import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, Calendar, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LifeTrajectory } from '../../types/strategicBrain';
import { Stock } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface LifeTrajectorySimulatorProps {
  trajectory: LifeTrajectory;
  stocks: Stock[];
  onGenerateTrajectory: (timeframe: 30 | 60 | 90) => LifeTrajectory;
}

export const LifeTrajectorySimulator: React.FC<LifeTrajectorySimulatorProps> = ({
  trajectory,
  stocks,
  onGenerateTrajectory,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<30 | 60 | 90>(trajectory.timeframe);
  const [activeView, setActiveView] = useState<'projection' | 'scenarios'>('projection');

  const handleTimeframeChange = (timeframe: 30 | 60 | 90) => {
    setSelectedTimeframe(timeframe);
    onGenerateTrajectory(timeframe);
  };

  const projectionData = stocks.map(stock => {
    const current = trajectory.currentPath.find(p => p.stockId === stock.id);
    const optimized = trajectory.optimizedPath.find(p => p.stockId === stock.id);
    
    return {
      name: stock.name,
      current: current?.projectedScore || stock.currentScore,
      optimized: optimized?.projectedScore || stock.currentScore,
      improvement: ((optimized?.projectedScore || stock.currentScore) - stock.currentScore),
    };
  });

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Target className="w-6 h-6 mr-2 text-purple-600" />
              Life Trajectory Simulator
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Forecast your life portfolio performance over time
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => handleTimeframeChange(days as 30 | 60 | 90)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedTimeframe === days
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveView('projection')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeView === 'projection'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Projections
              </button>
              <button
                onClick={() => setActiveView('scenarios')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeView === 'scenarios'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Scenarios
              </button>
            </div>
          </div>
        </div>

        {activeView === 'projection' && (
          <div className="space-y-6">
            {/* Projection Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#6B7280" name="Current Path" />
                  <Bar dataKey="optimized" fill="#8B5CF6" name="Optimized Path" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Projections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trajectory.currentPath.map((projection, index) => {
                const stock = stocks.find(s => s.id === projection.stockId);
                const optimized = trajectory.optimizedPath.find(p => p.stockId === projection.stockId);
                
                if (!stock || !optimized) return null;

                const improvement = optimized.projectedScore - projection.projectedScore;
                const improvementPercent = (improvement / projection.projectedScore) * 100;

                return (
                  <motion.div
                    key={projection.stockId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 ${stock.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                        {stock.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{stock.name}</h4>
                        <div className={`text-sm ${projection.confidence > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {projection.confidence}% confidence
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Current:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{stock.currentScore}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Projected:</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{projection.projectedScore.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Optimized:</span>
                        <span className="font-semibold text-purple-600">{optimized.projectedScore.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Potential Gain:</span>
                        <span className={`font-semibold ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          +{improvement.toFixed(0)} ({improvementPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Required Changes */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Required Changes:
                      </div>
                      <div className="space-y-1">
                        {optimized.requiredChanges.slice(0, 2).map((change, idx) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                            • {change}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'scenarios' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Trajectory Scenarios
            </h3>
            
            {trajectory.scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{scenario.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEffortColor(scenario.effort)}`}>
                        {scenario.effort} effort
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {scenario.description}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold ${
                      scenario.impact > 0 ? 'text-green-600' : scenario.impact < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {scenario.impact > 0 ? '+' : ''}{scenario.impact.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Index Impact</div>
                  </div>
                </div>

                {/* Impact Visualization */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        scenario.impact > 0 ? 'bg-green-500' : scenario.impact < 0 ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(scenario.impact) * 5)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-3">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Optimized Path
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};