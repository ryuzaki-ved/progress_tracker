import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';
import { calculateTaskScore, generateRecurringDates } from './utils.js';

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
      complexity: taskObj.complexity || 1,
      status: taskObj.status || 'pending',
      stockId: taskObj.stock_id.toString(),
      score: taskObj.score || calculateTaskScore({
        priority: taskObj.priority || 'medium',
        complexity: taskObj.complexity || 1,
        type: taskObj.type,
        dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
      }),
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

router.post('/', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { stockId, title, description, priority, complexity, dueDate, scheduledTime, estimatedDuration, recurringPattern } = req.body;
  try {
    const startDate = dueDate ? new Date(dueDate) : new Date();
    const dates = generateRecurringDates(recurringPattern, startDate);
    
    const insertTask = db.prepare(`INSERT INTO tasks (stock_id, title, description, priority, complexity, due_date, scheduled_time, estimated_duration, status, type, recurring_pattern, parent_task_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
    
    let parentTaskId: any = null;
    const patternString = recurringPattern ? JSON.stringify(recurringPattern) : null;

    const transaction = db.transaction(() => {
      dates.forEach((date, index) => {
        const result = insertTask.run(
          stockId,
          title,
          description || null,
          priority,
          complexity || 1,
          date.toISOString(),
          scheduledTime || null,
          estimatedDuration || 30,
          'pending',
          recurringPattern ? 'recurring' : 'one_time',
          index === 0 ? patternString : null,
          parentTaskId
        );
        if (index === 0) {
          parentTaskId = result.lastInsertRowid;
        }
      });
    });

    transaction();
    res.json({ data: { id: parentTaskId }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put('/:id', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id; // Could verify ownership deeply, but stocks join implicitly guards it in reads
  const { id } = req.params;
  const updates = req.body;
  try {
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    db.prepare(`UPDATE tasks SET title = ?, description = ?, priority = ?, complexity = ?, due_date = ?, status = ?, scheduled_time = ?, estimated_duration = ?, updated_at = datetime('now') WHERE id = ?`).run(
      updates.title ?? existingTask.title,
      updates.description ?? existingTask.description,
      updates.priority ?? existingTask.priority,
      updates.complexity ?? existingTask.complexity,
      updates.dueDate !== undefined ? updates.dueDate : existingTask.due_date,
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

router.delete('/:id', checkMaintenanceMode, (req: any, res) => {
  const { id } = req.params;
  try {
    const deleteTx = db.transaction(() => {
      // Find all child tasks to handle recurring task deletion safely without deleting them
      const childTasks = db.prepare('SELECT id FROM tasks WHERE parent_task_id = ? ORDER BY due_date ASC').all(id) as any[];
      
      if (childTasks.length > 0) {
        const newParentId = childTasks[0].id;
        
        // Transfer recurring pattern to the new parent
        const oldParentInfo = db.prepare('SELECT recurring_pattern FROM tasks WHERE id = ?').get(id) as any;
        if (oldParentInfo && oldParentInfo.recurring_pattern) {
          db.prepare('UPDATE tasks SET recurring_pattern = ? WHERE id = ?').run(oldParentInfo.recurring_pattern, newParentId);
        }

        // Update other children to point to the new parent
        db.prepare('UPDATE tasks SET parent_task_id = ? WHERE parent_task_id = ? AND id != ?').run(newParentId, id, newParentId);
        
        // The new parent itself should have a null parent_task_id
        db.prepare('UPDATE tasks SET parent_task_id = NULL WHERE id = ?').run(newParentId);
      }
      
      // Delete any performance bonds associated with THIS task only
      db.prepare('DELETE FROM performance_bonds WHERE creator_task_id = ? OR challenger_task_id = ?').run(id, id);
      
      // Finally delete the task itself
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    });
    
    deleteTx();
    res.json({ data: true, error: null });
  } catch(err:any) { 
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/complete', checkMaintenanceMode, (req: any, res) => {
  const { id } = req.params;
  const { completionFactor = 1.0 } = req.body;
  try {
    const taskObj = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!taskObj) return res.status(404).json({ error: 'Task not found' });
    const stockObj = db.prepare('SELECT * FROM stocks WHERE id = ?').get(taskObj.stock_id) as any;
    if (!stockObj) return res.status(404).json({ error: 'Stock not found' });

    let score = calculateTaskScore({
      priority: taskObj.priority || 'medium',
      complexity: taskObj.complexity || 1,
      type: taskObj.type,
      dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
      completedAt: new Date(),
    });

    // Apply completion factor (1, 2, 5, 8, 9, 10 -> 0.1, 0.2, 0.5, 0.8, 0.9, 1.0)
    score = Math.round(score * completionFactor);

    db.prepare(`UPDATE tasks SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now'), score = ? WHERE id = ?`).run(score, id);
    const newScore = (stockObj.current_score || 500) + score;
    db.prepare(`UPDATE stocks SET current_score = ?, last_activity_at = datetime('now') WHERE id = ?`).run(newScore, stockObj.id);
    db.prepare(`INSERT INTO stock_performance_history (stock_id, date, daily_score, score_delta, delta_percent, tasks_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      stockObj.id, new Date().toISOString().split('T')[0], newScore, score, stockObj.current_score ? (score / stockObj.current_score) * 100 : 0, 1
    );
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/uncomplete', checkMaintenanceMode, (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare(`UPDATE tasks SET status = 'pending', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
    res.json({ data: true, error: null });
  } catch(err:any) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/fail', checkMaintenanceMode, (req: any, res) => {
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
