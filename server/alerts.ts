import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare('SELECT * FROM alerts WHERE user_id = ? AND is_dismissed = false ORDER BY created_at DESC').all(userId) as any[];
    const alertsList = rows.map(alertObj => ({
      id: alertObj.id.toString(),
      type: alertObj.type,
      title: alertObj.title,
      message: alertObj.message,
      stockId: alertObj.stock_id,
      severity: alertObj.severity,
      isRead: Boolean(alertObj.is_read),
      isDismissed: Boolean(alertObj.is_dismissed),
      createdAt: new Date(alertObj.created_at),
    }));
    res.json({ data: alertsList, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/', (req: any, res) => {
  const userId = req.user.id;
  const { type, title, message, stockId, severity } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM alerts WHERE user_id = ? AND type = ? AND stock_id = ? AND is_dismissed = false').get(userId, type, stockId || null);
    if (existing) return res.json({ data: true, error: null });
    
    db.prepare(`INSERT INTO alerts (user_id, type, title, message, stock_id, severity) VALUES (?, ?, ?, ?, ?, ?)`).run(userId, type, title, message, stockId || null, severity);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/read', (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    db.prepare('UPDATE alerts SET is_read = true WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/dismiss', (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    db.prepare('UPDATE alerts SET is_dismissed = true WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
