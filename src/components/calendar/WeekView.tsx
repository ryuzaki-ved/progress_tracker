import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useStocks } from '../../hooks/useStocks';
import { useTimeManagement } from '../../hooks/useTimeManagement';
import { Task } from '../../types';
import { format, addDays, isSameDay } from 'date-fns';
import { getPriorityColor, getStatusColor } from '../../utils/stockUtils';

interface WeekViewProps {
  weekStart: Date;
  onCreateTask: (date: Date, time?: string) => void;
  onRescheduleTask: (taskId: string, newDate: Date, newTime?: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({ weekStart, onCreateTask, onRescheduleTask }) => {
  const { tasks } = useTasks();
  const { stocks } = useStocks();
  const { calculateDayLoad } = useTimeManagement();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStockColor = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock?.color || 'bg-gray-500';
  };

  const getStockName = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock?.name || 'Unknown';
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(task.dueDate, date)
    );
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedTask) {
      onRescheduleTask(draggedTask.id, targetDate);
      setDraggedTask(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayLoad = calculateDayLoad(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={index} className="text-center">
              <div className={`text-sm font-medium mb-2 ${
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-semibold mb-2 ${
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'd')}
              </div>
              <div className={`w-full h-2 rounded-full mb-2 ${
                dayLoad.loadScore === 'light' ? 'bg-green-200' :
                dayLoad.loadScore === 'moderate' ? 'bg-yellow-200' :
                dayLoad.loadScore === 'heavy' ? 'bg-orange-200' :
                'bg-red-200'
              }`}>
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    dayLoad.loadScore === 'light' ? 'bg-green-500' :
                    dayLoad.loadScore === 'moderate' ? 'bg-yellow-500' :
                    dayLoad.loadScore === 'heavy' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (dayLoad.totalScheduledMinutes / dayLoad.dailyBudgetMinutes) * 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(dayLoad.totalScheduledMinutes / 60)}h
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4 min-h-96">
        {weekDays.map((day, dayIndex) => {
          const dayTasks = getTasksForDay(day);
          const dayLoad = calculateDayLoad(day);
          
          return (
            <motion.div
              key={dayIndex}
              className={`p-3 border-2 border-dashed rounded-lg transition-colors ${
                dayLoad.loadScore === 'overloaded' 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => onCreateTask(day)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="space-y-2">
                {dayTasks.length > 0 ? (
                  dayTasks.map(task => (
                    <motion.div
                      key={task.id}
                      className={`p-2 rounded border-l-4 ${getPriorityColor(task.priority)} cursor-move text-xs`}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 2 }}
                    >
                      <div className="font-medium truncate text-gray-900 dark:text-white bg-white/80 dark:bg-gray-900/80 px-1 rounded">
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mt-1">
                        <div className={`w-2 h-2 ${getStockColor(task.stockId)} rounded`}></div>
                        <span>{getStockName(task.stockId)}</span>
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedDuration || 30}m</span>
                      </div>
                      <div className={`inline-block px-1 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-xs">Add task</span>
                  </div>
                )}
              </div>

              {/* Stock Balance Indicator */}
              {Object.keys(dayLoad.stockBalance).length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(dayLoad.stockBalance).map(([stockId, minutes]) => {
                      const stock = stocks.find(s => s.id === stockId);
                      if (!stock) return null;
                      
                      return (
                        <div
                          key={stockId}
                          className={`w-2 h-2 ${stock.color} rounded-full`}
                          title={`${stock.name}: ${Math.round(minutes / 60)}h`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stock Balance Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
        {stocks.map(stock => (
          <div key={stock.id} className="flex items-center space-x-1">
            <div className={`w-3 h-3 ${stock.color} rounded`}></div>
            <span>{stock.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};