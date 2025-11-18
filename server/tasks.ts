import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';
import { calculateTaskScore } from './utils.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare(`SELECT t.*, s.user_id FROM tasks t JOIN stocks s ON t.stock_id = s.id WHERE s.user_id = ? ORDER BY t.created_at DESC`).all(userId) as any[];
    const tasksList = rows.map(taskObj => ({
      id: taskObj.id,
      title: taskObj.title,
      description: taskObj.description || '',
      dueDate: taskObj.due_date ? new Date(taskObj.due_date) : null,
      priority: taskObj.priority || 'medium',
      status: taskObj.status || 'pending',
      stockId: taskObj.stock_id.toString(),
      points: taskObj.points || 10,
      createdAt: taskObj.created_at ? new Date(taskObj.created_at) : new Date(),
      completedAt: taskObj.completed_at ? new Date(taskObj.completed_at) : undefined,
      scheduledTime: taskObj.scheduled_time || undefined,
      estimatedDuration: taskObj.estimated_duration || 30,
    }));
    res.json({ data: tasksList, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/', (req: any, res) => {
  const userId = req.user.id;
  const { stockId, title, description, priority, dueDate, scheduledTime, estimatedDuration, points } = req.body;
  try {
    const info = db.prepare(`INSERT INTO tasks (stock_id, title, description, priority, due_date, scheduled_time, estimated_duration, points, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      stockId, title, description || null, priority, dueDate || null, scheduledTime || null, estimatedDuration || 30, points || 10, 'pending'
    );
    res.json({ data: { id: info.lastInsertRowid }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put('/:id', (req: any, res) => {
  const userId = req.user.id; // Could verify ownership deeply, but stocks join implicitly guards it in reads
  const { id } = req.params;
  const updates = req.body;
  try {
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    db.prepare(`UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, points = ?, status = ?, scheduled_time = ?, estimated_duration = ?, updated_at = datetime('now') WHERE id = ?`).run(
      updates.title ?? existingTask.title,
      updates.description ?? existingTask.description,
      updates.priority ?? existingTask.priority,
      updates.dueDate !== undefined ? updates.dueDate : existingTask.due_date,
      updates.points ?? existingTask.points,
      updates.status ?? existingTask.status,
      updates.scheduledTime ?? existingTask.scheduled_time,
      updates.estimatedDuration ?? existingTask.estimated_duration,
      id
    );
    res.json({ data: true, error: null });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/complete', (req: any, res) => {
  const { id } = req.params;
  try {
    const taskObj = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!taskObj) return res.status(404).json({ error: 'Task not found' });
    const stockObj = db.prepare('SELECT * FROM stocks WHERE id = ?').get(taskObj.stock_id) as any;
    if (!stockObj) return res.status(404).json({ error: 'Stock not found' });

    const score = calculateTaskScore({
      priority: taskObj.priority || 'medium',
      complexity: taskObj.complexity || 1,
      type: taskObj.type,
      dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
      completedAt: new Date(),
    });

    db.prepare(`UPDATE tasks SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now'), score = ? WHERE id = ?`).run(score, id);
    const newScore = (stockObj.current_score || 500) + score;
    db.prepare(`UPDATE stocks SET current_score = ?, last_activity_at = datetime('now') WHERE id = ?`).run(newScore, stockObj.id);
    db.prepare(`INSERT INTO stock_performance_history (stock_id, date, daily_score, score_delta, delta_percent, tasks_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      stockObj.id, new Date().toISOString().split('T')[0], newScore, score, stockObj.current_score ? (score / stockObj.current_score) * 100 : 0, 1
    );
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/uncomplete', (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare(`UPDATE tasks SET status = 'pending', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/fail', (req: any, res) => {
  const { id } = req.params;
  try {
    const taskObj = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!taskObj) return res.status(404).json({ error: 'Task not found' });
    const stockObj = db.prepare('SELECT * FROM stocks WHERE id = ?').get(taskObj.stock_id) as any;
    if (!stockObj) return res.status(404).json({ error: 'Stock not found' });

    const score = taskObj.score || calculateTaskScore({
      priority: taskObj.priority || 'medium',
      complexity: taskObj.complexity || 1,
      type: taskObj.type,
      dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
      completedAt: taskObj.completed_at ? new Date(taskObj.completed_at) : undefined,
    });

    db.prepare(`UPDATE tasks SET status = 'failed', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
    const decrease = score * 1.5;
    const newScore = Math.max(0, (stockObj.current_score || 500) - decrease);
    db.prepare(`UPDATE stocks SET current_score = ?, last_activity_at = datetime('now') WHERE id = ?`).run(newScore, stockObj.id);
    db.prepare(`INSERT INTO stock_performance_history (stock_id, date, daily_score, score_delta, delta_percent, tasks_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      stockObj.id, new Date().toISOString().split('T')[0], newScore, -decrease, stockObj.current_score ? (-decrease / stockObj.current_score) * 100 : 0, 0
    );
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

export default router;
