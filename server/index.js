import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import leaderboardRoutes from './routes/leaderboard.js';
import classRoutes from './routes/class.js';
<<<<<<< HEAD
=======
import adminRoutes from './routes/admin.js';
>>>>>>> a170f25 (added the admin login and its functionaly)

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/class', classRoutes);
<<<<<<< HEAD
=======
app.use('/api/admin', adminRoutes);
>>>>>>> a170f25 (added the admin login and its functionaly)

// Seed database with mock users for the leaderboard if empty
const seedDatabase = async () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count === 0) {
    console.log('Seeding mock users...');
    const mockUsers = [
      { name: "Arjun Sharma", role: "student", score: 285, levels: [1,2,3] },
      { name: "Priya Nair", role: "student", score: 270, levels: [1,2,3] },
      { name: "Rahul Verma", role: "student", score: 240, levels: [1,2] },
      { name: "Divya Menon", role: "student", score: 225, levels: [1,2] },
      { name: "Karthik Iyer", role: "student", score: 195, levels: [1,2] },
    ];

    const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
    const insertProgress = db.prepare('INSERT INTO user_progress (user_id, completed_levels, total_score) VALUES (?, ?, ?)');
    
    // Default password for seeded users just in case they want to login (password123)
    const defaultHash = await bcrypt.hash('password123', 10);

    db.transaction(() => {
      mockUsers.forEach((u, i) => {
        const id = uuidv4();
        insertUser.run(id, u.name, `user${i}@test.com`, defaultHash, u.role);
        insertProgress.run(id, JSON.stringify(u.levels), u.score);
      });
    })();
    console.log('Database seeded.');
  }
<<<<<<< HEAD
=======

  // Seed default admin account
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    console.log('Seeding default admin account...');
    const adminId = uuidv4();
    const adminHash = await bcrypt.hash('Admin@1234', 10);
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
      adminId, 'System Admin', 'admin@nyaya.edu', adminHash, 'admin'
    );
    // Admins don't need user_progress, but insert a blank row to keep FK constraints happy
    db.prepare('INSERT OR IGNORE INTO user_progress (user_id) VALUES (?)').run(adminId);
    console.log('Admin account created: admin@nyaya.edu / Admin@1234');
  }
>>>>>>> a170f25 (added the admin login and its functionaly)
};

seedDatabase().then(() => {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../dist')));

  // Anything that doesn't match the above, send back index.html
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

