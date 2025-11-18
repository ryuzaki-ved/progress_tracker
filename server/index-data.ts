import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare(`SELECT * FROM index_history WHERE user_id = ? ORDER BY date ASC`).all(userId) as any[];
    res.json({ data: rows, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/update', (req: any, res) => {
  const userId = req.user.id;
  const { currentValue } = req.body;
  
  if (currentValue === undefined) return res.status(400).json({ error: 'currentValue required' });

  try {
    const todayDate = new Date();
    const today = todayDate.getFullYear() + '-' +
      String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(todayDate.getDate()).padStart(2, '0');

    const existingToday = db.prepare(`SELECT open, high, low, close FROM index_history WHERE user_id = ? AND date = ?`).get(userId, today) as any;
    
    let open, high, low;

    if (existingToday) {
      open = existingToday.open;
      high = Math.max(existingToday.high, currentValue);
      low = Math.min(existingToday.low, currentValue);
    } else {
      const lastRecorded = db.prepare(`SELECT close FROM index_history WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 1`).get(userId, today) as any;
      const lastRecordedValue = lastRecorded?.close ?? 500;
      open = lastRecordedValue;
      high = Math.max(lastRecordedValue, currentValue);
      low = Math.min(lastRecordedValue, currentValue);
    }

    const change = currentValue - open;
    const changePercent = open > 0 ? (change / open) * 100 : 0;

    db.prepare(`INSERT OR REPLACE INTO index_history (user_id, date, open, high, low, close, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(userId, today, open, high, low, currentValue, change, changePercent);
    res.json({ data: true, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/multiple', (req: any, res) => {
  const userId = req.user.id;
  const { updates } = req.body;
  
  if (!updates) return res.status(400).json({ error: 'updates required' });

  try {
    const tx = db.transaction((updatesObj: Record<string, number>) => {
      for (const [date, value] of Object.entries(updatesObj)) {
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];

        const prevRes = db.prepare(`SELECT close FROM index_history WHERE user_id = ? AND date <= ? ORDER BY date DESC LIMIT 1`).get(userId, prevDateStr) as any;
        const prevValue = prevRes?.close ?? value;
        const change = value - prevValue;
        const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;

        db.prepare(`INSERT OR REPLACE INTO index_history (user_id, date, open, high, low, close, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(userId, date, value, value, value, value, change, changePercent);
      }
    });
    tx(updates);
    res.json({ data: true, error: null });
  } catch(err:any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
