import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Streak } from '../types';
import { useTasks } from './useTasks';

export const useStreaks = () => {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tasks } = useTasks();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchStreaks = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/streaks', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch streaks');
      const result = await response.json();
      
      const streaksList = result.data.map((s: any) => ({
        ...s,
        lastActivityDate: new Date(s.lastActivityDate),
      }));
      setStreaks(streaksList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch streaks');
    } finally {
      setLoading(false);
    }
  };

  const updateStreaks = async () => {
    if (!user || !tasks.length) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayCompleted = tasks.filter(task => 
        task.status === 'completed' && 
        task.completedAt && 
        task.completedAt.toISOString().split('T')[0] === today
      );

      const yesterdayCompleted = tasks.filter(task => 
        task.status === 'completed' && 
        task.completedAt && 
        task.completedAt.toISOString().split('T')[0] === yesterday
      );

      const dailyStreak = streaks.find(s => s.type === 'daily_completion');
      if (dailyStreak) {
        let newCurrentStreak = dailyStreak.currentStreak;
        let isActive = false;

        if (todayCompleted.length > 0) {
          if (yesterdayCompleted.length > 0 || dailyStreak.currentStreak === 0) {
            newCurrentStreak = dailyStreak.currentStreak + 1;
          }
          isActive = true;
        } else if (yesterdayCompleted.length === 0 && dailyStreak.currentStreak > 0) {
          newCurrentStreak = 0;
        }

        const newLongestStreak = Math.max(dailyStreak.longestStreak, newCurrentStreak);

        await fetch(`/api/streaks/${dailyStreak.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: today,
            isActive
          })
        });
      }

      const todayOnTime = tasks.filter(task => 
        task.status === 'completed' && 
        task.completedAt && 
        task.dueDate &&
        task.completedAt <= task.dueDate &&
        task.completedAt.toISOString().split('T')[0] === today
      );

      const onTimeStreak = streaks.find(s => s.type === 'on_time');
      if (onTimeStreak && todayOnTime.length > 0) {
        const newCurrentStreak = onTimeStreak.currentStreak + 1;
        const newLongestStreak = Math.max(onTimeStreak.longestStreak, newCurrentStreak);

        await fetch(`/api/streaks/${onTimeStreak.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: today,
            isActive: true
          })
        });
      }

      await fetchStreaks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streaks');
    }
  };

  useEffect(() => {
    if (user) {
        fetchStreaks();
    } else {
        setStreaks([]);
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (user && tasks.length > 0) {
      updateStreaks();
    }
    // eslint-disable-next-line
  }, [tasks, user]);

  return {
    streaks,
    loading,
    error,
    updateStreaks,
    refetch: fetchStreaks,
  };
};
