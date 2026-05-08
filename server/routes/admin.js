import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_RESET_PASSWORD = 'Test@1234';

// ─── PLATFORM STATS ───────────────────────────────────────────────
router.get('/stats', authenticateAdmin, (req, res) => {
  try {
    const totalUsers      = db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get().c;
    const totalStudents   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c;
    const totalTeachers   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'teacher'").get().c;
    const totalClasses    = db.prepare("SELECT COUNT(*) as c FROM classes").get().c;
    const totalGames      = db.prepare("SELECT COUNT(*) as c FROM game_results").get().c;
    const avgAccuracy     = db.prepare("SELECT COALESCE(AVG(overall_accuracy),0) as a FROM user_progress").get().a;
    const activeToday     = db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM sessions WHERE last_activity >= datetime('now', '-1 day')").get().c;

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalGames,
      avgAccuracy: Math.round(avgAccuracy),
      activeToday,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ALL USERS (students + teachers, not admins) ───────────────────
router.get('/users', authenticateAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.role, u.institution, u.created_at,
        up.total_score, up.overall_accuracy, up.completed_levels, up.pramana_accuracy,
        COALESCE((SELECT SUM(hints_used) FROM game_results WHERE user_id = u.id), 0) as hints_used,
        COALESCE((SELECT COUNT(*) FROM game_results WHERE user_id = u.id), 0) as games_played
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.role != 'admin'
      ORDER BY u.role, u.name
    `).all();

    res.json(users.map(u => ({
      ...u,
      completed_levels: JSON.parse(u.completed_levels || '[]'),
      pramana_accuracy: JSON.parse(u.pramana_accuracy || '{"pratyaksa":0,"anumana":0,"sabda":0}'),
    })));
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ALL STUDENTS ──────────────────────────────────────────────────
router.get('/students', authenticateAdmin, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.institution, u.created_at,
        up.total_score, up.overall_accuracy, up.completed_levels, up.pramana_accuracy,
        COALESCE((SELECT SUM(hints_used) FROM game_results WHERE user_id = u.id), 0) as hints_used,
        COALESCE((SELECT COUNT(*) FROM game_results WHERE user_id = u.id), 0) as games_played,
        GROUP_CONCAT(DISTINCT c.name) as class_names
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN class_enrollments ce ON ce.student_id = u.id AND ce.status = 'approved'
      LEFT JOIN classes c ON ce.class_id = c.id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.name
    `).all();

    res.json(students.map(s => ({
      ...s,
      completed_levels: JSON.parse(s.completed_levels || '[]'),
      pramana_accuracy: JSON.parse(s.pramana_accuracy || '{"pratyaksa":0,"anumana":0,"sabda":0}'),
    })));
  } catch (error) {
    console.error('Admin students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ALL TEACHERS (with their classes) ────────────────────────────
router.get('/teachers', authenticateAdmin, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.institution, u.created_at,
        COALESCE((SELECT COUNT(*) FROM classes WHERE teacher_id = u.id), 0) as total_classes,
        COALESCE((SELECT COUNT(DISTINCT ce.student_id)
          FROM class_enrollments ce
          JOIN classes c ON ce.class_id = c.id
          WHERE c.teacher_id = u.id AND ce.status = 'approved'), 0) as total_students
      FROM users u
      WHERE u.role = 'teacher'
      ORDER BY u.name
    `).all();

    // Fetch classes for each teacher
    const enriched = teachers.map(t => {
      const classes = db.prepare(`
        SELECT c.id, c.name, c.type, c.class_code, c.status, c.created_at,
          (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'approved') as student_count
        FROM classes c
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `).all(t.id);
      return { ...t, classes };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Admin teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── RESET PASSWORD ────────────────────────────────────────────────
router.post('/reset-password', authenticateAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Prevent resetting another admin's password
    const target = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(userId);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot reset admin passwords' });
    }

    const hash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);

    // Invalidate all active sessions for that user
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

    res.json({ message: `Password reset to default for ${target.name}` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE USER ───────────────────────────────────────────────────
router.delete('/delete-user/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const target = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(id);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin accounts' });
    }

    // Cascade delete in correct order
    db.transaction(() => {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM reflection_journal WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM hint_logs WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM pre_post_tests WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM class_results WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM class_enrollments WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM game_results WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(id);

      // If teacher, delete their classes and enrollments too
      if (target.role === 'teacher') {
        const teacherClasses = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').all(id);
        teacherClasses.forEach(cls => {
          db.prepare('DELETE FROM class_results WHERE class_id = ?').run(cls.id);
          db.prepare('DELETE FROM class_enrollments WHERE class_id = ?').run(cls.id);
        });
        db.prepare('DELETE FROM classes WHERE teacher_id = ?').run(id);
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();

    res.json({ message: `${target.name} has been deleted` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── REMOVE TEACHER FROM A CLASS (delete the class) ───────────────
router.delete('/remove-class/:classId', authenticateAdmin, (req, res) => {
  const { classId } = req.params;

  try {
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM class_results WHERE class_id = ?').run(classId);
      db.prepare('DELETE FROM class_enrollments WHERE class_id = ?').run(classId);
      db.prepare('DELETE FROM classes WHERE id = ?').run(classId);
    })();

    res.json({ message: `Class "${cls.name}" removed successfully` });
  } catch (error) {
    console.error('Remove class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
