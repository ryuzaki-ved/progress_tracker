import { Stock, Task } from '../types';

export const calculateStockScore = (stock: Stock, tasks: Task[]): number => {
  const stockTasks = tasks.filter(task => task.stockId === stock.id);
  const completedTasks = stockTasks.filter(task => task.status === 'completed');
  const overdueTasks = stockTasks.filter(task => task.status === 'overdue');
  
  const completedPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
  const overduePoints = overdueTasks.reduce((sum, task) => sum + task.points, 0);
  
  return Math.max(0, stock.currentScore + completedPoints - (overduePoints * 0.5));
};

export const calculateIndexValue = (stocks: Stock[]): number => {
  return stocks.reduce((sum, stock) => sum + (stock.currentScore * stock.weight), 0);
};

export const getVolatilityColor = (volatility: string): string => {
  switch (volatility) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'failed': return 'bg-gray-300 text-gray-700';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'border-red-400 bg-red-50';
    case 'medium': return 'border-yellow-400 bg-yellow-50';
    case 'low': return 'border-green-400 bg-green-50';
    default: return 'border-gray-400 bg-gray-50';
  }
};

export function calculateTaskScore({
  priority,
  complexity,
  type,
  dueDate,
  completedAt,
}: {
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  type?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
}): number {
  // Priority mapping
  const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const p = priorityMap[priority] || 1;
  const c = complexity || 1;
  // Base score
  let baseScore = p * c * 10;
  // Type bonus (optional, can be extended)
  if (type === 'milestone') baseScore *= 1.2;
  if (type === 'recurring') baseScore *= 0.9;
  // Time multiplier
  let timeMultiplier = 1.0;
  if (dueDate && completedAt) {
    const due = dueDate.getTime();
    const done = completedAt.getTime();
    const diff = done - due;
    if (diff < -1000 * 60 * 5) {
      // Early (more than 5 min before due)
      timeMultiplier = 1.1;
    } else if (Math.abs(diff) <= 1000 * 60 * 5) {
      // On time (within 5 min)
      timeMultiplier = 1.0;
    } else if (diff > 0 && diff <= 1000 * 60 * 60 * 24) {
      // Late (<24h)
      timeMultiplier = 0.7;
    } else if (diff > 1000 * 60 * 60 * 24) {
      // Very late (>24h)
      timeMultiplier = 0.4;
    }
  }
  return Math.round(baseScore * timeMultiplier);
}