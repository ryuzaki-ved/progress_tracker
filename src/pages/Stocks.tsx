import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkline } from '../components/ui/Sparkline';
import { StreakCounter } from '../components/ui/StreakCounter';
import { AddStockModal } from '../components/modals/AddStockModal';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useStreaks } from '../hooks/useStreaks';
import { getVolatilityColor } from '../utils/stockUtils';
import { getDb } from '../lib/sqlite';
import { Stock } from '../types';

export const Stocks: React.FC = () => {
  const { stocks, loading, createStock, deleteStock, updateStock } = useStocks();
  const { createTask } = useTasks();
  const { streaks } = useStreaks();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string | undefined>(undefined);
  const [performanceHistory, setPerformanceHistory] = useState<Record<string, any[]>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStock, setEditStock] = useState<Stock | null>(null);
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    async function fetchHistory() {
      const db = await getDb();
      const result: Record<string, any[]> = {};
      for (const stock of stocks) {
        const res = db.exec('SELECT * FROM stock_performance_history WHERE stock_id = ? ORDER BY date DESC', [stock.id]);
        const rows = res[0]?.values || [];
        const columns = res[0]?.columns || [];
        result[stock.id] = rows.map((row: any[]) => {
          const obj: any = {};
          columns.forEach((col: string, i: number) => (obj[col] = row[i]));
          return obj;
        });
        if (result[stock.id].length > 0) {
          console.log(`Performance history for stock ${stock.name}:`, result[stock.id]);
        }
      }
      setPerformanceHistory(result);
    }
    if (stocks.length > 0) fetchHistory();
  }, [stocks]);

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

  const totalWeight = stocks.reduce((sum, s) => sum + (typeof s.weight === 'number' ? s.weight * 100 : 0), 0);

  const toggleStockExpansion = (stockId: string) => {
    const newExpanded = new Set(expandedStocks);
    if (newExpanded.has(stockId)) {
      newExpanded.delete(stockId);
    } else {
      newExpanded.add(stockId);
    }
    setExpandedStocks(newExpanded);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stocks Overview</h1>
          <p className="text-gray-600 mt-1">Monitor your life categories performance</p>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">
            Total Weight: {totalWeight}%
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
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
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stock.name}</h3>
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
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stock.currentScore}</div>
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
                    data={(() => {
                      const values = stock.history.map(h => h.value);
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      // Avoid division by zero if all values are the same
                      return stock.history.map(h => ({
                        date: h.date,
                        value: max !== min ? (h.value - min) / (max - min) : 0.5
                      }));
                    })()} 
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

                {/* Add streak indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {streaks.filter(s => s.isActive).map(streak => (
                      <StreakCounter key={streak.id} streak={streak} size="sm" showLabel={false} />
                    ))}
                  </div>
                  {stock.changePercent > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-500"
                    >
                      📈
                    </motion.span>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setSelectedStockId(stock.id);
                    setShowAddTaskModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setEditStock(stock);
                    setShowEditModal(true);
                  }}
                >
                  Edit Stock
                </Button>
                <Button
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => {
                    if (window.confirm(`Delete stock '${stock.name}'? This cannot be undone.`)) {
                      deleteStock(stock.id);
                    }
                  }}
                >
                  Delete Stock
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stock Performance Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h3>
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stocks.filter(s => s.change === 0).length}
            </div>
            <div className="text-sm text-gray-600">Stable Stocks</div>
          </div>
        </div>
      </Card>

      <AddStockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createStock}
        currentTotalWeight={totalWeight}
      />
      <AddStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditStock(null);
        }}
        onSubmit={async (data) => {
          if (editStock) {
            await updateStock(editStock.id, data);
            setShowEditModal(false);
            setEditStock(null);
          }
        }}
        currentTotalWeight={totalWeight}
        initialData={editStock || undefined}
        editMode
      />
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={createTask as any}
        stocks={stocks}
        defaultStockId={selectedStockId}
      />

      {/* Stock Performance History UI */}
      <Card className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Performance History</h3>
        <div className="space-y-4">
          {stocks.map(stock => {
            const isExpanded = expandedStocks.has(stock.id);
            const history = performanceHistory[stock.id] || [];
            
            return (
              <div key={stock.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleStockExpansion(stock.id)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-semibold`}>
                      {stock.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-white">{stock.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stock.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {history.length} entries
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Last: {history[0]?.date || 'N/A'}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white dark:bg-gray-900">
                      {history.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 px-3 text-gray-900 dark:text-white font-medium">Date</th>
                                <th className="text-left py-2 px-3 text-gray-900 dark:text-white font-medium">Score</th>
                                <th className="text-left py-2 px-3 text-gray-900 dark:text-white font-medium">Delta</th>
                                <th className="text-left py-2 px-3 text-gray-900 dark:text-white font-medium">% Change</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((h, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-2 px-3 text-gray-900 dark:text-white">{h.date}</td>
                                  <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">{h.daily_score}</td>
                                  <td className={`py-2 px-3 font-medium ${h.score_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.score_delta >= 0 ? '+' : ''}{h.score_delta}
                                  </td>
                                  <td className={`py-2 px-3 font-medium ${h.delta_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.delta_percent >= 0 ? '+' : ''}{h.delta_percent?.toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No performance history available for this stock.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};