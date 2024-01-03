import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { IndexData } from '../types';

export const useIndex = () => {
  const { user } = useAuth();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndexData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get current index value using the database function
      const { data: currentIndex, error: indexError } = await supabase
        .rpc('calculate_user_index', { user_uuid: user.id });

      if (indexError) throw indexError;

      // Get index history for the last 7 days
      const { data: historyData, error: historyError } = await supabase
        .from('index_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(7);

      if (historyError) throw historyError;

      const history = historyData.map(h => ({
        date: new Date(h.date),
        value: h.index_value
      }));

      // Calculate change from yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('index_history')
        .select('index_value')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const { data: yesterdayData } = await supabase
        .from('index_history')
        .select('index_value')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .single();

      const todayValue = todayData?.index_value || currentIndex || 0;
      const yesterdayValue = yesterdayData?.index_value || todayValue;
      const change = todayValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;

      setIndexData({
        value: currentIndex || 0,
        change,
        changePercent,
        history: history.length > 0 ? history : [{ date: new Date(), value: currentIndex || 0 }]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch index data');
    } finally {
      setLoading(false);
    }
  };

  const updateIndexHistory = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate current index
      const { data: currentIndex, error: indexError } = await supabase
        .rpc('calculate_user_index', { user_uuid: user.id });

      if (indexError) throw indexError;

      // Get yesterday's value for change calculation
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: yesterdayData } = await supabase
        .from('index_history')
        .select('index_value')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .single();

      const yesterdayValue = yesterdayData?.index_value || currentIndex || 0;
      const change = (currentIndex || 0) - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;

      // Upsert today's index value
      const { error } = await supabase
        .from('index_history')
        .upsert({
          user_id: user.id,
          date: today,
          index_value: currentIndex || 0,
          daily_change: change,
          change_percent: changePercent,
        });

      if (error) throw error;
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index history');
    }
  };

  useEffect(() => {
    fetchIndexData();
  }, [user]);

  return {
    indexData,
    loading,
    error,
    updateIndexHistory,
    refetch: fetchIndexData,
  };
};