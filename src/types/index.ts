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
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  stockId: string;
  points: number;
  createdAt: Date;
  completedAt?: Date;
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