import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Achievement } from '../types';
import { useTasks } from './useTasks';
import { useStreaks } from './useStreaks';

const currentUserId = 1;

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
    color: 'bg-blue-500',
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const { tasks } = useTasks();
  const { streaks } = useStreaks();

  const initializeAchievements = async () => {
    try {
      const db = await getDb();
      
      // Create achievements table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          achievement_id TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          is_unlocked BOOLEAN DEFAULT false,
          unlocked_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, achievement_id)
        )
      `);

      // Initialize achievements if they don't exist
      for (const achievement of ACHIEVEMENT_DEFINITIONS) {
        const existing = db.exec(
          'SELECT id FROM achievements WHERE user_id = ? AND achievement_id = ?',
          [currentUserId, achievement.id]
        );
        
        if (!existing[0]?.values?.length) {
          db.run(
            'INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)',
            [currentUserId, achievement.id]
          );
        }
      }

      await persistDb();
      await fetchAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize achievements');
    }
  };

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM achievements WHERE user_id = ?',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const achievementsList: Achievement[] = rows.map((row: any[]) => {
        const achievementObj: any = {};
        columns.forEach((col, i) => (achievementObj[col] = row[i]));
        
        const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.id === achievementObj.achievement_id);
        
        return {
          id: achievementObj.achievement_id,
          title: definition?.title || 'Unknown Achievement',
          description: definition?.description || '',
          icon: definition?.icon || '🏆',
          category: definition?.category || 'completion',
          requirement: definition?.requirement || 1,
          progress: achievementObj.progress || 0,
          isUnlocked: Boolean(achievementObj.is_unlocked),
          unlockedAt: achievementObj.unlocked_at ? new Date(achievementObj.unlocked_at) : undefined,
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
    if (!tasks.length || !achievements.length) return;

    try {
      const db = await getDb();
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
      const earlyTasks = completedTasks.filter(task => 
        task.dueDate && task.completedAt && task.completedAt < task.dueDate
      );
      
      const dailyStreak = streaks.find(s => s.type === 'daily_completion');
      const onTimeStreak = streaks.find(s => s.type === 'on_time');

      const updates = [
        { id: 'first_task', progress: Math.min(completedTasks.length, 1) },
        { id: 'century_club', progress: completedTasks.length },
        { id: 'high_achiever', progress: totalPoints },
        { id: 'early_bird', progress: earlyTasks.length },
        { id: 'week_streak', progress: dailyStreak?.currentStreak || 0 },
        { id: 'consistency_king', progress: dailyStreak?.currentStreak || 0 },
        { id: 'marathon_runner', progress: dailyStreak?.currentStreak || 0 },
        { id: 'perfectionist', progress: onTimeStreak?.currentStreak || 0 },
      ];

      const newlyUnlockedList: Achievement[] = [];

      for (const update of updates) {
        const achievement = achievements.find(a => a.id === update.id);
        if (!achievement) continue;

        const shouldUnlock = !achievement.isUnlocked && update.progress >= achievement.requirement;
        
        if (shouldUnlock) {
          newlyUnlockedList.push(achievement);
          db.run(
            `UPDATE achievements SET 
             progress = ?, 
             is_unlocked = true, 
             unlocked_at = datetime('now'),
             updated_at = datetime('now')
             WHERE user_id = ? AND achievement_id = ?`,
            [update.progress, currentUserId, update.id]
          );
        } else {
          db.run(
            `UPDATE achievements SET 
             progress = ?, 
             updated_at = datetime('now')
             WHERE user_id = ? AND achievement_id = ?`,
            [update.progress, currentUserId, update.id]
          );
        }
      }

      if (newlyUnlockedList.length > 0) {
        setNewlyUnlocked(newlyUnlockedList);
        // Clear newly unlocked after 5 seconds
        setTimeout(() => setNewlyUnlocked([]), 5000);
      }

      await persistDb();
      await fetchAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update achievements');
    }
  };

  useEffect(() => {
    initializeAchievements();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && achievements.length > 0) {
      updateAchievements();
    }
  }, [tasks, streaks, achievements.length]);

  return {
    achievements,
    newlyUnlocked,
    loading,
    error,
    refetch: fetchAchievements,
  };
};