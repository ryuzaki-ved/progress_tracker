import React from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkline } from '../components/ui/Sparkline';
import { useStocks } from '../hooks/useStocks';
import { getVolatilityColor } from '../utils/stockUtils';

export const Stocks: React.FC = () => {
  const { stocks, loading } = useStocks();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stocks Overview</h1>
          <p className="text-gray-600 mt-1">Monitor your life categories performance</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Stock
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map((stock, index) => (
          <motion.div
            key={stock.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${stock.color} rounded-xl flex items-center justify-center text-white`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{stock.name}</h3>
                    <p className="text-sm text-gray-600">{stock.category}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getVolatilityColor(stock.volatility)}`}>
                  {stock.volatility}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stock.currentScore}</div>
                    <div className="text-sm text-gray-600">Current Score</div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      <span className="font-semibold">{stock.change >= 0 ? '+' : ''}{stock.change}</span>
                    </div>
                    <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="h-16">
                  <Sparkline 
                    data={stock.history} 
                    color={stock.change >= 0 ? '#10B981' : '#EF4444'}
                    height={64}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Last activity: {stock.lastActivity.toLocaleDateString()}
                  </div>
                  <div>
                    Weight: {(stock.weight * 100).toFixed(0)}%
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stock Performance Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stocks.filter(s => s.change > 0).length}
            </div>
            <div className="text-sm text-gray-600">Gaining Stocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stocks.filter(s => s.change < 0).length}
            </div>
            <div className="text-sm text-gray-600">Losing Stocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stocks.filter(s => s.change === 0).length}
            </div>
            <div className="text-sm text-gray-600">Stable Stocks</div>
          </div>
        </div>
      </Card>
    </div>
  );
};