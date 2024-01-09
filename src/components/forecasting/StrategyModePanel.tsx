import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StrategyGoal, Stock } from '../../types';

interface StrategyModePanelProps {
  goals: StrategyGoal[];
  stocks: Stock[];
  onCreateGoal: (stockId: string, targetChangePercent: number, timeframe: 30 | 60 | 90) => void;
  selectedTimeframe: 30 | 60 | 90;
  onTimeframeChange: (timeframe: 30 | 60 | 90) => void;
}

export const StrategyModePanel: React.FC<StrategyModePanelProps> = ({
  goals,
  stocks,
  onCreateGoal,
  selectedTimeframe,
  onTimeframeChange,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [targetChange, setTargetChange] = useState(20);

  const handleCreateGoal = () => {
    if (selectedStock) {
      onCreateGoal(selectedStock, targetChange, selectedTimeframe);
      setShowCreateModal(false);
      setSelectedStock('');
      setTargetChange(20);
    }
  };

  const getProgressColor = (progress: number, isOnTrack: boolean) => {
    if (!isOnTrack) return 'bg-red-500';
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const timeframeOptions = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            Strategy Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set strategic goals and track your progress toward them
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {timeframeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onTimeframeChange(option.value as 30 | 60 | 90)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTimeframe === option.value
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals
          .filter(goal => goal.timeframe === selectedTimeframe)
          .map((goal, index) => {
            const stock = stocks.find(s => s.id === goal.stockId);
            if (!stock) return null;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <div className="p-4">
                    {/* Stock Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 ${stock.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold">
                          {stock.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{stock.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.timeframe} Day Goal
                        </p>
                      </div>
                    </div>

                    {/* Goal Progress */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {goal.currentProgress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <motion.div
                            className={`h-3 rounded-full ${getProgressColor(goal.currentProgress, goal.isOnTrack)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, goal.currentProgress)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Target vs Current */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {stock.currentScore}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Target</div>
                          <div className="text-lg font-bold text-green-600">
                            {Math.round(goal.targetScore)}
                          </div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                        goal.isOnTrack 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {goal.isOnTrack ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {goal.isOnTrack ? 'On Track' : 'Behind Schedule'}
                        </span>
                      </div>

                      {/* Tasks Required */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <div className="font-medium mb-1">Tasks Required</div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{goal.tasksRequired} tasks total</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
      </div>

      {/* Empty State */}
      {goals.filter(goal => goal.timeframe === selectedTimeframe).length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No {selectedTimeframe}-Day Goals Set
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create strategic goals to track your progress and stay focused
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      )}

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Create {selectedTimeframe}-Day Goal
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Category
                    </label>
                    <select
                      value={selectedStock}
                      onChange={(e) => setSelectedStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a stock</option>
                      {stocks.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.name} (Current: {stock.currentScore})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Growth: {targetChange}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={targetChange}
                      onChange={(e) => setTargetChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>5%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {selectedStock && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <div className="font-medium">Target Preview</div>
                        <div className="mt-1">
                          {stocks.find(s => s.id === selectedStock)?.currentScore} → {' '}
                          {Math.round((stocks.find(s => s.id === selectedStock)?.currentScore || 0) * (1 + targetChange / 100))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGoal}
                    disabled={!selectedStock}
                    className="flex-1"
                  >
                    Create Goal
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};