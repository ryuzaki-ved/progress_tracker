import React from 'react';
import { motion } from 'framer-motion';
import { DayLoadInfo } from '../../types';

interface LoadIndicatorProps {
  dayLoad: DayLoadInfo;
  compact?: boolean;
}

export const LoadIndicator: React.FC<LoadIndicatorProps> = ({ dayLoad, compact = false }) => {
  const getLoadColor = () => {
    switch (dayLoad.loadScore) {
      case 'light': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'heavy': return 'bg-orange-500';
      case 'overloaded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLoadBgColor = () => {
    switch (dayLoad.loadScore) {
      case 'light': return 'bg-green-100 dark:bg-green-900/20';
      case 'moderate': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'heavy': return 'bg-orange-100 dark:bg-orange-900/20';
      case 'overloaded': return 'bg-red-100 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const loadPercentage = Math.min(100, (dayLoad.totalScheduledMinutes / dayLoad.dailyBudgetMinutes) * 100);

  if (compact) {
    return (
      <div className={`w-full h-8 ${getLoadBgColor()} rounded-lg p-1`}>
        <motion.div
          className={`h-full ${getLoadColor()} rounded`}
          initial={{ width: 0 }}
          animate={{ width: `${loadPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    );
  }

  return (
    <div className={`p-3 ${getLoadBgColor()} rounded-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Load: {dayLoad.loadScore}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {Math.round(loadPercentage)}%
        </span>
      </div>
      
      <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={`h-2 ${getLoadColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${loadPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {Math.round(dayLoad.totalScheduledMinutes / 60)}h of {Math.round(dayLoad.dailyBudgetMinutes / 60)}h
      </div>
    </div>
  );
};