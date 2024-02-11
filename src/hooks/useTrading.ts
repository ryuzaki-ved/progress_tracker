import { useState, useEffect, useCallback } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Holding, Transaction, OptionContract, OptionTransaction, UserOptionHolding } from '../types';
import { useAuth } from './useAuth';
import { calculateOptionPrice, generateWeeklyOptionsContracts } from '../utils/optionUtils';

export const useTrading = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [cashBalance, setCashBalance] = useState<number>(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Options state
  const [optionContracts, setOptionContracts] = useState<OptionContract[]>([]);
  const [userOptionHoldings, setUserOptionHoldings] = useState<UserOptionHolding[]>([]);
  const [optionTransactions, setOptionTransactions] = useState<OptionTransaction[]>([]);

  // Add state for current index value
  const [currentIndexValue, setCurrentIndexValue] = useState<number>(10000);

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

  // Fetch current index value
  const fetchCurrentIndexValue = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    const indexRes = db.exec('SELECT index_value FROM index_history WHERE user_id = ? ORDER BY date DESC LIMIT 1', [currentUserId]);
    const value = indexRes[0]?.values?.[0]?.[0] ?? 10000;
    setCurrentIndexValue(Number(value));
  }, [currentUserId]);

  // Fetch options data (now takes currentIndexValue)
  const fetchOptionsData = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    // Use currentIndexValue from state
    const contracts = generateWeeklyOptionsContracts(currentIndexValue);
    // Insert contracts if not already present
    for (const contract of contracts) {
      const exists = db.exec('SELECT id FROM options_contracts WHERE strike_price = ? AND expiry_date = ? AND option_type = ?', [contract.strikePrice, contract.expiryDate, contract.optionType]);
      if (!exists[0] || !exists[0].values.length) {
        db.run('INSERT INTO options_contracts (strike_price, expiry_date, option_type, underlying_index_value_at_creation, created_at) VALUES (?, ?, ?, ?, ?)', [contract.strikePrice, contract.expiryDate, contract.optionType, contract.underlyingIndexValueAtCreation, contract.createdAt]);
      }
    }
    // Fetch all contracts for this week
    const weekContractsRes = db.exec('SELECT * FROM options_contracts WHERE expiry_date = ?', [contracts[0].expiryDate]);
    const weekContracts = (weekContractsRes[0]?.values || []).map((row: any[], i: number) => {
      const obj: any = {};
      weekContractsRes[0].columns.forEach((col: any, j: number) => (obj[col] = row[j]));
      return {
        id: obj.id,
        strikePrice: obj.strike_price,
        expiryDate: obj.expiry_date,
        optionType: obj.option_type,
        underlyingIndexValueAtCreation: obj.underlying_index_value_at_creation,
        createdAt: obj.created_at,
      } as OptionContract;
    });
    setOptionContracts(weekContracts);
    // Fetch user holdings
    const holdingsRes = db.exec('SELECT * FROM user_options_holdings WHERE user_id = ?', [currentUserId]);
    const holdings = (holdingsRes[0]?.values || []).map((row: any[], i: number) => {
      const obj: any = {};
      holdingsRes[0].columns.forEach((col: any, j: number) => (obj[col] = row[j]));
      return {
        id: obj.id,
        userId: obj.user_id,
        contractId: obj.contract_id,
        quantity: obj.quantity,
        type: obj.type,
        weightedAvgPremium: obj.weighted_avg_premium,
      } as UserOptionHolding;
    });
    setUserOptionHoldings(holdings);
    // Fetch user option transactions
    const txRes = db.exec('SELECT * FROM option_transactions WHERE user_id = ? ORDER BY timestamp DESC', [currentUserId]);
    const txs = (txRes[0]?.values || []).map((row: any[], i: number) => {
      const obj: any = {};
      txRes[0].columns.forEach((col: any, j: number) => (obj[col] = row[j]));
      return {
        id: obj.id,
        userId: obj.user_id,
        contractId: obj.contract_id,
        type: obj.type,
        quantity: obj.quantity,
        premiumPerUnit: obj.premium_per_unit,
        totalPremium: obj.total_premium,
        timestamp: obj.timestamp,
      } as OptionTransaction;
    });
    setOptionTransactions(txs);
  }, [currentUserId, currentIndexValue]);

  // Refetch index and options data when index changes
  useEffect(() => {
    fetchCurrentIndexValue();
  }, [fetchCurrentIndexValue]);

  useEffect(() => {
    fetchOptionsData();
  }, [fetchOptionsData]);

  // Buy option
  const buyOption = async (contractId: number, quantity: number, premium: number) => {
    if (!currentUserId) throw new Error('No user');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    const db = await getDb();
    // Get contract
    const contractRes = db.exec('SELECT * FROM options_contracts WHERE id = ?', [contractId]);
    if (!contractRes[0] || !contractRes[0].values.length) throw new Error('Contract not found');
    const obj: any = {};
    contractRes[0].columns.forEach((col: any, i: number) => (obj[col] = contractRes[0].values[0][i]));
    const contract: OptionContract = {
      id: obj.id,
      strikePrice: obj.strike_price,
      expiryDate: obj.expiry_date,
      optionType: obj.option_type,
      underlyingIndexValueAtCreation: obj.underlying_index_value_at_creation,
      createdAt: obj.created_at,
    };
    const totalPremium = premium * quantity;
    // Check cash balance
    const cashRes = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const cash = cashRes[0]?.values?.[0]?.[0] ?? 0;
    if (totalPremium > cash) throw new Error('Insufficient cash balance');
    // Deduct cash
    db.run('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?', [totalPremium, currentUserId]);
    // Update holdings (weighted avg)
    const holdingRes = db.exec('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?', [currentUserId, contractId, contract.optionType === 'CE' ? 'long_ce' : 'long_pe']);
    if (holdingRes[0]?.values?.length) {
      const row = holdingRes[0].values[0];
      const columns = holdingRes[0].columns;
      const obj: any = {};
      columns.forEach((col: any, i: number) => (obj[col] = row[i]));
      const prevQty = Number(obj.quantity);
      const prevAvg = Number(obj.weighted_avg_premium);
      const newQty = prevQty + quantity;
      const newAvg = ((prevQty * prevAvg) + (quantity * premium)) / newQty;
      db.run('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?', [newQty, newAvg, obj.id]);
    } else {
      db.run('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)', [currentUserId, contractId, quantity, contract.optionType === 'CE' ? 'long_ce' : 'long_pe', premium]);
    }
    // Record transaction
    db.run('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)', [currentUserId, contractId, 'buy', quantity, premium, totalPremium]);
    await persistDb();
    await fetchCashBalance();
    await fetchOptionsData();
  };

  // Write option
  const writeOption = async (contractId: number, quantity: number, premium: number) => {
    if (!currentUserId) throw new Error('No user');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    const db = await getDb();
    // Get contract
    const contractRes = db.exec('SELECT * FROM options_contracts WHERE id = ?', [contractId]);
    if (!contractRes[0] || !contractRes[0].values.length) throw new Error('Contract not found');
    const obj: any = {};
    contractRes[0].columns.forEach((col: any, i: number) => (obj[col] = contractRes[0].values[0][i]));
    const contract: OptionContract = {
      id: obj.id,
      strikePrice: obj.strike_price,
      expiryDate: obj.expiry_date,
      optionType: obj.option_type,
      underlyingIndexValueAtCreation: obj.underlying_index_value_at_creation,
      createdAt: obj.created_at,
    };
    const totalPremium = premium * quantity;
    // Collateral: strike price * quantity (for simplicity)
    const collateral = contract.strikePrice * quantity;
    // Check cash balance
    const cashRes = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = ?', [currentUserId]);
    const cash = cashRes[0]?.values?.[0]?.[0] ?? 0;
    if (collateral > cash) throw new Error('Insufficient cash for collateral');
    // Deduct collateral, add premium
    db.run('UPDATE user_settings SET cash_balance = cash_balance - ? + ? WHERE user_id = ?', [collateral, totalPremium, currentUserId]);
    // Update holdings (weighted avg)
    const holdingType = contract.optionType === 'CE' ? 'short_ce' : 'short_pe';
    const holdingRes = db.exec('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?', [currentUserId, contractId, holdingType]);
    if (holdingRes[0]?.values?.length) {
      const row = holdingRes[0].values[0];
      const columns = holdingRes[0].columns;
      const obj: any = {};
      columns.forEach((col: any, i: number) => (obj[col] = row[i]));
      const prevQty = Number(obj.quantity);
      const prevAvg = Number(obj.weighted_avg_premium);
      const newQty = prevQty + quantity;
      const newAvg = ((prevQty * prevAvg) + (quantity * premium)) / newQty;
      db.run('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?', [newQty, newAvg, obj.id]);
    } else {
      db.run('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)', [currentUserId, contractId, quantity, holdingType, premium]);
    }
    // Record transaction
    db.run('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)', [currentUserId, contractId, 'write', quantity, premium, totalPremium]);
    await persistDb();
    await fetchCashBalance();
    await fetchOptionsData();
  };

  // Settle expired options (run on load/periodically)
  const settleExpiredOptions = useCallback(async () => {
    if (!currentUserId) return;
    const db = await getDb();
    const now = new Date();
    // Find expired contracts
    const expiredRes = db.exec('SELECT * FROM options_contracts WHERE expiry_date < ?', [now.toISOString()]);
    const expiredContracts = (expiredRes[0]?.values || []).map((row: any[], i: number) => {
      const obj: any = {};
      expiredRes[0].columns.forEach((col: any, j: number) => (obj[col] = row[j]));
      return obj;
    });
    for (const contract of expiredContracts) {
      // Get all user holdings for this contract
      const holdingsRes = db.exec('SELECT * FROM user_options_holdings WHERE contract_id = ?', [contract.id]);
      const holdings = (holdingsRes[0]?.values || []).map((row: any[], i: number) => {
        const obj: any = {};
        holdingsRes[0].columns.forEach((col: any, j: number) => (obj[col] = row[j]));
        return obj;
      });
      // Get index value at expiry (use latest before expiry)
      const indexRes = db.exec('SELECT index_value FROM index_history WHERE date <= ? ORDER BY date DESC LIMIT 1', [contract.expiry_date]);
      const expiryIndex = indexRes[0]?.values?.[0]?.[0] ?? contract.underlying_index_value_at_creation;
      for (const holding of holdings) {
        let pnl = 0;
        if (holding.type === 'long_ce') {
          pnl = Math.max(0, expiryIndex - contract.strike_price) * holding.quantity;
        } else if (holding.type === 'short_ce') {
          pnl = -Math.max(0, expiryIndex - contract.strike_price) * holding.quantity + holding.weighted_avg_premium * holding.quantity + contract.strike_price * holding.quantity; // return collateral
        } else if (holding.type === 'long_pe') {
          pnl = Math.max(0, contract.strike_price - expiryIndex) * holding.quantity;
        } else if (holding.type === 'short_pe') {
          pnl = -Math.max(0, contract.strike_price - expiryIndex) * holding.quantity + holding.weighted_avg_premium * holding.quantity + contract.strike_price * holding.quantity; // return collateral
        }
        // Update user cash balance
        db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [pnl, holding.user_id]);
        // Remove holding
        db.run('DELETE FROM user_options_holdings WHERE id = ?', [holding.id]);
      }
    }
    await persistDb();
    await fetchCashBalance();
    await fetchOptionsData();
  }, [currentUserId]);

  // Exit option position
  const exitOptionPosition = async (holdingId: number, quantity: number) => {
    if (!currentUserId) throw new Error('No user');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    const db = await getDb();
    // Get holding
    const holdingRes = db.exec('SELECT * FROM user_options_holdings WHERE id = ?', [holdingId]);
    if (!holdingRes[0] || !holdingRes[0].values.length) throw new Error('Holding not found');
    const obj: any = {};
    holdingRes[0].columns.forEach((col: any, i: number) => (obj[col] = holdingRes[0].values[0][i]));
    if (quantity > obj.quantity) throw new Error('Not enough quantity to exit');
    // Get contract
    const contractRes = db.exec('SELECT * FROM options_contracts WHERE id = ?', [obj.contract_id]);
    if (!contractRes[0] || !contractRes[0].values.length) throw new Error('Contract not found');
    const contract: OptionContract = {
      id: contractRes[0].values[0][0],
      strikePrice: contractRes[0].values[0][1],
      expiryDate: contractRes[0].values[0][2],
      optionType: contractRes[0].values[0][3],
      underlyingIndexValueAtCreation: contractRes[0].values[0][4],
      createdAt: contractRes[0].values[0][5],
    };
    // For short positions, return collateral
    if (obj.type === 'short_ce' || obj.type === 'short_pe') {
      const collateral = contract.strikePrice * quantity;
      db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [collateral, currentUserId]);
    }
    // For long positions, add current premium × quantity to cash balance
    if (obj.type === 'long_ce' || obj.type === 'long_pe') {
      // Use latest index value for premium
      const indexRes = db.exec('SELECT index_value FROM index_history WHERE user_id = ? ORDER BY date DESC LIMIT 1', [currentUserId]);
      const currentIndexValue = indexRes[0]?.values?.[0]?.[0] ?? contract.underlyingIndexValueAtCreation;
      const currentPremium = calculateOptionPrice(
        currentIndexValue,
        contract.strikePrice,
        contract.expiryDate,
        contract.optionType,
        contract.createdAt
      );
      const proceeds = currentPremium * quantity;
      db.run('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?', [proceeds, currentUserId]);
    }
    // Reduce or remove holding
    if (obj.quantity > quantity) {
      db.run('UPDATE user_options_holdings SET quantity = ? WHERE id = ?', [obj.quantity - quantity, holdingId]);
    } else {
      db.run('DELETE FROM user_options_holdings WHERE id = ?', [holdingId]);
    }
    // Record exit transaction
    db.run('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)', [currentUserId, contract.id, 'exit', quantity, obj.weighted_avg_premium, obj.weighted_avg_premium * quantity]);
    await persistDb();
    await fetchCashBalance();
    await fetchOptionsData();
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCashBalance(),
      fetchHoldings(),
      fetchTransactions(),
      fetchOptionsData(),
      settleExpiredOptions(),
    ]).finally(() => setLoading(false));
  }, [fetchCashBalance, fetchHoldings, fetchTransactions, fetchOptionsData, settleExpiredOptions]);

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
    optionContracts,
    userOptionHoldings,
    optionTransactions,
    fetchOptionsData,
    buyOption,
    writeOption,
    settleExpiredOptions,
    exitOptionPosition,
    currentIndexValue,
  };
}; 