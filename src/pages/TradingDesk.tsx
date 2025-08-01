import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, RefreshCw, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/ui/Card';
import { Button, PlaceOrderButton } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { useStocks } from '../hooks/useStocks';
import { useTrading } from '../hooks/useTrading';
import { AddFundsModal } from '../components/modals/AddFundsModal';
import CountUp from 'react-countup';
import SlidingNumber from '../components/ui/SlidingNumber';
import { TradingNotificationContainer } from '../components/ui/TradingNotification';
import { useTradingNotifications } from '../hooks/useTradingNotifications';
import { OptionHoldingsChart } from '../components/ui/OptionHoldingsChart';
import { OptionContract, UserOptionHolding, OptionTransaction } from '../types';
import { calculateOptionPrice } from '../utils/optionUtils';
import { getDb, persistDb } from '../lib/sqlite';

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
  const { holdings, cashBalance, transactions, loading: tradingLoading, buyStock, sellStock, error, addFunds, optionContracts, userOptionHoldings, optionTransactions, optionPnlHistory, buyOption, writeOption, fetchOptionsData, exitOptionPosition, currentIndexValue, resetOptionsData } = useTrading();
  const { notifications, dismissNotification, notifyStockBuy, notifyStockSell, notifyOptionBuy, notifyOptionWrite, notifyOptionExit, notifyOptionPnL } = useTradingNotifications();
  
  // Memoize calculated values to prevent unnecessary re-renders
  const {
    holdingsWithStock,
    holdingsDistribution,
    totalInvestment,
    currentValue,
    totalPnL,
    totalPnLPercent
  } = useMemo(() => {
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

    const holdingsDistribution = holdingsWithStock.map(h => ({
      name: h.stockName,
      value: h.quantity * h.currentPrice,
    }));

    const totalInvestment = holdingsWithStock.reduce((sum, h) => sum + (h.weightedAvgBuyPrice * h.quantity), 0);
    const currentValue = holdingsWithStock.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const totalPnL = currentValue - totalInvestment;
    const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

    return {
      holdingsWithStock,
      holdingsDistribution,
      totalInvestment,
      currentValue,
      totalPnL,
      totalPnLPercent
    };
  }, [holdings, stocks]);

  // Memoize cash balance to prevent unnecessary re-renders
  const memoizedCashBalance = useMemo(() => cashBalance, [cashBalance]);

  // Memoize option holdings calculations to prevent continuous updates
  const {
    optionHoldingsWithDetails,
    optionHoldingsDistribution,
    totalOptionsPnL,
    totalOptionsReturn
  } = useMemo(() => {
    const optionHoldingsWithDetails = userOptionHoldings.map(h => {
      const contract = optionContracts.find(c => c.id === h.contractId);
      let currentPremium = 0;
      if (contract) {
        currentPremium = calculateOptionPrice(
          currentIndexValue,
          contract.strikePrice,
          contract.expiryDate,
          contract.optionType,
          contract.createdAt
        );
      }
      const unrealizedPnL = (currentPremium - h.weightedAvgPremium) * h.quantity * (h.type.startsWith('long') ? 1 : -1);
      const returnPercent = h.weightedAvgPremium > 0 ? ((currentPremium - h.weightedAvgPremium) / h.weightedAvgPremium) * 100 * (h.type.startsWith('long') ? 1 : -1) : 0;
      
      return {
        ...h,
        contract,
        currentPremium,
        unrealizedPnL,
        returnPercent,
        contractName: contract ? `${contract.strikePrice} ${contract.optionType}` : `Contract ${h.contractId}`
      };
    });

    const optionHoldingsDistribution = optionHoldingsWithDetails.map(h => ({
      name: h.contractName,
      value: h.contract ? Math.abs(h.contract.strikePrice * h.quantity) : 0,
    }));

    const totalOptionsPnL = optionHoldingsWithDetails.reduce((sum, h) => sum + h.unrealizedPnL, 0);
    const totalOptionsInvested = optionHoldingsWithDetails.reduce((sum, h) => sum + (h.weightedAvgPremium * h.quantity), 0);
    const totalOptionsReturn = totalOptionsInvested > 0 ? (totalOptionsPnL / totalOptionsInvested) * 100 : 0;

    return {
      optionHoldingsWithDetails,
      optionHoldingsDistribution,
      totalOptionsPnL,
      totalOptionsReturn
    };
  }, [userOptionHoldings, optionContracts, currentIndexValue]);



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
    optionPremium = calculateOptionPrice(
      currentIndexValue,
      selectedOption.strikePrice,
      selectedOption.expiryDate,
      selectedOption.optionType,
      selectedOption.createdAt
    );
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
      
      const selectedStock = stocks.find(s => s.id.toString() === selectedStockId);
      if (!selectedStock) throw new Error('Stock not found');
      
      if (orderType === 'buy') {
        await buyStock(Number(selectedStockId), numericQuantity, currentPrice);
        notifyStockBuy(selectedStock.name, numericQuantity, currentPrice, totalCost);
      } else {
        await sellStock(Number(selectedStockId), numericQuantity, currentPrice);
        notifyStockSell(selectedStock.name, numericQuantity, currentPrice, totalCost);
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
      if (!selectedOption) throw new Error('No option selected');
      const premium = calculateOptionPrice(
        currentIndexValue,
        selectedOption.strikePrice,
        selectedOption.expiryDate,
        selectedOption.optionType,
        selectedOption.createdAt
      );
      
      const optionDetails = `${selectedOption.strikePrice} ${selectedOption.optionType}`;
      const totalCost = premium * qty;
      
      if (optionOrderType === 'buy') {
        await buyOption(Number(selectedOptionId), qty, premium);
        notifyOptionBuy(optionDetails, qty, premium, totalCost);
      } else {
        await writeOption(Number(selectedOptionId), qty, premium);
        notifyOptionWrite(optionDetails, qty, premium, totalCost);
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

  // Add handler for deleting a strike
  const handleDeleteStrike = async (strike: number) => {
    const db = await getDb();
    db.run('DELETE FROM options_contracts WHERE strike_price = ?', [strike]);
    await persistDb();
    fetchOptionsData();
  };

  // In the option order form, calculate margin/collateral
  let optionMargin = 0;
  if (selectedOption && optionOrderType === 'write') {
    optionMargin = selectedOption.strikePrice * (Number(optionQuantity) || 0);
  }

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
                key={`portfolio-${currentValue}`}
                end={currentValue}
                duration={1.5}
                separator="," 
                decimals={2}
                formattingFn={formatCurrency}
                preserveValue
                redraw={false}
                start={currentValue}
              />
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>
              {showPnL ? (
                <CountUp
                  key={`pnl-${totalPnL}`}
                  end={totalPnL}
                  duration={1.5}
                  separator="," 
                  decimals={2}
                  formattingFn={formatCurrency}
                  preserveValue
                  redraw={false}
                  start={totalPnL}
                />
              ) : (
                '\u2022\u2022\u2022\u2022'
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <div className="text-right flex items-center space-x-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</div>
              <div className="text-2xl font-bold text-green-600 font-share-tech-mono text-digital-shadow">
                <CountUp
                  key={`cash-${memoizedCashBalance}`}
                  end={memoizedCashBalance}
                  duration={1.5}
                  separator="," 
                  decimals={2}
                  formattingFn={formatCurrency}
                  preserveValue
                  redraw={false}
                  start={memoizedCashBalance}
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddFundsModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-500 hover:border-green-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
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
        
        {/* Options Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                <SlidingNumber value={userOptionHoldings.length} color="#2563eb" />
              </div>
              <div className="text-sm text-blue-700">Option Holdings</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 font-share-tech-mono text-digital-shadow">
                <SlidingNumber 
                  value={userOptionHoldings.reduce((sum, h) => {
                    if (h.type === 'long_ce' || h.type === 'long_pe') {
                      return sum + (h.weightedAvgPremium * h.quantity);
                    } else {
                      // short_ce or short_pe: margin = strikePrice * quantity
                      const contract = optionContracts.find(c => c.id === h.contractId);
                      if (contract) {
                        return sum + (contract.strikePrice * h.quantity);
                      }
                      return sum;
                    }
                  }, 0)} 
                  prefix="₹" 
                  decimals={2} 
                  color="#059669" 
                />
              </div>
              <div className="text-sm text-green-700">Options Invested</div>
            </div>
          </Card>
                    <Card className={`bg-gradient-to-r ${totalOptionsPnL >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-pink-50 border-red-200'} transition-transform duration-200 hover:scale-105 hover:shadow-lg`}>
            <div className="p-4 text-center">
              <div className={`text-2xl font-bold ${totalOptionsPnL >= 0 ? 'text-green-600' : 'text-red-600'} font-share-tech-mono text-digital-shadow`}>
                {showPnL ? (
                  <SlidingNumber 
                    value={totalOptionsReturn} 
                    suffix="%" 
                    decimals={2}
                    color={totalOptionsPnL >= 0 ? "#059669" : "#dc2626"} 
                  />
                ) : (
                  '\u2022\u2022\u2022\u2022'
                )}
              </div>
              <div className={`text-sm ${totalOptionsPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>Options Return</div>
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Contracts */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">OPTIONS CHAIN - Available Option Contracts (This Week)</h3>
                <Button onClick={resetOptionsData} variant="outline" size="sm">
                  Reset Options Data
                </Button>
              </div>
              {optionContracts.length > 0 && (
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  Expiry: {new Date(optionContracts[0].expiryDate).toLocaleDateString()}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">OI</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">CE</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Strike</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">PE</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">OI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Get unique strike prices
                      const uniqueStrikes = Array.from(new Set(optionContracts.map(opt => opt.strikePrice)));
                      return uniqueStrikes.map(strike => {
                        const ce = optionContracts.find(opt => opt.strikePrice === strike && opt.optionType === 'CE');
                        const pe = optionContracts.find(opt => opt.strikePrice === strike && opt.optionType === 'PE');
                        const cePremium = ce ? calculateOptionPrice(
                          currentIndexValue,
                          ce.strikePrice,
                          ce.expiryDate,
                          ce.optionType,
                          ce.createdAt
                        ) : null;
                        const pePremium = pe ? calculateOptionPrice(
                          currentIndexValue,
                          pe.strikePrice,
                          pe.expiryDate,
                          pe.optionType,
                          pe.createdAt
                        ) : null;
                        // Calculate OI for CE and PE
                        const ceOI = userOptionHoldings
                          .filter(h => {
                            const contract = optionContracts.find(c => c.id === h.contractId);
                            return contract && contract.strikePrice === strike && contract.optionType === 'CE';
                          })
                          .reduce((sum, h) => sum + h.quantity, 0);
                        const peOI = userOptionHoldings
                          .filter(h => {
                            const contract = optionContracts.find(c => c.id === h.contractId);
                            return contract && contract.strikePrice === strike && contract.optionType === 'PE';
                          })
                          .reduce((sum, h) => sum + h.quantity, 0);
                        return (
                          <tr key={strike} className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{ceOI}</td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white" onClick={() => ce && setSelectedOptionId(ce.id.toString())}>
                              {cePremium !== null ? cePremium.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white font-semibold">
                              <div className="flex items-center justify-center space-x-2">
                                <span>{strike}</span>
                                <button
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={e => { e.stopPropagation(); handleDeleteStrike(Number(strike)); }}
                                  title="Delete Strike"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white" onClick={() => pe && setSelectedOptionId(pe.id.toString())}>
                              {pePremium !== null ? pePremium.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{peOI}</td>
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
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">My Option Holdings</h3>
                <Button onClick={() => setShowOptionTxHistory(true)} variant="outline" size="sm">
                  View Transactions
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Contract</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Type</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Qty</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Avg Premium</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Current Price</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Unrealized P&L</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Return (%)</th>
                      <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionHoldingsWithDetails.map(h => (
                      <tr key={h.id}>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.contractName}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.type}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.quantity}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.weightedAvgPremium.toFixed(2)}</td>
                        <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{h.currentPremium.toFixed(2)}</td>
                        <td className={`py-2 px-4 text-center ${h.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{h.unrealizedPnL.toFixed(2)}</td>
                        <td className={`py-2 px-4 text-center ${h.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{h.returnPercent.toFixed(2)}%</td>
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
                                  const optionDetails = h.contractName;
                                  const exitValue = h.currentPremium * h.quantity;
                                  notifyOptionExit(optionDetails, h.quantity, h.currentPremium, exitValue);
                                  
                                  // Calculate and notify PnL
                                  const pnl = h.unrealizedPnL;
                                  const isProfit = pnl > 0;
                                  notifyOptionPnL(optionDetails, pnl, isProfit);
                                  
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Option Holdings Distribution Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-500" />
                Option Holdings Distribution
              </h3>
              <OptionHoldingsChart
                userOptionHoldings={userOptionHoldings}
                optionContracts={optionContracts}
                currentIndexValue={currentIndexValue}
              />
            </div>
          </div>
          {/* Place Option Order */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Place Option Order</h3>
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
                  {optionOrderType === 'write' ? (
                    <span>Margin: <span className="font-medium text-gray-900 dark:text-white">₹{optionMargin.toLocaleString()}</span></span>
                  ) : (
                    <span>Margin: <span className="font-medium text-gray-900 dark:text-white">{selectedOption && optionPremium && optionQuantity ? `₹${(optionPremium * Number(optionQuantity)).toLocaleString()}` : '-'}</span></span>
                  )}
                </div>
                {optionOrderError && <div className="text-red-600 text-sm">{optionOrderError}</div>}
                <Button type="submit" variant="primary" className="w-full">Place Option Order</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Options PnL History Section */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center" style={{ fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Options PnL History
            </h3>
            {(() => {
              const totalPnl = optionPnlHistory && optionPnlHistory.length > 0
                ? optionPnlHistory.reduce((sum, rec) => sum + (Number(rec.pnl) || 0), 0)
                : 0;
              // Format to Crore
              const crore = totalPnl / 10000000;
              const croreStr = `${crore >= 0 ? '' : '-'}₹${Math.abs(crore).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
              return (
                <div className={`flex items-center space-x-2 px-4 py-1 rounded font-bold text-lg ${totalPnl >= 0 ? 'bg-green-600' : 'bg-red-600'}`} style={{ fontFamily: 'Share Tech Mono, monospace', minWidth: 180, justifyContent: 'flex-end', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                  <span className="mr-1">{totalPnl >= 0 ? '▲' : '▼'}</span>
                  <span>Total PnL:</span>
                  <span>{croreStr}</span>
                </div>
              );
            })()}
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Contract</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Position</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Qty</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Entry Premium</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Exit Premium</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">PnL</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Return %</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Exit Type</th>
                  <th className="py-2 px-4 text-center text-gray-700 dark:text-gray-200">Exit Date</th>
                </tr>
              </thead>
              <tbody>
                {optionPnlHistory.map((pnl, index) => {
                  const contract = optionContracts.find(c => c.id === pnl.contract_id);
                  const isProfit = pnl.pnl >= 0;
                  return (
                    <motion.tr
                      key={pnl.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">
                        {contract ? `${contract.strikePrice} ${contract.optionType}` : pnl.contract_id}
                      </td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pnl.position_type.startsWith('long') 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {pnl.position_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">{pnl.quantity}</td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">₹{pnl.entry_premium.toFixed(2)}</td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">₹{pnl.exit_premium.toFixed(2)}</td>
                      <td className={`py-2 px-4 text-center font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>₹{pnl.pnl.toFixed(2)}</td>
                      <td className={`py-2 px-4 text-center font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{pnl.pnl_percent >= 0 ? '+' : ''}{pnl.pnl_percent.toFixed(2)}%</td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pnl.exit_type === 'manual' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {pnl.exit_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center text-gray-900 dark:text-white">
                        {pnl.exit_date ? new Date(pnl.exit_date).toLocaleDateString() : ''}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {optionPnlHistory.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-400">No PnL history yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Exit some option positions to see your PnL history here</p>
              </div>
            )}
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
                
                // Find the holding to get option details
                const holding = optionHoldingsWithDetails.find(h => h.id === exitQtyPrompt.holdingId);
                if (holding) {
                  const optionDetails = holding.contractName;
                  const exitValue = holding.currentPremium * qty;
                  notifyOptionExit(optionDetails, qty, holding.currentPremium, exitValue);
                  
                  // Calculate and notify PnL
                  const pnl = (holding.currentPremium - holding.weightedAvgPremium) * qty * (holding.type.startsWith('long') ? 1 : -1);
                  const isProfit = pnl > 0;
                  notifyOptionPnL(optionDetails, pnl, isProfit);
                }
                
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
      
      {/* Trading Notifications */}
      <TradingNotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
};