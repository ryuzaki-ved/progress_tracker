import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Calendar, Flag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AchievementBadge } from '../components/ui/AchievementBadge';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useStocks } from '../hooks/useStocks';
import { useAchievements } from '../hooks/useAchievements';
import { getStatusColor, getPriorityColor } from '../utils/stockUtils';

export const Tasks: React.FC = () => {
  const { tasks, loading: tasksLoading, completeTask, createTask, deleteTask, markAsNotCompleted, failTask } = useTasks();
  const { stocks, loading: stocksLoading } = useStocks();
  const { achievements } = useAchievements();
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStockId, setFilterStockId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  if (tasksLoading || stocksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'overdue') return task.status === 'overdue';
    return true;
  }).filter(task => {
    // Date filter
    if (filterDate) {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toISOString().split('T')[0];
      if (taskDate !== filterDate) return false;
    }
    return true;
  }).filter(task => {
    // Stock filter
    if (filterStockId === 'all') return true;
    return task.stockId === filterStockId;
  });

  const sortedTasks = filteredTasks.sort((a, b) => {
    if (sortBy === 'dueDate') {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return aDate - bDate;
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  const getStockName = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock ? stock.name : 'Unknown';
  };

  const getStockColor = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock ? stock.color : 'bg-gray-500';
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your productivity tasks</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Category
              </label>
              <select 
                value={filterStockId} 
                onChange={(e) => setFilterStockId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Stocks</option>
                {stocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilter('all');
                  setFilterDate('');
                  setFilterStockId('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Filter Summary */}
          {(filter !== 'all' || filterDate || filterStockId !== 'all') && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <span className="font-medium">Active filters:</span>
              {filter !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Status: {filter}</span>}
              {filterDate && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Date: {new Date(filterDate).toLocaleDateString()}</span>}
              {filterStockId !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Stock: {stocks.find(s => s.id === filterStockId)?.name}</span>}
              <span className="ml-2 text-gray-500">({filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} shown)</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className={`h-full border-l-4 ${getPriorityColor(task.priority)}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h3>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-3 h-3 ${getStockColor(task.stockId)} rounded`}></div>
                      <span className="text-xs text-gray-500">{getStockName(task.stockId)}</span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status === 'failed' ? 'Failed' : task.status}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flag className="w-4 h-4" />
                    <span className="capitalize">{task.priority}</span>
                  </div>
                </div>

                <Button 
                  variant={task.status === 'completed' ? 'secondary' : 'primary'} 
                  className="w-full"
                  disabled={task.status === 'completed'}
                 onClick={() => task.status !== 'completed' && handleCompleteTask(task.id)}
                >
                  {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                </Button>
                
                {/* Show confetti effect when task is completed */}
                {task.status === 'completed' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    className="text-center py-2"
                  >
                    <span className="text-2xl">🎉</span>
                  </motion.div>
                )}
                
                {task.status === 'completed' && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => markAsNotCompleted(task.id)}
                  >
                    Mark as Not Completed
                  </Button>
                )}
                {(task.status === 'pending' || task.status === 'overdue') && (
                  <Button
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={() => {
                      if (window.confirm(`Mark task '${task.title}' as failed? This cannot be undone.`)) {
                        failTask(task.id);
                      }
                    }}
                  >
                    Mark as Failed
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={() => {
                    if (window.confirm(`Delete task '${task.title}'? This cannot be undone.`)) {
                      deleteTask(task.id);
                    }
                  }}
                >
                  Delete Task
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Task Stats */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Statistics</h3>
          <div className="flex space-x-2">
            {achievements.filter(a => a.isUnlocked && a.category === 'completion').slice(0, 3).map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {tasks.reduce((sum, task) => sum + task.points, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </div>
      </Card>

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createTask}
        stocks={stocks}
      />
    </div>
  );
};