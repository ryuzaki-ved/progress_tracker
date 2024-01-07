import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, ChevronDown, ChevronRight, Award } from 'lucide-react';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getDb, persistDb } from '../lib/sqlite';

export const Dashboard: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { indexData, loading: indexLoading, refetch } = useIndex();
  const { streaks, loading: streaksLoading } = useStreaks();
  const { achievements, newlyUnlocked } = useAchievements();
  const { alerts, markAsRead, dismissAlert } = useAlerts();
  const { isDark } = useTheme();
  const [missingDays, setMissingDays] = useState<string[]>([]);
  const [manualValues, setManualValues] = useState<Record<string, number>>({});
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [editMode, setEditMode] = useState(false);
  const [editExpanded, setEditExpanded] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  useEffect(() => {
    if (indexData && indexData.history) {
      // Find missing days in the last 7 days
      const days = [];
      const today = new Date();
      const historyDates = indexData.history.map(h => h.date.toISOString().split('T')[0]);
      for (let i = 6; i >= 1; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().split('T')[0];
        if (!historyDates.includes(ds)) days.push(ds);
      }
      setMissingDays(days);
    }
  }, [indexData]);

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowAchievementModal(true);
    }
  }, [newlyUnlocked]);

  // Build last 7 days with values
  const last7Days = React.useMemo(() => {
    if (!indexData || !indexData.history) return [];
    const today = new Date();
    const days: { date: string, value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const found = indexData.history.find(h => h.date.toISOString().split('T')[0] === ds);
      days.push({ date: ds, value: found ? found.value : 500 });
    }
    return days;
  }, [indexData]);

  const handleManualValueChange = (date: string, value: number) => {
    setManualValues(v => ({ ...v, [date]: value }));
  };

  const handleAssignValues = async () => {
    const db = await getDb();
    for (const date of missingDays) {
      const value = manualValues[date] ?? 500;
      db.run(
        `INSERT INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, 0, 0, datetime('now'))`,
        [1, date, value]
      );
    }
    await persistDb();
    setManualValues({});
    setMissingDays([]);
    refetch();
  };

  const handleEditValueChange = (date: string, value: number) => {
    setEditValues(v => ({ ...v, [date]: value }));
  };

  const handleSaveEdits = async () => {
    const db = await getDb();
    for (const { date } of last7Days) {
      if (editValues[date] !== undefined) {
        db.run(
          `UPDATE index_history SET index_value = ? WHERE user_id = ? AND date = ?`,
          [editValues[date], 1, date]
        );
      }
    }
    await persistDb();
    setEditMode(false);
    setEditValues({});
    refetch();
  };

  if (stocksLoading || tasksLoading || indexLoading || streaksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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

  // Calculate min/max for dynamic Y-axis
  const indexHistoryValues = indexData.history.map(h => h.value);
  const minY = Math.min(...indexHistoryValues);
  const maxY = Math.max(...indexHistoryValues);
  const yMargin = Math.max(10, Math.round((maxY - minY) * 0.1));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your life performance like a stock portfolio</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Today's Date</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Index Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Life Performance Index</h2>
            <p className="text-gray-600 dark:text-gray-300">Your overall productivity score</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{indexData.value.toFixed(1)}</div>
            <div className={`flex items-center ${indexData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {indexData.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="font-semibold">{indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(1)}</span>
              <span className="ml-1">({indexData.changePercent >= 0 ? '+' : ''}{indexData.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indexData.history}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#CBD5E1'} />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke={isDark ? '#CBD5E1' : '#334155'} />
              <YAxis stroke={isDark ? '#CBD5E1' : '#334155'} domain={[minY - yMargin, maxY + yMargin]} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`${value}`, 'Index Value']}
                contentStyle={{ background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#334155' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {missingDays.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Assign Index Value for Missing Days</h3>
          <div className="space-y-2">
            {missingDays.map(date => (
              <div key={date} className="flex items-center space-x-4">
                <span className="w-32 text-gray-800">{new Date(date).toLocaleDateString()}</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={manualValues[date] ?? 500}
                  onChange={e => handleManualValueChange(date, Number(e.target.value))}
                  min={0}
                  max={2000}
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            onClick={handleAssignValues}
          >
            Assign Values
          </button>
        </Card>
      )}

      {last7Days.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setEditExpanded(v => !v)}>
            <div className="flex items-center">
              {editExpanded ? <ChevronDown className="w-5 h-5 mr-2 text-blue-700" /> : <ChevronRight className="w-5 h-5 mr-2 text-blue-700" />}
              <h3 className="text-lg font-semibold text-blue-900">Edit Index Values (Last 7 Days)</h3>
            </div>
            {!editMode ? (
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={e => { e.stopPropagation(); setEditMode(true); setEditExpanded(true); }}>
                Edit
              </button>
            ) : (
              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={e => { e.stopPropagation(); handleSaveEdits(); }}>
                Save Changes
              </button>
            )}
          </div>
          {editExpanded && (
            <div className="space-y-2 mt-2">
              {last7Days.map(({ date, value }) => (
                <div key={date} className="flex items-center space-x-4">
                  <span className="w-32 text-gray-800">{new Date(date).toLocaleDateString()}</span>
                  {editMode ? (
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-32"
                      value={editValues[date] !== undefined ? editValues[date] : value}
                      onChange={e => handleEditValueChange(date, Number(e.target.value))}
                      min={0}
                      max={2000}
                    />
                  ) : (
                    <span className="w-32 text-gray-900 font-semibold">{value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔔 Alerts & Notifications</h3>
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completed Today</p>
              <p className="text-2xl font-bold text-green-900">{completedToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Pending Tasks</p>
              <p className="text-2xl font-bold text-blue-900">{pendingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Achievements</p>
              <p className="text-2xl font-bold text-purple-900">{unlockedAchievements.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Active Streaks</p>
              <p className="text-2xl font-bold text-orange-900">{activeStreaks.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Streaks & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streaks */}
        <Card>
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
        <Card>
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

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.map((stock, index) => (
              <motion.div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                    <div className="text-sm font-semibold text-green-900 dark:text-green-200">{stock.currentScore} pts</div>
                  </div>
                  {/* Add streak indicator for top performers */}
                  <div className="flex items-center space-x-2">
                    {streaks.filter(s => s.isActive).length > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-orange-500"
                      >
                        🔥
                      </motion.span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-semibold">+{stock.changePercent.toFixed(2)}%</div>
                  <div className="w-16 h-8">
                    <Sparkline data={stock.history} color="#10B981" height={32} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Needs Attention</h3>
          <div className="space-y-3">
            {worstPerformers.map((stock, index) => (
              <motion.div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 rounded-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                    <div className="text-sm font-semibold text-red-900 dark:text-red-200">{stock.currentScore} pts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-600 font-semibold">{stock.changePercent.toFixed(2)}%</div>
                  <div className="w-16 h-8">
                    <Sparkline data={stock.history} color="#EF4444" height={32} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

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