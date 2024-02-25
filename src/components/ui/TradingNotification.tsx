import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { audioGenerator } from '../../utils/audioUtils';

export interface TradingNotificationData {
  id: string;
  type: 'buy_stock' | 'sell_stock' | 'stock_pnl_profit' | 'stock_pnl_loss' | 
        'buy_option' | 'write_option' | 'exit_option' | 'option_pnl_profit' | 'option_pnl_loss';
  title: string;
  message: string;
  amount?: number;
  stockName?: string;
  optionDetails?: string;
  timestamp: Date;
}

interface TradingNotificationProps {
  notification: TradingNotificationData;
  onDismiss: (id: string) => void;
}

export const TradingNotification: React.FC<TradingNotificationProps> = ({ 
  notification, 
  onDismiss 
}) => {

  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'buy_stock':
        return {
          icon: TrendingUp,
          bgGradient: 'from-green-500 to-emerald-600',
          borderColor: 'border-green-400',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          sound: 'buy',
          emoji: '📈',
          animation: 'success'
        };
      case 'sell_stock':
        return {
          icon: TrendingDown,
          bgGradient: 'from-blue-500 to-indigo-600',
          borderColor: 'border-blue-400',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          sound: 'sell',
          emoji: '📉',
          animation: 'info'
        };
      case 'stock_pnl_profit':
        return {
          icon: CheckCircle,
          bgGradient: 'from-green-500 to-emerald-600',
          borderColor: 'border-green-400',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          sound: 'profit',
          emoji: '💰',
          animation: 'success'
        };
      case 'stock_pnl_loss':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-red-500 to-pink-600',
          borderColor: 'border-red-400',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          sound: 'loss',
          emoji: '📉',
          animation: 'error'
        };
      case 'buy_option':
        return {
          icon: Target,
          bgGradient: 'from-purple-500 to-violet-600',
          borderColor: 'border-purple-400',
          textColor: 'text-purple-900',
          iconColor: 'text-purple-600',
          sound: 'buy',
          emoji: '🎯',
          animation: 'success'
        };
      case 'write_option':
        return {
          icon: Zap,
          bgGradient: 'from-orange-500 to-red-600',
          borderColor: 'border-orange-400',
          textColor: 'text-orange-900',
          iconColor: 'text-orange-600',
          sound: 'sell',
          emoji: '⚡',
          animation: 'warning'
        };
      case 'exit_option':
        return {
          icon: Activity,
          bgGradient: 'from-yellow-500 to-amber-600',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
          sound: 'sell',
          emoji: '🔄',
          animation: 'info'
        };
      case 'option_pnl_profit':
        return {
          icon: CheckCircle,
          bgGradient: 'from-green-500 to-emerald-600',
          borderColor: 'border-green-400',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          sound: 'profit',
          emoji: '💎',
          animation: 'success'
        };
      case 'option_pnl_loss':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-red-500 to-pink-600',
          borderColor: 'border-red-400',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          sound: 'loss',
          emoji: '💸',
          animation: 'error'
        };
      default:
        return {
          icon: DollarSign,
          bgGradient: 'from-gray-500 to-slate-600',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-900',
          iconColor: 'text-gray-600',
          sound: 'info',
          emoji: '💡',
          animation: 'info'
        };
    }
  };

  const config = getNotificationConfig();
  const Icon = config.icon;

  // Play sound effect
  useEffect(() => {
    audioGenerator.playSound(config.sound as any);
  }, [config.sound]);

  const getAnimationVariants = () => {
    switch (config.animation) {
      case 'success':
        return {
          initial: { opacity: 0, x: 300, scale: 0.8 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 300, scale: 0.8 },
          hover: { scale: 1.02, y: -2 }
        };
      case 'error':
        return {
          initial: { opacity: 0, x: 300, scale: 0.8, rotate: -5 },
          animate: { opacity: 1, x: 0, scale: 1, rotate: 0 },
          exit: { opacity: 0, x: 300, scale: 0.8, rotate: 5 },
          hover: { scale: 1.02, y: -2 }
        };
      case 'warning':
        return {
          initial: { opacity: 0, x: 300, scale: 0.8, rotate: 5 },
          animate: { opacity: 1, x: 0, scale: 1, rotate: 0 },
          exit: { opacity: 0, x: 300, scale: 0.8, rotate: -5 },
          hover: { scale: 1.02, y: -2 }
        };
      default:
        return {
          initial: { opacity: 0, x: 300, scale: 0.8 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 300, scale: 0.8 },
          hover: { scale: 1.02, y: -2 }
        };
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        variants={getAnimationVariants()}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.3 
        }}
        className={`
          relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 ${config.borderColor}
          min-w-[320px] max-w-[400px] p-4 backdrop-blur-sm
          transform transition-all duration-200
        `}
      >
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} opacity-10 rounded-xl`} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start space-x-3">
            {/* Icon with animation */}
            <motion.div
              className={`w-12 h-12 bg-gradient-to-r ${config.bgGradient} rounded-full flex items-center justify-center shadow-lg`}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-2xl">{config.emoji}</span>
                <h4 className={`font-bold text-lg ${config.textColor} dark:text-white truncate`}>
                  {notification.title}
                </h4>
              </div>
              
              <p className={`text-sm ${config.textColor} dark:text-gray-200 opacity-90 mb-2`}>
                {notification.message}
              </p>

              {/* Amount display */}
              {notification.amount && (
                <div className={`text-lg font-bold ${config.textColor} dark:text-white`}>
                  {formatAmount(notification.amount)}
                </div>
              )}

              {/* Stock/Option details */}
              {(notification.stockName || notification.optionDetails) && (
                <div className={`text-xs ${config.textColor} dark:text-gray-300 opacity-75 mt-1`}>
                  {notification.stockName && <span>Stock: {notification.stockName}</span>}
                  {notification.optionDetails && <span>Option: {notification.optionDetails}</span>}
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-xs ${config.textColor} dark:text-gray-400 opacity-60 mt-2`}>
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {/* Close button */}
            <motion.button
              onClick={() => onDismiss(notification.id)}
              className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${config.iconColor}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${config.bgGradient} rounded-b-xl`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
                 />
       </motion.div>
   );
 };

// Notification container component
interface TradingNotificationContainerProps {
  notifications: TradingNotificationData[];
  onDismiss: (id: string) => void;
}

export const TradingNotificationContainer: React.FC<TradingNotificationContainerProps> = ({
  notifications,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <TradingNotification
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}; 