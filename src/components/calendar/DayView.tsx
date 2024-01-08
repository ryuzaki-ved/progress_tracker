import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Flag } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useStocks } from '../../hooks/useStocks';
import { useTimeManagement } from '../../hooks/useTimeManagement';
import { Task } from '../../types';
import { format, isSameDay } from 'date-fns';
import { getPriorityColor, getStatusColor } from '../../utils/stockUtils';

interface DayViewProps {
  date: Date;
  onCreateTask: (date: Date, time?: string) => void;
  onRescheduleTask: (taskId: string, newDate: Date, newTime?: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({ date, onCreateTask, onRescheduleTask }) => {
  const { tasks } = useTasks();
  const { stocks } = useStocks();
  const { workingHours, calculateDayLoad } = useTimeManagement();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const dayTasks = tasks.filter(task => 
    task.dueDate && isSameDay(task.dueDate, date)
  );

  const dayLoad = calculateDayLoad(date);

  // Generate time slots for the day
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    let hour = startHour;
    let minute = startMinute;
    while (hour < endHour || (hour === endHour && minute <= endMinute)) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const scheduledTask = dayTasks.find(task => task.scheduledTime === timeString);
      slots.push({
        time: timeString,
        task: scheduledTask,
        isAvailable: !scheduledTask,
      });
      minute += 30;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Format time in 12-hour format with AM/PM
  const format12Hour = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStockColor = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock?.color || 'bg-gray-500';
  };

  const getStockName = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock?.name || 'Unknown';
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    if (draggedTask) {
      onRescheduleTask(draggedTask.id, date, timeSlot);
      setDraggedTask(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(dayLoad.totalScheduledMinutes / 60)}h {dayLoad.totalScheduledMinutes % 60}m scheduled
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            dayLoad.loadScore === 'light' ? 'bg-green-100 text-green-800' :
            dayLoad.loadScore === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
            dayLoad.loadScore === 'heavy' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {dayLoad.loadScore}
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-1 gap-1 max-h-96 overflow-y-auto">
        {timeSlots.map((slot, index) => (
          <motion.div
            key={slot.time}
            className={`flex items-center p-2 border rounded-lg transition-colors ${
              slot.isAvailable 
                ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' 
                : 'border-gray-300 dark:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slot.time)}
            onClick={() => slot.isAvailable && onCreateTask(date, slot.time)}
            whileHover={slot.isAvailable ? { scale: 1.01 } : {}}
          >
            <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
              {format12Hour(slot.time)}
            </div>
            
            {slot.task ? (
              <motion.div
                className={`flex-1 p-3 rounded-lg border-l-4 ${getPriorityColor(slot.task.priority)} cursor-move bg-white dark:bg-gray-900`}
                draggable
                onDragStart={() => handleDragStart(slot.task!)}
                whileHover={{ scale: 1.02 }}
                whileDrag={{ scale: 1.05, rotate: 2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{slot.task.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className={`w-3 h-3 ${getStockColor(slot.task.stockId)} rounded`}></div>
                      <span>{getStockName(slot.task.stockId)}</span>
                      <Clock className="w-3 h-3" />
                      <span>{slot.task.estimatedDuration || 30}m</span>
                      <Flag className="w-3 h-3" />
                      <span className="capitalize">{slot.task.priority}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.task.status)}`}>
                    {slot.task.status}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg py-4">
                <Plus className="w-4 h-4 mr-1" />
                <span className="text-sm">Add task</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Unscheduled Tasks */}
      {dayTasks.filter(task => !task.scheduledTime).length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Unscheduled Tasks</h4>
          <div className="space-y-2">
            {dayTasks.filter(task => !task.scheduledTime).map(task => (
              <motion.div
                key={task.id}
                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)} cursor-move bg-gray-50 dark:bg-gray-800`}
                draggable
                onDragStart={() => handleDragStart(task)}
                whileHover={{ scale: 1.01 }}
                whileDrag={{ scale: 1.05, rotate: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className={`w-3 h-3 ${getStockColor(task.stockId)} rounded`}></div>
                      <span>{getStockName(task.stockId)}</span>
                      <Clock className="w-3 h-3" />
                      <span>{task.estimatedDuration || 30}m</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};