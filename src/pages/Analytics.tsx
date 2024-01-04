import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useIndex } from '../hooks/useIndex';
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

export const Analytics: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { indexData, loading: indexLoading } = useIndex();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedStock, setSelectedStock] = useState('all');

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

  // Calculate daily productivity
  const dailyProductivityData = [
    { date: '2024-01-08', completed: 3, pending: 2, overdue: 1 },
    { date: '2024-01-09', completed: 4, pending: 3, overdue: 0 },
    { date: '2024-01-10', completed: 2, pending: 4, overdue: 1 },
    { date: '2024-01-11', completed: 5, pending: 2, overdue: 0 },
    { date: '2024-01-12', completed: 3, pending: 3, overdue: 1 },
    { date: '2024-01-13', completed: 4, pending: 2, overdue: 0 },
    { date: '2024-01-14', completed: 6, pending: 1, overdue: 0 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into your productivity performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select 
            value={selectedStock} 
            onChange={(e) => setSelectedStock(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              <p className="text-sm text-purple-600 font-medium">Active Streaks</p>
              <p className="text-2xl font-bold text-purple-900">12</p>
              <div className="flex items-center text-sm text-purple-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Best: 18 days
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Index Performance Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Index Performance</h3>
          <div className="h-64">
            {console.log('Chart data:', indexData.history.map(h => ({
              ...h,
              date: typeof h.date === 'string' ? h.date : h.date.toISOString().split('T')[0]
            })))}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indexData.history.map(h => ({
                ...h,
                date: typeof h.date === 'string' ? h.date : h.date.toISOString().split('T')[0]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value}`, 'Index Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stock Performance Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Performance</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion by Stock</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={taskCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, rate }) => `${name}: ${rate.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="rate"
                >
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily Productivity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Productivity</h3>
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

      {/* Detailed Analytics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Current Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Change</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Volatility</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tasks</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Completion Rate</th>
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
                    className="border-b border-gray-100 hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${stock.color} rounded-lg`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{stock.name}</div>
                          <div className="text-sm text-gray-600">{stock.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{stock.currentScore}</td>
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
                    <td className="py-3 px-4 text-gray-900">{stockTasks.length}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{completionRate.toFixed(0)}%</span>
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