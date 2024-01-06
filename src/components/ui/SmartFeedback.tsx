import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Zap } from 'lucide-react';
import { Card } from './Card';
import { useStocks } from '../../hooks/useStocks';
import { useTasks } from '../../hooks/useTasks';
import { useStreaks } from '../../hooks/useStreaks';

export const SmartFeedback: React.FC = () => {
  const { stocks } = useStocks();
  const { tasks } = useTasks();
  const { streaks } = useStreaks();

  const generateFeedback = () => {
    const completedToday = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt && 
      task.completedAt.toDateString() === new Date().toDateString()
    );

    const overdueTasks = tasks.filter(task => task.status === 'overdue');
    const dailyStreak = streaks.find(s => s.type === 'daily_completion');
    const improvingStocks = stocks.filter(stock => stock.changePercent > 0);
    const decliningStocks = stocks.filter(stock => stock.changePercent < -10);

    const feedbackOptions = [];

    // Positive feedback
    if (dailyStreak && dailyStreak.currentStreak >= 5) {
      feedbackOptions.push({
        type: 'success',
        icon: '🔥',
        title: `${dailyStreak.currentStreak}-day streak in progress!`,
        message: "You're absolutely crushing it! Keep this momentum going.",
        color: 'from-orange-50 to-red-50 border-orange-200',
        textColor: 'text-orange-900',
      });
    }

    if (completedToday.length > 0) {
      feedbackOptions.push({
        type: 'success',
        icon: '🎯',
        title: `${completedToday.length} task${completedToday.length > 1 ? 's' : ''} completed today!`,
        message: "Great progress! Every completed task moves you closer to your goals.",
        color: 'from-green-50 to-emerald-50 border-green-200',
        textColor: 'text-green-900',
      });
    }

    if (improvingStocks.length === stocks.length && stocks.length > 0) {
      feedbackOptions.push({
        type: 'success',
        icon: '📈',
        title: 'All stocks are improving!',
        message: "Incredible! Every area of your life is trending upward.",
        color: 'from-blue-50 to-indigo-50 border-blue-200',
        textColor: 'text-blue-900',
      });
    }

    // Constructive feedback
    if (decliningStocks.length > 0) {
      const worstStock = decliningStocks.sort((a, b) => a.changePercent - b.changePercent)[0];
      feedbackOptions.push({
        type: 'warning',
        icon: '⚠️',
        title: `${worstStock.name} needs attention`,
        message: `Down ${Math.abs(worstStock.changePercent).toFixed(1)}% recently. Consider focusing here this week.`,
        color: 'from-yellow-50 to-amber-50 border-yellow-200',
        textColor: 'text-yellow-900',
      });
    }

    if (overdueTasks.length > 0) {
      feedbackOptions.push({
        type: 'alert',
        icon: '⏰',
        title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        message: "Tackle these to prevent your scores from dropping further.",
        color: 'from-red-50 to-pink-50 border-red-200',
        textColor: 'text-red-900',
      });
    }

    // Motivational feedback
    if (feedbackOptions.length === 0) {
      feedbackOptions.push({
        type: 'neutral',
        icon: '💡',
        title: 'Ready for your next challenge?',
        message: "Add some new tasks to keep building momentum in your life areas.",
        color: 'from-purple-50 to-violet-50 border-purple-200',
        textColor: 'text-purple-900',
      });
    }

    return feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
  };

  const feedback = generateFeedback();

  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return TrendingUp;
      case 'warning':
        return AlertTriangle;
      case 'alert':
        return TrendingDown;
      default:
        return Zap;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-r ${feedback.color}`}>
        <div className="flex items-center space-x-4">
          <motion.div
            className={`w-12 h-12 rounded-full bg-white bg-opacity-50 flex items-center justify-center`}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            <span className="text-2xl">{feedback.icon}</span>
          </motion.div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${feedback.textColor} mb-1`}>
              {feedback.title}
            </h3>
            <p className={`${feedback.textColor} opacity-80`}>
              {feedback.message}
            </p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon className={`w-6 h-6 ${feedback.textColor}`} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};