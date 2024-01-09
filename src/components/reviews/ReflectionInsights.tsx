import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, Target, X, Calendar, Clock, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ReflectionInsight } from '../../types';

interface ReflectionInsightsProps {
  insights: ReflectionInsight[];
  onDismiss: (insightId: string) => void;
}

const INSIGHT_ICONS = {
  pattern: BarChart3,
  trend: TrendingUp,
  suggestion: Lightbulb,
  achievement: Target,
};

const INSIGHT_COLORS = {
  pattern: 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700',
  trend: 'from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700',
  suggestion: 'from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700',
  achievement: 'from-purple-50 to-violet-50 border-purple-200 dark:from-purple-900/20 dark:to-violet-900/20 dark:border-purple-700',
};

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export const ReflectionInsights: React.FC<ReflectionInsightsProps> = ({
  insights,
  onDismiss,
}) => {
  if (insights.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-6xl mb-4">🧠</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Building Your Insights
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Keep tracking your progress to unlock personalized insights and patterns
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reflection Insights
        </h3>
      </div>

      {insights.map((insight, index) => {
        const Icon = INSIGHT_ICONS[insight.type];
        const colorClasses = INSIGHT_COLORS[insight.type];
        const confidenceColor = CONFIDENCE_COLORS[insight.confidence];

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gradient-to-r ${colorClasses}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${confidenceColor}`}>
                        {insight.confidence} confidence
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {insight.description}
                    </p>
                    
                    {insight.actionable && (
                      <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                        <Target className="w-4 h-4" />
                        <span>Actionable insight</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{insight.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{insight.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(insight.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};