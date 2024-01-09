import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Minus, BarChart3, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadSimulation, Stock } from '../../types';

interface LoadSimulatorProps {
  stocks: Stock[];
  onSimulate: (changes: LoadSimulation['changes']) => LoadSimulation;
}

export const LoadSimulator: React.FC<LoadSimulatorProps> = ({
  stocks,
  onSimulate,
}) => {
  const [changes, setChanges] = useState<LoadSimulation['changes']>([]);
  const [simulation, setSimulation] = useState<LoadSimulation | null>(null);

  const addChange = (stockId: string) => {
    setChanges(prev => [
      ...prev,
      { stockId, additionalTasks: 1, additionalHours: 1.5, isPositive: true }
    ]);
  };

  const updateChange = (index: number, field: 'additionalTasks' | 'additionalHours' | 'isPositive', value: number | boolean) => {
    setChanges(prev => prev.map((change, i) => 
      i === index ? { ...change, [field]: value } : change
    ));
  };

  const removeChange = (index: number) => {
    setChanges(prev => prev.filter((_, i) => i !== index));
  };

  const runSimulation = () => {
    if (changes.length > 0) {
      const result = onSimulate(changes);
      setSimulation(result);
    }
  };

  const resetSimulation = () => {
    setChanges([]);
    setSimulation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap className="w-6 h-6 mr-2 text-purple-600" />
            Load Simulator
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            See how adding tasks affects your stock performance
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetSimulation}>
            Reset
          </Button>
          <Button onClick={runSimulation} disabled={changes.length === 0}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Simulate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Changes
            </h3>
            
            {/* Stock Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add tasks to stock
              </label>
              <div className="grid grid-cols-2 gap-2">
                {stocks.map(stock => (
                  <Button
                    key={stock.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addChange(stock.id)}
                    className="justify-start"
                  >
                    <div className={`w-3 h-3 ${stock.color} rounded mr-2`} />
                    {stock.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Changes List */}
            <div className="space-y-3">
              {changes.map((change, index) => {
                const stock = stocks.find(s => s.id === change.stockId);
                if (!stock) return null;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 ${stock.color} rounded`} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stock.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChange(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Tasks
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={change.additionalTasks}
                          onChange={(e) => updateChange(index, 'additionalTasks', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={change.additionalHours}
                          onChange={(e) => updateChange(index, 'additionalHours', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Impact Type
                      </label>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateChange(index, 'isPositive', true)}
                          className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            change.isPositive
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          📈 Gain
                        </button>
                        <button
                          type="button"
                          onClick={() => updateChange(index, 'isPositive', false)}
                          className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            !change.isPositive
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          📉 Loss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {changes.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add changes to see simulation results</p>
              </div>
            )}
          </div>
        </Card>

        {/* Results Panel */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Simulation Results
            </h3>
            
            {simulation ? (
              <div className="space-y-4">
                {/* Overall Impact */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Overall Index Impact
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {simulation.overallIndexChange > 0 ? '+' : ''}
                    {simulation.overallIndexChange.toFixed(2)}%
                  </div>
                </div>

                {/* Stock-by-Stock Impact */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Stock Impact
                  </h4>
                  {simulation.projectedImpact.map((impact, index) => {
                    const stock = stocks.find(s => s.id === impact.stockId);
                    if (!stock) return null;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 ${stock.color} rounded`} />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {stock.name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            impact.scoreChange > 0 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {impact.scoreChange > 0 ? 'Gain' : 'Loss'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            impact.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {impact.scoreChange > 0 ? '+' : ''}{impact.scoreChange}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {impact.percentChange > 0 ? '+' : ''}{impact.percentChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    💡 Insights
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {simulation.overallIndexChange > 5 && (
                      <li>• Excellent impact! This change would significantly boost your index</li>
                    )}
                    {simulation.overallIndexChange > 0 && simulation.overallIndexChange <= 5 && (
                      <li>• Positive impact with moderate improvement</li>
                    )}
                    {simulation.overallIndexChange < 0 && (
                      <li>• This change would decrease your overall performance by {Math.abs(simulation.overallIndexChange).toFixed(1)}%</li>
                    )}
                    {simulation.projectedImpact.some(i => i.scoreChange < 0) && (
                      <li>• Some stocks would be negatively impacted - consider mitigation strategies</li>
                    )}
                    {simulation.projectedImpact.every(i => i.scoreChange > 0) && (
                      <li>• All affected stocks would benefit from this change</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Run simulation to see results</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};