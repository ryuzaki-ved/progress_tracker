import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Sparkline } from '../components/ui/Sparkline';
import { useStocks } from '../hooks/useStocks';
import { useTasks } from '../hooks/useTasks';
import { useIndex } from '../hooks/useIndex';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { stocks, loading: stocksLoading } = useStocks();
  const { tasks, loading: tasksLoading } = useTasks();
  const { indexData, loading: indexLoading } = useIndex();

  if (stocksLoading || tasksLoading || indexLoading) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your life performance like a stock portfolio</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Today's Date</div>
          <div className="text-lg font-semibold text-gray-900">
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Life Performance Index</h2>
            <p className="text-gray-600">Your overall productivity score</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{indexData.value.toFixed(1)}</div>
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
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

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
              <p className="text-sm text-purple-600 font-medium">Active Stocks</p>
              <p className="text-2xl font-bold text-purple-900">{stocks.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Avg. Daily Score</p>
              <p className="text-2xl font-bold text-orange-900">{(indexData.value / 7).toFixed(0)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.map((stock, index) => (
              <motion.div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{stock.name}</div>
                    <div className="text-sm text-gray-600">{stock.currentScore} pts</div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Needs Attention</h3>
          <div className="space-y-3">
            {worstPerformers.map((stock, index) => (
              <motion.div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${stock.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{stock.name}</div>
                    <div className="text-sm text-gray-600">{stock.currentScore} pts</div>
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

      {/* Motivational Message */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Daily Insight</h3>
          <p className="text-gray-700">
            Your Health & Fitness stock is performing exceptionally well! Keep up the momentum by completing your pending tasks in Career Development to boost your overall index.
          </p>
        </div>
      </Card>
    </div>
  );
};