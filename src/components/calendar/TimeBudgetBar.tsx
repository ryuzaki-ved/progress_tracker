import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { DayLoadInfo } from '../../types';

interface TimeBudgetBarProps {
  dayLoad: DayLoadInfo;
}

export const TimeBudgetBar: React.FC<TimeBudgetBarProps> = ({ dayLoad }) => {
  const usedPercentage = Math.min(100, (dayLoad.totalScheduledMinutes / dayLoad.dailyBudgetMinutes) * 100);
  const remainingMinutes = Math.max(0, dayLoad.dailyBudgetMinutes - dayLoad.totalScheduledMinutes);
  const isOverbooked = dayLoad.totalScheduledMinutes > dayLoad.dailyBudgetMinutes;

  const getBarColor = () => {
    if (isOverbooked) return 'bg-red-500';
    if (usedPercentage > 80) return 'bg-orange-500';
    if (usedPercentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Budget
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {formatTime(dayLoad.totalScheduledMinutes)} scheduled
          </span>
          {isOverbooked ? (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {formatTime(Math.abs(remainingMinutes))} over budget
              </span>
            </div>
          ) : (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatTime(remainingMinutes)} remaining
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className={`h-3 rounded-full ${getBarColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, usedPercentage)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {isOverbooked && (
            <motion.div
              className="absolute top-0 right-0 h-3 bg-red-600 rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(20, usedPercentage - 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            />
          )}
        </div>
        
        {/* Progress markers */}
        <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-white dark:bg-gray-800 opacity-50" />
        <div className="absolute top-0 left-3/4 w-0.5 h-3 bg-white dark:bg-gray-800 opacity-50" />
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0h</span>
        <span>{formatTime(dayLoad.dailyBudgetMinutes / 2)}</span>
        <span>{formatTime(dayLoad.dailyBudgetMinutes)}</span>
      </div>
    </div>
  );
};