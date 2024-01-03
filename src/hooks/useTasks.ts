import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Task } from '../types';

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          stocks!inner (
            user_id,
            name,
            color
          )
        `)
        .eq('stocks.user_id', user.id)
        .order('due_date', { nullsLast: true });

      if (error) throw error;

      const transformedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        dueDate: new Date(task.due_date || new Date()),
        priority: task.priority as 'low' | 'medium' | 'high',
        status: task.status as 'pending' | 'completed' | 'overdue',
        stockId: task.stock_id,
        points: task.points || 10,
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      }));

      setTasks(transformedTasks);
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
    priority: 'low' | 'medium' | 'high';
    points?: number;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          stock_id: taskData.stockId,
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.dueDate?.toISOString(),
          priority: taskData.priority,
          points: taskData.points || 10,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTasks();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const updateData: any = {
        title: updates.title,
        description: updates.description,
        due_date: updates.dueDate?.toISOString(),
        priority: updates.priority,
        status: updates.status,
        points: updates.points,
        updated_at: new Date().toISOString(),
      };

      // Set completed_at when marking as completed
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status !== 'completed') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const completeTask = async (id: string) => {
    await updateTask(id, { 
      status: 'completed',
      completedAt: new Date()
    });
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refetch: fetchTasks,
  };
};