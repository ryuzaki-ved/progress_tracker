import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { useStocks } from './useStocks';
import { IndexData } from '../types';
import { calculateIndexValue } from '../utils/stockUtils';

export const useIndex = () => {
  const { user } = useAuth();
  const { stocks } = useStocks();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const getCurrentIndexValue = () => {
    return calculateIndexValue(stocks);
  };

  const fetchIndexData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/index', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch index data');
      const result = await response.json();
      const rawHistory = result.data;

      const today = new Date();
      const continuousHistory: { date: string; open: number, high: number, low: number, close: number }[] = [];
      let lastKnownValue = 500;
      for (let i = 29; i >= 0; i--) {
        const currentDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = currentDate.getFullYear() + '-' +
          String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(currentDate.getDate()).padStart(2, '0');
        const recordedEntry = rawHistory.find((h: any) => h.date === dateString);
        if (recordedEntry) {
          lastKnownValue = recordedEntry.close;
          continuousHistory.push({
            date: dateString,
            open: recordedEntry.open,
            high: recordedEntry.high,
            low: recordedEntry.low,
            close: recordedEntry.close
          });
        } else {
          continuousHistory.push({
            date: dateString,
            open: lastKnownValue,
            high: lastKnownValue,
            low: lastKnownValue,
            close: lastKnownValue
          });
        }
      }

      const liveIndexValue = getCurrentIndexValue();
      if (continuousHistory.length > 0) {
        const todayEntry = continuousHistory[continuousHistory.length - 1];
        todayEntry.high = Math.max(todayEntry.high, liveIndexValue);
        todayEntry.low = Math.min(todayEntry.low, liveIndexValue);
        todayEntry.close = liveIndexValue;
      }
      continuousHistory.sort((a, b) => a.date.localeCompare(b.date));

      const yesterdayDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayString = yesterdayDate.getFullYear() + '-' +
        String(yesterdayDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(yesterdayDate.getDate()).padStart(2, '0');
      const yesterdayEntry = rawHistory.find((h: any) => h.date === yesterdayString);
      const yesterdayValue = yesterdayEntry ? yesterdayEntry.close : lastKnownValue;
      const todayValue = liveIndexValue;
      const change = todayValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;

      setIndexData({
        value: todayValue,
        change,
        changePercent,
        history: continuousHistory,
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
      const currentValue = getCurrentIndexValue();
      const response = await fetch('/api/index/update', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ currentValue })
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index history');
    }
  };

  const updateMultipleIndexValues = async (updates: Record<string, number>) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch('/api/index/multiple', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ updates })
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index values');
      throw err;
    }
  };

  const refreshIndexData = async () => {
    if (!user) return;
    await updateIndexHistory();
    await fetchIndexData();
  };

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      fetchIndexData();
      updateIndexHistory();
    } else {
        setIndexData(null);
    }
    // eslint-disable-next-line
  }, [stocks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const todayDate = new Date();
      const todayString = todayDate.getFullYear() + '-' +
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(todayDate.getDate()).padStart(2, '0');
      if (todayString !== currentDate) {
        setCurrentDate(todayString);
        fetchIndexData();
        updateIndexHistory();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentDate, stocks]);

  return {
    indexData,
    loading,
    error,
    updateIndexHistory,
    updateMultipleIndexValues,
    refetch: refreshIndexData,
  };
};
