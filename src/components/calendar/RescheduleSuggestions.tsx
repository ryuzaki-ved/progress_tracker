import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Calendar, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Reschedulesuggestion } from '../../types';
import { useTasks } from '../../hooks/useTasks';

interface RescheduleSuggestionsProps {
  suggestions: Reschedulesuggestion[];
  onApplySuggestion: (taskId: string, newDate: Date, newTime?: string) => void;
}

export const RescheduleSuggestions: React.FC<RescheduleSuggestionsProps> = ({ 
  suggestions, 
  onApplySuggestion 
}) => {
  const { tasks } = useTasks();

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All Good! 🎉
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your schedule looks well-balanced. No rescheduling suggestions at this time.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center space-x-3 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Smart Rescheduling Suggestions
        </h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={`${suggestion.taskId}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {getTaskTitle(suggestion.taskId)}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                    {suggestion.confidence} confidence
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {suggestion.reason}
                </p>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Suggested: {suggestion.suggestedDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplySuggestion(suggestion.taskId, suggestion.suggestedDate)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {suggestions.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button variant="outline" className="w-full">
            Apply All High-Confidence Suggestions ({suggestions.filter(s => s.confidence === 'high').length})
          </Button>
        </div>
      )}
    </Card>
  );
};