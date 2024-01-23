import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Calendar, Flag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Stock } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    stockId: string;
    dueDate?: Date;
    scheduledTime?: string;
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    points?: number;
  }) => Promise<void>;
  stocks: Stock[];
  defaultStockId?: string;
  defaultDate?: Date;
  defaultTime?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stocks,
  defaultStockId,
  defaultDate,
  defaultTime,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stockId: defaultStockId || (stocks[0]?.id || ''),
    dueDate: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
    scheduledTime: defaultTime || '',
    estimatedDuration: 30,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    points: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(f => ({
      ...f,
      stockId: defaultStockId || (stocks[0]?.id || ''),
      dueDate: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
      scheduledTime: defaultTime || '',
    }));
  }, [defaultDate, defaultTime, defaultStockId, stocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        ...formData,
        description: formData.description || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        scheduledTime: formData.scheduledTime || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        points: formData.points || undefined,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        stockId: defaultStockId || (stocks[0]?.id || ''),
        dueDate: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
        scheduledTime: defaultTime || '',
        estimatedDuration: 30,
        priority: 'medium',
        points: 10,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedStock = stocks.find(s => s.id === formData.stockId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Complete React certification"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional details about this task"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Category *
              </label>
              {defaultStockId ? (
                <>
                  <select
                    value={formData.stockId}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    {stocks.filter(stock => stock.id === defaultStockId).map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name} ({stock.category})
                      </option>
                    ))}
                  </select>
                  {selectedStock && (
                    <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className={`w-3 h-3 ${selectedStock.color} rounded mr-2`}></div>
                      This task will contribute to your {selectedStock.name} stock
                    </div>
                  )}
                </>
              ) : (
                <>
                  <select
                    value={formData.stockId}
                    onChange={(e) => setFormData({ ...formData, stockId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {stocks.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name} ({stock.category})
                      </option>
                    ))}
                  </select>
                  {selectedStock && (
                    <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className={`w-3 h-3 ${selectedStock.color} rounded mr-2`}></div>
                      This task will contribute to your {selectedStock.name} stock
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Duration: {formData.estimatedDuration} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>15m</span>
                  <span>4h</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points: {formData.points}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Points earned when completing this task
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.stockId}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};