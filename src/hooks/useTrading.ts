import { useState, useEffect, useCallback } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Holding, Transaction } from '../types';
import { useAuth } from './useAuth';

export const useTrading = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [cashBalance, setCashBalance] = useState<number>(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cash balance
  const fetchCashBalance = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const value = res[0]?.values?.[0]?.[0];
    setCashBalance(value !== undefined ? Number(value) : 10000000);
  }, [currentUserId]);

  // Fetch holdings
  const fetchHoldings = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    const res = db.exec('SELECT * FROM user_holdings WHERE user_id = ?', [currentUserId]);
    const rows = res[0]?.values || [];
    const columns = res[0]?.columns || [];
    const holdingsList: Holding[] = rows.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: any, i: any) => (obj[col] = row[i]));
      return {
        id: obj.id,
        userId: obj.user_id,
        stockId: obj.stock_id,
        quantity: Number(obj.quantity),
        weightedAvgBuyPrice: Number(obj.weighted_avg_buy_price),
        createdAt: obj.created_at,
        updatedAt: obj.updated_at,
      };
    });
    setHoldings(holdingsList);
  }, [currentUserId]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    const res = db.exec('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC', [currentUserId]);
    const rows = res[0]?.values || [];
    const columns = res[0]?.columns || [];
    const txList: Transaction[] = rows.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: any, i: any) => (obj[col] = row[i]));
      return {
        id: obj.id,
        userId: obj.user_id,
        stockId: obj.stock_id,
        type: obj.type,
        quantity: Number(obj.quantity),
        price: Number(obj.price),
        brokerageFee: Number(obj.brokerage_fee),
        timestamp: obj.timestamp,
      };
    });
    setTransactions(txList);
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCashBalance(),
      fetchHoldings(),
      fetchTransactions(),
    ]).finally(() => setLoading(false));
  }, [fetchCashBalance, fetchHoldings, fetchTransactions]);

  // Buy stock
  const buyStock = async (stockId: number, quantity: number, price: number) => {
    if (!currentUserId) throw new Error('No user');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (price <= 0) throw new Error('Price must be positive');
    const db = await getDb();
    // Calculate total cost and brokerage
    const estimatedCost = quantity * price;
    const brokerage = Math.max(20, estimatedCost * 0.0003);
    const totalCost = estimatedCost + brokerage;
    // Check cash balance
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const currentBalance = res[0]?.values?.[0]?.[0] ?? 10000000;
    if (totalCost > currentBalance) throw new Error('Insufficient cash balance');
    // Update cash balance
    db.run('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?', [totalCost, currentUserId]);
    // Update holdings (weighted average)
    const holdingRes = db.exec('SELECT * FROM user_holdings WHERE user_id = ? AND stock_id = ?', [currentUserId, stockId]);
    if (holdingRes[0]?.values?.length) {
      // Already holding: update quantity and weighted average
      const row = holdingRes[0].values[0];
      const columns = holdingRes[0].columns;
      const obj: any = {};
      columns.forEach((col: any, i: any) => (obj[col] = row[i]));
      const prevQty = Number(obj.quantity);
      const prevAvg = Number(obj.weighted_avg_buy_price);
      const newQty = prevQty + quantity;
      const newAvg = ((prevQty * prevAvg) + (quantity * price)) / newQty;
      db.run('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime("now") WHERE id = ?', [newQty, newAvg, obj.id]);
    } else {
      // First time buying this stock
      db.run('INSERT INTO user_holdings (user_id, stock_id, quantity, weighted_avg_buy_price, created_at) VALUES (?, ?, ?, ?, datetime("now"))', [currentUserId, stockId, quantity, price]);
    }
    // Record transaction
    db.run('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))', [currentUserId, stockId, 'buy', quantity, price, brokerage]);
    await persistDb();
    await fetchCashBalance();
    await fetchHoldings();
    await fetchTransactions();
  };

  // Sell stock
  const sellStock = async (stockId: number, quantity: number, price: number) => {
    if (!currentUserId) throw new Error('No user');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (price <= 0) throw new Error('Price must be positive');
    const db = await getDb();
    // Check holding
    const holdingRes = db.exec('SELECT * FROM user_holdings WHERE user_id = ? AND stock_id = ?', [currentUserId, stockId]);
    if (!holdingRes[0]?.values?.length) throw new Error('No holdings to sell');
    const row = holdingRes[0].values[0];
    const columns = holdingRes[0].columns;
    const obj: any = {};
    columns.forEach((col: any, i: any) => (obj[col] = row[i]));
    const prevQty = Number(obj.quantity);
    if (quantity > prevQty) throw new Error('Insufficient quantity to sell');
    // Calculate proceeds and brokerage
    const proceeds = quantity * price;
    const brokerage = Math.max(20, proceeds * 0.0003);
    const netProceeds = proceeds - brokerage;
    // Update cash balance
    db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [netProceeds, currentUserId]);
    // Update holdings
    const newQty = prevQty - quantity;
    if (newQty > 0) {
      db.run('UPDATE user_holdings SET quantity = ?, updated_at = datetime("now") WHERE id = ?', [newQty, obj.id]);
    } else {
      db.run('DELETE FROM user_holdings WHERE id = ?', [obj.id]);
    }
    // Record transaction
    db.run('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))', [currentUserId, stockId, 'sell', quantity, price, brokerage]);
    await persistDb();
    await fetchCashBalance();
    await fetchHoldings();
    await fetchTransactions();
  };

  return {
    cashBalance,
    holdings,
    transactions,
    loading,
    error,
    fetchCashBalance,
    fetchHoldings,
    fetchTransactions,
    buyStock,
    sellStock,
  };
}; 