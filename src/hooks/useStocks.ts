import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Stock } from '../types';

// TEMP: Hardcoded user id for demo (replace with real auth integration)
const currentUserId = 1;

export const useStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = async () => {
    console.log('fetchStocks called');
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM stocks WHERE user_id = ? ORDER BY created_at',
        [currentUserId]
      );
      console.log('Stocks query result:', res);
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      const stocksList: Stock[] = [];
      for (const row of rows) {
        const stockObj: any = {};
        columns.forEach((col, i) => (stockObj[col] = row[i]));
        // Fetch latest performance history entry for this stock
        const perfRes = db.exec(
          'SELECT score_delta, delta_percent FROM stock_performance_history WHERE stock_id = ? ORDER BY date DESC LIMIT 1',
          [stockObj.id]
        );
        const perfRow = perfRes[0]?.values?.[0];
        const change = perfRow ? perfRow[0] : 0;
        const changePercent = perfRow ? perfRow[1] : 0;
        stocksList.push({
          id: stockObj.id,
          name: stockObj.name,
          icon: stockObj.icon || 'activity',
          category: stockObj.category || 'General',
          currentScore: stockObj.current_score ?? 500,
          change,
          changePercent,
          volatility: 'low', // Placeholder
          lastActivity: new Date(), // Placeholder
          color: stockObj.color,
          weight: Number(stockObj.weight),
          history: [], // Placeholder
        });
      }
      setStocks(stocksList);
    } catch (err) {
      console.error('fetchStocks error:', err);
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
    setError(null);
    try {
      const db = await getDb();
      db.run(
        `INSERT INTO stocks (user_id, name, description, category, color, weight, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          currentUserId,
          stockData.name,
          stockData.description || null,
          stockData.category || null,
          stockData.color,
          stockData.weight,
          stockData.icon || null,
        ]
      );
      await persistDb();
      await fetchStocks();
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        setError('A stock with this name already exists.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create stock');
      }
      throw err;
    }
  };

  const updateStock = async (id: string, updates: Partial<Stock>) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        `UPDATE stocks SET name = ?, category = ?, color = ?, weight = ?, icon = ? WHERE id = ? AND user_id = ?`,
        [
          updates.name,
          updates.category,
          updates.color,
          updates.weight,
          updates.icon,
          id,
          currentUserId,
        ]
      );
      await persistDb();
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  };

  const deleteStock = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        `DELETE FROM stocks WHERE id = ? AND user_id = ?`,
        [id, currentUserId]
      );
      await persistDb();
      await fetchStocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stock');
      throw err;
    }
  };

  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line
  }, []);

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