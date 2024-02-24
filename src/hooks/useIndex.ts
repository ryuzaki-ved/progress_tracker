import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { useStocks } from './useStocks';
import { IndexData } from '../types';
import { calculateIndexValue, normalizeDateToStartOfDay } from '../utils/stockUtils';

const currentUserId = 1;

export const useIndex = () => {
  const { stocks } = useStocks();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track the current date string
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

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
      // Fetch all index history for the user
      const res = db.exec(
        `SELECT * FROM index_history WHERE user_id = ? ORDER BY date ASC`,
        [currentUserId]
      );
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      // Store all dates as strings in 'yyyy-MM-dd' format
      const rawHistory = rows.map((row: any[]) => {
        const obj: any = {};
        (columns as string[]).forEach((col: string, i: number) => (obj[col] = row[i]));
        return {
          date: obj.date, // keep as string
          value: obj.index_value,
        };
      });

      console.log('DEBUG: Raw history from DB:', rawHistory);
      console.log('DEBUG: Raw history length:', rawHistory.length);

      // Create a continuous history for the last 30 days
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      console.log('DEBUG: Today string:', todayString);
      const continuousHistory: { date: string; value: number }[] = [];
      let lastKnownValue = 500; // Default starting value
      for (let i = 29; i >= 0; i--) {
        const currentDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = currentDate.getFullYear() + '-' + 
          String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(currentDate.getDate()).padStart(2, '0');
        console.log(`DEBUG: Loop i=${i}, dateString=${dateString}, isToday=${dateString === todayString}`);
        // Check if we have a recorded value for this date
        const recordedEntry = rawHistory.find(h => h.date === dateString);
        if (recordedEntry) {
          lastKnownValue = recordedEntry.value;
          continuousHistory.push({
            date: dateString,
            value: recordedEntry.value
          });
        } else {
          continuousHistory.push({
            date: dateString,
            value: lastKnownValue
          });
        }
      }
      console.log('DEBUG: Continuous history after loop:', continuousHistory);
      console.log('DEBUG: Continuous history length after loop:', continuousHistory.length);

      // For today specifically, always use the live calculated value
      const liveIndexValue = getCurrentIndexValue();
      console.log('DEBUG: Live index value:', liveIndexValue);
      // Today should always be the last entry (index 29) since we loop from 29 to 0
      if (continuousHistory.length > 0) {
        console.log('DEBUG: Updating last entry (today) with live value');
        console.log('DEBUG: Last entry before update:', continuousHistory[continuousHistory.length - 1]);
        continuousHistory[continuousHistory.length - 1].value = liveIndexValue;
        console.log('DEBUG: Last entry after update:', continuousHistory[continuousHistory.length - 1]);
      }
      // Ensure history is sorted by date ascending (oldest to newest)
      continuousHistory.sort((a, b) => a.date.localeCompare(b.date));
      console.log('DEBUG: Continuous history after sort:', continuousHistory);
      console.log('DEBUG: Continuous history length after sort:', continuousHistory.length);
      // Calculate today's change compared to yesterday
      const yesterdayDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayString = yesterdayDate.getFullYear() + '-' + 
        String(yesterdayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(yesterdayDate.getDate()).padStart(2, '0');
      const yesterdayEntry = rawHistory.find(h => h.date === yesterdayString);
      const yesterdayValue = yesterdayEntry ? yesterdayEntry.value : lastKnownValue;
      const todayValue = liveIndexValue;
      const change = todayValue - yesterdayValue;
      const changePercent = yesterdayValue > 0 ? (change / yesterdayValue) * 100 : 0;
      console.log('DEBUG: Final indexData being set:', {
        value: todayValue,
        change,
        changePercent,
        historyLength: continuousHistory.length
      });
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

  // Update today's index value in history (if not already present)
  const updateIndexHistory = async () => {
    try {
      const db = await getDb();
      const todayDate = new Date();
      const today = todayDate.getFullYear() + '-' + 
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(todayDate.getDate()).padStart(2, '0');
      
      // Get the most recent recorded index value (not necessarily yesterday)
      const lastRecordRes = db.exec(
        `SELECT index_value FROM index_history WHERE user_id = ? ORDER BY date DESC LIMIT 1`,
        [currentUserId]
      );
      const lastRecordedValue = lastRecordRes[0]?.values?.[0]?.[0] ?? 500;
      
      const currentValue = getCurrentIndexValue();
      const change = currentValue - lastRecordedValue;
      const changePercent = lastRecordedValue > 0 ? (change / lastRecordedValue) * 100 : 0;
      
      // Use INSERT OR REPLACE to upsert today's record
      db.run(
        `INSERT OR REPLACE INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [currentUserId, today, currentValue, change, changePercent]
      );
      await persistDb();
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index history');
    }
  };

  // Update multiple index values for specific dates
  const updateMultipleIndexValues = async (updates: Record<string, number>) => {
    setError(null);
    try {
      const db = await getDb();
      
      for (const [date, value] of Object.entries(updates)) {
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
        
        // Insert or replace the record for this date
        db.run(
          `INSERT OR REPLACE INTO index_history (user_id, date, index_value, daily_change, change_percent, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [currentUserId, date, value, change, changePercent]
        );
      }
      
      await persistDb();
      await fetchIndexData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update index values');
      throw err;
    }
  };

  // Robust refetch: always update today's index history before fetching
  const refreshIndexData = async () => {
    await updateIndexHistory();
    // fetchIndexData is already called at the end of updateIndexHistory, but call again to ensure latest state
    await fetchIndexData();
  };

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      fetchIndexData();
      updateIndexHistory();
    }
    // eslint-disable-next-line
  }, [stocks]);

  // Add timer to check for date change every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const todayDate = new Date();
      const todayString = todayDate.getFullYear() + '-' + 
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(todayDate.getDate()).padStart(2, '0');
      if (todayString !== currentDate) {
        setCurrentDate(todayString);
        // Date changed, refresh index data
        fetchIndexData();
        updateIndexHistory();
      }
    }, 10000); // 10 seconds
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