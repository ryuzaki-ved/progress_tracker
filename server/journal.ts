import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare(`SELECT * FROM journal_entries WHERE user_id = ? ORDER BY date DESC`).all(userId) as any[];
    const entriesList = rows.map(entryObj => ({
      id: entryObj.id.toString(),
      userId: entryObj.user_id.toString(),
      type: entryObj.type,
      date: new Date(entryObj.date),
      title: entryObj.title,
      content: entryObj.content,
      mood: entryObj.mood,
      prompts: entryObj.prompts ? JSON.parse(entryObj.prompts) : undefined,
      tags: entryObj.tags ? JSON.parse(entryObj.tags) : [],
      isPrivate: Boolean(entryObj.is_private),
      createdAt: new Date(entryObj.created_at),
      updatedAt: new Date(entryObj.updated_at),
    }));
    res.json({ data: entriesList, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.post('/', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { type, date, title, content, mood, prompts, tags, isPrivate } = req.body;
  try {
    const info = db.prepare(`INSERT INTO journal_entries (user_id, type, date, title, content, mood, prompts, tags, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, type, date, title || null, content, mood || null, prompts ? JSON.stringify(prompts) : null, tags ? JSON.stringify(tags) : null, isPrivate ? 1 : 0);
    res.json({ data: { id: info.lastInsertRowid }, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.put('/:id', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const setClause = [];
    const values = [];
    if (updates.title !== undefined) { setClause.push('title = ?'); values.push(updates.title); }
    if (updates.content !== undefined) { setClause.push('content = ?'); values.push(updates.content); }
    if (updates.mood !== undefined) { setClause.push('mood = ?'); values.push(updates.mood); }
    if (updates.prompts !== undefined) { setClause.push('prompts = ?'); values.push(JSON.stringify(updates.prompts)); }
    if (updates.tags !== undefined) { setClause.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    if (updates.isPrivate !== undefined) { setClause.push('is_private = ?'); values.push(updates.isPrivate ? 1 : 0); }
    
    if (setClause.length === 0) return res.json({ data: true, error: null });
    
    setClause.push('updated_at = datetime("now")');
    values.push(id, userId);
    
    db.prepare(`UPDATE journal_entries SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    res.json({ data: true, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.delete('/:id', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
