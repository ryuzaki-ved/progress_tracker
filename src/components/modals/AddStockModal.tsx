import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stockData: {
    name: string;
    description?: string;
    category?: string;
    color: string;
    weight: number;
    icon?: string;
  }) => Promise<void>;
  currentTotalWeight: number;
  initialData?: Partial<import('../../types').Stock>;
  editMode?: boolean;
}

const STOCK_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-yellow-500',
];

const STOCK_CATEGORIES = [
  'Professional',
  'Personal',
  'Health',
  'Education',
  'Creative',
  'Social',
  'Financial',
  'Spiritual',
];

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentTotalWeight,
  initialData,
  editMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Personal',
    color: 'bg-blue-500',
    weight: 20, // percent
    icon: 'activity',
  });
  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'Personal',
        color: initialData.color || 'bg-blue-500',
        weight: initialData.weight ? Math.round(initialData.weight * 100) : 20,
        icon: initialData.icon || 'activity',
      });
    } else if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        category: 'Personal',
        color: 'bg-blue-500',
        weight: 20,
        icon: 'activity',
      });
    }
  }, [editMode, initialData, isOpen]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const newWeight = formData.weight;
    // For edit, subtract the old weight from total
    let allowedTotal = currentTotalWeight;
    if (editMode && initialData) {
      allowedTotal -= initialData.weight ? Math.round(initialData.weight * 100) : 0;
    }
    if (allowedTotal + newWeight > 100) {
      setError('Total weight cannot exceed 100%.');
      setLoading(false);
      return;
    }
    try {
      await onSubmit({
        ...formData,
        weight: newWeight / 100, // store as 0.01–1.0
        description: formData.description || undefined,
        category: formData.category || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Failed to save stock'));
    } finally {
      setLoading(false);
    }
  };

  return (
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editMode ? 'Edit Stock' : 'Add New Stock'}</h2>
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
                  Stock Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Career Development"
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
                  placeholder="Brief description of this life area"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STOCK_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  {STOCK_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full ${color} ring-2 ring-offset-2 ${
                        formData.color === color ? 'ring-gray-400' : 'ring-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight: {formData.weight}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How much this stock contributes to your overall index
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
                  disabled={loading || !formData.name.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {editMode ? 'Saving...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      {editMode ? 'Save Changes' : 'Create Stock'}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    ) : null
  );
};