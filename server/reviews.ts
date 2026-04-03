import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare('SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start DESC').all(userId) as any[];
    const reviewsList = rows.map(reviewObj => ({
      id: reviewObj.id.toString(),
      userId: reviewObj.user_id.toString(),
      weekStart: new Date(reviewObj.week_start),
      weekEnd: new Date(reviewObj.week_end),
      rating: reviewObj.rating,
      stats: JSON.parse(reviewObj.stats),
      journalEntryId: reviewObj.journal_entry_id?.toString(),
      insights: reviewObj.insights ? JSON.parse(reviewObj.insights) : [],
      goals: reviewObj.goals ? JSON.parse(reviewObj.goals) : [],
      createdAt: new Date(reviewObj.created_at),
      updatedAt: new Date(reviewObj.updated_at),
    }));
    res.json({ data: reviewsList, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { weekStart, weekEnd, rating, stats, journalEntryId, insights, goals } = req.body;
  try {
    const info = db.prepare(`INSERT INTO weekly_reviews (user_id, week_start, week_end, rating, stats, journal_entry_id, insights, goals) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, weekStart, weekEnd, rating, JSON.stringify(stats), journalEntryId || null, JSON.stringify(insights), JSON.stringify(goals || []));
    res.json({ data: { id: info.lastInsertRowid }, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.get('/insights', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare('SELECT * FROM reflection_insights WHERE user_id = ? AND dismissed = false ORDER BY created_at DESC').all(userId) as any[];
    const insightsList = rows.map(insightObj => ({
      id: insightObj.id.toString(),
      type: insightObj.type,
      title: insightObj.title,
      description: insightObj.description,
      data: insightObj.data ? JSON.parse(insightObj.data) : null,
      confidence: insightObj.confidence,
      actionable: Boolean(insightObj.actionable),
      dismissed: Boolean(insightObj.dismissed),
      createdAt: new Date(insightObj.created_at),
    }));
    res.json({ data: insightsList, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/insights/:id/dismiss', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    db.prepare('UPDATE reflection_insights SET dismissed = true WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
