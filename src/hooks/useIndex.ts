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
      
      // Get yesterday's value from database
      const yesterdayRes = db.exec(
        `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
        [currentUserId, yesterday]
      );
      const yesterdayValue = yesterdayRes[0]?.values?.[0]?.[0] ?? todayValue;
      const change = todayValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;
      
      // Build history array - use the actual database history
      setIndexData({
        value: todayValue,
        change,
        changePercent,
        history: history.length > 0 ? history : [{ date: new Date(), value: todayValue }],
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
      
      // Check if today's record already exists
      const todayRes = db.exec(
        `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
        [currentUserId, today]
      );
      
      // Only insert if today's record doesn't exist
      if (!todayRes[0]?.values?.[0]) {
        // Get yesterday's value
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const yesterdayRes = db.exec(
          `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
          [currentUserId, yesterday]
        );
        const yesterdayValue = yesterdayRes[0]?.values?.[0]?.[0] ?? 500;
        const currentValue = getCurrentIndexValue();
        const change = currentValue - yesterdayValue;
        const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;
        
        // Insert the record for today
        db.run(
          `INSERT INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [currentUserId, today, currentValue, change, changePercent]
        );
        await persistDb();
        await fetchIndexData();
      }
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

  // Update multiple index values for specific dates
  const updateMultipleIndexValues = async (updates: Record<string, number>) => {
    setError(null);
    console.log('Updating index values:', updates);
    try {
      const db = await getDb();
      
      for (const [date, value] of Object.entries(updates)) {
        console.log(`Processing date: ${date}, value: ${value}`);
        
        // Get the previous day's value for change calculation
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        
        const prevRes = db.exec(
          `SELECT index_value FROM index_history WHERE user_id = ? AND date = ?`,
          [currentUserId, prevDateStr]
        );
        const prevValue = prevRes[0]?.values?.[0]?.[0] ?? value;
        const change = value - prevValue;
        const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;
        
        console.log(`Previous value: ${prevValue}, change: ${change}, changePercent: ${changePercent}`);
        
        // Insert or replace the record for this date
        db.run(
          `INSERT OR REPLACE INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [currentUserId, date, value, change, changePercent]
        );
        console.log(`Updated record for ${date}`);
      }
      
      console.log('Persisting database...');
      await persistDb();
      console.log('Refetching index data...');
      await fetchIndexData();
      console.log('Update completed successfully');
    } catch (err) {
      console.error('Error updating index values:', err);
      setError(err instanceof Error ? err.message : 'Failed to update index values');
      throw err;
    }
  };

  return {
    indexData,
    loading,
    error,
    updateIndexHistory,
    updateMultipleIndexValues,
    refetch: fetchIndexData,
  };
};