import jwt from 'jsonwebtoken';
import db from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'nyaya-pramana-dev-secret-key-123';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists and is not expired
    const stmt = db.prepare(`SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')`);
    const session = stmt.get(token);

    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    req.user = payload;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
<<<<<<< HEAD
=======

export function authenticateAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
>>>>>>> a170f25 (added the admin login and its functionaly)
