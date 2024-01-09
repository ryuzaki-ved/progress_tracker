import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, PieChart, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AchievementBadge } from '../components/ui/AchievementBadge';
import { StreakCounter } from '../components/ui/StreakCounter';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useIndex } from '../hooks/useIndex';
import { useAchievements } from '../hooks/useAchievements';
import { useStreaks } from '../hooks/useStreaks';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { addDays, format, isSameDay, subDays } from 'date-fns';

export const Analytics: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { indexData, loading: indexLoading } = useIndex();
  const { achievements } = useAchievements();
  const { streaks } = useStreaks();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedStock, setSelectedStock] = useState('all');
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [editMode, setEditMode] = useState(false);
  const [editExpanded, setEditExpanded] = useState(false);

  if (stocksLoading || tasksLoading || indexLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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

  // Calculate stock performance data
  const stockPerformanceData = stocks.map(stock => ({
    name: stock.name,
    score: stock.currentScore,
    change: stock.changePercent,
    color: stock.color.replace('bg-', ''),
  }));

  // Calculate task completion rates
  const taskCompletionData = stocks.map(stock => {
    const stockTasks = tasks.filter(task => task.stockId === stock.id);
    const completedTasks = stockTasks.filter(task => task.status === 'completed');
    return {
      name: stock.name,
      completed: completedTasks.length,
      total: stockTasks.length,
      rate: stockTasks.length > 0 ? (completedTasks.length / stockTasks.length) * 100 : 0,
    };
  });

  // Calculate daily productivity from real tasks
  const getDaysArray = (days: number) => {
    const arr = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      arr.push(subDays(today, i));
    }
    return arr;
  };
  const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const daysArray = getDaysArray(rangeDays);
  const dailyProductivityData = daysArray.map(date => {
    const completed = tasks.filter(t => t.completedAt && isSameDay(t.completedAt, date)).length;
    const overdue = tasks.filter(t => t.status === 'overdue' && t.dueDate && isSameDay(t.dueDate, date)).length;
    const pending = tasks.filter(t => t.status === 'pending' && t.dueDate && isSameDay(t.dueDate, date)).length;
    return {
      date: format(date, 'yyyy-MM-dd'),
      completed,
      pending,
      overdue,
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Calculate min/max for dynamic Y-axis (Index Performance Chart)
  const indexHistoryValues = indexData.history.map(h => h.value);
  const minY = Math.min(...indexHistoryValues);
  const maxY = Math.max(...indexHistoryValues);
  const yMargin = Math.max(10, Math.round((maxY - minY) * 0.1));

  // Pie chart data for stock weightage
  const stockWeightData = stocks.map(stock => ({
    name: stock.name,
    value: stock.weight,
    color: stock.color?.replace('bg-', '') || '#3B82F6',
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Insights into your productivity performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select 
            value={selectedStock} 
            onChange={(e) => setSelectedStock(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Stocks</option>
            {stocks.map(stock => (
              <option key={stock.id} value={stock.id}>{stock.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Index Performance</p>
              <p className="text-2xl font-bold text-blue-900">{indexData.value.toFixed(1)}</p>
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{indexData.changePercent.toFixed(2)}%
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-green-900">
                {tasks.length > 0 ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(0) : 0}%
              </p>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.2% vs last week
              </div>
            </div>
            <PieChart className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Achievements</p>
              <p className="text-2xl font-bold text-purple-900">{achievements.filter(a => a.isUnlocked).length}</p>
              <div className="flex items-center text-sm text-purple-600">
                <div className="flex space-x-1 overflow-hidden">
                  {achievements.filter(a => a.isUnlocked).slice(0, 3).map(achievement => (
                    <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
                  ))}
                </div>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Points Earned</p>
              <p className="text-2xl font-bold text-orange-900">
                {tasks.filter(t => t.status === 'completed').reduce((sum, task) => sum + task.points, 0)}
              </p>
              <div className="flex items-center text-sm text-orange-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15 today
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Streaks Overview */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 Streak Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {streaks.map(streak => (
            <div key={streak.id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <StreakCounter streak={streak} size="lg" />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Best: {streak.longestStreak} days
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Index Performance Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Index Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indexData.history.map(h => ({
                ...h,
                date: typeof h.date === 'string' ? h.date : h.date.toISOString().split('T')[0]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis domain={[minY - yMargin, maxY + yMargin]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value}`, 'Index Value']}
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
        {/* Stock Weightage Pie Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Weightage in Index</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stockWeightData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {stockWeightData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Stock Performance Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Task Completion Rate */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Completion by Stock</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Daily Productivity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Productivity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill="#10B981" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" />
                <Bar dataKey="overdue" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      {/* Expand/Collapse Edit Index Values Section */}
      {indexData.history.length > 0 && (
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
              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={e => { e.stopPropagation(); /* handleSaveEdits() to be implemented if needed */ }}>
                Save Changes
              </button>
            )}
          </div>
          {editExpanded && (
            <div className="space-y-2 mt-2">
              {indexData.history.slice(-7).map((h, idx) => (
                <div key={h.date.toString()} className="flex items-center space-x-4">
                  <span className="w-32 text-gray-800">{typeof h.date === 'string' ? new Date(h.date).toLocaleDateString() : h.date.toLocaleDateString()}</span>
                  {editMode ? (
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-32"
                      value={editValues[h.date.toString()] !== undefined ? editValues[h.date.toString()] : h.value}
                      onChange={e => setEditValues(v => ({ ...v, [h.date.toString()]: Number(e.target.value) }))}
                      min={0}
                      max={2000}
                    />
                  ) : (
                    <span className="w-32 text-gray-900 font-semibold">{h.value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Detailed Analytics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Current Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Change</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Volatility</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tasks</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const stockTasks = tasks.filter(t => t.stockId === stock.id);
                const completedTasks = stockTasks.filter(t => t.status === 'completed');
                const completionRate = stockTasks.length > 0 ? (completedTasks.length / stockTasks.length) * 100 : 0;

                return (
                  <motion.tr
                    key={stock.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${stock.color} rounded-lg`}></div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{stock.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{stock.currentScore}</td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stock.volatility === 'low' ? 'bg-green-100 text-green-800' :
                        stock.volatility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stock.volatility}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{stockTasks.length}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{completionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};