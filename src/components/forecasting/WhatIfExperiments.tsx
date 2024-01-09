import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Plus, Save, Trash2, Play, Copy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { WhatIfScenario, Stock, Task } from '../../types';

interface WhatIfExperimentsProps {
  scenarios: WhatIfScenario[];
  stocks: Stock[];
  onCreateScenario: (name: string, description: string, changes: WhatIfScenario['changes']) => WhatIfScenario;
  onSaveScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

export const WhatIfExperiments: React.FC<WhatIfExperimentsProps> = ({
  scenarios,
  stocks,
  onCreateScenario,
  onSaveScenario,
  onDeleteScenario,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [changes, setChanges] = useState<WhatIfScenario['changes']>([]);
  const [activeScenario, setActiveScenario] = useState<WhatIfScenario | null>(null);

  const addChange = (type: WhatIfScenario['changes'][0]['type']) => {
    const newChange: WhatIfScenario['changes'][0] = { type };
    
    switch (type) {
      case 'add_task':
        newChange.stockId = stocks[0]?.id;
        newChange.taskData = { title: 'New Task', points: 15, priority: 'medium' };
        break;
      case 'change_weight':
        newChange.stockId = stocks[0]?.id;
        newChange.weightChange = 0.1;
        break;
      case 'add_stock':
        newChange.stockData = { name: 'New Stock', weight: 0.1, color: 'bg-blue-500', category: 'Personal' };
        break;
    }
    
    setChanges(prev => [...prev, newChange]);
  };

  const updateChange = (index: number, updates: Partial<WhatIfScenario['changes'][0]>) => {
    setChanges(prev => prev.map((change, i) => 
      i === index ? { ...change, ...updates } : change
    ));
  };

  const removeChange = (index: number) => {
    setChanges(prev => prev.filter((_, i) => i !== index));
  };

  const createScenario = () => {
    if (scenarioName && changes.length > 0) {
      const scenario = onCreateScenario(scenarioName, scenarioDescription, changes);
      setActiveScenario(scenario);
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setScenarioName('');
    setScenarioDescription('');
    setChanges([]);
  };

  const getChangeDescription = (change: WhatIfScenario['changes'][0]) => {
    switch (change.type) {
      case 'add_task':
        const stock = stocks.find(s => s.id === change.stockId);
        return `Add "${change.taskData?.title}" to ${stock?.name}`;
      case 'change_weight':
        const weightStock = stocks.find(s => s.id === change.stockId);
        return `Change ${weightStock?.name} weight by ${(change.weightChange || 0) * 100}%`;
      case 'add_stock':
        return `Add new stock "${change.stockData?.name}"`;
      case 'remove_stock':
        const removeStock = stocks.find(s => s.id === change.stockId);
        return `Remove stock "${removeStock?.name}"`;
      default:
        return 'Unknown change';
    }
  };

  const getImpactColor = (change: number) => {
    if (change > 5) return 'text-green-600';
    if (change > 0) return 'text-blue-600';
    if (change > -5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Beaker className="w-6 h-6 mr-2 text-purple-600" />
            What-If Experiments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Test scenarios and see their impact before making changes
          </p>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* Active Scenario */}
      {activeScenario && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  🧪 Active Experiment: {activeScenario.name}
                </h3>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  {activeScenario.description}
                </p>
              </div>
              <div className="flex space-x-2">
                {!activeScenario.isSaved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSaveScenario(activeScenario.id)}
                    className="text-purple-600 border-purple-300"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveScenario(null)}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-purple-900/30 rounded-lg p-3">
                <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                  Index Impact
                </div>
                <div className={`text-xl font-bold ${getImpactColor(activeScenario.projectedResults.indexChange)}`}>
                  {activeScenario.projectedResults.indexChange > 0 ? '+' : ''}
                  {activeScenario.projectedResults.indexChange.toFixed(2)}%
                </div>
              </div>
              
              <div className="bg-white dark:bg-purple-900/30 rounded-lg p-3">
                <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                  Stocks Affected
                </div>
                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {activeScenario.projectedResults.stockChanges.length}
                </div>
              </div>
              
              <div className="bg-white dark:bg-purple-900/30 rounded-lg p-3">
                <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                  Timeframe
                </div>
                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {activeScenario.projectedResults.timeframe} days
                </div>
              </div>
            </div>

            {/* Stock Changes */}
            {activeScenario.projectedResults.stockChanges.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Stock Impact
                </h4>
                <div className="space-y-2">
                  {activeScenario.projectedResults.stockChanges.map((change, index) => {
                    const stock = stocks.find(s => s.id === change.stockId);
                    if (!stock) return null;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white dark:bg-purple-900/30 rounded-lg p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 ${stock.color} rounded`} />
                          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {stock.name}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold ${getImpactColor(change.change)}`}>
                          {change.change > 0 ? '+' : ''}{change.change}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Saved Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.filter(s => s.isSaved).map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="h-full">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {scenario.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {scenario.description}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveScenario(scenario)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteScenario(scenario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {scenario.changes.length} change{scenario.changes.length !== 1 ? 's' : ''}
                  </div>
                  
                  <div className={`text-lg font-bold ${getImpactColor(scenario.projectedResults.indexChange)}`}>
                    {scenario.projectedResults.indexChange > 0 ? '+' : ''}
                    {scenario.projectedResults.indexChange.toFixed(1)}% impact
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {scenarios.filter(s => s.isSaved).length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🧪</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Saved Experiments
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create experiments to test different scenarios and their impact
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Experiment
          </Button>
        </Card>
      )}

      {/* Create Scenario Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Create What-If Experiment
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experiment Name
                    </label>
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Focus on Health & Fitness"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={scenarioDescription}
                      onChange={(e) => setScenarioDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Describe what you want to test..."
                    />
                  </div>

                  {/* Add Changes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Changes to Test
                      </label>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addChange('add_task')}
                        >
                          Add Task
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addChange('change_weight')}
                        >
                          Change Weight
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {changes.map((change, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getChangeDescription(change)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChange(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Change-specific inputs */}
                          {change.type === 'add_task' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Stock
                                </label>
                                <select
                                  value={change.stockId || ''}
                                  onChange={(e) => updateChange(index, { stockId: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  {stocks.map(stock => (
                                    <option key={stock.id} value={stock.id}>
                                      {stock.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  value={change.taskData?.points || 15}
                                  onChange={(e) => updateChange(index, {
                                    taskData: { ...change.taskData, points: parseInt(e.target.value) || 15 }
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                          
                          {change.type === 'change_weight' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Stock
                                </label>
                                <select
                                  value={change.stockId || ''}
                                  onChange={(e) => updateChange(index, { stockId: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  {stocks.map(stock => (
                                    <option key={stock.id} value={stock.id}>
                                      {stock.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Weight Change
                                </label>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="-0.5"
                                  max="0.5"
                                  value={change.weightChange || 0}
                                  onChange={(e) => updateChange(index, { weightChange: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createScenario}
                    disabled={!scenarioName || changes.length === 0}
                    className="flex-1"
                  >
                    Create Experiment
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