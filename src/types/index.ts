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
  dueDate: Date;
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

export interface Theme {
  mode: 'light' | 'dark';
  accent: string;
}