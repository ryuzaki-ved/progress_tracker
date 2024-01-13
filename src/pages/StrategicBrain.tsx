import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Search, BarChart3, Settings } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StrategicAdvisorPanel } from '../components/strategicBrain/StrategicAdvisorPanel';
import { PortfolioHeatmap } from '../components/strategicBrain/PortfolioHeatmap';
import { LifeTrajectorySimulator } from '../components/strategicBrain/LifeTrajectorySimulator';
import { PatternDetectionPanel } from '../components/strategicBrain/PatternDetectionPanel';
import { useStrategicBrain } from '../hooks/useStrategicBrain';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';

export const StrategicBrain: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { 
    strategicBrain, 
    switchMode, 
    dismissInsight, 
    setAdvisorPersonality,
    generateTrajectory 
  } = useStrategicBrain();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'trajectory' | 'patterns'>('overview');
  const [advisorExpanded, setAdvisorExpanded] = useState(true);

  if (stocksLoading || tasksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your life portfolio...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Strategic Overview', icon: Brain },
    { id: 'heatmap', label: 'Portfolio Balance', icon: BarChart3 },
    { id: 'trajectory', label: 'Life Trajectory', icon: Target },
    { id: 'patterns', label: 'Pattern Detection', icon: Search },
  ];

  return (
    <div className="p-6 space-y-6 relative">
      {/* Strategic Advisor Panel */}
      <StrategicAdvisorPanel
        strategicBrain={strategicBrain}
        onDismissInsight={dismissInsight}
        onSwitchMode={switchMode}
        isExpanded={advisorExpanded}
        onToggleExpanded={() => setAdvisorExpanded(!advisorExpanded)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            Strategic Brain
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered strategic advisor for your life portfolio
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Advisor Personality:</span>
            <select
              value={strategicBrain.advisorPersonality}
              onChange={(e) => setAdvisorPersonality(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="zen">🧘 Zen</option>
              <option value="energetic">⚡ Energetic</option>
              <option value="analytical">📊 Analytical</option>
              <option value="supportive">🤗 Supportive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              strategicBrain.portfolioAnalysis.overallHealth === 'excellent' ? 'text-green-600' :
              strategicBrain.portfolioAnalysis.overallHealth === 'good' ? 'text-blue-600' :
              strategicBrain.portfolioAnalysis.overallHealth === 'concerning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {strategicBrain.portfolioAnalysis.overallHealth.toUpperCase()}
            </div>
            <div className="text-sm text-purple-700">Portfolio Health</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              strategicBrain.portfolioAnalysis.burnoutRisk > 70 ? 'text-red-600' :
              strategicBrain.portfolioAnalysis.burnoutRisk > 50 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {strategicBrain.portfolioAnalysis.burnoutRisk.toFixed(0)}%
            </div>
            <div className="text-sm text-orange-700">Burnout Risk</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {strategicBrain.portfolioAnalysis.momentumScore.toFixed(0)}%
            </div>
            <div className="text-sm text-green-700">Momentum Score</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {strategicBrain.insights.length}
            </div>
            <div className="text-sm text-blue-700">Active Insights</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={advisorExpanded ? 'mr-104' : 'mr-20'}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Mode */}
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${strategicBrain.activeMode.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                    {strategicBrain.activeMode.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">
                      Current Mode: {strategicBrain.activeMode.name}
                    </h3>
                    <p className="text-purple-700 text-sm">
                      {strategicBrain.activeMode.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-purple-700 mb-1">Task Load Multiplier</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {strategicBrain.activeMode.settings.taskLoadMultiplier}x
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🎯 Top Recommendations
                </h3>
                <div className="space-y-3">
                  {strategicBrain.portfolioAnalysis.recommendations.slice(0, 3).map((rec, index) => {
                    const stock = stocks.find(s => s.id === rec.stockId);
                    return (
                      <div key={rec.stockId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.type === 'increase' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {rec.type === 'increase' ? '↗️ Increase' : '↘️ Decrease'}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{stock?.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📈 Performance Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Momentum Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${strategicBrain.portfolioAnalysis.momentumScore}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {strategicBrain.portfolioAnalysis.momentumScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${strategicBrain.portfolioAnalysis.efficiencyScore}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {strategicBrain.portfolioAnalysis.efficiencyScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Burnout Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            strategicBrain.portfolioAnalysis.burnoutRisk > 70 ? 'bg-red-500' :
                            strategicBrain.portfolioAnalysis.burnoutRisk > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${strategicBrain.portfolioAnalysis.burnoutRisk}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {strategicBrain.portfolioAnalysis.burnoutRisk.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <PortfolioHeatmap
            portfolioAnalysis={strategicBrain.portfolioAnalysis}
            stocks={stocks}
          />
        )}

        {activeTab === 'trajectory' && (
          <LifeTrajectorySimulator
            trajectory={strategicBrain.trajectory}
            stocks={stocks}
            onGenerateTrajectory={generateTrajectory}
          />
        )}

        {activeTab === 'patterns' && (
          <PatternDetectionPanel patterns={strategicBrain.patterns} />
        )}
      </motion.div>
    </div>
  );
};