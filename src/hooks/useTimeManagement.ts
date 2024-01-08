import { useState, useEffect, useMemo } from 'react';
import { Task, DayLoadInfo, Reschedulesuggestion } from '../types';
import { useTasks } from './useTasks';
import { useStocks } from './useStocks';
import { addDays, startOfDay, isSameDay, format } from 'date-fns';

export const useTimeManagement = () => {
  const { tasks } = useTasks();
  const { stocks } = useStocks();
  const [dailyBudgetMinutes, setDailyBudgetMinutes] = useState(480); // 8 hours default
  const [workingHours, setWorkingHours] = useState({ start: '00:00', end: '23:30' });

  // Calculate load info for a specific day
  const calculateDayLoad = (date: Date): DayLoadInfo => {
    const dayTasks = tasks.filter(task => 
      task.dueDate && isSameDay(task.dueDate, date) && task.status !== 'completed'
    );

    const totalScheduledMinutes = dayTasks.reduce((sum, task) => 
      sum + (task.estimatedDuration || 30), 0
    );

    // Calculate stock balance for the day
    const stockBalance: Record<string, number> = {};
    dayTasks.forEach(task => {
      if (!stockBalance[task.stockId]) stockBalance[task.stockId] = 0;
      stockBalance[task.stockId] += task.estimatedDuration || 30;
    });

    let loadScore: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
    const loadRatio = totalScheduledMinutes / dailyBudgetMinutes;
    
    if (loadRatio > 1.2) loadScore = 'overloaded';
    else if (loadRatio > 0.8) loadScore = 'heavy';
    else if (loadRatio > 0.5) loadScore = 'moderate';

    return {
      date,
      totalScheduledMinutes,
      dailyBudgetMinutes,
      loadScore,
      tasks: dayTasks,
      stockBalance,
    };
  };

  // Get load info for the next 7 days
  const weeklyLoadInfo = useMemo(() => {
    const days: DayLoadInfo[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      days.push(calculateDayLoad(date));
    }
    return days;
  }, [tasks, dailyBudgetMinutes]);

  // Generate rescheduling suggestions
  const generateReschedulesuggestions = (): Reschedulesuggestion[] => {
    const suggestions: Reschedulesuggestion[] = [];
    const overdueTasks = tasks.filter(task => 
      task.status === 'overdue' || 
      (task.dueDate && task.dueDate < new Date() && task.status === 'pending')
    );

    overdueTasks.forEach(task => {
      // Find the best day to reschedule based on load
      const bestDay = weeklyLoadInfo
        .filter(day => day.loadScore !== 'overloaded')
        .sort((a, b) => a.totalScheduledMinutes - b.totalScheduledMinutes)[0];

      if (bestDay) {
        suggestions.push({
          taskId: task.id,
          suggestedDate: bestDay.date,
          reason: `${bestDay.date.toLocaleDateString()} has lighter load (${Math.round(bestDay.totalScheduledMinutes / 60)}h scheduled)`,
          confidence: bestDay.loadScore === 'light' ? 'high' : 'medium',
        });
      }
    });

    return suggestions;
  };

  // Check for conflicts and issues
  const detectIssues = () => {
    const issues: string[] = [];
    
    // Check for overbooked days
    weeklyLoadInfo.forEach(day => {
      if (day.loadScore === 'overloaded') {
        issues.push(`${day.date.toLocaleDateString()} is overbooked (${Math.round(day.totalScheduledMinutes / 60)}h scheduled)`);
      }
    });

    // Check for neglected stocks
    const stockActivity: Record<string, number> = {};
    weeklyLoadInfo.forEach(day => {
      Object.entries(day.stockBalance).forEach(([stockId, minutes]) => {
        if (!stockActivity[stockId]) stockActivity[stockId] = 0;
        stockActivity[stockId] += minutes;
      });
    });

    stocks.forEach(stock => {
      if (!stockActivity[stock.id] || stockActivity[stock.id] < 60) {
        issues.push(`${stock.name} has no tasks scheduled this week`);
      }
    });

    return issues;
  };

  // Auto-balance week by redistributing tasks
  const autoBalanceWeek = () => {
    const suggestions: { taskId: string; newDate: Date }[] = [];
    
    // Find overloaded days and light days
    const overloadedDays = weeklyLoadInfo.filter(day => day.loadScore === 'overloaded');
    const lightDays = weeklyLoadInfo.filter(day => day.loadScore === 'light');

    overloadedDays.forEach(overloadedDay => {
      // Move some tasks to lighter days
      const movableTasks = overloadedDay.tasks
        .filter(task => task.priority !== 'high')
        .sort((a, b) => (a.estimatedDuration || 30) - (b.estimatedDuration || 30));

      movableTasks.slice(0, 2).forEach(task => {
        const targetDay = lightDays.find(day => 
          day.totalScheduledMinutes + (task.estimatedDuration || 30) < day.dailyBudgetMinutes
        );
        
        if (targetDay) {
          suggestions.push({
            taskId: task.id,
            newDate: targetDay.date,
          });
        }
      });
    });

    return suggestions;
  };

  return {
    dailyBudgetMinutes,
    setDailyBudgetMinutes,
    workingHours,
    setWorkingHours,
    weeklyLoadInfo,
    calculateDayLoad,
    generateReschedulesuggestions,
    detectIssues,
    autoBalanceWeek,
  };
};