export interface Stock {
  id: string;
  name: string;
  icon: string;
  category: string;
  currentScore: number;
  change: number;
  changePercent: number;
  volatility: 'low' | 'medium' | 'high';
  lastActivity: Date;
  color: string;
  weight: number;
  history: { date: Date; value: number }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | null | undefined;
  scheduledTime?: string; // HH:MM format for specific time scheduling
  estimatedDuration?: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  stockId: string;
  points: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface DailyTimeSlot {
  time: string; // HH:MM format
  task?: Task;
  isAvailable: boolean;
}

export interface DayLoadInfo {
  date: Date;
  totalScheduledMinutes: number;
  dailyBudgetMinutes: number;
  loadScore: 'light' | 'moderate' | 'heavy' | 'overloaded';
  tasks: Task[];
  stockBalance: Record<string, number>; // stockId -> minutes
}

export interface Reschedulesuggestion {
  taskId: string;
  suggestedDate: Date;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface IndexData {
  value: number;
  change: number;
  changePercent: number;
  history: { date: Date; value: number }[];
}

export interface Streak {
  id: string;
  type: 'daily_completion' | 'on_time' | 'no_missed';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  isActive: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'performance' | 'consistency';
  requirement: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  color: string;
}

export interface Alert {
  id: string;
  type: 'neglected_stock' | 'performance_drop' | 'overdue_tasks' | 'streak_risk';
  title: string;
  message: string;
  stockId?: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
}

export interface Theme {
  mode: 'light' | 'dark';
  accent: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: Date;
  title?: string;
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'tough' | 'chaotic';
  prompts?: {
    whatWorked?: string;
    whereStruggled?: string;
    willImprove?: string;
    gratitude?: string;
  };
  tags?: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  rating: 'great' | 'good' | 'okay' | 'tough' | 'chaotic';
  stats: {
    tasksCompleted: number;
    tasksMissed: number;
    tasksRescheduled: number;
    streaksMaintained: number;
    streaksBroken: number;
    indexChange: number;
    topPerformingStock: string;
    strugglingStock: string;
  };
  journalEntryId?: string;
  insights: string[];
  goals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReflectionInsight {
  id: string;
  type: 'pattern' | 'trend' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  data: any;
  confidence: 'low' | 'medium' | 'high';
  actionable: boolean;
  dismissed: boolean;
  createdAt: Date;
}

export interface StockForecast {
  stockId: string;
  momentum: 'rising' | 'falling' | 'stable';
  confidence: 'low' | 'medium' | 'high';
  projectedScore: number;
  projectedChange: number;
  projectedChangePercent: number;
  tasksNeeded: number;
  hoursNeeded: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  forecastPeriod: number; // days
}

export interface StrategyGoal {
  id: string;
  stockId: string;
  targetScore: number;
  targetChangePercent: number;
  timeframe: 30 | 60 | 90; // days
  currentProgress: number;
  weeklyMilestones: number[];
  tasksRequired: number;
  isOnTrack: boolean;
  createdAt: Date;
}

export interface LoadSimulation {
  scenario: string;
  changes: {
    stockId: string;
    additionalTasks: number;
    additionalHours: number;
  }[];
  projectedImpact: {
    stockId: string;
    scoreChange: number;
    percentChange: number;
  }[];
  overallIndexChange: number;
}

export interface NeglectAlert {
  id: string;
  stockId: string;
  severity: 'warning' | 'urgent' | 'critical';
  declinePercent: number;
  timeframe: number; // days
  projectedZeroDate?: Date;
  actionRequired: string;
  isOnHold: boolean;
  createdAt: Date;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  changes: {
    type: 'add_task' | 'remove_task' | 'change_weight' | 'add_stock' | 'remove_stock';
    stockId?: string;
    taskData?: Partial<Task>;
    weightChange?: number;
    stockData?: Partial<Stock>;
  }[];
  projectedResults: {
    indexChange: number;
    stockChanges: { stockId: string; change: number }[];
    timeframe: number;
  };
  isSaved: boolean;
  createdAt: Date;
}