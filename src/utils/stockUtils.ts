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
  const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);
  return stocks.reduce((sum, stock) => 
    sum + (stock.currentScore * stock.weight / totalWeight), 0
  );
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