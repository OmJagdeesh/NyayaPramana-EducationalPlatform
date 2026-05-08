import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate a 6-character alphanumeric class code
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  const existing = db.prepare('SELECT id FROM classes WHERE class_code = ?').get(code);
  if (existing) return generateClassCode();
  return code;
}

// ─── TEACHER ENDPOINTS ────────────────────────────────────────────

// Create a class/quiz/game
router.post('/create', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create classes' });
  }

  const { name, description, type, questions } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  try {
    const id = uuidv4();
    const classCode = generateClassCode();

    db.prepare(`
      INSERT INTO classes (id, teacher_id, name, description, class_code, type, questions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name.trim(), description || '', classCode, type || 'class', JSON.stringify(questions || []));

    res.status(201).json({
      id,
      classCode,
      name: name.trim(),
      type: type || 'class',
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all classes created by this teacher
router.get('/my-classes', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view their classes' });
  }

  try {
    const classes = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'approved') as student_count,
        (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'pending') as pending_count
      FROM classes c
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json(classes.map(c => ({
      ...c,
      questions: JSON.parse(c.questions || '[]')
    })));
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students enrolled in a specific class with their stats
router.get('/students/:classId', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Verify teacher owns this class
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.classId, req.user.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const students = db.prepare(`
      SELECT 
        u.id, u.name, u.email,
        ce.status as enrollment_status, ce.enrolled_at,
        up.total_score, up.overall_accuracy, up.completed_levels, up.pramana_accuracy,
        COALESCE((SELECT SUM(hints_used) FROM game_results WHERE user_id = u.id), 0) as hints_used,
        COALESCE((SELECT AVG(time_seconds) FROM game_results WHERE user_id = u.id), 0) as avg_time
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE ce.class_id = ? AND ce.status = 'approved'
      ORDER BY up.total_score DESC
    `).all(req.params.classId);

    // Also get class-specific results
    const classResults = db.prepare(`
      SELECT 
        cr.student_id, cr.score, cr.accuracy, cr.correct, cr.total, cr.time_seconds, cr.completed_at, cr.pramana_data
      FROM class_results cr
      WHERE cr.class_id = ?
      ORDER BY cr.completed_at DESC
    `).all(req.params.classId);

    res.json({
      classInfo: { ...cls, questions: JSON.parse(cls.questions || '[]') },
      students: students.map(s => ({
        ...s,
        completed_levels: JSON.parse(s.completed_levels || '[]'),
        pramana_accuracy: JSON.parse(s.pramana_accuracy || '{"pratyaksa":0,"anumana":0,"sabda":0}')
      })),
      classResults: classResults.map(r => ({
        ...r,
        pramana_data: JSON.parse(r.pramana_data || '[]')
      }))
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending join requests for a class
router.get('/requests/:classId', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const cls = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.classId, req.user.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const requests = db.prepare(`
      SELECT ce.id, ce.status, ce.enrolled_at, u.id as student_id, u.name, u.email
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      WHERE ce.class_id = ?
      ORDER BY ce.enrolled_at DESC
    `).all(req.params.classId);

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or reject a join request
router.post('/approve', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { enrollmentId, action } = req.body; // action: 'approved' or 'rejected'
  if (!enrollmentId || !['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // Verify teacher owns the class for this enrollment
    const enrollment = db.prepare(`
      SELECT ce.*, c.teacher_id 
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.id = ?
    `).get(enrollmentId);

    if (!enrollment || enrollment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    db.prepare('UPDATE class_enrollments SET status = ? WHERE id = ?').run(action, enrollmentId);
    res.json({ message: `Request ${action} successfully` });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students under this teacher (across all classes)
router.get('/all-students', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const students = db.prepare(`
      SELECT DISTINCT
        u.id, u.name, u.email,
        up.total_score, up.overall_accuracy, up.completed_levels, up.pramana_accuracy,
        COALESCE((SELECT SUM(hints_used) FROM game_results WHERE user_id = u.id), 0) as hints_used,
        COALESCE((SELECT COUNT(*) FROM game_results WHERE user_id = u.id), 0) as games_played,
        GROUP_CONCAT(DISTINCT c.name) as class_names
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      JOIN classes c ON ce.class_id = c.id
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE c.teacher_id = ? AND ce.status = 'approved'
      GROUP BY u.id
      ORDER BY up.total_score DESC
    `).all(req.user.id);

    res.json(students.map(s => ({
      ...s,
      completed_levels: JSON.parse(s.completed_levels || '[]'),
      pramana_accuracy: JSON.parse(s.pramana_accuracy || '{"pratyaksa":0,"anumana":0,"sabda":0}')
    })));
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student stats for a specific game/class (for PDF download)
router.get('/game-stats/:classId', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.classId, req.user.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const results = db.prepare(`
      SELECT 
        u.name, u.email,
        cr.score, cr.accuracy, cr.correct, cr.total, cr.time_seconds, cr.completed_at, cr.pramana_data,
        up.total_score as overall_score, up.overall_accuracy
      FROM class_results cr
      JOIN users u ON cr.student_id = u.id
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE cr.class_id = ?
      ORDER BY cr.score DESC
    `).all(req.params.classId);

    // Compute class-level stats
    const totalStudents = results.length;
    const avgScore = totalStudents > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalStudents) : 0;
    const avgAccuracy = totalStudents > 0 ? Math.round(results.reduce((s, r) => s + r.accuracy, 0) / totalStudents) : 0;
    const avgTime = totalStudents > 0 ? Math.round(results.reduce((s, r) => s + r.time_seconds, 0) / totalStudents) : 0;

    res.json({
      classInfo: { name: cls.name, type: cls.type, code: cls.class_code, created_at: cls.created_at },
      summary: { totalStudents, avgScore, avgAccuracy, avgTime },
      results: results.map(r => ({
        ...r,
        pramana_data: JSON.parse(r.pramana_data || '[]')
      }))
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── STUDENT ENDPOINTS ────────────────────────────────────────────

// Join a class by code
router.post('/join', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can join classes' });
  }

  const { classCode } = req.body;
  if (!classCode || !classCode.trim()) {
    return res.status(400).json({ error: 'Class code is required' });
  }

  try {
    const cls = db.prepare('SELECT * FROM classes WHERE class_code = ? AND status = ?').get(classCode.trim().toUpperCase(), 'active');
    if (!cls) {
      return res.status(404).json({ error: 'Invalid class code or class is no longer active' });
    }

    // Check if already enrolled
    const existing = db.prepare('SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?').get(cls.id, req.user.id);
    if (existing) {
      return res.status(400).json({ error: `You have already ${existing.status === 'pending' ? 'requested to join' : 'joined'} this class` });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO class_enrollments (id, class_id, student_id, status) VALUES (?, ?, ?, ?)').run(id, cls.id, req.user.id, 'approved');

    // Get teacher name
    const teacher = db.prepare('SELECT name FROM users WHERE id = ?').get(cls.teacher_id);

    res.status(201).json({
      message: 'Successfully joined game!',
      className: cls.name,
      teacherName: teacher?.name || 'Unknown',
      status: 'approved'
    });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's enrollments
router.get('/my-enrollments', authenticate, (req, res) => {
  try {
    const enrollments = db.prepare(`
      SELECT 
        ce.id as enrollment_id, ce.status, ce.enrolled_at,
        c.id as class_id, c.name as class_name, c.type, c.class_code, c.description, c.questions,
        u.name as teacher_name, u.institution
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = ?
      ORDER BY ce.enrolled_at DESC
    `).all(req.user.id);

    res.json(enrollments.map(e => ({
      ...e,
      questions: e.status === 'approved' ? JSON.parse(e.questions || '[]') : []
    })));
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all teachers
router.get('/teachers', authenticate, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT u.id, u.name, u.institution,
        (SELECT COUNT(DISTINCT c.id) FROM classes c WHERE c.teacher_id = u.id AND c.status = 'active') as active_classes,
        (SELECT COUNT(DISTINCT ce.student_id) FROM class_enrollments ce JOIN classes c ON ce.class_id = c.id WHERE c.teacher_id = u.id AND ce.status = 'approved') as total_students
      FROM users u
      WHERE u.role = 'teacher'
      ORDER BY u.name
    `).all();

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teachers whose classes the student is enrolled in
router.get('/my-teachers', authenticate, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT DISTINCT 
        u.id, u.name, u.institution,
        GROUP_CONCAT(DISTINCT c.name) as class_names
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = ? AND ce.status = 'approved'
      GROUP BY u.id
      ORDER BY u.name
    `).all(req.user.id);

    res.json(teachers);
  } catch (error) {
    console.error('Get my teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a result for a class game/quiz
router.post('/submit-result', authenticate, (req, res) => {
  const { classId, score, accuracy, correct, total, timeSeconds, pramanaData } = req.body;

  if (!classId) {
    return res.status(400).json({ error: 'Class ID is required' });
  }

  try {
    // Verify student is enrolled and approved
    const enrollment = db.prepare('SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ? AND status = ?')
      .get(classId, req.user.id, 'approved');
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this class' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO class_results (id, class_id, student_id, score, accuracy, correct, total, time_seconds, pramana_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, classId, req.user.id, score || 0, accuracy || 0, correct || 0, total || 0, timeSeconds || 0, JSON.stringify(pramanaData || []));

    res.json({ message: 'Result submitted successfully' });
  } catch (error) {
    console.error('Submit class result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get effectiveness report data
router.get('/effectiveness/:classId', authenticate, (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.classId, req.user.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get all students in the class
    const students = db.prepare(`
      SELECT student_id FROM class_enrollments WHERE class_id = ? AND status = 'approved'
    `).all(req.params.classId);
    
    if (students.length === 0) {
      return res.json({ classInfo: cls, data: [] });
    }

    const sIds = students.map(s => `'${s.student_id}'`).join(',');
    
    const prePost = db.prepare(`SELECT * FROM pre_post_tests WHERE student_id IN (${sIds})`).all();
    const gameStats = db.prepare(`SELECT student_id, AVG(time_seconds) as avg_t, SUM(hints_used) as hints_used, COUNT(*) as attempts FROM game_results WHERE user_id IN (${sIds}) GROUP BY user_id`).all();

    res.json({ classInfo: cls, prePost, gameStats });
  } catch (error) {
    console.error('Effectiveness route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download research export
router.get('/research-export', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'researcher' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers/admins can export pilot data' });
  }
  try {
    // Generate an anonymized CSV view of the data. 
    // Data needed: anon_id, pramana_category, game_mode, accuracy, avg_time_per_question,
    // total_attempts, hints_used, pre_test_score, post_test_score, improvement_delta,
    // session_date, journal_entry
    const data = db.prepare(`
      SELECT 
        u.id as raw_id,
        gr.pramana_data, gr.game_type as game_mode, gr.accuracy, gr.time_seconds, gr.hints_used, gr.completed_at as session_date,
        rj.journal_entry,
        (SELECT score FROM pre_post_tests WHERE student_id = u.id AND test_type = 'pre' ORDER BY timestamp DESC LIMIT 1) as pre_test_score,
        (SELECT score FROM pre_post_tests WHERE student_id = u.id AND test_type = 'post' ORDER BY timestamp DESC LIMIT 1) as post_test_score
      FROM users u
      LEFT JOIN game_results gr ON u.id = gr.user_id
      LEFT JOIN reflection_journal rj ON u.id = rj.student_id
    `).all();

    // In a real implementation we would convert this to CSV using a server library, 
    // but the frontend can easily generate CSV from JSON if we return array of objects.
    // Hash the ID using simple truncation for anonymization or proper hash.
    const anonymized = data.map(row => {
      const pData = JSON.parse(row.pramana_data || '[]');
      const avgPAcc = pData.length ? Math.round(pData.reduce((acc, p) => acc + (p.correct ? 1 : 0), 0) / pData.length * 100) : row.accuracy;
      return {
        anon_id: row.raw_id.substring(0, 8), // basic hash stub
        game_mode: row.game_mode,
        accuracy: row.accuracy,
        time_seconds: row.time_seconds,
        hints_used: row.hints_used,
        pre_test_score: row.pre_test_score,
        post_test_score: row.post_test_score,
        improvement_delta: row.post_test_score && row.pre_test_score ? (row.post_test_score - row.pre_test_score) : null,
        session_date: row.session_date,
        journal_entry: row.journal_entry
      };
    });
    res.json(anonymized);
  } catch (error) {
    console.error('Export route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── SEARCH STUDENTS (for teacher direct enroll) ──────────────────
router.get('/search-students', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can search students' });
  }
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res.json([]);
  }
  try {
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.institution,
        COALESCE(up.total_score, 0) as total_score,
        COALESCE(up.overall_accuracy, 0) as overall_accuracy
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.role = 'student'
        AND (LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))
      ORDER BY u.name
      LIMIT 15
    `).all(`%${q}%`, `%${q}%`);
    res.json(students);
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DIRECT ENROLL (teacher enrolls student without join request) ──
router.post('/enroll-direct', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can directly enroll students' });
  }
  const { classId, studentId } = req.body;
  if (!classId || !studentId) {
    return res.status(400).json({ error: 'classId and studentId are required' });
  }
  try {
    // Verify teacher owns the class
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(classId, req.user.id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found or not yours' });
    }
    // Verify student exists
    const student = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'student'").get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Insert or update enrollment to approved
    const existing = db.prepare('SELECT id, status FROM class_enrollments WHERE class_id = ? AND student_id = ?').get(classId, studentId);
    if (existing) {
      if (existing.status === 'approved') {
        return res.status(409).json({ error: `${student.name} is already enrolled in this class` });
      }
      db.prepare("UPDATE class_enrollments SET status = 'approved' WHERE id = ?").run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO class_enrollments (id, class_id, student_id, status)
        VALUES (?, ?, ?, 'approved')
      `).run(uuidv4(), classId, studentId);
    }
    res.json({ message: `${student.name} enrolled successfully in ${cls.name}` });
  } catch (error) {
    console.error('Direct enroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

