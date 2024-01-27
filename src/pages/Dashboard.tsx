import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, ChevronDown, ChevronRight, Award, BookOpen } from 'lucide-react';
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

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowAchievementModal(true);
    }
  }, [newlyUnlocked]);

  const handleClearAllAlerts = async () => {
    for (const alert of alerts) {
      await dismissAlert(alert.id);
    }
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

  // Check if user has journaled today
  const todayEntry = getEntryByDate(new Date(), 'daily');
  const hasJournaledToday = !!todayEntry;

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
      <Card hover className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover className="bg-green-50 border-green-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
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
        
        <Card hover className="bg-blue-50 border-blue-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
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
        
        <Card hover className="bg-purple-50 border-purple-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
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
        
        <Card hover className="bg-orange-50 border-orange-200 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
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

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.map((stock, index) => (
              <motion.div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px 0 rgba(16,185,129,0.10)' }}
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
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 rounded-lg cursor-pointer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px 0 rgba(239,68,68,0.10)' }}
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