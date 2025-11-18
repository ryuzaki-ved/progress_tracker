import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Alert } from '../types';
import { useStocks } from './useStocks';
import { useTasks } from './useTasks';
import { normalizeDateToStartOfDay } from '../utils/stockUtils';

export const useAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { stocks } = useStocks();
  const { tasks } = useTasks();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alerts', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const result = await response.json();
      
      const alertsList = result.data.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      }));
      setAlerts(alertsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData: Omit<Alert, 'id' | 'isRead' | 'isDismissed' | 'createdAt'>) => {
    if (!user) return;
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(alertData)
      });
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    }
  };

  const markAsRead = async (alertId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST', headers: getHeaders() });
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read');
    }
  };

  const dismissAlert = async (alertId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST', headers: getHeaders() });
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
    }
  };

  const generateAlerts = async () => {
    if (!user || !stocks.length || !tasks.length) return;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    const overdueTasks = tasks.filter(task => 
      task.status === 'overdue' || 
      (task.dueDate && task.dueDate < normalizeDateToStartOfDay(now) && task.status === 'pending')
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
    if (user) {
        fetchAlerts();
    } else {
        setAlerts([]);
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (user && stocks.length > 0 && tasks.length > 0) {
      generateAlerts();
    }
    // eslint-disable-next-line
  }, [stocks, tasks, user]);

  return {
    alerts,
    loading,
    error,
    markAsRead,
    dismissAlert,
    refetch: fetchAlerts,
  };
};
