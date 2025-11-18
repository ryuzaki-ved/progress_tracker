import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

// Initialize default streaks for a user if they don't exist
const initializeUserStreaks = (userId: number) => {
  const streakTypes = ['daily_completion', 'on_time', 'no_missed'];
  for (const type of streakTypes) {
    const existing = db.prepare('SELECT id FROM streaks WHERE user_id = ? AND type = ?').get(userId, type);
    if (!existing) {
      db.prepare('INSERT INTO streaks (user_id, type) VALUES (?, ?)').run(userId, type);
    }
  }
};

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    initializeUserStreaks(userId);
    const rows = db.prepare('SELECT * FROM streaks WHERE user_id = ?').all(userId) as any[];
    const streaksList = rows.map(streakObj => ({
      id: streakObj.id.toString(),
      type: streakObj.type,
      currentStreak: streakObj.current_streak || 0,
      longestStreak: streakObj.longest_streak || 0,
      lastActivityDate: streakObj.last_activity_date ? new Date(streakObj.last_activity_date) : new Date(),
      isActive: Boolean(streakObj.is_active),
    }));
    res.json({ data: streaksList, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.put('/:id', (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { currentStreak, longestStreak, lastActivityDate, isActive } = req.body;
  try {
    db.prepare(`UPDATE streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ?, is_active = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(currentStreak, longestStreak, lastActivityDate, isActive ? 1 : 0, id, userId);
    res.json({ data: true, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

export default router;
