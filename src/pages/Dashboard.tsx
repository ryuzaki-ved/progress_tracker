import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, ChevronDown, ChevronRight, Award, BookOpen, Plus, BarChart3, Calendar, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Sparkline } from '../components/ui/Sparkline';
import { StreakCounter } from '../components/ui/StreakCounter';
import { AchievementBadge } from '../components/ui/AchievementBadge';
import { SmartFeedback } from '../components/ui/SmartFeedback';
import { AlertCard } from '../components/ui/AlertCard';
import { AchievementUnlockModal } from '../components/ui/AchievementUnlockModal';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useIndex } from '../hooks/useIndex';
import { useStreaks } from '../hooks/useStreaks';
import { useAchievements } from '../hooks/useAchievements';
import { useAlerts } from '../hooks/useAlerts';
import { useJournal } from '../hooks/useJournal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getDb, persistDb } from '../lib/sqlite';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { indexData, loading: indexLoading, refetch } = useIndex();
  const { streaks, loading: streaksLoading } = useStreaks();
  const { achievements, newlyUnlocked } = useAchievements();
  const { alerts, markAsRead, dismissAlert } = useAlerts();
  const { isDark } = useTheme();
  const { entries: journalEntries, getEntryByDate } = useJournal();
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [defaultStartDate, setDefaultStartDate] = useState<Date | null>(null);
  const [useDefaultStartDate, setUseDefaultStartDate] = useState(false);

  // Load default start date preference from localStorage
  useEffect(() => {
    const savedDefaultStart = localStorage.getItem('dashboardDefaultStartDate');
    const savedUseDefault = localStorage.getItem('dashboardUseDefaultStartDate');
    
    if (savedDefaultStart) {
      setDefaultStartDate(new Date(savedDefaultStart));
    }
    if (savedUseDefault === 'true') {
      setUseDefaultStartDate(true);
    }
  }, []);

  // Apply default start date when data loads and no custom range is set
  useEffect(() => {
    if (useDefaultStartDate && defaultStartDate && !dateRange && indexData?.history) {
      const end = new Date();
      setDateRange({ start: defaultStartDate, end });
    }
  }, [useDefaultStartDate, defaultStartDate, dateRange, indexData]);

  // Save preferences to localStorage
  const saveDefaultStartDate = (date: Date | null, useDefault: boolean) => {
    if (date) {
      localStorage.setItem('dashboardDefaultStartDate', date.toISOString());
    } else {
      localStorage.removeItem('dashboardDefaultStartDate');
    }
    localStorage.setItem('dashboardUseDefaultStartDate', useDefault.toString());
  };

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowAchievementModal(true);
    }
  }, [newlyUnlocked]);

  // Listen for day change and refetch index data
  useEffect(() => {
    let lastDate = new Date().toISOString().split('T')[0];
    const interval = setInterval(() => {
      const todayString = new Date().toISOString().split('T')[0];
      if (todayString !== lastDate) {
        lastDate = todayString;
        refetch();
      }
    }, 10000); // check every 10 seconds
    return () => clearInterval(interval);
  }, [refetch]);

  const handleClearAllAlerts = async () => {
    for (const alert of alerts) {
      await dismissAlert(alert.id);
    }
  };

  // Check if user has no stocks (first-time user) - show this even if other data is loading
  if (stocks.length === 0 && !stocksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <BarChart3 className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Welcome to Your Life Portfolio!
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed"
          >
            To get started, you'll need to add some "stocks" - these represent different areas of your life that you want to track and improve. Think of them as categories like Health, Career, Relationships, etc.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What you'll be able to do:</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Track performance across different life areas</li>
                <li>• View trends and insights with charts</li>
                <li>• Set goals and monitor progress</li>
                <li>• Get personalized recommendations</li>
              </ul>
            </div>
            
            <motion.a
              href="/stocks"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Stock
            </motion.a>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show loading only when stocks are still loading
  if (stocksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading for other data only if we have stocks but other data is still loading
  if (tasksLoading || indexLoading || streaksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading additional data...</p>
        </div>
      </div>
    );
  }

  if (!indexData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const topPerformers = stocks
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);
  
  const worstPerformers = stocks
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);
  
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedToday = tasks.filter(task => 
    task.status === 'completed' && 
    task.completedAt && 
    task.completedAt.toDateString() === new Date().toDateString()
  ).length;

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const activeStreaks = streaks.filter(s => s.isActive);

  // Check if user has journaled today
  const todayEntry = getEntryByDate(new Date(), 'daily');
  const hasJournaledToday = !!todayEntry;

  // Filter chart data based on date range
  const getFilteredChartData = () => {
    if (!indexData?.history) return [];
    
    if (!dateRange) {
      return indexData.history;
    }
    
    return indexData.history.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  };

  const filteredChartData = getFilteredChartData();

  // Calculate min/max for dynamic Y-axis based on filtered data
  const indexHistoryValues = filteredChartData.map(h => h.value);
  const minY = Math.min(...indexHistoryValues);
  const maxY = Math.max(...indexHistoryValues);
  const yMargin = Math.max(10, Math.round((maxY - minY) * 0.1));

  const handleDateRangeSelect = (start: Date, end: Date) => {
    setDateRange({ start, end });
    setShowDatePicker(false);
  };

  const clearDateRange = () => {
    setDateRange(null);
  };

  const getDateRangeDisplay = () => {
    if (!dateRange) return 'All Time';
    return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
  };

  const handleSetDefaultStartDate = (date: Date) => {
    setDefaultStartDate(date);
    setUseDefaultStartDate(true);
    saveDefaultStartDate(date, true);
    
    // Apply the new default immediately
    const end = new Date();
    setDateRange({ start: date, end });
  };

  const handleToggleDefaultStartDate = (useDefault: boolean) => {
    setUseDefaultStartDate(useDefault);
    saveDefaultStartDate(defaultStartDate, useDefault);
    
    if (useDefault && defaultStartDate) {
      const end = new Date();
      setDateRange({ start: defaultStartDate, end });
    } else if (!useDefault) {
      setDateRange(null);
    }
  };

  const handleClearDefaultStartDate = () => {
    setDefaultStartDate(null);
    setUseDefaultStartDate(false);
    saveDefaultStartDate(null, false);
    setDateRange(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-100 to-zinc-200 dark:from-gray-900 dark:via-slate-800 dark:to-zinc-900 p-6 space-y-6">
      {/* Header Section with Enhanced Design */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-zinc-500/5 dark:from-slate-400/10 dark:to-zinc-400/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-slate-700 to-zinc-800 dark:from-white dark:via-slate-200 dark:to-zinc-200 bg-clip-text text-transparent"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Track your life performance like a stock portfolio
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-right bg-gray-50/80 dark:bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Date</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Index Overview with Enhanced Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800 p-6 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
        
                  <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                    📈
                  </div>
                  Life Performance Index
                </h2>
                <p className="text-gray-200 text-sm">Your overall productivity score</p>
              </div>
            <div className="flex items-center space-x-6">
              {/* Date Range Selector with Enhanced Design */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center space-x-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{getDateRangeDisplay()}</span>
                  {dateRange && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateRange();
                      }}
                      className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 min-w-80"
                >
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Select Date Range</h4>
                    
                    {/* Default Start Date Section */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Start Date</h5>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={useDefaultStartDate}
                            onChange={(e) => handleToggleDefaultStartDate(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Use as default</span>
                        </label>
                      </div>
                      
                      {useDefaultStartDate && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={defaultStartDate ? defaultStartDate.toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                handleSetDefaultStartDate(date);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button
                              onClick={handleClearDefaultStartDate}
                              className="px-2 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                              title="Clear default start date"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {defaultStartDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Chart will always start from {defaultStartDate.toLocaleDateString()} when you open the dashboard
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Range Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Ranges</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 7);
                            handleDateRangeSelect(start, end);
                          }}
                          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 30);
                            handleDateRangeSelect(start, end);
                          }}
                          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setMonth(start.getMonth() - 3);
                            handleDateRangeSelect(start, end);
                          }}
                          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setFullYear(start.getFullYear() - 1);
                            handleDateRangeSelect(start, end);
                          }}
                          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Last Year
                        </button>
                      </div>
                    </div>
                    
                    {/* Custom Date Inputs */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Range</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onChange={(e) => {
                              const start = new Date(e.target.value);
                              const end = dateRange?.end || new Date();
                              if (start <= end) {
                                handleDateRangeSelect(start, end);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onChange={(e) => {
                              const end = new Date(e.target.value);
                              const start = dateRange?.start || new Date();
                              if (start <= end) {
                                handleDateRangeSelect(start, end);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          clearDateRange();
                          setShowDatePicker(false);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Clear Range
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
              <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-2xl font-bold text-white">{indexData.value.toFixed(1)}</div>
                <div className={`flex items-center text-sm ${indexData.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {indexData.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  <span className="font-semibold">{indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(1)}</span>
                  <span className="ml-1">({indexData.changePercent >= 0 ? '+' : ''}{indexData.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-80 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                  stroke="rgba(255,255,255,0.8)" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.8)" 
                  domain={[minY - yMargin, maxY + yMargin]} 
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value}`, 'Index Value']}
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="rgba(255,255,255,0.9)" 
                  strokeWidth={4}
                  dot={{ fill: 'rgba(255,255,255,0.9)', strokeWidth: 3, r: 6 }}
                  activeDot={{ r: 8, stroke: 'rgba(255,255,255,0.9)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔔 Alerts & Notifications</h3>
            <Button variant="outline" size="sm" onClick={handleClearAllAlerts}>Clear All</Button>
          </div>
          {alerts.slice(0, 3).map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}

      {/* Smart Feedback */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">💡 Smart Insights</h3>
        <SmartFeedback />
        
        {/* Journal Prompt */}
        {!hasJournaledToday && (
          <Card hover className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    Take a moment to reflect
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    How has your day been so far? A quick journal entry can help track your progress.
                  </p>
                </div>
              </div>
              <motion.a
                href="/retrospective"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Journal
              </motion.a>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Stats with Enhanced Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-4 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-medium">Completed Today</p>
              <p className="text-2xl font-bold text-white">{completedToday}</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 font-medium">Pending Tasks</p>
              <p className="text-2xl font-bold text-white">{pendingTasks}</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-4 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-100 font-medium">Achievements</p>
              <p className="text-2xl font-bold text-white">{unlockedAchievements.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-100 font-medium">Active Streaks</p>
              <p className="text-2xl font-bold text-white">{activeStreaks.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Streaks & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streaks */}
        <Card hover>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🔥 Current Streaks
          </h3>
          <div className="space-y-4">
            {streaks.map(streak => (
              <div key={streak.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <StreakCounter streak={streak} size="md" />
                {streak.currentStreak > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-orange-500"
                  >
                    🔥
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Achievements */}
        <Card hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              🏆 Achievements
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {achievements.slice(0, 8).map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="sm"
                showProgress={!achievement.isUnlocked}
              />
            ))}
          </div>
          {achievements.length > 8 && (
            <div className="text-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{achievements.length - 8} more achievements
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Top & Bottom Performers with Enhanced Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-4 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                🏆
              </div>
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map((stock, index) => (
                <motion.div
                  key={stock.id}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg cursor-pointer border border-white/15"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2, scale: 1.01, boxShadow: '0 4px 16px 0 rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{stock.name}</div>
                      <div className="text-xs text-emerald-100">{stock.currentScore} pts</div>
                    </div>
                    {streaks.filter(s => s.isActive).length > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-yellow-300 text-lg"
                      >
                        🔥
                      </motion.span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-200 font-bold text-sm">+{stock.changePercent.toFixed(2)}%</div>
                    <div className="w-16 h-8 mt-1">
                      <Sparkline data={stock.history} color="rgba(255,255,255,0.8)" height={32} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-500 to-red-600 p-4 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                ⚠️
              </div>
              Needs Attention
            </h3>
            <div className="space-y-3">
              {worstPerformers.map((stock, index) => (
                <motion.div
                  key={stock.id}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg cursor-pointer border border-white/15"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2, scale: 1.01, boxShadow: '0 4px 16px 0 rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{stock.name}</div>
                      <div className="text-xs text-rose-100">{stock.currentScore} pts</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-200 font-bold text-sm">{stock.changePercent.toFixed(2)}%</div>
                    <div className="w-16 h-8 mt-1">
                      <Sparkline data={stock.history} color="rgba(255,255,255,0.8)" height={32} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievement Unlock Modal */}
      {showAchievementModal && (
        <AchievementUnlockModal
          achievements={newlyUnlocked}
          onClose={() => setShowAchievementModal(false)}
        />
      )}
    </div>
  );
};