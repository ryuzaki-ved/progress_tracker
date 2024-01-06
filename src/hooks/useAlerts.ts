import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Alert } from '../types';
import { useStocks } from './useStocks';
import { useTasks } from './useTasks';

const currentUserId = 1;

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { stocks } = useStocks();
  const { tasks } = useTasks();

  const initializeAlerts = async () => {
    try {
      const db = await getDb();
      
      // Create alerts table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          stock_id TEXT,
          severity TEXT DEFAULT 'medium',
          is_read BOOLEAN DEFAULT false,
          is_dismissed BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await persistDb();
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize alerts');
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM alerts WHERE user_id = ? AND is_dismissed = false ORDER BY created_at DESC',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const alertsList: Alert[] = rows.map((row: any[]) => {
        const alertObj: any = {};
        columns.forEach((col, i) => (alertObj[col] = row[i]));
        
        return {
          id: alertObj.id.toString(),
          type: alertObj.type,
          title: alertObj.title,
          message: alertObj.message,
          stockId: alertObj.stock_id,
          severity: alertObj.severity,
          isRead: Boolean(alertObj.is_read),
          isDismissed: Boolean(alertObj.is_dismissed),
          createdAt: new Date(alertObj.created_at),
        };
      });
      
      setAlerts(alertsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData: Omit<Alert, 'id' | 'isRead' | 'isDismissed' | 'createdAt'>) => {
    try {
      const db = await getDb();
      
      // Check if similar alert already exists
      const existing = db.exec(
        'SELECT id FROM alerts WHERE user_id = ? AND type = ? AND stock_id = ? AND is_dismissed = false',
        [currentUserId, alertData.type, alertData.stockId || null]
      );
      
      if (existing[0]?.values?.length) return; // Don't create duplicate alerts
      
      db.run(
        `INSERT INTO alerts (user_id, type, title, message, stock_id, severity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          currentUserId,
          alertData.type,
          alertData.title,
          alertData.message,
          alertData.stockId || null,
          alertData.severity,
        ]
      );
      
      await persistDb();
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const db = await getDb();
      db.run(
        'UPDATE alerts SET is_read = true WHERE id = ? AND user_id = ?',
        [alertId, currentUserId]
      );
      await persistDb();
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read');
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const db = await getDb();
      db.run(
        'UPDATE alerts SET is_dismissed = true WHERE id = ? AND user_id = ?',
        [alertId, currentUserId]
      );
      await persistDb();
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
    }
  };

  const generateAlerts = async () => {
    if (!stocks.length || !tasks.length) return;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for neglected stocks
    for (const stock of stocks) {
      const stockTasks = tasks.filter(task => task.stockId === stock.id);
      const recentTasks = stockTasks.filter(task => 
        task.createdAt && task.createdAt > oneWeekAgo
      );

      if (recentTasks.length === 0 && stockTasks.length > 0) {
        await createAlert({
          type: 'neglected_stock',
          title: `${stock.name} Needs Attention`,
          message: `No tasks created for ${stock.name} in the past week. Consider adding some goals!`,
          stockId: stock.id,
          severity: 'medium',
        });
      }

      // Check for performance drops
      if (stock.changePercent < -15) {
        await createAlert({
          type: 'performance_drop',
          title: `${stock.name} Performance Drop`,
          message: `${stock.name} has dropped ${Math.abs(stock.changePercent).toFixed(1)}% recently. Time to focus here?`,
          stockId: stock.id,
          severity: 'high',
        });
      }
    }

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.status === 'overdue' || 
      (task.dueDate && task.dueDate < now && task.status === 'pending')
    );

    if (overdueTasks.length > 0) {
      await createAlert({
        type: 'overdue_tasks',
        title: 'Overdue Tasks',
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Complete them to boost your scores!`,
        severity: 'high',
      });
    }
  };

  useEffect(() => {
    initializeAlerts();
  }, []);

  useEffect(() => {
    if (stocks.length > 0 && tasks.length > 0) {
      generateAlerts();
    }
  }, [stocks, tasks]);

  return {
    alerts,
    loading,
    error,
    markAsRead,
    dismissAlert,
    refetch: fetchAlerts,
  };
};