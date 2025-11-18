import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useStocks } from '../hooks/useStocks';
import { IndexCandlestickChart } from '../components/dashboard/IndexCandlestickChart';

export const Sectors: React.FC = () => {
  const { stocks, loading } = useStocks();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/stocks/history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
        });
        const result = await response.json();
        if (result.data) {
          setHistory(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch stock history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  // Process data into sectors
  const sectorData = useMemo(() => {
    if (stocks.length === 0 || history.length === 0) return {};

    // Group stocks by sector
    const sectors = Array.from(new Set(stocks.map(s => s.category).filter(Boolean)));
    
    // Map stock ID to sector (category)
    const stockToSector: Record<string, string> = {};
    stocks.forEach(s => stockToSector[s.id] = s.category);

    const result: Record<string, { ohlc: any[], currentScore: number, change: number, changePercent: number }> = {};

    sectors.forEach(sector => {
      // Find all history records for this sector
      const sectorHistory = history.filter(h => stockToSector[h.stock_id] === sector);
      
      // Group by date
      const byDate: Record<string, number> = {};
      sectorHistory.forEach(h => {
        if (!byDate[h.date]) byDate[h.date] = 0;
        byDate[h.date] += h.daily_score;
      });

      // Sort dates
      const sortedDates = Object.keys(byDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      const ohlc = [];
      let previousClose = 0;

      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const value = byDate[date];
        const open = i === 0 ? value : previousClose;
        const close = value;
        // Make sure there is a slight body for lightweight charts to render a flat candle visibly
        const high = Math.max(open, close) === close && open === close ? close + 0.1 : Math.max(open, close);
        const low = Math.min(open, close) === close && open === close ? close - 0.1 : Math.min(open, close);
        
        ohlc.push({ date, open, high, low, close });
        previousClose = close;
      }

      // Calculate current summary
      const currentScore = ohlc.length > 0 ? ohlc[ohlc.length - 1].close : 0;
      const prevScore = ohlc.length > 1 ? ohlc[ohlc.length - 2].close : currentScore;
      const change = currentScore - prevScore;
      const changePercent = prevScore !== 0 ? (change / prevScore) * 100 : 0;

      result[sector] = {
        ohlc,
        currentScore,
        change,
        changePercent
      };
    });

    return result;
  }, [stocks, history]);

  if (loading || loadingHistory) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sectors...</p>
        </div>
      </div>
    );
  }

  const sectorsObj = Object.entries(sectorData);

  return (
    <div className="p-6 space-y-6 relative z-0">
      <div className="flex items-center justify-between">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-glow font-display">Sectors Overview</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor aggregated performance across life categories</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sectorsObj.length > 0 ? sectorsObj.map(([sectorName, data], index) => (
          <motion.div
            key={sectorName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="h-full relative overflow-hidden bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
              
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white shadow-neon-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white tracking-wide">{sectorName}</h3>
                    <p className="text-sm text-gray-300">Combined Category Score</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <div>
                    <div className="text-2xl font-bold text-white text-glow">{data.currentScore.toFixed(1)}</div>
                    <div className="text-sm text-gray-300">Total Score</div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      <span className="font-semibold">{data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}</span>
                    </div>
                    <div className={`text-sm ${data.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'} opacity-90`}>
                      {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="h-64 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/20 shadow-inner">
                  <IndexCandlestickChart data={data.ohlc} height={230} />
                </div>
              </div>
            </Card>
          </motion.div>
        )) : (
          <div className="col-span-full flex justify-center py-10 text-gray-500">
            No sectors or stock history to display yet.
          </div>
        )}
      </div>
    </div>
  );
};

