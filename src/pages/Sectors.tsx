import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp, TrendingDown, Star, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useStocks } from '../hooks/useStocks';
import { useIndex } from '../hooks/useIndex';
import { IndexCandlestickChart } from '../components/dashboard/IndexCandlestickChart';

export const Sectors: React.FC = () => {
  const { stocks, loading } = useStocks();
  const { indexData } = useIndex();
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
    
    // Process only active (non-archived) stocks for relevant grouping
    const activeStocks = stocks.filter(s => !s.isArchived);

    const result: Record<string, { 
      ohlc: any[], 
      currentScore: number, 
      change: number, 
      changePercent: number,
      memberStocks: any[],
      mvp: any | null,
      isOutperforming: boolean
    }> = {};

    sectors.forEach(sector => {
      const sectorStocks = activeStocks.filter(s => s.category === sector);
      if (sectorStocks.length === 0) return;

      const totalWeight = sectorStocks.reduce((sum, s) => sum + (s.weight || 1), 0);
      
      // Calculate daily weighted average scores
      const ohlc: { date: string; open: number; high: number; low: number; close: number }[] = [];
      let lastKnownValue = 500;
      const today = new Date();

      // Process last 30 days
      for (let i = 29; i >= 0; i--) {
        const currentDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find history for all stocks in this sector on this date
        const dailyRecords = history.filter(h => 
          sectorStocks.some(s => s.id === h.stock_id.toString()) && h.date === dateStr
        );

        if (dailyRecords.length > 0) {
          // Weighted average: Sum(Score * Weight) / Sum(Weight)
          let weightedSum = 0;
          let weightCount = 0;
          
          sectorStocks.forEach(stock => {
            const record = dailyRecords.find(r => r.stock_id.toString() === stock.id);
            const score = record ? record.daily_score : stock.currentScore; // Fallback to current if missing
            weightedSum += score * (stock.weight || 1);
            weightCount += (stock.weight || 1);
          });

          const close = weightCount > 0 ? weightedSum / weightCount : lastKnownValue;
          const open = lastKnownValue;
          const high = Math.max(open, close) + 0.1;
          const low = Math.min(open, close) - 0.1;

          ohlc.push({ date: dateStr, open, high, low, close });
          lastKnownValue = close;
        } else {
          ohlc.push({
            date: dateStr,
            open: lastKnownValue,
            high: lastKnownValue,
            low: lastKnownValue,
            close: lastKnownValue,
          });
        }
      }

      ohlc.sort((a, b) => a.date.localeCompare(b.date));

      const currentScore = ohlc.length > 0 ? ohlc[ohlc.length - 1].close : 500;
      const prevScore = ohlc.length > 1 ? ohlc[ohlc.length - 2].close : currentScore;
      const change = currentScore - prevScore;
      const changePercent = prevScore !== 0 ? (change / prevScore) * 100 : 0;

      // Identify MVP (Top individual gainer in this sector TODAY)
      const mvp = sectorStocks.reduce((best, s) => {
        if (!best) return s;
        return (s.changePercent > best.changePercent) ? s : best;
      }, null as any);

      // Benchmark Comparison (Compare sector daily change vs overall index daily change)
      const benchmarkChange = indexData?.changePercent ?? 0;
      const isOutperforming = changePercent > benchmarkChange;

      result[sector] = {
        ohlc,
        currentScore,
        change,
        changePercent,
        memberStocks: sectorStocks,
        mvp,
        isOutperforming
      };
    });

    return result;
  }, [stocks, history, indexData]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sectorsObj.length > 0 ? sectorsObj.map(([sectorName, data], index) => (
          <motion.div
            key={sectorName}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card hover className="h-full relative overflow-hidden bg-[#1a1c23] border border-white/10 group">
              {/* Animated accent reflection */}
              <div className="absolute -inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(400px_at_50%_0%,rgba(139,92,246,0.15),transparent)]"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header with Benchmark Comparison */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300">
                      <Layers className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{sectorName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center ${
                          data.isOutperforming ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {data.isOutperforming ? (
                            <><ArrowUpRight className="w-3 h-3 mr-1" /> Outperforming Index</>
                          ) : (
                            <><ArrowDownRight className="w-3 h-3 mr-1" /> Underperforming Index</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-white font-mono tracking-tighter">
                      {data.currentScore.toFixed(2)}
                    </div>
                    <div className={`flex items-center justify-end text-sm font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}
                      <span className="ml-1 text-[10px] opacity-70">({data.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Main Performance Chart */}
                <div className="relative mb-6 rounded-2xl overflow-hidden bg-black/40 border border-white/5 p-4 shadow-inner">
                  <IndexCandlestickChart data={data.ohlc} height={220} />
                </div>

                {/* Stock Membership Chips */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">
                    <span>Member Stocks</span>
                    <span>{data.memberStocks.length} Assets</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.memberStocks.map(s => (
                      <div key={s.id} className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors cursor-default">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.change >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Insight Section (MVP) */}
                {data.mvp && (
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                      </div>
                      <span className="text-xs font-medium text-gray-400">Sector MVP:</span>
                      <span className="text-xs font-bold text-white tracking-wide">{data.mvp.name}</span>
                    </div>
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md">
                      +{data.mvp.changePercent.toFixed(1)}% Today
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Info className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No sector performance data available yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Complete your first task to start tracking category performance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

