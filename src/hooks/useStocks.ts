import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Stock } from '../types';
import { subDays } from 'date-fns';

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

        // Fetch last 30 days of performance history for this stock
        const today = new Date();
        const startDate = subDays(today, 30);
        const histRes = db.exec(
          'SELECT date, daily_score, score_delta FROM stock_performance_history WHERE stock_id = ? AND date >= ? ORDER BY date ASC',
          [stockObj.id, startDate.toISOString().slice(0, 10)]
        );
        const histRows = histRes[0]?.values || [];
        const history = histRows.map((h: any[]) => ({
          date: new Date(h[0]),
          value: h[1],
        }));
        const scoreDeltas = histRows.map((h: any[]) => h[2]);

        // Calculate standard deviation of score_delta
        let volatility: 'low' | 'medium' | 'high' = 'low';
        if (scoreDeltas.length >= 5) {
          const mean = scoreDeltas.reduce((a, b) => a + b, 0) / scoreDeltas.length;
          const variance = scoreDeltas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scoreDeltas.length;
          const stdDev = Math.sqrt(variance);
          if (stdDev < 10) volatility = 'low';
          else if (stdDev < 30) volatility = 'medium';
          else volatility = 'high';
        } else if (scoreDeltas.length > 0) {
          // Fallback: use max absolute delta
          const maxAbsDelta = Math.max(...scoreDeltas.map((d: number) => Math.abs(d)));
          if (maxAbsDelta < 10) volatility = 'low';
          else if (maxAbsDelta < 30) volatility = 'medium';
          else volatility = 'high';
        }

        stocksList.push({
          id: stockObj.id.toString(),
          name: stockObj.name,
          icon: stockObj.icon || 'activity',
          category: stockObj.category || 'General',
          currentScore: stockObj.current_score ?? 500,
          change,
          changePercent,
          volatility,
          lastActivity: stockObj.last_activity_at ? new Date(stockObj.last_activity_at) : new Date(),
          color: stockObj.color,
          weight: Number(stockObj.weight),
          history,
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

  // Apply decay to stocks based on last activity and settings
  const applyDecayToStocks = async () => {
    const autoDecayEnabled = localStorage.getItem('auto_decay_enabled') === 'true';
    const decayRate = parseFloat(localStorage.getItem('decay_rate') || '0');
    if (!autoDecayEnabled || !stocks.length || isNaN(decayRate) || decayRate <= 0) return;
    const db = await getDb();
    const now = new Date();
    let updated = false;
    for (const stock of stocks) {
      const lastActivity = stock.lastActivity instanceof Date ? stock.lastActivity : new Date(stock.lastActivity);
      const daysPassed = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed > 0) {
        const decayAmount = daysPassed * (decayRate / 100) * stock.currentScore;
        const newScore = Math.max(0, stock.currentScore - decayAmount);
        db.run('UPDATE stocks SET current_score = ?, last_activity_at = ? WHERE id = ?', [newScore, now.toISOString(), stock.id]);
        updated = true;
      }
    }
    if (updated) {
      await persistDb();
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
    fetchStocks().then(() => {
      applyDecayToStocks();
    });
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