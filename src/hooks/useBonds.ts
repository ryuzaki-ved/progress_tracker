import { useState, useEffect } from 'react';

export interface Bond {
  id: number;
  creator_id: number;
  challenger_id: number;
  creator_task_id: number;
  challenger_task_id: number | null;
  creator_amount: number;
  challenger_amount: number | null;
  creator_completed: boolean;
  challenger_completed: boolean;
  due_date: string;
  status: 'pending_acceptance' | 'active' | 'completed';
  winner: 'creator' | 'challenger' | 'both' | 'none' | null;
  created_at: string;
  completed_at: string | null;
}

export const useBonds = () => {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('lifestock_token');

  const fetchBonds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/bonds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      console.log('Bonds fetch response:', result);
      if (result.error) throw new Error(result.error);
      setBonds(result.data || []);
    } catch (err: any) {
      console.error('Bonds fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBond = async (challengerId: number, creatorTaskId: number, creatorAmount: number, dueDate: string) => {
    try {
      const response = await fetch('/api/bonds/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengerId,
          creatorTaskId,
          creatorAmount,
          dueDate
        })
      });
      const result = await response.json();
      console.log('Bond creation response:', result);
      if (result.error) throw new Error(result.error);
      await fetchBonds();
      return result.data;
    } catch (err: any) {
      console.error('Bond creation failed:', err);
      setError(err.message);
      throw err;
    }
  };

  const acceptBond = async (bondId: number, challengerTaskId: number, challengerAmount: number) => {
    try {
      const response = await fetch(`/api/bonds/${bondId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengerTaskId,
          challengerAmount
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      await fetchBonds();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completeBond = async (bondId: number) => {
    try {
      const response = await fetch(`/api/bonds/${bondId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      await fetchBonds();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const forfeitBond = async (bondId: number) => {
    try {
      const response = await fetch(`/api/bonds/${bondId}/forfeit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      await fetchBonds();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchBonds();
    }
  }, [token]);

  return {
    bonds,
    loading,
    error,
    fetchBonds,
    createBond,
    acceptBond,
    completeBond,
    forfeitBond
  };
};
