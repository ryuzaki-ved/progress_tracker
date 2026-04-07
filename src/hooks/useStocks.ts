import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Stock } from '../types';
import { LIFESTOCK_STOCKS_MUTATED } from '../utils/indexSync';

export const useStocks = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [indexDivisor, setIndexDivisor] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchStocks = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stocks', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const result = await response.json();
      
      const stocksList = result.data.map((s: any) => ({
        ...s,
        lastActivity: new Date(s.lastActivity),
        history: s.history.map((h: any) => ({ ...h, date: new Date(h.date) }))
      }));
      setStocks(stocksList);
      if (result.meta?.indexDivisor) {
        setIndexDivisor(result.meta.indexDivisor);
      }
    } catch (err) {
      console.error('fetchStocks error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  };

  const applyDecayToStocks = async () => {
    if (!user) return;
    const autoDecayEnabled = localStorage.getItem('auto_decay_enabled') === 'true';
    const decayRate = parseFloat(localStorage.getItem('decay_rate') || '0');
    if (!autoDecayEnabled || !stocks.length || isNaN(decayRate) || decayRate <= 0) return;

    const now = new Date();
    let updated = false;

    // Use a local copy for processing decay to avoid multiple updates causing flicker
    for (const stock of stocks) {
      const lastActivity = stock.lastActivity instanceof Date ? stock.lastActivity : new Date(stock.lastActivity);
      const daysPassed = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed > 0) {
        const decayAmount = daysPassed * (decayRate / 100) * stock.currentScore;
        const newScore = Math.max(0, stock.currentScore - decayAmount);
        
        await fetch(`/api/stocks/${stock.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ current_score: newScore, last_activity_at: now.toISOString() })
        });
        updated = true;
      }
    }
    if (updated) {
      await fetchStocks(); // Refresh state after decay
    }
  };

  const createStock = async (stockData: {
    name: string;
    description?: string;
    category?: string;
    color: string;
    weight: number;
    icon?: string;
  }) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch('/api/stocks', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(stockData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create stock');
      await fetchStocks();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to create stock');
      throw err;
    }
  };

  const updateStock = async (id: string, updates: Partial<Stock>) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(updates)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  };

  const deleteStock = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stock');
      throw err;
    }
  };

  const archiveStock = async (id: string, isArchived: boolean = true) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ is_archived: isArchived })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive stock');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
        fetchStocks().then(() => {
          applyDecayToStocks();
        });
    } else {
        setStocks([]);
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onMutate = () => {
      void fetchStocks();
    };
    window.addEventListener(LIFESTOCK_STOCKS_MUTATED, onMutate);
    return () => window.removeEventListener(LIFESTOCK_STOCKS_MUTATED, onMutate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch uses latest fetchStocks; avoid re-subscribing every render
  }, [user]);

  return {
    stocks,
    indexDivisor,
    loading,
    error,
    createStock,
    updateStock,
    deleteStock,
    archiveStock,
    refetch: fetchStocks,
  };
};
