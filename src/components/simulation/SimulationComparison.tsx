import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Target,
  Zap
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SimulationState, SimulationComparison as ComparisonType } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SimulationComparisonProps {
  simulation: SimulationState;
  onClose: () => void;
}

export const SimulationComparison: React.FC<SimulationComparisonProps> = ({
  simulation,
  onClose,
}) => {
  const { compareWithReality, applySimulation } = useSimulation();
  const comparison = compareWithReality(simulation);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'achievement': return Target;
      default: return Info;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'from-green-50 to-emerald-50 border-green-200 text-green-800';
      case 'warning': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800';
      case 'achievement': return 'from-purple-50 to-violet-50 border-purple-200 text-purple-800';
      default: return 'from-blue-50 to-indigo-50 border-blue-200 text-blue-800';
    }
  };

  const stockComparisonData = simulation.stocks.map(simStock => {
    const realStock = comparison.realState.stocks.find(s => s.id === simStock.id);
    return {
      name: simStock.name,
      real: realStock?.currentScore || 0,
      simulated: simStock.currentScore,
      realWeight: realStock?.weight || 0,
      simulatedWeight: simStock.weight,
    };
  });

  const handleApply = async () => {
    const confirmed = await applySimulation(simulation.id);
    if (confirmed) {
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap className="w-6 h-6 mr-2 text-purple-600" />
            Simulation Analysis: {simulation.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Compare your current path with this alternate strategy
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close Analysis
        </Button>
      </div>

      {/* Overview Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Reality</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {comparison.realState.indexValue.toFixed(1)}
            </div>
            <div className="text-sm text-blue-700 mb-4">Life Index Value</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              comparison.realState.recentTrend === 'rising' ? 'bg-green-100 text-green-800' :
              comparison.realState.recentTrend === 'falling' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {comparison.realState.recentTrend === 'rising' ? <TrendingUp className="w-4 h-4 mr-1" /> :
               comparison.realState.recentTrend === 'falling' ? <TrendingDown className="w-4 h-4 mr-1" /> :
               <ArrowRight className="w-4 h-4 mr-1" />}
              {comparison.realState.recentTrend}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Simulated Future</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {comparison.simulatedState.indexValue.toFixed(1)}
            </div>
            <div className="text-sm text-purple-700 mb-4">Projected Index Value</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              comparison.simulatedState.projectedTrend === 'rising' ? 'bg-green-100 text-green-800' :
              comparison.simulatedState.projectedTrend === 'falling' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {comparison.simulatedState.projectedTrend === 'rising' ? <TrendingUp className="w-4 h-4 mr-1" /> :
               comparison.simulatedState.projectedTrend === 'falling' ? <TrendingDown className="w-4 h-4 mr-1" /> :
               <ArrowRight className="w-4 h-4 mr-1" />}
              {comparison.simulatedState.projectedTrend}
            </div>
          </div>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              simulation.projectedChanges.indexChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {simulation.projectedChanges.indexChange > 0 ? '+' : ''}
              {simulation.projectedChanges.indexChange.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Index Change</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              simulation.projectedChanges.riskLevel === 'low' ? 'text-green-600' :
              simulation.projectedChanges.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {simulation.projectedChanges.riskLevel}
            </div>
            <div className="text-sm text-gray-600">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {simulation.projectedChanges.balanceScore.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Balance Score</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              simulation.projectedChanges.burnoutRisk < 30 ? 'text-green-600' :
              simulation.projectedChanges.burnoutRisk < 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {simulation.projectedChanges.burnoutRisk.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Burnout Risk</div>
          </div>
        </div>
      </Card>

      {/* Stock Comparison Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Performance Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="real" fill="#3B82F6" name="Current" />
              <Bar dataKey="simulated" fill="#8B5CF6" name="Simulated" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weight Changes */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weight Allocation Changes</h3>
        <div className="space-y-3">
          {stockComparisonData.map((stock, index) => {
            const weightChange = (stock.simulatedWeight - stock.realWeight) * 100;
            return (
              <motion.div
                key={stock.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {(stock.realWeight * 100).toFixed(0)}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-purple-600">
                    {(stock.simulatedWeight * 100).toFixed(0)}%
                  </span>
                  <span className={`font-semibold ${
                    weightChange > 0 ? 'text-green-600' : weightChange < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    ({weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}%)
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* AI Insights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🤖 AI Insights</h3>
        <div className="space-y-3">
          {comparison.insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const colorClasses = getInsightColor(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border bg-gradient-to-r ${colorClasses}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs opacity-75">{insight.confidence}% confidence</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.impact} impact
                        </span>
                      </div>
                    </div>
                    <p className="text-sm opacity-90">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">Ready to Apply This Strategy?</h3>
            <p className="text-purple-700 text-sm">
              This will update your real data with the simulated changes. This action cannot be undone.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Keep Exploring
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Apply Strategy
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};