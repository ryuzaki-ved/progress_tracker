import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Plus, Calendar, Flag, Repeat2 } from 'lucide-react';
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
    complexity?: number;
    repeatPattern?: {
      type: 'none' | 'daily' | 'weekly' | 'custom';
      endDate?: Date;
      daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
      customDates?: Date[];
    };
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
    complexity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'custom'>('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [newCustomDate, setNewCustomDate] = useState('');

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      const repeatPattern = repeatType !== 'none' ? {
        type: repeatType,
        endDate: repeatEndDate ? new Date(repeatEndDate) : undefined,
        daysOfWeek: repeatType === 'weekly' ? selectedDaysOfWeek : undefined,
        customDates: repeatType === 'custom' ? customDates.map(d => new Date(d)) : undefined,
      } : undefined;

      await onSubmit({
        ...formData,
        description: formData.description || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        scheduledTime: formData.scheduledTime || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        complexity: formData.complexity || undefined,
        repeatPattern,
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
        complexity: 1,
      });
      setRepeatType('none');
      setRepeatEndDate('');
      setSelectedDaysOfWeek([]);
      setCustomDates([]);
      setNewCustomDate('');

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedStock = stocks.find(s => s.id === formData.stockId);

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] flex flex-col"
      >
        <Card className="p-6 overflow-y-auto flex-1">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexity: {formData.complexity}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 (Simple)</span>
                <span>5 (Hard)</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatType !== 'none'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRepeatType('daily');
                    } else {
                      setRepeatType('none');
                      setRepeatEndDate('');
                      setSelectedDaysOfWeek([]);
                      setCustomDates([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                />
                <Repeat2 className="w-4 h-4 ml-2 mr-2" />
                Repeat this task on multiple days
              </label>

              {repeatType !== 'none' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repeat Pattern
                    </label>
                    <select
                      value={repeatType}
                      onChange={(e) => {
                        setRepeatType(e.target.value as any);
                        setSelectedDaysOfWeek([]);
                        setCustomDates([]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom Dates</option>
                    </select>
                  </div>

                  {repeatType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Days of Week
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {dayLabels.map((day, index) => (
                          <label key={index} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDaysOfWeek.includes(index)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDaysOfWeek([...selectedDaysOfWeek, index]);
                                } else {
                                  setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== index));
                                }
                              }}
                              className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{day.slice(0, 3)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {repeatType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Specific Dates
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="date"
                          value={newCustomDate}
                          onChange={(e) => setNewCustomDate(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCustomDate && !customDates.includes(newCustomDate)) {
                              setCustomDates([...customDates, newCustomDate]);
                              setNewCustomDate('');
                            }
                          }}
                          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                      {customDates.length > 0 && (
                        <div className="space-y-1">
                          {customDates.map((date, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-700 px-3 py-2 rounded text-sm">
                              <span className="text-gray-900 dark:text-white">{new Date(date).toLocaleDateString()}</span>
                              <button
                                type="button"
                                onClick={() => setCustomDates(customDates.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repeat Until (Optional)
                    </label>
                    <input
                      type="date"
                      value={repeatEndDate}
                      onChange={(e) => setRepeatEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to repeat indefinitely
                    </p>
                  </div>
                </div>
              )}
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
    </div>,
    document.body
  );
};
