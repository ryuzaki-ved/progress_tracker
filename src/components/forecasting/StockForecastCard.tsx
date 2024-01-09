import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { StockForecast, Stock } from '../../types';

interface StockForecastCardProps {
  forecast: StockForecast;
  stock: Stock;
  timeframe: 7 | 14 | 30;
}

export const StockForecastCard: React.FC<StockForecastCardProps> = ({
  forecast,
  stock,
  timeframe,
}) => {
  const getMomentumIcon = () => {
    switch (forecast.momentum) {
      case 'rising': return TrendingUp;
      case 'falling': return TrendingDown;
      case 'stable': return Minus;
    }
  };

  const getMomentumColor = () => {
    switch (forecast.momentum) {
      case 'rising': return 'text-green-600';
      case 'falling': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  const getRiskColor = () => {
    switch (forecast.riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getConfidenceWidth = () => {
    switch (forecast.confidence) {
      case 'low': return 'w-1/3';
      case 'medium': return 'w-2/3';
      case 'high': return 'w-full';
    }
  };

  const MomentumIcon = getMomentumIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden">
        {/* Risk indicator stripe */}
        <div className={`absolute top-0 left-0 w-full h-1 ${
          forecast.riskLevel === 'critical' ? 'bg-red-500' :
          forecast.riskLevel === 'high' ? 'bg-orange-500' :
          forecast.riskLevel === 'medium' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${stock.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">
                  {stock.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{stock.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stock.category}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MomentumIcon className={`w-5 h-5 ${getMomentumColor()}`} />
              <span className={`text-sm font-medium ${getMomentumColor()}`}>
                {forecast.momentum}
              </span>
            </div>
          </div>

          {/* Current vs Projected */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {stock.currentScore}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Projected ({timeframe}d)
              </div>
              <div className={`text-lg font-bold ${
                forecast.projectedScore > stock.currentScore ? 'text-green-600' :
                forecast.projectedScore < stock.currentScore ? 'text-red-600' :
                'text-gray-900 dark:text-white'
              }`}>
                {Math.round(forecast.projectedScore)}
                <span className="text-sm ml-1">
                  ({forecast.projectedChangePercent > 0 ? '+' : ''}
                  {forecast.projectedChangePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Confidence</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {forecast.confidence}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className={`h-2 bg-blue-500 rounded-full transition-all duration-500 ${getConfidenceWidth()}`} />
            </div>
          </div>

          {/* Action Required */}
          {forecast.tasksNeeded > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Action Needed
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center space-x-4">
                  <span>{forecast.tasksNeeded} tasks</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {forecast.hoursNeeded}h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Risk Alert */}
          {(forecast.riskLevel === 'high' || forecast.riskLevel === 'critical') && (
            <div className={`border rounded-lg p-3 mb-4 ${getRiskColor()}`}>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {forecast.riskLevel === 'critical' ? 'Critical Risk' : 'High Risk'}
                </span>
              </div>
              <p className="text-sm">
                This stock is trending toward significant decline
              </p>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Recommendation
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {forecast.recommendation}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};