import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare(`SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`).all(userId) as any[];
    const notesList = rows.map(noteObj => ({
      id: noteObj.id.toString(),
      userId: noteObj.user_id.toString(),
      title: noteObj.title,
      content: noteObj.content,
      category: noteObj.category || 'General',
      tags: noteObj.tags ? JSON.parse(noteObj.tags) : [],
      isPinned: Boolean(noteObj.is_pinned),
      isArchived: Boolean(noteObj.is_archived),
      color: noteObj.color || '#3B82F6',
      createdAt: new Date(noteObj.created_at),
      updatedAt: new Date(noteObj.updated_at),
    }));
    res.json({ data: notesList, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.post('/', (req: any, res) => {
  const userId = req.user.id;
  const { title, content, category, tags, isPinned, isArchived, color } = req.body;
  try {
    const info = db.prepare(`INSERT INTO notes (user_id, title, content, category, tags, is_pinned, is_archived, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, title, content, category, JSON.stringify(tags), isPinned ? 1 : 0, isArchived ? 1 : 0, color);
    res.json({ data: { id: info.lastInsertRowid }, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.put('/:id', (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const setClause = [];
    const values = [];
    if (updates.title !== undefined) { setClause.push('title = ?'); values.push(updates.title); }
    if (updates.content !== undefined) { setClause.push('content = ?'); values.push(updates.content); }
    if (updates.category !== undefined) { setClause.push('category = ?'); values.push(updates.category); }
    if (updates.tags !== undefined) { setClause.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    if (updates.isPinned !== undefined) { setClause.push('is_pinned = ?'); values.push(updates.isPinned ? 1 : 0); }
    if (updates.isArchived !== undefined) { setClause.push('is_archived = ?'); values.push(updates.isArchived ? 1 : 0); }
    if (updates.color !== undefined) { setClause.push('color = ?'); values.push(updates.color); }
    
    if (setClause.length === 0) return res.json({ data: true, error: null });
    
    setClause.push('updated_at = datetime("now")');
    values.push(id, userId);
    
    db.prepare(`UPDATE notes SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    res.json({ data: true, error: null });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.delete('/:id', (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
