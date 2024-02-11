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
import CountUp from 'react-countup';
import SlidingNumber from '../components/ui/SlidingNumber';
import { OptionContract, UserOptionHolding, OptionTransaction } from '../types';
import { calculateOptionPrice } from '../utils/optionUtils';

const OptionToggleSwitch: React.FC<{
  value: 'buy' | 'write';
  onChange: (value: 'buy' | 'write') => void;
  option1Label?: string;
  option2Label?: string;
  className?: string;
}> = ({ value, onChange, option1Label = 'Buy', option2Label = 'Write', className }) => (
  <div className={`flex rounded-full border-2 border-blue-400 overflow-hidden ${className || ''}`} style={{ width: 180, height: 40 }}>
    <button
      type="button"
      className={`flex-1 text-center py-1 font-semibold transition-colors ${value === 'buy' ? 'bg-blue-400 text-white' : 'bg-white text-blue-400'}`}
      onClick={() => onChange('buy')}
    >
      {option1Label}
    </button>
    <button
      type="button"
      className={`flex-1 text-center py-1 font-semibold transition-colors ${value === 'write' ? 'bg-blue-400 text-white' : 'bg-white text-blue-400'}`}
      onClick={() => onChange('write')}
    >
      {option2Label}
    </button>
  </div>
);

export const TradingDesk: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { holdings, cashBalance, transactions, loading: tradingLoading, buyStock, sellStock, error, addFunds, optionContracts, userOptionHoldings, optionTransactions, buyOption, writeOption, fetchOptionsData, exitOptionPosition } = useTrading();
  const [showPnL, setShowPnL] = useState(true);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showTxHistory, setShowTxHistory] = useState(false);
  
  // Trading form state
  const [priceType, setPriceType] = useState('market');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  // Options trading form state
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [optionOrderType, setOptionOrderType] = useState<'buy' | 'write'>('buy');
  const [optionQuantity, setOptionQuantity] = useState('');
  const [optionOrderError, setOptionOrderError] = useState<string | null>(null);

  // Add state for showing the options transaction modal and quantity input
  const [showOptionTxHistory, setShowOptionTxHistory] = useState(false);
  const [exitQtyPrompt, setExitQtyPrompt] = useState<{ holdingId: number; max: number } | null>(null);

  // Fetch options data on mount
  useEffect(() => {
    fetchOptionsData();
  }, [fetchOptionsData]);

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

  // Get selected option contract
  const selectedOption = optionContracts.find(o => o.id.toString() === selectedOptionId);

  // Calculate premium for selected option
  let optionPremium = 0;
  if (selectedOption) {
    optionPremium = (window as any).calculateOptionPrice
      ? (window as any).calculateOptionPrice(selectedOption.underlyingIndexValueAtCreation, selectedOption.strikePrice, selectedOption.expiryDate, selectedOption.optionType, selectedOption.createdAt)
      : 0;
  }

  // Calculate order costs
  const numericQuantity = quantity === '' ? 0 : Number(quantity);
  const estimatedCost = numericQuantity * currentPrice;
  const brokerage = estimatedCost > 0 ? Math.max(20, estimatedCost * 0.0003) : 0; // ₹20 or 0.03% whichever is higher
  const totalCost = estimatedCost + brokerage;

  // Handle order submit
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    try {
      if (!selectedStockId) throw new Error('Select a stock');
      if (numericQuantity <= 0) throw new Error('Enter a valid quantity');
      if (orderType === 'buy') {
        await buyStock(Number(selectedStockId), numericQuantity, currentPrice);
      } else {
        await sellStock(Number(selectedStockId), numericQuantity, currentPrice);
      }
      setQuantity('');
    } catch (err: any) {
      setOrderError(err.message || 'Order failed');
    }
  };

  // Handle option order submit
  const handleOptionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOptionOrderError(null);
    try {
      if (!selectedOptionId) throw new Error('Select an option contract');
      const qty = Number(optionQuantity);
      if (qty <= 0) throw new Error('Enter a valid quantity');
      if (optionOrderType === 'buy') {
        await buyOption(Number(selectedOptionId), qty);
      } else {
        await writeOption(Number(selectedOptionId), qty);
      }
      setOptionQuantity('');
      fetchOptionsData();
    } catch (err: any) {
      setOptionOrderError(err.message || 'Order failed');
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
          <h1 className="text-3xl font-semibold font-sans tracking-wide text-gray-900 dark:text-white flex items-center drop-shadow-sm">
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white font-share-tech-mono text-digital-shadow">
              <CountUp
                key={currentValue}
                end={currentValue}
                duration={1.5}
                separator="," 
                decimals={2}
                formattingFn={formatCurrency}
                preserveValue
                redraw={false}
              />
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>
              {showPnL ? (
                <CountUp
                  key={totalPnL}
                  end={totalPnL}
                  duration={1.5}
                  separator="," 
                  decimals={2}
                  formattingFn={formatCurrency}
                  preserveValue
                  redraw={false}
                />
              ) : (
                '\u2022\u2022\u2022\u2022\u2022\u2022'
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <div className="text-right flex items-center space-x-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</div>
              <div className="text-2xl font-bold text-green-600 font-share-tech-mono text-digital-shadow">
                <CountUp
                  key={cashBalance}
                  end={cashBalance}
                  duration={1.5}
                  separator="," 
                  decimals={2}
                  formattingFn={formatCurrency}
                  preserveValue
                  redraw={false}
                />
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
              <SlidingNumber value={holdingsWithStock.length} color="#2563eb" />
            </div>
            <div className="text-sm text-blue-700">Holdings</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 font-share-tech-mono text-digital-shadow">
              <SlidingNumber value={totalInvestment} prefix="₹" decimals={2} color="#059669" />
            </div>
            <div className="text-sm text-green-700">Invested</div>
          </div>
        </Card>
        <Card className={`bg-gradient-to-r ${totalPnL >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-pink-50 border-red-200'} transition-transform duration-200 hover:scale-105 hover:shadow-lg`}>
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>
              {showPnL ? (
                <SlidingNumber value={totalPnLPercent} suffix="%" decimals={2} color={totalPnL >= 0 ? "#059669" : "#dc2626"} />
              ) : (
                '\u2022\u2022\u2022\u2022'
              )}
            </div>
            <div className={`text-sm ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total Return</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 font-share-tech-mono text-digital-shadow">
              <SlidingNumber value={holdingsWithStock.filter(h => h.unrealizedPnL > 0).length} color="#7c3aed" />
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
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
                              <div className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: 'Times New Roman, Times, serif' }}>{holding.stockName}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{holding.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          <div className="font-medium text-gray-900 dark:text-white font-share-tech-mono text-digital-shadow">{holding.quantity}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          <div className="font-medium text-gray-900 dark:text-white font-share-tech-mono text-digital-shadow">₹{holding.weightedAvgBuyPrice.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          <div className="font-medium text-gray-900 dark:text-white font-share-tech-mono text-digital-shadow">₹{holding.currentPrice.toFixed(2)}</div>
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
                          <div className={`font-medium ${isGainer ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>₹{holding.unrealizedPnL.toFixed(2)}</div>
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
                          <div className={`font-medium ${isGainer ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>{formatPercent(holding.unrealizedPnLPercent)}</div>
                        </td>
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
                      label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(1)}%)`}
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
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else if (/^\d+$/.test(val)) {
                      setQuantity(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Current Price: <span className="font-medium text-gray-900 dark:text-white font-share-tech-mono text-digital-shadow">₹{currentPrice.toFixed(2)}</span></span>
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
      {/* Options Trading Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Options Trading</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Contracts */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Available Option Contracts (This Week)</h3>
              {optionContracts.length > 0 && (
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  Expiry: {new Date(optionContracts[0].expiryDate).toLocaleDateString()}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="py-2 px-4 text-center">CE</th>
                      <th className="py-2 px-4 text-center">Strike</th>
                      <th className="py-2 px-4 text-center">PE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Group contracts by strike */}
                    {(() => {
                      // Map: strike -> { CE, PE }
                      const strikeMap: Record<number, { ce?: OptionContract; pe?: OptionContract }> = {};
                      optionContracts.forEach(opt => {
                        if (!strikeMap[opt.strikePrice]) strikeMap[opt.strikePrice] = {};
                        if (opt.optionType === 'CE') strikeMap[opt.strikePrice].ce = opt;
                        if (opt.optionType === 'PE') strikeMap[opt.strikePrice].pe = opt;
                      });
                      return Object.keys(strikeMap).sort((a, b) => Number(a) - Number(b)).map(strike => {
                        const ce = strikeMap[Number(strike)].ce;
                        const pe = strikeMap[Number(strike)].pe;
                        const cePremium = ce ? calculateOptionPrice(
                          ce.underlyingIndexValueAtCreation,
                          ce.strikePrice,
                          ce.expiryDate,
                          ce.optionType,
                          ce.createdAt
                        ) : null;
                        const pePremium = pe ? calculateOptionPrice(
                          pe.underlyingIndexValueAtCreation,
                          pe.strikePrice,
                          pe.expiryDate,
                          pe.optionType,
                          pe.createdAt
                        ) : null;
                        return (
                          <tr key={strike} className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white" onClick={() => ce && setSelectedOptionId(ce.id.toString())}>
                              {cePremium !== null ? cePremium.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white font-semibold">{strike}</td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white" onClick={() => pe && setSelectedOptionId(pe.id.toString())}>
                              {pePremium !== null ? pePremium.toFixed(2) : '-'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            {/* User Option Holdings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold mb-2">My Option Holdings</h3>
                <Button onClick={() => setShowOptionTxHistory(true)} variant="outline" size="sm">
                  View Transactions
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="py-2 px-4 text-center">Contract</th>
                      <th className="py-2 px-4 text-center">Type</th>
                      <th className="py-2 px-4 text-center">Qty</th>
                      <th className="py-2 px-4 text-center">Avg Premium</th>
                      <th className="py-2 px-4 text-center">Unrealized P&L</th>
                      <th className="py-2 px-4 text-center">Return (%)</th>
                      <th className="py-2 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOptionHoldings.map(h => {
                      const contract = optionContracts.find(c => c.id === h.contractId);
                      let currentPremium = 0;
                      if (contract) {
                        currentPremium = calculateOptionPrice(
                          contract.underlyingIndexValueAtCreation,
                          contract.strikePrice,
                          contract.expiryDate,
                          contract.optionType,
                          contract.createdAt
                        );
                      }
                      const unrealizedPnL = (currentPremium - h.weightedAvgPremium) * h.quantity * (h.type.startsWith('long') ? 1 : -1);
                      const returnPercent = h.weightedAvgPremium > 0 ? ((currentPremium - h.weightedAvgPremium) / h.weightedAvgPremium) * 100 * (h.type.startsWith('long') ? 1 : -1) : 0;
                      return (
                        <tr key={h.id}>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{contract ? `${contract.strikePrice} ${contract.optionType}` : h.contractId}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.type}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.quantity}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.weightedAvgPremium.toFixed(2)}</td>
                          <td className={`py-2 px-4 text-center ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{unrealizedPnL.toFixed(2)}</td>
                          <td className={`py-2 px-4 text-center ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{returnPercent.toFixed(2)}%</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                              onClick={() => setExitQtyPrompt({ holdingId: h.id, max: h.quantity })}
                              disabled={h.quantity <= 0}
                            >
                              Exit Partial
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              onClick={async () => {
                                try {
                                  await exitOptionPosition(h.id, h.quantity);
                                  fetchOptionsData();
                                } catch (err) {
                                  alert('Failed to exit position: ' + (err as any).message);
                                }
                              }}
                              disabled={h.quantity <= 0}
                            >
                              Exit All
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Option Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Option Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="py-2 px-4 text-center">Type</th>
                      <th className="py-2 px-4 text-center">Contract</th>
                      <th className="py-2 px-4 text-center">Qty</th>
                      <th className="py-2 px-4 text-center">Premium</th>
                      <th className="py-2 px-4 text-center">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionTransactions.map(tx => {
                      const contract = optionContracts.find(c => c.id === tx.contractId);
                      return (
                        <tr key={tx.id}>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.type}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{contract ? `${contract.strikePrice} ${contract.optionType}` : tx.contractId}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.quantity}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.premiumPerUnit.toFixed(2)}</td>
                          <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{new Date(tx.timestamp).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Place Option Order */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Place Option Order</h3>
              <form className="space-y-4" onSubmit={handleOptionOrder}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Option Contract</label>
                  <select
                    value={selectedOptionId}
                    onChange={e => setSelectedOptionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150 hover:border-blue-400 dark:hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-800"
                  >
                    <option value="">Choose an option...</option>
                    {optionContracts.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.strikePrice} {opt.optionType} (Exp: {new Date(opt.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Type</label>
                  <div className="flex justify-center">
                    <OptionToggleSwitch
                      value={optionOrderType}
                      onChange={setOptionOrderType}
                      option1Label="Buy"
                      option2Label="Write"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={optionQuantity}
                    placeholder="0"
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setOptionQuantity('');
                      } else if (/^\d+$/.test(val)) {
                        setOptionQuantity(val);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Premium: <span className="font-medium text-gray-900 dark:text-white">{optionPremium && selectedOption ? optionPremium.toFixed(2) : '-'}</span></span>
                </div>
                {optionOrderError && <div className="text-red-600 text-sm">{optionOrderError}</div>}
                <Button type="submit" variant="primary" className="w-full">Place Option Order</Button>
              </form>
            </div>
          </div>
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
      {/* Modal for Option Transaction History */}
      {showOptionTxHistory && (
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
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={() => setShowOptionTxHistory(false)}>
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Option Transaction History</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="py-2 px-4 text-center">Type</th>
                    <th className="py-2 px-4 text-center">Contract</th>
                    <th className="py-2 px-4 text-center">Qty</th>
                    <th className="py-2 px-4 text-center">Premium</th>
                    <th className="py-2 px-4 text-center">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {optionTransactions.map(tx => {
                    const contract = optionContracts.find(c => c.id === tx.contractId);
                    return (
                      <tr key={tx.id}>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.type}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{contract ? `${contract.strikePrice} ${contract.optionType}` : tx.contractId}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.quantity}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{tx.premiumPerUnit.toFixed(2)}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{new Date(tx.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Modal for Exit Partial prompt */}
      {exitQtyPrompt && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-sm w-full p-6 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={() => setExitQtyPrompt(null)}>
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Exit Partial Position</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              const qty = Number((e.target as any).elements.qty.value);
              if (!qty || qty < 1 || qty > exitQtyPrompt.max) {
                alert('Enter a valid quantity');
                return;
              }
              try {
                await exitOptionPosition(exitQtyPrompt.holdingId, qty);
                setExitQtyPrompt(null);
                fetchOptionsData();
              } catch (err) {
                alert('Failed to exit position: ' + (err as any).message);
              }
            }}>
              <label className="block mb-2 text-gray-700 dark:text-gray-300">Quantity to exit (max {exitQtyPrompt.max}):</label>
              <input name="qty" type="number" min={1} max={exitQtyPrompt.max} defaultValue={1} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4" />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded" onClick={() => setExitQtyPrompt(null)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Exit</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSubmit={handleAddFunds}
      />
    </div>
  );
};