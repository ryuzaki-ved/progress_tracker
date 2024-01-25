import { useState, useCallback } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { useAuth } from './useAuth';

export interface Holding {
  id: number;
  user_id: number;
  stock_id: number;
  quantity: number;
  avg_buy_price: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  stock_id: number;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  transaction_date: string;
}

export function useTrading() {
  const { user } = useAuth();
  const userId = user.id;
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch portfolio (cash balance + holdings)
  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      // Get cash balance
      const cashRes = db.exec(`SELECT cash_balance FROM users WHERE id = ?`, [userId]);
      const cash = cashRes[0]?.values?.[0]?.[0] ?? 0;
      setCashBalance(Number(cash));
      // Get holdings
      const holdingsRes = db.exec(`SELECT * FROM holdings WHERE user_id = ?`, [userId]);
      const holdingsRows = holdingsRes[0]?.values || [];
      setHoldings(holdingsRows.map(row => ({
        id: row[0], user_id: row[1], stock_id: row[2], quantity: row[3], avg_buy_price: row[4]
      })));
    } catch (e) {
      setError('Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const txRes = db.exec(`SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC`, [userId]);
      const txRows = txRes[0]?.values || [];
      setTransactions(txRows.map(row => ({
        id: row[0], user_id: row[1], stock_id: row[2], type: row[3], quantity: row[4], price: row[5], total_amount: row[6], transaction_date: row[7]
      })));
    } catch (e) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buy stock
  const buyStock = useCallback(async (stockId: number, quantity: number, price: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const db = await getDb();
      // Brokerage fee: 0.1% of total cost
      const totalCost = price * quantity * 1.001;
      // Check cash balance
      const cashRes = db.exec(`SELECT cash_balance FROM users WHERE id = ?`, [userId]);
      const cash = cashRes[0]?.values?.[0]?.[0] ?? 0;
      if (totalCost > cash) {
        setError('Insufficient funds');
        setLoading(false);
        return false;
      }
      // Check if holding exists
      const holdingRes = db.exec(`SELECT id, quantity, avg_buy_price FROM holdings WHERE user_id = ? AND stock_id = ?`, [userId, stockId]);
      if (holdingRes[0]?.values?.length) {
        // Update holding (weighted average)
        const [id, oldQty, oldAvg] = holdingRes[0].values[0];
        const newQty = Number(oldQty) + quantity;
        const newAvg = ((Number(oldQty) * Number(oldAvg)) + (quantity * price)) / newQty;
        db.run(`UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE id = ?`, [newQty, newAvg, id]);
      } else {
        // Insert new holding
        db.run(`INSERT INTO holdings (user_id, stock_id, quantity, avg_buy_price) VALUES (?, ?, ?, ?)`, [userId, stockId, quantity, price]);
      }
      // Update cash balance
      db.run(`UPDATE users SET cash_balance = cash_balance - ? WHERE id = ?`, [totalCost, userId]);
      // Record transaction
      db.run(`INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_amount) VALUES (?, ?, 'buy', ?, ?, ?)`, [userId, stockId, quantity, price, totalCost]);
      await persistDb();
      setSuccess('Buy successful!');
      await fetchPortfolio();
      await fetchTransactions();
      return true;
    } catch (e) {
      setError('Buy failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchPortfolio, fetchTransactions]);

  // Sell stock
  const sellStock = useCallback(async (stockId: number, quantity: number, price: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const db = await getDb();
      // Check holding
      const holdingRes = db.exec(`SELECT id, quantity, avg_buy_price FROM holdings WHERE user_id = ? AND stock_id = ?`, [userId, stockId]);
      if (!holdingRes[0]?.values?.length) {
        setError('No shares owned');
        setLoading(false);
        return false;
      }
      const [id, oldQty, oldAvg] = holdingRes[0].values[0];
      if (quantity > Number(oldQty)) {
        setError('Not enough shares');
        setLoading(false);
        return false;
      }
      const newQty = Number(oldQty) - quantity;
      // Update or remove holding
      if (newQty > 0) {
        db.run(`UPDATE holdings SET quantity = ? WHERE id = ?`, [newQty, id]);
      } else {
        db.run(`DELETE FROM holdings WHERE id = ?`, [id]);
      }
      // Update cash balance (no fee for selling)
      const totalProceeds = price * quantity;
      db.run(`UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?`, [totalProceeds, userId]);
      // Record transaction
      db.run(`INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_amount) VALUES (?, ?, 'sell', ?, ?, ?)`, [userId, stockId, quantity, price, totalProceeds]);
      await persistDb();
      setSuccess('Sell successful!');
      await fetchPortfolio();
      await fetchTransactions();
      return true;
    } catch (e) {
      setError('Sell failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchPortfolio, fetchTransactions]);

  // Initial load
  const initialize = useCallback(() => {
    fetchPortfolio();
    fetchTransactions();
  }, [fetchPortfolio, fetchTransactions]);

  return {
    cashBalance,
    holdings,
    transactions,
    loading,
    error,
    success,
    fetchPortfolio,
    fetchTransactions,
    buyStock,
    sellStock,
    initialize,
  };
} 