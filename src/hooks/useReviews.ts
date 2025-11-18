import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { WeeklyReview, ReflectionInsight } from '../types';
import { useTasks } from './useTasks';
import { useStocks } from './useStocks';
import { useStreaks } from './useStreaks';
import { useIndex } from './useIndex';
import { endOfWeek, isSameWeek } from 'date-fns';

export const useReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [insights, setInsights] = useState<ReflectionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { tasks } = useTasks();
  const { stocks } = useStocks();
  const { streaks } = useStreaks();
  const { indexData } = useIndex();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchReviews = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/reviews', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const result = await response.json();
      
      const reviewsList = result.data.map((r: any) => ({
        ...r,
        weekStart: new Date(r.weekStart),
        weekEnd: new Date(r.weekEnd),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
      
      setReviews(reviewsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    }
  };

  const fetchInsights = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/reviews/insights', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch insights');
      const result = await response.json();
      
      const insightsList = result.data.map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
      }));
      
      setInsights(insightsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    }
  };

  const generateWeeklyStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart);
    const weekTasks = tasks.filter(task => 
      task.createdAt && task.createdAt >= weekStart && task.createdAt <= weekEnd
    );
    
    const completedTasks = weekTasks.filter(task => task.status === 'completed');
    const missedTasks = weekTasks.filter(task => task.status === 'overdue' || (task.status as any) === 'failed');
    const rescheduledTasks = weekTasks.filter(task => 
      task.dueDate && (task as any).updatedAt && (task as any).updatedAt > task.createdAt
    );

    const activeStreaks = streaks.filter(streak => streak.isActive);
    const brokenStreaks = streaks.filter(streak => !streak.isActive && streak.currentStreak === 0);

    const topStock = stocks.reduce((best, stock) => 
      stock.changePercent > (best?.changePercent || -Infinity) ? stock : best, null as any
    );
    
    const strugglingStock = stocks.reduce((worst, stock) => 
      stock.changePercent < (worst?.changePercent || Infinity) ? stock : worst, null as any
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

  const generateInsights = async (): Promise<string[]> => {
    const newInsights: string[] = [];
    
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

    if (parseInt(leastProductiveDay[0]) >= 0 && leastProductiveDay[1] !== Infinity) {
      newInsights.push(`You tend to complete fewer tasks on ${dayNames[parseInt(leastProductiveDay[0])]}`);
    }

    const decliningStocks = stocks.filter(stock => stock.changePercent < -5);
    if (decliningStocks.length > 0) {
      newInsights.push(`${decliningStocks[0].name} needs attention - consider adding more tasks here`);
    }

    const longestStreak = streaks.reduce((max, streak) => 
      streak.longestStreak > max ? streak.longestStreak : max, 0
    );
    
    if (longestStreak > 7) {
      newInsights.push(`Great job maintaining streaks! Your longest is ${longestStreak} days`);
    }

    return newInsights;
  };

  const createWeeklyReview = async (weekStart: Date, rating: WeeklyReview['rating'], journalEntryId?: string) => {
    if (!user) return;
    setError(null);
    try {
      const weekEnd = endOfWeek(weekStart);
      const stats = generateWeeklyStats(weekStart);
      const generatedInsights = await generateInsights();
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          rating,
          stats,
          journalEntryId,
          insights: generatedInsights,
          goals: []
        })
      });

      if (!response.ok) throw new Error((await response.json()).error);
      
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create weekly review');
      throw err;
    }
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/reviews/insights/${insightId}/dismiss`, { method: 'POST', headers: getHeaders() });
      await fetchInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss insight');
    }
  };

  const getReviewForWeek = (date: Date) => {
    return reviews.find(review => isSameWeek(review.weekStart, date));
  };

  useEffect(() => {
    if (user) {
        fetchReviews();
        fetchInsights();
    } else {
        setReviews([]);
        setInsights([]);
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (user && tasks.length > 0 && stocks.length > 0) {
      setLoading(false);
    }
  }, [tasks, stocks, user]);

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
