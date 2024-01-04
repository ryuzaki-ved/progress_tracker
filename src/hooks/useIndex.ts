import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { useStocks } from './useStocks';
import { IndexData } from '../types';
import { calculateIndexValue } from '../utils/stockUtils';

const currentUserId = 1;

export const useIndex = () => {
  const { stocks } = useStocks();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate the current index value (weighted sum of stocks)
  const getCurrentIndexValue = () => {
    console.log('Stocks for index calculation:', stocks);
    const value = calculateIndexValue(stocks);
    console.log('Calculated index value:', value);
    return value;
  };

  const fetchIndexData = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      // Get last 7 days of index history
      const res = db.exec(
        `SELECT * FROM index_history WHERE user_id = ? ORDER BY date ASC LIMIT 7`,
        [currentUserId]
      );
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      const history = rows.map((row: any[]) => {
        const obj: any = {};
        (columns as string[]).forEach((col: string, i: number) => (obj[col] = row[i]));
        return {
          date: new Date(obj.date),
          value: obj.index_value,
        };
      });
      // Get today's and yesterday's values
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayValue = getCurrentIndexValue();
      const yesterdayRes = db.exec(
        `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
        [currentUserId, yesterday]
      );
      const yesterdayValue = yesterdayRes[0]?.values?.[0]?.[0] ?? todayValue;
      const change = todayValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;
      // Build history array
      const liveValue = getCurrentIndexValue();
      const historyWithoutToday = history.filter((h: { date: Date }) => h.date.toISOString().split('T')[0] !== today);
      const newHistory = [...historyWithoutToday, { date: new Date(), value: liveValue }];
      setIndexData({
        value: todayValue,
        change,
        changePercent,
        history: newHistory.length > 0 ? newHistory : [{ date: new Date(), value: todayValue }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch index data');
    } finally {
      setLoading(false);
    }
  };

  // Update today's index value in history (if not already present)
  const updateIndexHistory = async () => {
    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];
      // Check if today's entry exists
      const res = db.exec(
        `SELECT id FROM index_history WHERE user_id = ? AND date = ?`,
        [currentUserId, today]
      );
      if (res[0]?.values?.length) return; // Already exists
      // Get yesterday's value
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yesterdayRes = db.exec(
        `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
        [currentUserId, yesterday]
      );
      const yesterdayValue = yesterdayRes[0]?.values?.[0]?.[0] ?? 0;
      const currentValue = getCurrentIndexValue();
      const change = currentValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;
      db.run(
        `INSERT INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [currentUserId, today, currentValue, change, changePercent]
      );
      await persistDb();
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index history');
    }
  };

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      fetchIndexData();
      updateIndexHistory();
    }
    // eslint-disable-next-line
  }, [stocks]);

  return {
    indexData,
    loading,
    error,
    updateIndexHistory,
    refetch: fetchIndexData,
  };
};