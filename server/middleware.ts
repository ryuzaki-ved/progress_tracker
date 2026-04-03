import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = 'super_secret_progress_tracker_key_44321'; // For personal use

// Middleware to verify JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Check if maintenance mode is enabled
export const isMaintenanceEnabled = (): boolean => {
  try {
    const result = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('maintenance_mode') as { value?: string } | undefined;
    return result?.value === '1';
  } catch {
    return false;
  }
};

// Middleware to block operations during maintenance (except for admins)
export const checkMaintenanceMode = (req: any, res: any, next: any) => {
  if (isMaintenanceEnabled()) {
    const userId = req.user?.id;
    if (!userId) return res.status(503).json({ error: 'System is under maintenance' });

    const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
    if (userRow?.role !== 'admin') {
      return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
    }
  }
  next();
};
