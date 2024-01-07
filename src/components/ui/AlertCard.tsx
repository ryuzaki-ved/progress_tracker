import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Alert } from '../../types';
import { Card } from './Card';

interface AlertCardProps {
  alert: Alert;
  onDismiss: (alertId: string) => void;
  onMarkAsRead: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onDismiss, onMarkAsRead }) => {
  const getIcon = () => {
    switch (alert.severity) {
      case 'high':
        return AlertTriangle;
      case 'medium':
        return AlertCircle;
      case 'low':
        return Info;
      default:
        return Info;
    }
  };

  const getColorClasses = () => {
    switch (alert.severity) {
      case 'high':
        return {
          bg: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700',
          text: 'text-red-900 dark:text-red-200',
          icon: 'text-red-600',
        };
      case 'medium':
        return {
          bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700',
          text: 'text-yellow-900 dark:text-yellow-200',
          icon: 'text-yellow-600',
        };
      case 'low':
        return {
          bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700',
          text: 'text-blue-900 dark:text-blue-200',
          icon: 'text-blue-600',
        };
      default:
        return {
          bg: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-600',
          text: 'text-gray-900 dark:text-gray-200',
          icon: 'text-gray-600',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColorClasses();

  const handleClick = () => {
    if (!alert.isRead) {
      onMarkAsRead(alert.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`bg-gradient-to-r ${colors.bg} cursor-pointer ${!alert.isRead ? 'ring-2 ring-opacity-50' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <motion.div
              animate={{ 
                scale: alert.severity === 'high' ? [1, 1.2, 1] : 1,
              }}
              transition={{ 
                duration: 1, 
                repeat: alert.severity === 'high' ? Infinity : 0,
                repeatType: 'reverse'
              }}
            >
              <Icon className={`w-5 h-5 ${colors.icon} mt-0.5`} />
            </motion.div>
            
            <div className="flex-1">
              <h4 className={`font-semibold ${colors.text} ${!alert.isRead ? 'font-bold' : ''}`}>
                {alert.title}
              </h4>
              <p className={`${colors.text} opacity-80 text-sm mt-1`}>
                {alert.message}
              </p>
              <div className={`text-xs opacity-60 mt-2 ${colors.text}`}>
                {alert.createdAt.toLocaleDateString()} at {alert.createdAt.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            className={`${colors.icon} hover:opacity-80 ml-2`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
};