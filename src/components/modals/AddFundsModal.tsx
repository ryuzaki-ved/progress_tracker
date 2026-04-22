import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign } from 'lucide-react';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  totalPortfolioValue: number; // Total funds (cash + invested in stocks)
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onSubmit, totalPortfolioValue }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate the maximum allowed to add: 15% of total portfolio value
  const maxAllowedToAdd = totalPortfolioValue * 0.15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > maxAllowedToAdd) {
      setError(`You can add a maximum of ₹${maxAllowedToAdd.toFixed(2)} (15% of your portfolio value)`);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(numAmount);
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add funds');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative border border-gray-200 dark:border-gray-700">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          onClick={onClose}
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Funds</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (₹) - Max: ₹{maxAllowedToAdd.toFixed(2)}
            </label>
            <input
              type="number"
              min={1}
              max={maxAllowedToAdd}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 focus:border-green-400 dark:focus:border-green-500 transition-all duration-200 text-lg"
              disabled={loading}
              autoFocus
              placeholder="Enter amount..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You can add up to 15% of your total portfolio value
            </p>
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-60 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Adding...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Add Funds
              </div>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}; 
