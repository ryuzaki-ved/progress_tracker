import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Moon, Sun, Palette, Sliders, Bell, Shield, Monitor } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStocks } from '../hooks/useStocks';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { stocks, updateStock } = useStocks();
  const { mode, accent, setMode, setAccent } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoDecay, setAutoDecay] = useState(true);
  const [decayRate, setDecayRate] = useState(1);
  const [stockWeights, setStockWeights] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize stock weights from actual stocks data
  useEffect(() => {
    if (stocks.length > 0) {
      const weights = stocks.reduce((acc, stock) => ({ ...acc, [stock.id]: stock.weight }), {});
      setStockWeights(weights);
    }
  }, [stocks]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('settings_notifications');
    const storedAutoDecay = localStorage.getItem('settings_autoDecay');
    const storedDecayRate = localStorage.getItem('settings_decayRate');
    if (storedNotifications !== null) setNotifications(storedNotifications === 'true');
    if (storedAutoDecay !== null) setAutoDecay(storedAutoDecay === 'true');
    if (storedDecayRate !== null) setDecayRate(Number(storedDecayRate));
  }, []);

  const handleWeightChange = (stockId: string, weight: number) => {
    setStockWeights(prev => ({ ...prev, [stockId]: weight }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      // Update stock weights
      const updatePromises = Object.entries(stockWeights).map(([stockId, weight]) => {
        const stock = stocks.find(s => s.id === stockId);
        if (stock && stock.weight !== weight) {
          return updateStock(stockId, { ...stock, weight });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Save settings to localStorage
      localStorage.setItem('settings_theme', mode);
      localStorage.setItem('settings_accent', accent);
      localStorage.setItem('settings_notifications', String(notifications));
      localStorage.setItem('settings_autoDecay', String(autoDecay));
      localStorage.setItem('settings_decayRate', String(decayRate));

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!user) return;

    try {
      // Fetch all user data
      const [stocksData, tasksData, indexData] = await Promise.all([
        // This part of the code was removed as per the edit hint.
        // The original code had supabase calls here, which are now removed.
        // The data will not be exported locally.
      ]);

      const exportData = {
        user: { id: user.id, email: user.email },
        stocks: stocksData.data || [],
        tasks: tasksData.data || [],
        indexHistory: indexData.data || [],
        exportedAt: new Date().toISOString(),
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifestock-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Simple CSV export for stocks
        const csvContent = [
          'Stock Name,Category,Current Score,Weight,Created At',
          ...exportData.stocks.map(stock => 
            `"${stock.name}","${stock.category}",${stock.current_score},${stock.weight},"${stock.created_at}"`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifestock-stocks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to reset ALL your data? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This will permanently delete all your stocks, tasks, and history. Type "DELETE" to confirm.'
    );
    
    if (!doubleConfirmed) return;

    try {
      // Delete all user data (cascading deletes will handle related records)
      // This part of the code was removed as per the edit hint.
      // The original code had supabase calls here, which are now removed.
      // The data will not be reset locally.
      
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset data. Please try again.');
    }
  };
  const totalWeight = Object.values(stockWeights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your productivity tracking experience</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={saving}>
          <span>
            {saving ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </span>
        </Button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map(({ value, label, icon: Icon }) => (
                  <motion.button
                    key={value}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      mode === value
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setMode(value as any)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
              <div className="flex space-x-2">
                {[
                  { name: 'blue', class: 'bg-blue-500' },
                  { name: 'green', class: 'bg-green-500' },
                  { name: 'purple', class: 'bg-purple-500' },
                  { name: 'orange', class: 'bg-orange-500' },
                  { name: 'pink', class: 'bg-pink-500' },
                ].map(({ name, class: colorClass }) => (
                  <motion.button
                    key={name}
                    className={`w-8 h-8 rounded-full ${colorClass} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${
                      accent === name ? 'ring-gray-400 dark:ring-gray-500' : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'
                    }`}
                    onClick={() => setAccent(name as any)}
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
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Receive alerts for due tasks and milestones</div>
              </div>
              <motion.button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
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
              <div className="font-medium text-gray-900 dark:text-white">Notification Schedule</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Summary</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue="09:00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Task Reminders</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">
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
            <Sliders className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Weights</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adjust how much each life category contributes to your overall index score.
              Total weight: <span className={`font-semibold ${totalWeight > 1 ? 'text-red-600' : 'text-green-700'}`}>{(totalWeight * 100).toFixed(0)}%</span>
              {totalWeight > 1 && (
                <span className="ml-2 text-xs text-red-600">(Exceeds 100%!)</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stocks.map(stock => (
                <motion.div
                  key={stock.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${stock.color} rounded-lg`}></div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stock.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(stockWeights[stock.id] * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stockWeights[stock.id] ?? 0}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      // Calculate what the new total would be if this stock is changed
                      const newTotal = Object.entries(stockWeights).reduce((sum, [id, weight]) => {
                        if (id === stock.id) return sum + newValue;
                        return sum + weight;
                      }, 0);
                      // Only allow if new total is <= 1, or if reducing this stock's weight
                      if (newTotal <= 1 || newValue < (stockWeights[stock.id] ?? 0)) {
                        handleWeightChange(stock.id, newValue);
                      }
                    }}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* System Settings */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Auto Decay</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Automatically decrease scores over time without activity</div>
              </div>
              <motion.button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoDecay ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Decay Rate: {decayRate}% per day
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={decayRate}
                  onChange={(e) => setDecayRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Retention</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">
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
            <Save className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-2">Export Data</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportData('json')}>
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportData('csv')}>
                  Export CSV
                </Button>
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-2">Import Data</div>
              <input
                type="file"
                accept=".json,.csv"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleResetData}
              >
                Reset All Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};