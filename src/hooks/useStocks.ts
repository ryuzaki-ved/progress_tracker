import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Stock } from '../types';

export const useStocks = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stocks')
        .select(`
          *,
          stock_performance_history (
            date,
            daily_score,
            score_delta,
            delta_percent
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;

      const transformedStocks: Stock[] = data.map(stock => {
        const history = stock.stock_performance_history
          .slice(-7) // Last 7 days
          .map(h => ({
            date: new Date(h.date),
            value: h.daily_score
          }));

        const latestHistory = stock.stock_performance_history[stock.stock_performance_history.length - 1];
        const change = latestHistory?.score_delta || 0;
        const changePercent = latestHistory?.delta_percent || 0;

        return {
          id: stock.id,
          name: stock.name,
          icon: stock.icon || 'activity',
          category: stock.category || 'General',
          currentScore: stock.current_score || 500,
          change,
          changePercent,
          volatility: stock.volatility_score > 0.7 ? 'high' : stock.volatility_score > 0.4 ? 'medium' : 'low',
          lastActivity: new Date(stock.last_activity_at || stock.updated_at),
          color: stock.color,
          weight: stock.weight,
          history: history.length > 0 ? history : [{ date: new Date(), value: stock.current_score || 500 }]
        };
      });

      setStocks(transformedStocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
    } finally {
      setLoading(false);
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

    try {
      const { data, error } = await supabase
        .from('stocks')
        .insert({
          user_id: user.id,
          ...stockData,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial performance history entry
      await supabase
        .from('stock_performance_history')
        .insert({
          stock_id: data.id,
          date: new Date().toISOString().split('T')[0],
          daily_score: 500,
          score_delta: 0,
          delta_percent: 0,
          tasks_completed: 0,
          tasks_overdue: 0,
          points_earned: 0,
        });

      await fetchStocks();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock');
      throw err;
    }
  };

  const updateStock = async (id: string, updates: Partial<Stock>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stocks')
        .update({
          name: updates.name,
          category: updates.category,
          color: updates.color,
          weight: updates.weight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  };

  const deleteStock = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stocks')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stock');
      throw err;
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [user]);

  return {
    stocks,
    loading,
    error,
    createStock,
    updateStock,
    deleteStock,
    refetch: fetchStocks,
  };
};