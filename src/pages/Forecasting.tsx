import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, AlertTriangle, Beaker, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StockForecastCard } from '../components/forecasting/StockForecastCard';
import { StrategyModePanel } from '../components/forecasting/StrategyModePanel';
import { LoadSimulator } from '../components/forecasting/LoadSimulator';
import { NeglectAlerts } from '../components/forecasting/NeglectAlerts';
import { WhatIfExperiments } from '../components/forecasting/WhatIfExperiments';
import { useForecasting } from '../hooks/useForecasting';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';

export const Forecasting: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const {
    stockForecasts,
    strategyGoals,
    neglectAlerts,
    whatIfScenarios,
    loading: forecastLoading,
    createStrategyGoal,
    simulateLoad,
    createWhatIfScenario,
    saveScenario,
    deleteScenario,
  } = useForecasting();

  const [activeTab, setActiveTab] = useState<'forecasts' | 'strategy' | 'simulator' | 'alerts' | 'experiments'>('forecasts');
  const [forecastTimeframe, setForecastTimeframe] = useState<7 | 14 | 30>(7);
  const [strategyTimeframe, setStrategyTimeframe] = useState<30 | 60 | 90>(30);

  if (stocksLoading || tasksLoading || forecastLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forecasting data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'forecasts', label: 'Stock Forecasts', icon: TrendingUp, count: stockForecasts.length },
    { id: 'strategy', label: 'Strategy Mode', icon: Target, count: strategyGoals.length },
    { id: 'simulator', label: 'Load Simulator', icon: Zap },
    { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle, count: neglectAlerts.length },
    { id: 'experiments', label: 'What-If Lab', icon: Beaker, count: whatIfScenarios.filter(s => s.isSaved).length },
  ];

  const handlePutOnHold = (alertId: string) => {
    // Implementation would update the alert status
    console.log('Put on hold:', alertId);
  };

  const handleReactivate = (alertId: string) => {
    // Implementation would reactivate the alert
    console.log('Reactivate:', alertId);
  };

  const handleDismissAlert = (alertId: string) => {
    // Implementation would dismiss the alert
    console.log('Dismiss alert:', alertId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forward Planning & Forecasting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Strategic insights and projections for your life performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setForecastTimeframe(days as 7 | 14 | 30)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  forecastTimeframe === days
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
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
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                )}
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
      >
        {activeTab === 'forecasts' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stockForecasts.filter(f => f.momentum === 'rising').length}
                  </div>
                  <div className="text-sm text-green-700">Rising Stocks</div>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stockForecasts.filter(f => f.momentum === 'falling').length}
                  </div>
                  <div className="text-sm text-red-700">Falling Stocks</div>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stockForecasts.filter(f => f.riskLevel === 'high' || f.riskLevel === 'critical').length}
                  </div>
                  <div className="text-sm text-yellow-700">At Risk</div>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stockForecasts.filter(f => f.confidence === 'high').length}
                  </div>
                  <div className="text-sm text-blue-700">High Confidence</div>
                </div>
              </Card>
            </div>

            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stockForecasts.map((forecast, index) => {
                const stock = stocks.find(s => s.id === forecast.stockId);
                if (!stock) return null;

                return (
                  <StockForecastCard
                    key={forecast.stockId}
                    forecast={forecast}
                    stock={stock}
                    timeframe={forecastTimeframe}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <StrategyModePanel
            goals={strategyGoals}
            stocks={stocks}
            onCreateGoal={createStrategyGoal}
            selectedTimeframe={strategyTimeframe}
            onTimeframeChange={setStrategyTimeframe}
          />
        )}

        {activeTab === 'simulator' && (
          <LoadSimulator
            stocks={stocks}
            onSimulate={simulateLoad}
          />
        )}

        {activeTab === 'alerts' && (
          <NeglectAlerts
            alerts={neglectAlerts}
            stocks={stocks}
            onPutOnHold={handlePutOnHold}
            onReactivate={handleReactivate}
            onDismiss={handleDismissAlert}
          />
        )}

        {activeTab === 'experiments' && (
          <WhatIfExperiments
            scenarios={whatIfScenarios}
            stocks={stocks}
            onCreateScenario={createWhatIfScenario}
            onSaveScenario={saveScenario}
            onDeleteScenario={deleteScenario}
          />
        )}
      </motion.div>
    </div>
  );
};