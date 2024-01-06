import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Clock } from 'lucide-react';
import { Streak } from '../../types';

interface StreakCounterProps {
  streak: Streak;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ 
  streak, 
  size = 'md', 
  showLabel = true 
}) => {
  const getIcon = () => {
    switch (streak.type) {
      case 'daily_completion':
        return Target;
      case 'on_time':
        return Clock;
      case 'no_missed':
        return Flame;
      default:
        return Flame;
    }
  };

  const getLabel = () => {
    switch (streak.type) {
      case 'daily_completion':
        return 'Daily Streak';
      case 'on_time':
        return 'On-Time Streak';
      case 'no_missed':
        return 'Perfect Streak';
      default:
        return 'Streak';
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const Icon = getIcon();

  return (
    <motion.div
      className={`flex items-center space-x-2 ${sizeClasses[size]}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={`${streak.isActive ? 'text-orange-500' : 'text-gray-400'} ${iconSizes[size]}`}
        animate={streak.isActive ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ 
          duration: 2, 
          repeat: streak.isActive ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        <Icon className={iconSizes[size]} />
      </motion.div>
      
      <div className="flex flex-col">
        <motion.span
          className={`font-bold ${streak.isActive ? 'text-orange-600' : 'text-gray-600'}`}
          animate={streak.currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {streak.currentStreak}
        </motion.span>
        
        {showLabel && (
          <span className="text-xs text-gray-500">
            {getLabel()}
          </span>
        )}
      </div>
      
      {streak.longestStreak > streak.currentStreak && (
        <div className="text-xs text-gray-400">
          Best: {streak.longestStreak}
        </div>
      )}
    </motion.div>
  );
};