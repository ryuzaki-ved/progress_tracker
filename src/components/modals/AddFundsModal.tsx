import React, { useState } from 'react';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-sm w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Funds</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
            <input
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-shadow duration-150"
              disabled={loading}
              autoFocus
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Funds'}
          </button>
        </form>
      </div>
    </div>
  );
}; 