import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Stock, Task } from '../types';
import { calculateTaskScore } from '../utils/stockUtils';

// TEMP: Hardcoded user id for demo (replace with real auth integration)
const currentUserId = 1;

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      // Join with stocks to filter by user_id
      const res = db.exec(
        `SELECT t.*, s.user_id FROM tasks t JOIN stocks s ON t.stock_id = s.id WHERE s.user_id = ? ORDER BY t.created_at DESC`,
        [currentUserId]
      );
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      const tasksList: Task[] = rows.map((row: any[]) => {
        const taskObj: any = {};
        columns.forEach((col, i) => (taskObj[col] = row[i]));
        return {
          id: taskObj.id,
          title: taskObj.title,
          description: taskObj.description || '',
          dueDate: taskObj.due_date ? new Date(taskObj.due_date) : null,
          priority: (taskObj.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          status: (taskObj.status || 'pending') as 'pending' | 'completed' | 'overdue' | 'failed',
          stockId: taskObj.stock_id,
          points: taskObj.points || 10,
          createdAt: taskObj.created_at ? new Date(taskObj.created_at) : new Date(),
          completedAt: taskObj.completed_at ? new Date(taskObj.completed_at) : undefined,
          scheduledTime: taskObj.scheduled_time || undefined,
          estimatedDuration: taskObj.estimated_duration || 30,
        };
      });
      setTasks(tasksList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    stockId: string;
    dueDate?: Date;
    scheduledTime?: string;
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    points?: number;
  }) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        `INSERT INTO tasks (stock_id, title, description, priority, due_date, scheduled_time, estimated_duration, points, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          taskData.stockId,
          taskData.title,
          taskData.description || null,
          taskData.priority,
          taskData.dueDate ? taskData.dueDate.toISOString() : null,
          taskData.scheduledTime || null,
          taskData.estimatedDuration || 30,
          taskData.points || 10,
          'pending',
        ]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setError(null);
    try {
      const db = await getDb();
      
      // First, fetch the existing task data
      const existingTaskRes = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
      const existingTaskRow = existingTaskRes[0]?.values?.[0];
      const existingTaskCols = existingTaskRes[0]?.columns || [];
      
      if (!existingTaskRow) {
        throw new Error('Task not found');
      }
      
      // Convert existing task row to object
      const existingTask: any = {};
      existingTaskCols.forEach((col, i) => (existingTask[col] = existingTaskRow[i]));
      
      // Merge updates with existing values
      const mergedData = {
        title: updates.title ?? existingTask.title,
        description: updates.description ?? existingTask.description,
        priority: updates.priority ?? existingTask.priority,
        dueDate: updates.dueDate !== undefined ? updates.dueDate : (existingTask.due_date ? new Date(existingTask.due_date) : null),
        points: updates.points ?? existingTask.points,
        status: updates.status ?? existingTask.status,
        scheduledTime: (updates as any).scheduledTime ?? existingTask.scheduled_time,
        estimatedDuration: (updates as any).estimatedDuration ?? existingTask.estimated_duration,
      };
      
      db.run(
        `UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, points = ?, status = ?, scheduled_time = ?, estimated_duration = ?, updated_at = datetime('now') WHERE id = ?`,
        [
          mergedData.title,
          mergedData.description,
          mergedData.priority,
          mergedData.dueDate ? mergedData.dueDate.toISOString() : null,
          mergedData.points,
          mergedData.status,
          mergedData.scheduledTime,
          mergedData.estimatedDuration,
          id,
        ]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const completeTask = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      // Get the task and its stock
      const taskRes = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
      const taskRow = taskRes[0]?.values?.[0];
      const taskCols = taskRes[0]?.columns || [];
      if (!taskRow) throw new Error('Task not found');
      const taskObj: any = {};
      taskCols.forEach((col, i) => (taskObj[col] = taskRow[i]));
      const stockRes = db.exec('SELECT * FROM stocks WHERE id = ?', [taskObj.stock_id]);
      const stockRow = stockRes[0]?.values?.[0];
      const stockCols = stockRes[0]?.columns || [];
      if (!stockRow) throw new Error('Stock not found');
      const stockObj: any = {};
      stockCols.forEach((col, i) => (stockObj[col] = stockRow[i]));
      // Calculate score
      const score = calculateTaskScore({
        priority: taskObj.priority || 'medium',
        complexity: taskObj.complexity || 1,
        type: taskObj.type,
        dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
        completedAt: new Date(),
      });
      // Update task
      db.run(
        `UPDATE tasks SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now'), score = ? WHERE id = ?`,
        [score, id]
      );
      // Update stock current_score and last_activity_at
      const newScore = (stockObj.current_score || 500) + score;
      db.run(
        `UPDATE stocks SET current_score = ?, last_activity_at = datetime('now') WHERE id = ?`,
        [newScore, stockObj.id]
      );
      // Insert into stock_performance_history
      db.run(
        `INSERT INTO stock_performance_history (stock_id, date, daily_score, score_delta, delta_percent, tasks_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          stockObj.id,
          new Date().toISOString().split('T')[0],
          newScore,
          score,
          stockObj.current_score ? (score / stockObj.current_score) * 100 : 0,
          1,
        ]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        `DELETE FROM tasks WHERE id = ?`,
        [id]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const markAsNotCompleted = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      // Get the task
      const taskRes = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
      const taskRow = taskRes[0]?.values?.[0];
      const taskCols = taskRes[0]?.columns || [];
      if (!taskRow) throw new Error('Task not found');
      // Update task only (no penalty)
      db.run(
        `UPDATE tasks SET status = 'pending', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as not completed');
      throw err;
    }
  };

  const failTask = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      // Get the task and its stock
      const taskRes = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
      const taskRow = taskRes[0]?.values?.[0];
      const taskCols = taskRes[0]?.columns || [];
      if (!taskRow) throw new Error('Task not found');
      const taskObj: any = {};
      taskCols.forEach((col, i) => (taskObj[col] = taskRow[i]));
      const stockRes = db.exec('SELECT * FROM stocks WHERE id = ?', [taskObj.stock_id]);
      const stockRow = stockRes[0]?.values?.[0];
      const stockCols = stockRes[0]?.columns || [];
      if (!stockRow) throw new Error('Stock not found');
      const stockObj: any = {};
      stockCols.forEach((col, i) => (stockObj[col] = stockRow[i]));
      // Get the last score for this task (from score column or recalculate)
      const score = taskObj.score || calculateTaskScore({
        priority: taskObj.priority || 'medium',
        complexity: taskObj.complexity || 1,
        type: taskObj.type,
        dueDate: taskObj.due_date ? new Date(taskObj.due_date) : undefined,
        completedAt: taskObj.completed_at ? new Date(taskObj.completed_at) : undefined,
    });
      // Update task
      db.run(
        `UPDATE tasks SET status = 'failed', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
      // Decrease stock current_score by 1.5x the task's score
      const decrease = score * 1.5;
      const newScore = Math.max(0, (stockObj.current_score || 500) - decrease);
      db.run(
        `UPDATE stocks SET current_score = ?, last_activity_at = datetime('now') WHERE id = ?`,
        [newScore, stockObj.id]
      );
      // Insert into stock_performance_history
      db.run(
        `INSERT INTO stock_performance_history (stock_id, date, daily_score, score_delta, delta_percent, tasks_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          stockObj.id,
          new Date().toISOString().split('T')[0],
          newScore,
          -decrease,
          stockObj.current_score ? (-decrease / stockObj.current_score) * 100 : 0,
          0,
        ]
      );
      await persistDb();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as failed');
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    markAsNotCompleted,
    failTask,
    refetch: fetchTasks,
  };
};