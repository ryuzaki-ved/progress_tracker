import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/ui/Card';
import { Button, PlaceOrderButton } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { useStocks } from '../hooks/useStocks';
import { useTrading } from '../hooks/useTrading';
import { AddFundsModal } from '../components/modals/AddFundsModal';

export const TradingDesk: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { holdings, cashBalance, transactions, loading: tradingLoading, buyStock, sellStock, error, addFunds } = useTrading();
  const [showPnL, setShowPnL] = useState(true);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(0);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showTxHistory, setShowTxHistory] = useState(false);
  
  // Trading form state
  const [priceType, setPriceType] = useState('market');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  if (stocksLoading || tradingLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trading desk...</p>
        </div>
      </div>
    );
  }

  // Map holdings to include stock info and current price
  const holdingsWithStock = holdings.map(holding => {
    const stock = stocks.find(s => s.id.toString() === holding.stockId.toString());
    const currentPrice = stock ? stock.currentScore * 0.1 : 0;
    return {
      ...holding,
      stockName: stock?.name || '',
      currentPrice,
      category: stock?.category || '',
      color: stock?.color || '',
      unrealizedPnL: (currentPrice - holding.weightedAvgBuyPrice) * holding.quantity,
      unrealizedPnLPercent: holding.weightedAvgBuyPrice > 0 ? ((currentPrice - holding.weightedAvgBuyPrice) / holding.weightedAvgBuyPrice) * 100 : 0,
    };
  });

  // Pie chart data: distribution of holdings by value
  const holdingsDistribution = holdingsWithStock.map(h => ({
    name: h.stockName,
    value: h.quantity * h.currentPrice,
  }));

  // Pie chart colors
  const pieColors = [
    '#6366F1', // indigo
    '#10B981', // emerald
    '#F59E42', // orange
    '#EF4444', // red
    '#8B5CF6', // violet
    '#FBBF24', // amber
    '#3B82F6', // blue
    '#F472B6', // pink
    '#22D3EE', // cyan
    '#A3E635', // lime
  ];
  const totalInvestment = holdingsWithStock.reduce((sum, h) => sum + (h.weightedAvgBuyPrice * h.quantity), 0);
  const currentValue = holdingsWithStock.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
  const totalPnL = currentValue - totalInvestment;
  const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Get selected stock details
  const selectedStock = stocks.find(s => s.id.toString() === selectedStockId);
  const selectedHolding = holdingsWithStock.find(h => h.stockId.toString() === selectedStockId);
  const currentPrice = selectedStock ? selectedStock.currentScore * 0.1 : 0;

  // Calculate order costs
  const estimatedCost = quantity * currentPrice;
  const brokerage = estimatedCost > 0 ? Math.max(20, estimatedCost * 0.0003) : 0; // ₹20 or 0.03% whichever is higher
  const totalCost = estimatedCost + brokerage;

  // Handle order submit
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    try {
      if (!selectedStockId) throw new Error('Select a stock');
      if (quantity <= 0) throw new Error('Enter a valid quantity');
      if (orderType === 'buy') {
        await buyStock(Number(selectedStockId), quantity, currentPrice);
      } else {
        await sellStock(Number(selectedStockId), quantity, currentPrice);
      }
      setQuantity(0);
    } catch (err: any) {
      setOrderError(err.message || 'Order failed');
    }
  };

  // Add Funds handler
  const handleAddFunds = async (amount: number) => {
    await addFunds(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
            Trading Desk
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Live portfolio view and trading interface
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Portfolio Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(currentValue)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {showPnL ? formatCurrency(totalPnL) : '\u2022\u2022\u2022\u2022\u2022\u2022'}
            </div>
          </div>
          <div className="text-right flex items-center space-x-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(cashBalance)}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddFundsModal(true)}>
              Add Funds
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {holdingsWithStock.length}
            </div>
            <div className="text-sm text-blue-700">Holdings</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInvestment)}
            </div>
            <div className="text-sm text-green-700">Invested</div>
          </div>
        </Card>
        <Card className={`bg-gradient-to-r ${totalPnL >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-pink-50 border-red-200'} transition-transform duration-200 hover:scale-105 hover:shadow-lg`}>
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>              {showPnL ? formatPercent(totalPnLPercent) : '••••'}
            </div>
            <div className={`text-sm ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>              Total Return
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {holdingsWithStock.filter(h => h.unrealizedPnL > 0).length}
            </div>
            <div className="text-sm text-purple-700">Gainers</div>
          </div>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Stock Holdings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                My Holdings
              </h2>
              <Button onClick={() => setShowTxHistory(true)} variant="outline" size="sm">
                View Transactions
              </Button>
            </div>
            {/* Holdings Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="py-2 px-4 text-left text-gray-700 dark:text-gray-200">Stock</th>
                    <th className="py-2 px-4 text-right text-gray-700 dark:text-gray-200">Qty</th>
                    <th className="py-2 px-4 text-right text-gray-700 dark:text-gray-200">Avg Buy</th>
                    <th className="py-2 px-4 text-right text-gray-700 dark:text-gray-200">Current</th>
                    <th className="py-2 px-4 text-right text-gray-700 dark:text-gray-200">Unrealized P&L</th>
                    <th className="py-2 px-4 text-right text-gray-700 dark:text-gray-200">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsWithStock.map((holding, index) => {
                    const isGainer = holding.unrealizedPnL >= 0;
                    return (
                      <motion.tr
                        key={holding.stockId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${holding.color} rounded-lg flex items-center justify-center`}>
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{holding.stockName}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{holding.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {holding.quantity}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ₹{holding.weightedAvgBuyPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ₹{holding.currentPrice.toFixed(2)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${isGainer ? 'text-green-600' : 'text-red-600'}`}>₹{holding.unrealizedPnL.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-medium ${isGainer ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(holding.unrealizedPnLPercent)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {holdingsWithStock.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Holdings Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start by creating some life stocks to begin trading
                </p>
              </div>
            )}
          </Card>
          {/* Holdings Distribution Pie Chart */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-500" />
                Holdings Distribution
              </h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={holdingsDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {holdingsDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>
        {/* Right Section - Place Order */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Place Order
              </h2>
            </div>
            {/* Trade Form */}
            <form className="space-y-4" onSubmit={handleOrder}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Stock
                </label>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150 hover:border-blue-400 dark:hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-800"
                >
                  <option value="">Choose a stock...</option>
                  {stocks.map(stock => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} - ₹{(stock.currentScore * 0.1).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Type</label>
                <div className="flex justify-center">
                  <ToggleSwitch
                    value={orderType}
                    onChange={setOrderType}
                    option1Label="Buy"
                    option2Label="Sell"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Current Price: <span className="font-medium text-gray-900 dark:text-white">₹{currentPrice.toFixed(2)}</span></span>
                <span>Brokerage: <span className="font-medium">₹{brokerage.toFixed(2)}</span></span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Total: <span className="font-medium text-gray-900 dark:text-white">₹{totalCost.toFixed(2)}</span></span>
              </div>
              {orderError && <div className="text-red-600 text-sm">{orderError}</div>}
              {/* Replace Button with PlaceOrderButton for Place Order */}
              <PlaceOrderButton type="submit">
                Place Order
                <span className="stripe" />
              </PlaceOrderButton>
            </form>
          </Card>
        </div>
      </div>
      {/* Transactions Modal */}
      <AnimatePresence>
      {showTxHistory && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={() => setShowTxHistory(false)}>
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Transaction History</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Type</th>
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Stock</th>
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Qty</th>
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Price</th>
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Brokerage</th>
                    <th className="py-2 px-4 text-gray-700 dark:text-gray-200">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((tx, idx) => {
                      const stock = stocks.find(s => s.id.toString() === tx.stockId.toString());
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <td className="py-2 px-4 font-medium capitalize text-gray-900 dark:text-gray-100">{tx.type}</td>
                          <td className="py-2 px-4 text-gray-900 dark:text-gray-100">{stock?.name || tx.stockId}</td>
                          <td className="py-2 px-4 text-right text-gray-900 dark:text-gray-100">{tx.quantity}</td>
                          <td className="py-2 px-4 text-right text-gray-900 dark:text-gray-100">₹{tx.price.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-gray-900 dark:text-gray-100">₹{tx.brokerageFee.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-gray-900 dark:text-gray-100">{new Date(tx.timestamp).toLocaleString()}</td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSubmit={handleAddFunds}
      />
    </div>
  );
};