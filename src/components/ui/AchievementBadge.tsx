import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '../../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  size = 'md',
  showProgress = false 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-18 h-18 text-xl',
  };

  const progressPercent = Math.min((achievement.progress / achievement.requirement) * 100, 100);

  return (
    <div className="relative">
      <motion.div
        className={`${sizeClasses[size]} ${achievement.color} rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden ${
          achievement.isUnlocked ? 'shadow-lg' : 'opacity-50 grayscale'
        }`}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={achievement.isUnlocked ? {
          boxShadow: [
            '0 0 0 0 rgba(59, 130, 246, 0.7)',
            '0 0 0 10px rgba(59, 130, 246, 0)',
            '0 0 0 0 rgba(59, 130, 246, 0)'
          ]
        } : {}}
        transition={{ duration: 2, repeat: achievement.isUnlocked ? Infinity : 0 }}
      >
        <span className="text-white font-bold z-10">
          {achievement.icon}
        </span>
        
        {!achievement.isUnlocked && showProgress && (
          <motion.div
            className="absolute bottom-0 left-0 bg-white bg-opacity-30 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg border border-gray-700 dark:border-gray-600">
              <div className="font-semibold">{achievement.title}</div>
              <div className="text-gray-200 dark:text-gray-300">{achievement.description}</div>
              {!achievement.isUnlocked && (
                <div className="text-gray-300 dark:text-gray-400 mt-1">
                  Progress: {achievement.progress}/{achievement.requirement}
                </div>
              )}
              {achievement.isUnlocked && achievement.unlockedAt && (
                <div className="text-gray-300 dark:text-gray-400 mt-1">
                  Unlocked: {achievement.unlockedAt.toLocaleDateString()}
                </div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};