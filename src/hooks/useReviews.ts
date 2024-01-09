import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { WeeklyReview, ReflectionInsight } from '../types';
import { useTasks } from './useTasks';
import { useStocks } from './useStocks';
import { useStreaks } from './useStreaks';
import { useIndex } from './useIndex';
import { startOfWeek, endOfWeek, subWeeks, format, isSameWeek } from 'date-fns';

const currentUserId = 1;

export const useReviews = () => {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [insights, setInsights] = useState<ReflectionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { tasks } = useTasks();
  const { stocks } = useStocks();
  const { streaks } = useStreaks();
  const { indexData } = useIndex();

  const initializeReviews = async () => {
    try {
      const db = await getDb();
      
      // Create weekly_reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS weekly_reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          week_start TEXT NOT NULL,
          week_end TEXT NOT NULL,
          rating TEXT NOT NULL,
          stats TEXT NOT NULL,
          journal_entry_id INTEGER,
          insights TEXT,
          goals TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Create reflection_insights table
      db.run(`
        CREATE TABLE IF NOT EXISTS reflection_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          data TEXT,
          confidence TEXT DEFAULT 'medium',
          actionable BOOLEAN DEFAULT false,
          dismissed BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await persistDb();
      await fetchReviews();
      await fetchInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize reviews');
    }
  };

  const fetchReviews = async () => {
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start DESC',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const reviewsList: WeeklyReview[] = rows.map((row: any[]) => {
        const reviewObj: any = {};
        columns.forEach((col, i) => (reviewObj[col] = row[i]));
        
        return {
          id: reviewObj.id.toString(),
          userId: reviewObj.user_id.toString(),
          weekStart: new Date(reviewObj.week_start),
          weekEnd: new Date(reviewObj.week_end),
          rating: reviewObj.rating,
          stats: JSON.parse(reviewObj.stats),
          journalEntryId: reviewObj.journal_entry_id?.toString(),
          insights: reviewObj.insights ? JSON.parse(reviewObj.insights) : [],
          goals: reviewObj.goals ? JSON.parse(reviewObj.goals) : [],
          createdAt: new Date(reviewObj.created_at),
          updatedAt: new Date(reviewObj.updated_at),
        };
      });
      
      setReviews(reviewsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    }
  };

  const fetchInsights = async () => {
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM reflection_insights WHERE user_id = ? AND dismissed = false ORDER BY created_at DESC',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const insightsList: ReflectionInsight[] = rows.map((row: any[]) => {
        const insightObj: any = {};
        columns.forEach((col, i) => (insightObj[col] = row[i]));
        
        return {
          id: insightObj.id.toString(),
          type: insightObj.type,
          title: insightObj.title,
          description: insightObj.description,
          data: insightObj.data ? JSON.parse(insightObj.data) : null,
          confidence: insightObj.confidence,
          actionable: Boolean(insightObj.actionable),
          dismissed: Boolean(insightObj.dismissed),
          createdAt: new Date(insightObj.created_at),
        };
      });
      
      setInsights(insightsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    }
  };

  const generateWeeklyStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart);
    const weekTasks = tasks.filter(task => 
      task.createdAt >= weekStart && task.createdAt <= weekEnd
    );
    
    const completedTasks = weekTasks.filter(task => task.status === 'completed');
    const missedTasks = weekTasks.filter(task => task.status === 'overdue' || task.status === 'failed');
    const rescheduledTasks = weekTasks.filter(task => 
      task.dueDate && task.updatedAt && task.updatedAt > task.createdAt
    );

    const activeStreaks = streaks.filter(streak => streak.isActive);
    const brokenStreaks = streaks.filter(streak => !streak.isActive && streak.currentStreak === 0);

    const topStock = stocks.reduce((best, stock) => 
      stock.changePercent > (best?.changePercent || -Infinity) ? stock : best, null
    );
    
    const strugglingStock = stocks.reduce((worst, stock) => 
      stock.changePercent < (worst?.changePercent || Infinity) ? stock : worst, null
    );

    return {
      tasksCompleted: completedTasks.length,
      tasksMissed: missedTasks.length,
      tasksRescheduled: rescheduledTasks.length,
      streaksMaintained: activeStreaks.length,
      streaksBroken: brokenStreaks.length,
      indexChange: indexData?.changePercent || 0,
      topPerformingStock: topStock?.name || '',
      strugglingStock: strugglingStock?.name || '',
    };
  };

  const createWeeklyReview = async (weekStart: Date, rating: WeeklyReview['rating'], journalEntryId?: string) => {
    setError(null);
    try {
      const db = await getDb();
      const weekEnd = endOfWeek(weekStart);
      const stats = generateWeeklyStats(weekStart);
      const insights = await generateInsights();
      
      db.run(
        `INSERT INTO weekly_reviews (user_id, week_start, week_end, rating, stats, journal_entry_id, insights, goals) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          currentUserId,
          weekStart.toISOString(),
          weekEnd.toISOString(),
          rating,
          JSON.stringify(stats),
          journalEntryId || null,
          JSON.stringify(insights),
          JSON.stringify([]),
        ]
      );
      
      await persistDb();
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create weekly review');
      throw err;
    }
  };

  const generateInsights = async (): Promise<string[]> => {
    const insights: string[] = [];
    
    // Analyze task completion patterns
    const tasksByDay = tasks.reduce((acc, task) => {
      if (task.completedAt) {
        const day = task.completedAt.getDay();
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const leastProductiveDay = Object.entries(tasksByDay).reduce((min, [day, count]) => 
      count < (tasksByDay[parseInt(min[0])] || Infinity) ? [day, count] : min, ['0', Infinity]
    );

    if (parseInt(leastProductiveDay[0]) >= 0) {
      insights.push(`You tend to complete fewer tasks on ${dayNames[parseInt(leastProductiveDay[0])]}`);
    }

    // Analyze stock performance
    const decliningStocks = stocks.filter(stock => stock.changePercent < -5);
    if (decliningStocks.length > 0) {
      insights.push(`${decliningStocks[0].name} needs attention - consider adding more tasks here`);
    }

    // Analyze streaks
    const longestStreak = streaks.reduce((max, streak) => 
      streak.longestStreak > max ? streak.longestStreak : max, 0
    );
    
    if (longestStreak > 7) {
      insights.push(`Great job maintaining streaks! Your longest is ${longestStreak} days`);
    }

    return insights;
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const db = await getDb();
      db.run(
        'UPDATE reflection_insights SET dismissed = true WHERE id = ? AND user_id = ?',
        [insightId, currentUserId]
      );
      await persistDb();
      await fetchInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss insight');
    }
  };

  const getReviewForWeek = (date: Date) => {
    return reviews.find(review => isSameWeek(review.weekStart, date));
  };

  useEffect(() => {
    initializeReviews();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && stocks.length > 0) {
      setLoading(false);
    }
  }, [tasks, stocks]);

  return {
    reviews,
    insights,
    loading,
    error,
    createWeeklyReview,
    generateWeeklyStats,
    dismissInsight,
    getReviewForWeek,
    refetch: fetchReviews,
  };
};