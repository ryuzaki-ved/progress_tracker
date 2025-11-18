import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Activity, Trash2, Edit2, Archive, ListTodo, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StreakCounter } from '../components/ui/StreakCounter';
import { AddStockModal } from '../components/modals/AddStockModal';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useStreaks } from '../hooks/useStreaks';
import { getVolatilityColor } from '../utils/stockUtils';
import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid } from 'recharts';

export const Stocks: React.FC = () => {
  const { stocks, loading, createStock, deleteStock, updateStock, archiveStock } = useStocks();
  const { createTask } = useTasks();
  const { streaks } = useStreaks();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<Record<string, any[]>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  const activeStocks = stocks.filter(s => !s.isArchived);

  // Auto-select first stock on load
  useEffect(() => {
    if (activeStocks.length > 0 && !selectedStockId) {
      setSelectedStockId(activeStocks[0].id);
    }
  }, [activeStocks, selectedStockId]);

  // Fetch performance history for all stocks
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/stocks/history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
        });
        const result = await response.json();
        if (result.data) {
          const processed: Record<string, any[]> = {};
          result.data.forEach((row: any) => {
             if (!processed[row.stock_id]) processed[row.stock_id] = [];
             // Reverse so newest is at the end for the chart
             processed[row.stock_id].unshift(row);
          });
          setPerformanceHistory(processed);
        }
      } catch (err) {
        console.error('Failed to fetch stock history:', err);
      }
    }
    if (stocks.length > 0) fetchHistory();
  }, [stocks]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-display">Decrypting Stock Matrix...</p>
        </div>
      </div>
    );
  }

  const totalWeight = activeStocks.reduce((sum, s) => sum + (typeof s.weight === 'number' ? s.weight * 100 : 0), 0);
  const selectedStock = activeStocks.find(s => s.id === selectedStockId) || activeStocks[0];
  const historyRaw = selectedStock ? (performanceHistory[selectedStock.id] || []) : [];
  
  // Format history for Recharts (ensure numerical plotting)
  const chartData = historyRaw.map(h => ({
    date: h.date,
    score: h.daily_score,
    delta: h.score_delta
  }));

  const stockStreaks = streaks.filter(s => s.isActive); 

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] flex flex-col lg:overflow-hidden w-full">
      
      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 mt-1">Master view of your individual life component yields</p>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-5 py-2 flex flex-col items-center shadow-[0_0_15px_rgba(139,92,246,0.1)]">
             <div className="text-[10px] uppercase font-bold text-violet-300 tracking-wider">Active Alignment</div>
             <div className="text-xl font-bold font-display text-white">{totalWeight.toFixed(0)}%</div>
          </div>
          <Button onClick={() => setShowAddModal(true)} variant="primary" className="h-full rounded-2xl shadow-lg hidden sm:flex">
            <Plus className="w-5 h-5 mr-2" />
            Issue Stock
          </Button>
          {/* Mobile only + button */}
          <Button onClick={() => setShowAddModal(true)} variant="primary" className="h-full rounded-2xl shadow-lg sm:hidden px-3">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* MASTER-DETAIL SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 lg:overflow-hidden min-h-0">
        
        {/* LEFT PANE - TICKER LIST */}
        <div className="w-full lg:w-[380px] h-64 lg:h-full flex flex-col p-4 overflow-hidden border border-white/5 rounded-3xl bg-background/50 shadow-xl flex-shrink-0">
          <div className="px-2 pb-4 mb-2 border-b border-white/5 flex justify-between items-center text-sm font-semibold text-gray-400 uppercase tracking-wider">
            <span>Ticker</span>
            <span>Yield</span>
          </div>
          <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {activeStocks.map((stock) => {
              const isSelected = selectedStock?.id === stock.id;
              return (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStockId(stock.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between ${
                    isSelected 
                      ? 'bg-violet-500/10 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${stock.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                       <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-bold font-display text-sm tracking-wide ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {stock.name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">{stock.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold font-display text-lg tracking-tight ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {stock.currentScore}
                    </div>
                    <div className={`flex items-center justify-end text-[11px] font-bold ${stock.change >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                      {stock.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE - FOCUS PANEL */}
        <div className="flex-1 w-full lg:w-auto bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl flex flex-col lg:overflow-hidden min-w-0 min-h-0 relative">
          {selectedStock ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStock.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 lg:overflow-y-auto custom-scrollbar flex flex-col min-h-0 relative"
              >
                {/* FOCUS HEADER */}
                <div className="relative p-8 border-b border-white/5 overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                      <div className={`w-20 h-20 ${selectedStock.color} rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/50`}>
                         <Activity className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h2 className="text-4xl font-bold font-display text-white tracking-tight">{selectedStock.name}</h2>
                          <div className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest ${getVolatilityColor(selectedStock.volatility)}`}>
                            {selectedStock.volatility}
                          </div>
                        </div>
                        <div className="text-gray-400 font-medium">
                          {selectedStock.category} • Weight: {(selectedStock.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-5xl font-bold font-display text-white tracking-tighter shadow-sm">
                        {selectedStock.currentScore}
                      </div>
                      <div className={`flex items-center justify-end mt-2 font-bold ${selectedStock.change >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                        {selectedStock.change >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                        <span className="text-lg">{selectedStock.change >= 0 ? '+' : ''}{selectedStock.change}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-8 flex items-center space-x-3">
                    <button 
                      onClick={() => setShowAddTaskModal(true)}
                      className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-violet-500/20"
                    >
                      <ListTodo className="w-4 h-4" />
                      <span>Log Task</span>
                    </button>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-white/10"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Configure</span>
                    </button>
                    <div className="flex-1" />
                    <button 
                      onClick={() => {
                        if (window.confirm(`Archive stock '${selectedStock.name}'? It will be hidden but its history will be kept for the Index.`)) {
                          archiveStock(selectedStock.id);
                        }
                      }}
                      className="flex items-center space-x-2 bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 text-gray-400 px-4 py-2.5 rounded-xl font-medium transition-colors border border-transparent hover:border-yellow-500/30"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`PERMANENTLY delete stock '${selectedStock.name}' and ALL its history? This will drop your index score.`)) {
                          deleteStock(selectedStock.id);
                        }
                      }}
                      className="flex items-center space-x-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 px-4 py-2.5 rounded-xl font-medium transition-colors border border-transparent hover:border-rose-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* GRAPH */}
                <div className="p-8 border-b border-white/5 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Yield Trajectory
                  </h3>
                  <div className="h-64 relative">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            itemStyle={{ color: '#8B5CF6', fontWeight: 'bold' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#8B5CF6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            style={{ filter: 'drop-shadow(0px 10px 10px rgba(139, 92, 246, 0.4))' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col">
                        <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                        <p>Insufficient trajectory data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM REGION: HISTORY & STREAKS */}
                <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 bg-black/20 flex-shrink-0 min-h-[400px]">
                  
                  {/* RECENT SETTLEMENTS */}
                  <div className="col-span-1 border border-white/5 rounded-2xl bg-white/5 p-4 overflow-hidden flex flex-col h-72">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Recent Settlements</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                       {historyRaw.slice(0, 15).map((h, i) => (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-xl transition-colors">
                           <div className="text-gray-300 text-sm font-medium">{h.date}</div>
                           <div className="flex items-center space-x-4">
                             <div className="text-white font-bold font-display">{h.daily_score}</div>
                             <div className={`w-12 text-right text-xs font-bold ${h.score_delta >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                               {h.score_delta >= 0 ? '+' : ''}{h.score_delta}
                             </div>
                           </div>
                         </div>
                       ))}
                       {historyRaw.length === 0 && (
                         <div className="text-gray-500 text-sm text-center mt-6">No historical records found.</div>
                       )}
                    </div>
                  </div>

                  {/* ACTIVE STREAKS */}
                  <div className="col-span-1 border border-white/5 rounded-2xl p-6 bg-gradient-to-b from-white/5 to-transparent h-72">
                     <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">Active Momentum</h3>
                     <div className="flex flex-wrap gap-3">
                       {stockStreaks.length > 0 ? stockStreaks.map(streak => (
                         <StreakCounter key={streak.id} streak={streak} size="md" />
                       )) : (
                         <div className="text-gray-500 text-sm w-full text-center mt-4">
                           Complete tasks consistently to build momentum and ignite daily streaks!
                         </div>
                       )}
                     </div>
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-0">
              Select an active component to inject into the focus panel
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
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
        }}
        onSubmit={async (data) => {
          if (selectedStock) {
            await updateStock(selectedStock.id, data);
            setShowEditModal(false);
          }
        }}
        currentTotalWeight={totalWeight}
        initialData={selectedStock || undefined}
        editMode
      />
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={createTask as any}
        stocks={activeStocks}
        defaultStockId={selectedStockId || undefined}
      />

    </div>
  );
};
