import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Streak } from '../types';
import { useTasks } from './useTasks';

const currentUserId = 1;

export const useStreaks = () => {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tasks } = useTasks();

  const initializeStreaks = async () => {
    try {
      const db = await getDb();
      
      // Create streaks table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS streaks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_activity_date TEXT,
          is_active BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Initialize default streak types if they don't exist
      const streakTypes = ['daily_completion', 'on_time', 'no_missed'];
      
      for (const type of streakTypes) {
        const existing = db.exec(
          'SELECT id FROM streaks WHERE user_id = ? AND type = ?',
          [currentUserId, type]
        );
        
        if (!existing[0]?.values?.length) {
          db.run(
            'INSERT INTO streaks (user_id, type) VALUES (?, ?)',
            [currentUserId, type]
          );
        }
      }

      await persistDb();
      await fetchStreaks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize streaks');
    }
  };

  const fetchStreaks = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM streaks WHERE user_id = ?',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const streaksList: Streak[] = rows.map((row: any[]) => {
        const streakObj: any = {};
        columns.forEach((col, i) => (streakObj[col] = row[i]));
        
        return {
          id: streakObj.id.toString(),
          type: streakObj.type,
          currentStreak: streakObj.current_streak || 0,
          longestStreak: streakObj.longest_streak || 0,
          lastActivityDate: streakObj.last_activity_date ? new Date(streakObj.last_activity_date) : new Date(),
          isActive: Boolean(streakObj.is_active),
        };
      });
      
      setStreaks(streaksList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch streaks');
    } finally {
      setLoading(false);
    }
  };

  const updateStreaks = async () => {
    if (!tasks.length) return;

    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Check daily completion streak
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

      // Update daily completion streak
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

        db.run(
          `UPDATE streaks SET 
           current_streak = ?, 
           longest_streak = ?, 
           last_activity_date = ?, 
           is_active = ?,
           updated_at = datetime('now')
           WHERE id = ?`,
          [newCurrentStreak, newLongestStreak, today, isActive, dailyStreak.id]
        );
      }

      // Check on-time streak
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

        db.run(
          `UPDATE streaks SET 
           current_streak = ?, 
           longest_streak = ?, 
           last_activity_date = ?, 
           is_active = true,
           updated_at = datetime('now')
           WHERE id = ?`,
          [newCurrentStreak, newLongestStreak, today, onTimeStreak.id]
        );
      }

      await persistDb();
      await fetchStreaks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streaks');
    }
  };

  useEffect(() => {
    initializeStreaks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      updateStreaks();
    }
  }, [tasks]);

  return {
    streaks,
    loading,
    error,
    updateStreaks,
    refetch: fetchStreaks,
  };
};