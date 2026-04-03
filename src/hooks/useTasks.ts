import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Task } from '../types';
import { notifyStocksMutated, pushSequentialIndexUpdate } from '../utils/indexSync';

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const result = await response.json();
      
      const tasksList = result.data.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: new Date(t.createdAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      }));
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
    repeatPattern?: {
      type: 'none' | 'daily' | 'weekly' | 'custom';
      endDate?: Date;
      daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
      customDates?: Date[];
    };
  }) => {
    if (!user) return;
    setError(null);
    try {
      const payload = {
          title: taskData.title,
          description: taskData.description,
          stockId: taskData.stockId,
          dueDate: taskData.dueDate?.toISOString(),
          scheduledTime: taskData.scheduledTime,
          estimatedDuration: taskData.estimatedDuration,
          priority: taskData.priority,
          points: taskData.points,
          recurringPattern: taskData.repeatPattern ? {
            type: taskData.repeatPattern.type,
            endDate: taskData.repeatPattern.endDate?.toISOString(),
            daysOfWeek: taskData.repeatPattern.daysOfWeek,
            customDates: taskData.repeatPattern.customDates?.map(d => d.toISOString()),
          } : null,
      };
      const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    setError(null);
    try {
      const payload = { ...updates };
      if (payload.dueDate) payload.dueDate = payload.dueDate.toISOString() as any;
      const response = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const completeTask = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${id}/complete`, { method: 'POST', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await pushSequentialIndexUpdate();
      notifyStocksMutated();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const markAsNotCompleted = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${id}/uncomplete`, { method: 'POST', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as not completed');
      throw err;
    }
  };

  const failTask = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${id}/fail`, { method: 'POST', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await pushSequentialIndexUpdate();
      notifyStocksMutated();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as failed');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
        fetchTasks();
    } else {
        setTasks([]);
    }
    // eslint-disable-next-line
  }, [user]);

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
