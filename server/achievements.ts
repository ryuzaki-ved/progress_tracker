import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

const ACHIEVEMENT_IDS = [
  'first_task', 'week_streak', 'century_club', 'perfectionist',
  'consistency_king', 'early_bird', 'marathon_runner', 'high_achiever'
];

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    for (const id of ACHIEVEMENT_IDS) {
      const existing = db.prepare('SELECT id FROM achievements WHERE user_id = ? AND achievement_id = ?').get(userId, id);
      if (!existing) {
        db.prepare('INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, id);
      }
    }
    
    const rows = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(userId) as any[];
    const list = rows.map(r => ({
      id: r.achievement_id,
      progress: r.progress,
      isUnlocked: Boolean(r.is_unlocked),
      unlockedAt: r.unlocked_at ? new Date(r.unlocked_at) : undefined,
    }));
    res.json({ data: list, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/sync', (req: any, res) => {
  const userId = req.user.id;
  const { updates } = req.body;
  try {
    const tx = db.transaction((updatesList: any[]) => {
      const results = [];
      for (const update of updatesList) {
        const row = db.prepare('SELECT is_unlocked FROM achievements WHERE user_id = ? AND achievement_id = ?').get(userId, update.id) as any;
        if (!row) continue;
        
        const wasUnlocked = Boolean(row.is_unlocked);
        const shouldUnlock = !wasUnlocked && update.progress >= update.requirement;
        let newlyUnlocked = false;
        
        if (shouldUnlock) {
          db.prepare(`UPDATE achievements SET progress = ?, is_unlocked = true, unlocked_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ? AND achievement_id = ?`).run(update.progress, userId, update.id);
          newlyUnlocked = true;
        } else {
          db.prepare(`UPDATE achievements SET progress = ?, updated_at = datetime('now') WHERE user_id = ? AND achievement_id = ?`).run(update.progress, userId, update.id);
        }
        results.push({ id: update.id, newlyUnlocked });
      }
      return results;
    });
    const results = tx(updates);
    res.json({ data: results, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
