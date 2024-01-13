import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  ChevronRight,
  ChevronDown,
  X,
  Settings,
  Lightbulb
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StrategicBrainState, StrategicInsight } from '../../types/strategicBrain';

interface StrategicAdvisorPanelProps {
  strategicBrain: StrategicBrainState;
  onDismissInsight: (insightId: string) => void;
  onSwitchMode: (modeId: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const StrategicAdvisorPanel: React.FC<StrategicAdvisorPanelProps> = ({
  strategicBrain,
  onDismissInsight,
  onSwitchMode,
  isExpanded,
  onToggleExpanded,
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'balance' | 'modes'>('insights');

  const getPersonalityGreeting = () => {
    switch (strategicBrain.advisorPersonality) {
      case 'zen': return '🧘 Your inner wisdom speaks...';
      case 'energetic': return '⚡ Ready to optimize your life?';
      case 'analytical': return '📊 Data-driven insights ready';
      case 'supportive': return '🤗 Here to support your journey';
      default: return '🧠 Strategic analysis complete';
    }
  };

  const getInsightIcon = (insight: StrategicInsight) => {
    switch (insight.type) {
      case 'risk': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      case 'rebalance': return Target;
      case 'momentum': return Zap;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (insight: StrategicInsight) => {
    switch (insight.severity) {
      case 'critical': return 'from-red-50 to-pink-50 border-red-200 text-red-800';
      case 'high': return 'from-orange-50 to-red-50 border-orange-200 text-orange-800';
      case 'medium': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800';
      case 'low': return 'from-blue-50 to-indigo-50 border-blue-200 text-blue-800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'concerning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      className={`fixed right-4 top-20 z-40 ${isExpanded ? 'w-96' : 'w-16'} transition-all duration-300`}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"
            >
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
            {isExpanded && (
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Strategic Brain</h3>
                <p className="text-xs text-purple-700 dark:text-purple-300">{getPersonalityGreeting()}</p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/50"
          >
            {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-white dark:bg-purple-900/30 rounded">
                  <div className={`font-bold ${getHealthColor(strategicBrain.portfolioAnalysis.overallHealth).split(' ')[0]}`}>
                    {strategicBrain.portfolioAnalysis.overallHealth.toUpperCase()}
                  </div>
                  <div className="text-purple-700 dark:text-purple-300">Portfolio Health</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-purple-900/30 rounded">
                  <div className={`font-bold ${
                    strategicBrain.portfolioAnalysis.burnoutRisk > 70 ? 'text-red-600' :
                    strategicBrain.portfolioAnalysis.burnoutRisk > 50 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {strategicBrain.portfolioAnalysis.burnoutRisk.toFixed(0)}%
                  </div>
                  <div className="text-purple-700 dark:text-purple-300">Burnout Risk</div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-purple-100 dark:bg-purple-800/50 rounded-lg p-1">
                {[
                  { id: 'insights', label: 'Insights', count: strategicBrain.insights.length },
                  { id: 'balance', label: 'Balance' },
                  { id: 'modes', label: 'Modes' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100 shadow-sm'
                        : 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 bg-purple-600 text-white rounded-full px-1 text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="max-h-64 overflow-y-auto">
                {activeTab === 'insights' && (
                  <div className="space-y-2">
                    {strategicBrain.insights.length === 0 ? (
                      <div className="text-center py-4 text-purple-600 dark:text-purple-400 text-sm">
                        🎯 All systems optimal!
                      </div>
                    ) : (
                      strategicBrain.insights.map(insight => {
                        const Icon = getInsightIcon(insight);
                        return (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg border bg-gradient-to-r ${getInsightColor(insight)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-2 flex-1">
                                <Icon className="w-4 h-4 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{insight.title}</h4>
                                  <p className="text-xs opacity-90 mt-1">{insight.description}</p>
                                  {insight.actionable && insight.actions && (
                                    <div className="mt-2 space-y-1">
                                      {insight.actions.slice(0, 2).map((action, idx) => (
                                        <div key={idx} className="text-xs opacity-75">
                                          • {action}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDismissInsight(insight.id)}
                                className="text-current opacity-60 hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'balance' && (
                  <div className="space-y-2">
                    {strategicBrain.portfolioAnalysis.currentBalance.map(item => (
                      <div key={item.stockId} className="p-2 bg-white dark:bg-purple-900/30 rounded">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-purple-900 dark:text-purple-100">
                            {item.name}
                          </span>
                          <span className={`font-semibold ${
                            Math.abs(item.imbalance) < 5 ? 'text-green-600' :
                            Math.abs(item.imbalance) < 15 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {item.imbalance > 0 ? '+' : ''}{item.imbalance.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 flex text-xs text-purple-700 dark:text-purple-300">
                          <span>Target: {item.currentWeight.toFixed(0)}%</span>
                          <span className="ml-2">Actual: {item.actualActivity.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'modes' && (
                  <div className="space-y-2">
                    {strategicBrain.availableModes.map(mode => (
                      <motion.button
                        key={mode.id}
                        onClick={() => onSwitchMode(mode.id)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          mode.isActive
                            ? 'border-purple-400 bg-purple-100 dark:bg-purple-800/50'
                            : 'border-purple-200 dark:border-purple-600 hover:border-purple-300 dark:hover:border-purple-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{mode.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-purple-900 dark:text-purple-100">
                              {mode.name}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              {mode.description}
                            </div>
                          </div>
                          {mode.isActive && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};