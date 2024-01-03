import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Moon, Sun, Palette, Sliders, Bell, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockStocks } from '../data/mockData';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [notifications, setNotifications] = useState(true);
  const [autoDecay, setAutoDecay] = useState(true);
  const [decayRate, setDecayRate] = useState(1);
  const [stockWeights, setStockWeights] = useState(
    mockStocks.reduce((acc, stock) => ({ ...acc, [stock.id]: stock.weight }), {})
  );

  const handleWeightChange = (stockId: string, weight: number) => {
    setStockWeights(prev => ({ ...prev, [stockId]: weight }));
  };

  const totalWeight = Object.values(stockWeights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Customize your productivity tracking experience</p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Sliders }
                ].map(({ value, label, icon: Icon }) => (
                  <motion.button
                    key={value}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      theme === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setTheme(value as any)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">{label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex space-x-2">
                {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'].map(color => (
                  <motion.button
                    key={color}
                    className={`w-8 h-8 rounded-full ${color} ring-2 ring-offset-2 ring-transparent hover:ring-gray-300`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-600">Receive alerts for due tasks and milestones</div>
              </div>
              <motion.button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={() => setNotifications(!notifications)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{ x: notifications ? 26 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-gray-900">Notification Schedule</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Daily Summary</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="09:00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Task Reminders</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>30 minutes before</option>
                    <option>1 hour before</option>
                    <option>1 day before</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stock Weights */}
        <Card className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <Sliders className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Stock Weights</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Adjust how much each life category contributes to your overall index score.
              Total weight: <span className="font-semibold">{(totalWeight * 100).toFixed(0)}%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockStocks.map(stock => (
                <motion.div
                  key={stock.id}
                  className="p-4 border border-gray-200 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${stock.color} rounded-lg`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{stock.name}</div>
                        <div className="text-sm text-gray-600">{stock.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {(stockWeights[stock.id] * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={stockWeights[stock.id]}
                    onChange={(e) => handleWeightChange(stock.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* System Settings */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Decay</div>
                <div className="text-sm text-gray-600">Automatically decrease scores over time without activity</div>
              </div>
              <motion.button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoDecay ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={() => setAutoDecay(!autoDecay)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{ x: autoDecay ? 26 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {autoDecay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decay Rate: {decayRate}% per day
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={decayRate}
                  onChange={(e) => setDecayRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Keep all data</option>
                <option>1 year</option>
                <option>6 months</option>
                <option>3 months</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Export & Import */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Save className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900 mb-2">Export Data</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Export JSON</Button>
                <Button variant="outline" size="sm">Export CSV</Button>
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-900 mb-2">Import Data</div>
              <input
                type="file"
                accept=".json,.csv"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700">
                Reset All Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};