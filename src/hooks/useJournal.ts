import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { JournalEntry } from '../types';

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/journal', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch journal entries');
      const result = await response.json();
      
      const entriesList = result.data.map((e: any) => ({
        ...e,
        date: new Date(e.date),
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      }));
      setEntries(entriesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setError(null);
    try {
      const payload = {
          ...entryData,
          date: entryData.date.toISOString(),
      };
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal entry');
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) return;
    setError(null);
    try {
      const payload = { ...updates };
      if (payload.date) payload.date = payload.date.toISOString() as any;
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journal entry');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/journal/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journal entry');
      throw err;
    }
  };

  const getEntryByDate = (date: Date, type: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(entry => 
      entry.date.toISOString().split('T')[0] === dateStr && entry.type === type
    );
  };

  useEffect(() => {
    if (user) {
        fetchEntries();
    } else {
        setEntries([]);
    }
    // eslint-disable-next-line
  }, [user]);

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    refetch: fetchEntries,
  };
};
