import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { PortfolioAnalysis } from '../../types/strategicBrain';
import { Stock } from '../../types';

interface PortfolioHeatmapProps {
  portfolioAnalysis: PortfolioAnalysis;
  stocks: Stock[];
}

export const PortfolioHeatmap: React.FC<PortfolioHeatmapProps> = ({
  portfolioAnalysis,
  stocks,
}) => {
  const getImbalanceColor = (imbalance: number) => {
    const abs = Math.abs(imbalance);
    if (abs < 5) return 'bg-green-100 border-green-300 text-green-800';
    if (abs < 15) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (abs < 25) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  const getImbalanceIcon = (imbalance: number) => {
    if (imbalance > 5) return TrendingUp;
    if (imbalance < -5) return TrendingDown;
    return Minus;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Portfolio Balance Heatmap
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          portfolioAnalysis.overallHealth === 'excellent' ? 'bg-green-100 text-green-800' :
          portfolioAnalysis.overallHealth === 'good' ? 'bg-blue-100 text-blue-800' :
          portfolioAnalysis.overallHealth === 'concerning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {portfolioAnalysis.overallHealth}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolioAnalysis.currentBalance.map((item, index) => {
          const stock = stocks.find(s => s.id === item.stockId);
          const Icon = getImbalanceIcon(item.imbalance);
          
          return (
            <motion.div
              key={item.stockId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${getImbalanceColor(item.imbalance)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {stock && (
                    <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                      {stock.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <div className="text-xs opacity-75">
                      Target: {item.currentWeight.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <Icon className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Actual Activity:</span>
                  <span className="font-semibold">{item.actualActivity.toFixed(0)}%</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Imbalance:</span>
                  <span className="font-semibold">
                    {item.imbalance > 0 ? '+' : ''}{item.imbalance.toFixed(1)}%
                  </span>
                </div>

                {/* Visual bar */}
                <div className="mt-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span>Target</span>
                    <div className="flex-1 bg-white bg-opacity-50 rounded-full h-2 relative">
                      <div 
                        className="bg-current rounded-full h-2 transition-all duration-500"
                        style={{ width: `${item.currentWeight}%` }}
                      />
                      <div 
                        className="absolute top-0 bg-white bg-opacity-80 rounded-full h-2 transition-all duration-500"
                        style={{ 
                          width: `${item.actualActivity}%`,
                          left: 0
                        }}
                      />
                    </div>
                    <span>Actual</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recommendations */}
      {portfolioAnalysis.recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            🎯 Rebalancing Recommendations
          </h4>
          <div className="space-y-2">
            {portfolioAnalysis.recommendations.map((rec, index) => {
              const stock = stocks.find(s => s.id === rec.stockId);
              return (
                <motion.div
                  key={rec.stockId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    rec.impact === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.type === 'increase' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {rec.type === 'increase' ? '↗️ Increase' : '↘️ Decrease'}
                    </span>
                    <span className="font-medium">{stock?.name}</span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{rec.reason}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};