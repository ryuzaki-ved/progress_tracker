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
    // Debug: log currentUserId
    console.log('useTrading: currentUserId:', currentUserId);
    // Debug: log all user_settings
    const allSettings = db.exec('SELECT * FROM user_settings');
    console.log('All user_settings:', allSettings[0]?.values);
    // Ensure row exists for current user
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    if (!res[0] || !res[0].values.length) {
      db.run('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, ?)', [currentUserId, 10000000]);
      console.log('Inserted new user_settings row for user:', currentUserId);
    }
    const res2 = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const value = res2[0]?.values?.[0]?.[0];
    // Log fetched cash balance
    console.log('useTrading: Fetched cash_balance:', value);
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
    // Debug: log currentUserId
    console.log('useTrading: currentUserId:', currentUserId);
    // Debug: log all user_settings
    const allSettings = db.exec('SELECT * FROM user_settings');
    console.log('All user_settings:', allSettings[0]?.values);
    // Ensure row exists for current user
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    if (!res[0] || !res[0].values.length) {
      db.run('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, ?)', [currentUserId, 10000000]);
      console.log('Inserted new user_settings row for user:', currentUserId);
    }
    const res2 = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const currentBalance = res2[0]?.values?.[0]?.[0] ?? 10000000;
    // Log balance before update and total cost
    const estimatedCost = quantity * price;
    const brokerage = Math.max(20, estimatedCost * 0.0003);
    const totalCost = estimatedCost + brokerage;
    console.log('useTrading: Buy - Current balance before update:', currentBalance);
    console.log('useTrading: Buy - Total cost:', totalCost);
    if (totalCost > currentBalance) throw new Error('Insufficient cash balance');
    // Update cash balance
    db.run('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?', [totalCost, currentUserId]);
    // Log balance after update
    const updatedBalanceRes = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    console.log('useTrading: Buy - Balance after update query:', updatedBalanceRes[0]?.values?.[0]?.[0]);
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
    // Debug: log currentUserId
    console.log('useTrading: currentUserId:', currentUserId);
    // Debug: log all user_settings
    const allSettings = db.exec('SELECT * FROM user_settings');
    console.log('All user_settings:', allSettings[0]?.values);
    // Ensure row exists for current user
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    if (!res[0] || !res[0].values.length) {
      db.run('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, ?)', [currentUserId, 10000000]);
      console.log('Inserted new user_settings row for user:', currentUserId);
    }
    const res2 = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const currentBalance = res2[0]?.values?.[0]?.[0] ?? 10000000;
    // Log balance before update and net proceeds
    const proceeds = quantity * price;
    const brokerage = Math.max(20, proceeds * 0.0003);
    const netProceeds = proceeds - brokerage;
    console.log('useTrading: Sell - Current balance before update:', currentBalance);
    console.log('useTrading: Sell - Net proceeds:', netProceeds);
    // Update cash balance
    db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [netProceeds, currentUserId]);
    // Log balance after update
    const updatedBalanceRes = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    console.log('useTrading: Sell - Balance after update query:', updatedBalanceRes[0]?.values?.[0]?.[0]);
    // Update holdings
    const holdingRes = db.exec('SELECT * FROM user_holdings WHERE user_id = ? AND stock_id = ?', [currentUserId, stockId]);
    if (!holdingRes[0]?.values?.length) throw new Error('No holdings to sell');
    const row = holdingRes[0].values[0];
    const columns = holdingRes[0].columns;
    const obj: any = {};
    columns.forEach((col: any, i: any) => (obj[col] = row[i]));
    const prevQty = Number(obj.quantity);
    const prevAvgPrice = Number(obj.weighted_avg_buy_price);
    if (quantity > prevQty) throw new Error('Insufficient quantity to sell');
    const newQty = prevQty - quantity;
    if (newQty > 0) {
      // Calculate new weighted average buy price for remaining shares
      // Formula: (Total original cost - Cost of sold shares) / Remaining quantity
      const totalOriginalCost = prevQty * prevAvgPrice;
      const soldSharesCost = quantity * prevAvgPrice; // Use original avg price for sold shares
      const remainingCost = totalOriginalCost - soldSharesCost;
      const newWeightedAvgPrice = remainingCost / newQty;
      
      console.log('useTrading: Sell - Rebalancing weighted avg price:');
      console.log('  - Previous quantity:', prevQty, 'Previous avg price:', prevAvgPrice);
      console.log('  - Selling quantity:', quantity, 'at price:', price);
      console.log('  - Total original cost:', totalOriginalCost);
      console.log('  - Cost of sold shares:', soldSharesCost);
      console.log('  - Remaining cost:', remainingCost);
      console.log('  - New quantity:', newQty, 'New weighted avg price:', newWeightedAvgPrice);
      
      db.run('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime("now") WHERE id = ?', [newQty, newWeightedAvgPrice, obj.id]);
    } else {
      console.log('useTrading: Sell - Removing holding completely (sold all shares)');
      db.run('DELETE FROM user_holdings WHERE id = ?', [obj.id]);
    }
    // Record transaction
    db.run('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))', [currentUserId, stockId, 'sell', quantity, price, brokerage]);
    await persistDb();
    await fetchCashBalance();
    await fetchHoldings();
    await fetchTransactions();
  };

  // Add funds to cash balance
  const addFunds = async (amount: number) => {
    if (!currentUserId) throw new Error('No user');
    if (amount <= 0) throw new Error('Amount must be positive');
    const db = await getDb();
    // Ensure row exists for current user
    const res = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    if (!res[0] || !res[0].values.length) {
      db.run('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, ?)', [currentUserId, 10000000]);
    }
    db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [amount, currentUserId]);
    await persistDb();
    await fetchCashBalance();
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
    addFunds, // Export addFunds
  };
}; 