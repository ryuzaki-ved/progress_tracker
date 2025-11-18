import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  try {
    const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id) as any;
    if (!userRow || userRow.role !== 'admin') {
      return res.status(403).json({ error: 'Requires admin privileges' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal error checking privileges' });
  }
};

router.get('/users', isAdmin, (req: any, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, show_in_leaderboard FROM users ORDER BY id ASC').all();
    res.json({ data: users, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put('/users/:id/leaderboard', isAdmin, (req: any, res) => {
  try {
    const userId = req.params.id;
    const { show_in_leaderboard } = req.body;
    db.prepare('UPDATE users SET show_in_leaderboard = ? WHERE id = ?').run(show_in_leaderboard ? 1 : 0, userId);
    res.json({ data: true, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete('/users/:id', isAdmin, (req: any, res) => {
  const userId = req.params.id;
  try {
    db.transaction(() => {
      // Delete user data sequentially according to schema
      db.prepare('DELETE FROM stock_performance_history WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)').run(userId);
      db.prepare('DELETE FROM tasks WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)').run(userId);
      db.prepare('DELETE FROM user_holdings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM index_history WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM journal_entries WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM streaks WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM weekly_reviews WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM reflection_insights WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM alerts WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM achievements WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_options_holdings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM option_transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM option_pnl_history WHERE user_id = ?').run(userId);
      
      // Delete stocks only after dependents are cleared
      db.prepare('DELETE FROM stocks WHERE user_id = ?').run(userId);
      
      // Finally delete the user and settings
      db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();
    res.json({ data: true, error: null });
  } catch(err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
