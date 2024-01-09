import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Target, Calendar, Award, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WeeklyReview } from '../../types';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: WeeklyReview['rating'], journalEntryId?: string) => Promise<void>;
  weekStart: Date;
  stats: WeeklyReview['stats'];
  insights: string[];
  existingReview?: WeeklyReview;
}

const RATING_OPTIONS = [
  { value: 'great', emoji: '🌟', label: 'Great Week', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'good', emoji: '😊', label: 'Good Week', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'okay', emoji: '😐', label: 'Okay Week', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'tough', emoji: '😔', label: 'Tough Week', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'chaotic', emoji: '🌪️', label: 'Chaotic Week', color: 'bg-red-100 text-red-800 border-red-300' },
];

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  weekStart,
  stats,
  insights,
  existingReview,
}) => {
  const [selectedRating, setSelectedRating] = useState<WeeklyReview['rating']>('okay');
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const weekEnd = endOfWeek(weekStart);

  useEffect(() => {
    if (existingReview) {
      setSelectedRating(existingReview.rating);
    } else {
      setSelectedRating('okay');
      setCurrentStep(0);
    }
  }, [existingReview, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedRating);
      onClose();
    } catch (error) {
      console.error('Failed to save weekly review:', error);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'Week Overview',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Let's review how your week went
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.tasksCompleted}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.tasksMissed}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Missed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.streaksMaintained}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Streaks</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.indexChange.toFixed(1)}%</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Index Change</div>
            </div>
          </div>

          {stats.topPerformingStock && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">Top Performer</span>
              </div>
              <span className="text-green-700 dark:text-green-300">{stats.topPerformingStock}</span>
            </div>
          )}

          {stats.strugglingStock && (
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800 dark:text-orange-200">Needs Attention</span>
              </div>
              <span className="text-orange-700 dark:text-orange-300">{stats.strugglingStock}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Rate Your Week',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              How would you rate this week overall?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your honest reflection helps track patterns over time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RATING_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRating === option.value
                    ? option.color
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setSelectedRating(option.value as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Insights & Patterns',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Here's what we noticed
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Patterns and insights from your week
            </p>
          </div>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-200">{insight}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Keep tracking your progress to unlock personalized insights!
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  Weekly Review
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index <= currentStep
                      ? 'bg-indigo-500'
                      : 'bg-indigo-200 dark:bg-indigo-700'
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px] mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
                    {steps[currentStep].title}
                  </h3>
                  {steps[currentStep].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-indigo-200 dark:border-indigo-600">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                {currentStep + 1} of {steps.length}
              </span>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    'Complete Review'
                  )}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};