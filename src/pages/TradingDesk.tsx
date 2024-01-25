import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStocks } from '../hooks/useStocks';
import { useTrading } from '../hooks/useTrading';

interface Holding {
  stockId: string;
  stockName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  category: string;
  color: string;
}

interface MarketPrice {
  stockId: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export const TradingDesk: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const {
    cashBalance,
    holdings,
    transactions,
    loading: tradingLoading,
    error,
    success,
    buyStock,
    sellStock,
    initialize,
    fetchPortfolio,
    fetchTransactions,
  } = useTrading();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPnL, setShowPnL] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedStockId, setSelectedStockId] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(0);
  const [priceType, setPriceType] = useState('market');

  // Map holdings to UI shape, join with stocks
  const uiHoldings = holdings.map(h => {
    const stock = stocks.find(s => s.id === String(h.stock_id));
    const currentPrice = stock ? stock.currentScore * 0.1 : 0;
    const unrealizedPnL = (currentPrice - h.avg_buy_price) * h.quantity;
    const unrealizedPnLPercent = h.avg_buy_price > 0 ? ((currentPrice - h.avg_buy_price) / h.avg_buy_price) * 100 : 0;
    return {
      stockId: String(h.stock_id),
      stockName: stock?.name || '',
      quantity: h.quantity,
      avgBuyPrice: h.avg_buy_price,
      currentPrice,
      unrealizedPnL,
      unrealizedPnLPercent,
      category: stock?.category || '',
      color: stock?.color || '',
    };
  });

  // Price refresh: just update lastRefresh (prices are derived from stocks)
  const refreshMarketPrices = async () => {
    setIsRefreshing(true);
    await fetchPortfolio();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, []);

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

  // Calculate portfolio totals
  const totalInvestment = uiHoldings.reduce((sum, h) => sum + (h.avgBuyPrice * h.quantity), 0);
  const currentValue = uiHoldings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
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
  const selectedStock = stocks.find(s => s.id === selectedStockId);
  const selectedHolding = uiHoldings.find(h => h.stockId === selectedStockId);
  const currentPrice = selectedStock ? selectedStock.currentScore * 0.1 : 0;

  // Calculate order costs
  const estimatedCost = quantity * currentPrice;
  const brokerage = estimatedCost > 0 ? Math.max(20, estimatedCost * 0.0003) : 0; // ₹20 or 0.03% whichever is higher
  const totalCost = estimatedCost + brokerage;

  // Place order handler
  const handlePlaceOrder = async () => {
    if (!selectedStockId || quantity <= 0) return;
    if (orderType === 'buy') {
      await buyStock(Number(selectedStockId), quantity, currentPrice);
    } else {
      await sellStock(Number(selectedStockId), quantity, currentPrice);
    }
    setQuantity(0);
    fetchPortfolio();
    fetchTransactions();
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
              {showPnL ? formatCurrency(totalPnL) : '••••••'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cashBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {uiHoldings.length}
            </div>
            <div className="text-sm text-blue-700">Holdings</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInvestment)}
            </div>
            <div className="text-sm text-green-700">Invested</div>
          </div>
        </Card>
        
        <Card className={`bg-gradient-to-r ${totalPnL >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-pink-50 border-red-200'}`}>
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {showPnL ? formatPercent(totalPnLPercent) : '••••'}
            </div>
            <div className={`text-sm ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Total Return
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {uiHoldings.filter(h => h.unrealizedPnL > 0).length}
            </div>
            <div className="text-sm text-purple-700">Gainers</div>
          </div>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Stock Holdings */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                My Holdings
              </h2>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPnL(!showPnL)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showPnL ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMarketPrices}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stock</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">LTP</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">P&L</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uiHoldings.map((holding, index) => {
                    const marketPrice = stocks.find(s => s.id === holding.stockId);
                    const isGainer = holding.unrealizedPnL >= 0;
                    
                    return (
                      <motion.tr
                        key={holding.stockId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                          ₹{holding.avgBuyPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ₹{holding.currentPrice.toFixed(2)}
                          </div>
                          {marketPrice && (
                            <div className={`text-sm flex items-center justify-end ${
                              marketPrice.currentScore * 0.1 >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {marketPrice.currentScore * 0.1 >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {formatPercent(marketPrice.currentScore * 0.1)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className={`font-medium ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
                            {showPnL ? formatCurrency(holding.unrealizedPnL) : '••••••'}
                          </div>
                          <div className={`text-sm ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
                            {showPnL ? formatPercent(holding.unrealizedPnLPercent) : '••••'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex space-x-2 justify-end">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                              Buy
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                              Sell
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {uiHoldings.length === 0 && (
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
        </div>

        {/* Right Section - Trade Form */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Place Order
              </h2>
            </div>

            {/* Trade Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Stock
                </label>
                <select 
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a stock...</option>
                  {stocks.map(stock => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} - ₹{(stock.currentScore * 0.1).toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedHolding && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                      <span className="font-semibold text-blue-600">₹{currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">You own:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedHolding.quantity} shares</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Buy Price:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{selectedHolding.avgBuyPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setOrderType('buy')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderType === 'buy' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Buy
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderType('sell')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderType === 'sell' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  min="1"
                  max={orderType === 'sell' ? selectedHolding?.quantity : undefined}
                  placeholder="Number of shares"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {orderType === 'sell' && selectedHolding && quantity > selectedHolding.quantity && (
                  <div className="mt-1 text-sm text-red-600">
                    You only own {selectedHolding.quantity} shares
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Type
                </label>
                <select 
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                  <option value="stop">Stop Order</option>
                </select>
              </div>

              <div className={`rounded-lg p-4 ${
                estimatedCost > 0 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Price per share:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedStockId ? `₹${currentPrice.toFixed(2)}` : '₹0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quantity || 0} shares</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Cost:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{estimatedCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Brokerage:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{brokerage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className={`${orderType === 'buy' ? 'text-red-600' : 'text-green-600'}`}>
                    {orderType === 'buy' ? '-' : '+'}₹{totalCost.toFixed(2)}
                  </span>
                </div>
                {estimatedCost > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {orderType === 'buy' 
                        ? `You will ${orderType} ${quantity} shares of ${selectedHolding?.stockName} for ₹${totalCost.toFixed(2)}`
                        : `You will ${orderType} ${quantity} shares of ${selectedHolding?.stockName} for ₹${(estimatedCost - brokerage).toFixed(2)} (after brokerage)`
                      }
                    </div>
                  </div>
                )}
              </div>

              <Button 
                className={`w-full text-white ${
                  orderType === 'buy' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={
                  !selectedStockId ||
                  quantity <= 0 ||
                  (orderType === 'sell' && (!selectedHolding || quantity > selectedHolding.quantity)) ||
                  tradingLoading ||
                  error ||
                  (orderType === 'buy' && totalCost > cashBalance)
                }
                onClick={handlePlaceOrder}
              >
                {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
              </Button>
              {orderType === 'buy' && totalCost > cashBalance && (
                <div className="text-red-600 text-sm mb-2">Insufficient funds for this order.</div>
              )}
              {orderType === 'sell' && selectedHolding && quantity > selectedHolding.quantity && (
                <div className="text-red-600 text-sm mb-2">You only own {selectedHolding.quantity} shares.</div>
              )}
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              {success && <div className="text-green-600 text-sm mb-2">{success}</div>}

            </div>
          </Card>

          {/* Market Summary */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Market Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Market Status:</span>
                <span className="text-green-600 font-medium">Open</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Holdings:</span>
                <span className="font-medium text-gray-900 dark:text-white">{uiHoldings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gainers:</span>
                <span className="font-medium text-green-600">
                  {uiHoldings.filter(h => h.unrealizedPnL > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Losers:</span>
                <span className="font-medium text-red-600">
                  {uiHoldings.filter(h => h.unrealizedPnL < 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Portfolio Return:</span>
                <span className={`font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showPnL ? formatPercent(totalPnLPercent) : '••••'}
                </span>
              </div>
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h3>
            <div className="space-y-2">
              {uiHoldings
                .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
                .slice(0, 3)
                .map((holding, index) => (
                  <div key={holding.stockId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${holding.color} rounded`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {holding.stockName}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {showPnL ? formatPercent(holding.unrealizedPnLPercent) : '••••'}
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>
            <div className="overflow-x-auto max-h-64">
              {transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No transactions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Stock</th><th>Qty</th><th>Price</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const stock = stocks.find(s => s.id === String(tx.stock_id));
                      return (
                        <tr key={tx.id}>
                          <td>{new Date(tx.transaction_date).toLocaleString()}</td>
                          <td className={tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}>{tx.type}</td>
                          <td>{stock?.name || tx.stock_id}</td>
                          <td>{tx.quantity}</td>
                          <td>₹{tx.price.toFixed(2)}</td>
                          <td>₹{tx.total_amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};