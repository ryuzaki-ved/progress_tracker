import { useState, useEffect, useCallback } from 'react';
import { Holding, Transaction, OptionContract, OptionTransaction, UserOptionHolding } from '../types';
import { useAuth } from './useAuth';

export const useTrading = () => {
  const { user } = useAuth();
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [optionContracts, setOptionContracts] = useState<OptionContract[]>([]);
  const [userOptionHoldings, setUserOptionHoldings] = useState<UserOptionHolding[]>([]);
  const [optionTransactions, setOptionTransactions] = useState<OptionTransaction[]>([]);
  const [optionPnlHistory, setOptionPnlHistory] = useState<any[]>([]);
  const [currentIndexValue, setCurrentIndexValue] = useState<number | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchCashBalance = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/trading/cash', { headers: getHeaders() });
      if (response.ok) {
          const result = await response.json();
          setCashBalance(result.data);
      }
    } catch (err) { console.error(err); }
  }, [user]);

  const fetchHoldings = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/trading/holdings', { headers: getHeaders() });
      if (response.ok) {
          const result = await response.json();
          setHoldings(result.data.map((h: any) => ({
            id: h.id,
            userId: h.user_id,
            stockId: h.stock_id,
            quantity: Number(h.quantity),
            weightedAvgBuyPrice: Number(h.weighted_avg_buy_price),
            createdAt: h.created_at,
            updatedAt: h.updated_at,
          })));
      }
    } catch(err) { console.error(err); }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/trading/transactions', { headers: getHeaders() });
      if (response.ok) {
        const result = await response.json();
        setTransactions(result.data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            stockId: t.stock_id,
            type: t.type,
            quantity: Number(t.quantity),
            price: Number(t.price),
            brokerageFee: Number(t.brokerage_fee),
            timestamp: t.timestamp,
        })));
      }
    } catch(err) { console.error(err); }
  }, [user]);

  const fetchCurrentIndexValue = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/index', { headers: getHeaders() });
      if (response.ok) {
          const result = await response.json();
          const rawHistory = result.data;
          if (rawHistory && rawHistory.length > 0) {
              const latest = rawHistory[rawHistory.length - 1];
              setCurrentIndexValue(Number(latest.close));
          } else {
              setCurrentIndexValue(null);
          }
      }
    } catch(err) { console.error(err); }
  }, [user]);

  const fetchOptionsData = useCallback(async () => {
    if (!user || currentIndexValue === null) return;
    try {
      const response = await fetch('/api/trading/options/fetch', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ currentIndexValue })
      });
      if (response.ok) {
          const result = await response.json();
          const { contracts, holdings, transactions, pnlHistory } = result.data;
          
          setOptionContracts(contracts.map((c:any) => ({
              id: c.id,
              strikePrice: c.strike_price,
              expiryDate: c.expiry_date,
              optionType: c.option_type,
              underlyingIndexValueAtCreation: c.underlying_index_value_at_creation,
              createdAt: c.created_at
          })));
          
          setUserOptionHoldings(holdings.map((h:any) => ({
              id: h.id,
              userId: h.user_id,
              contractId: h.contract_id,
              quantity: h.quantity,
              type: h.type,
              weightedAvgPremium: h.weighted_avg_premium
          })));
          
          setOptionTransactions(transactions.map((t:any) => ({
              id: t.id,
              userId: t.user_id,
              contractId: t.contract_id,
              type: t.type,
              quantity: t.quantity,
              premiumPerUnit: t.premium_per_unit,
              totalPremium: t.total_premium,
              timestamp: t.timestamp
          })));
          
          setOptionPnlHistory(pnlHistory);
      }
    } catch(err) { console.error(err); }
  }, [user, currentIndexValue]);

  useEffect(() => {
    fetchCurrentIndexValue();
  }, [fetchCurrentIndexValue]);

  useEffect(() => {
    fetchOptionsData();
  }, [fetchOptionsData]);

  const buyOption = async (contractId: number, quantity: number, premium: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/options/buy', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contractId, quantity, premium })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    await fetchCashBalance();
    await fetchOptionsData();
  };

  const writeOption = async (contractId: number, quantity: number, premium: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/options/write', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contractId, quantity, premium })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    await fetchCashBalance();
    await fetchOptionsData();
  };

  const settleExpiredOptions = useCallback(async () => {
    if (!user) return;
    try {
        await fetch('/api/trading/options/settle-expired', { method: 'POST', headers: getHeaders() });
        await fetchCashBalance();
        await fetchOptionsData();
    } catch(err) {}
  }, [user, fetchCashBalance, fetchOptionsData]);

  const exitOptionPosition = async (holdingId: number, quantity: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/options/exit', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ holdingId, quantity, currentIndexValue })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    await fetchCashBalance();
    await fetchOptionsData();
  };

  const resetOptionsData = async () => {
    if (!user) return;
    await fetch('/api/trading/options/reset', { method: 'POST', headers: getHeaders() });
    await fetchOptionsData();
  };

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

  const buyStock = async (stockId: number, quantity: number, price: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/buy-stock', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ stockId, quantity, price })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    await fetchCashBalance();
    await fetchHoldings();
    await fetchTransactions();
  };

  const sellStock = async (stockId: number, quantity: number, price: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/sell-stock', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ stockId, quantity, price })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    await fetchCashBalance();
    await fetchHoldings();
    await fetchTransactions();
  };

  const addFunds = async (amount: number) => {
    if (!user) throw new Error('No user');
    const response = await fetch('/api/trading/add-funds', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount })
    });
    if (!response.ok) throw new Error((await response.json()).error);
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
    addFunds,
    optionContracts,
    userOptionHoldings,
    optionTransactions,
    optionPnlHistory,
    fetchOptionsData,
    buyOption,
    writeOption,
    settleExpiredOptions,
    exitOptionPosition,
    currentIndexValue,
    resetOptionsData,
  };
};
