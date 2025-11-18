import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Achievement } from '../types';
import { useTasks } from './useTasks';
import { useStreaks } from './useStreaks';

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_task',
    title: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    category: 'completion',
    requirement: 1,
    color: 'bg-green-500',
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Complete tasks for 7 days in a row',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
    color: 'bg-orange-500',
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 total tasks',
    icon: '💯',
    category: 'completion',
    requirement: 100,
    color: 'bg-purple-500',
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete all tasks on time for a week',
    icon: '⭐',
    category: 'performance',
    requirement: 7,
    color: 'bg-yellow-500',
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Complete at least one task every day for 30 days',
    icon: '👑',
    category: 'consistency',
    requirement: 30,
    color: 'bg-violet-500',
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete 50 tasks before their due date',
    icon: '🐦',
    category: 'performance',
    requirement: 50,
    color: 'bg-indigo-500',
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Maintain a 50-day completion streak',
    icon: '🏃‍♂️',
    category: 'streak',
    requirement: 50,
    color: 'bg-red-500',
  },
  {
    id: 'high_achiever',
    title: 'High Achiever',
    description: 'Earn 1000 total points',
    icon: '🚀',
    category: 'completion',
    requirement: 1000,
    color: 'bg-pink-500',
  },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const { tasks } = useTasks();
  const { streaks } = useStreaks();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchAchievements = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/achievements', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const result = await response.json();
      
      const achievementsList: Achievement[] = result.data.map((r: any) => {
        const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.id === r.id);
        return {
          id: r.id,
          title: definition?.title || 'Unknown Achievement',
          description: definition?.description || '',
          icon: definition?.icon || '🏆',
          category: definition?.category || 'completion',
          requirement: definition?.requirement || 1,
          progress: r.progress || 0,
          isUnlocked: Boolean(r.isUnlocked),
          unlockedAt: r.unlockedAt ? new Date(r.unlockedAt) : undefined,
          color: definition?.color || 'bg-gray-500',
        };
      });
      
      setAchievements(achievementsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  const updateAchievements = async () => {
    if (!user || !tasks.length || !achievements.length) return;

    try {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
      const earlyTasks = completedTasks.filter(task => 
        task.dueDate && task.completedAt && task.completedAt < task.dueDate
      );
      
      const dailyStreak = streaks.find(s => s.type === 'daily_completion');
      const onTimeStreak = streaks.find(s => s.type === 'on_time');

      const updates = [
        { id: 'first_task', progress: Math.min(completedTasks.length, 1), requirement: 1 },
        { id: 'century_club', progress: completedTasks.length, requirement: 100 },
        { id: 'high_achiever', progress: totalPoints, requirement: 1000 },
        { id: 'early_bird', progress: earlyTasks.length, requirement: 50 },
        { id: 'week_streak', progress: dailyStreak?.currentStreak || 0, requirement: 7 },
        { id: 'consistency_king', progress: dailyStreak?.currentStreak || 0, requirement: 30 },
        { id: 'marathon_runner', progress: dailyStreak?.currentStreak || 0, requirement: 50 },
        { id: 'perfectionist', progress: onTimeStreak?.currentStreak || 0, requirement: 7 },
      ];

      const response = await fetch('/api/achievements/sync', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ updates })
      });
      if (!response.ok) throw new Error('Failed to sync achievements');
      const result = await response.json();

      const newlyUnlockedList: Achievement[] = [];
      for (const res of result.data) {
        if (res.newlyUnlocked) {
          const achievement = achievements.find(a => a.id === res.id);
          if (achievement) newlyUnlockedList.push(achievement);
        }
      }

      if (newlyUnlockedList.length > 0) {
        setNewlyUnlocked(newlyUnlockedList);
        setTimeout(() => setNewlyUnlocked([]), 5000);
      }

      await fetchAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update achievements');
    }
  };

  useEffect(() => {
    if (user) {
        fetchAchievements();
    } else {
        setAchievements([]);
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (user && tasks.length > 0 && achievements.length > 0) {
      updateAchievements();
    }
    // eslint-disable-next-line
  }, [tasks, streaks, achievements.length, user]);

  return {
    achievements,
    newlyUnlocked,
    loading,
    error,
    refetch: fetchAchievements,
  };
};
