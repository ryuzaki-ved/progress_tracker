import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { JournalEntry } from '../types';

const currentUserId = 1;

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeJournal = async () => {
    try {
      const db = await getDb();
      
      // Create journal_entries table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL DEFAULT 'daily',
          date TEXT NOT NULL,
          title TEXT,
          content TEXT NOT NULL,
          mood TEXT,
          prompts TEXT,
          tags TEXT,
          is_private BOOLEAN DEFAULT true,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await persistDb();
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize journal');
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY date DESC',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const entriesList: JournalEntry[] = rows.map((row: any[]) => {
        const entryObj: any = {};
        columns.forEach((col, i) => (entryObj[col] = row[i]));
        
        return {
          id: entryObj.id.toString(),
          userId: entryObj.user_id.toString(),
          type: entryObj.type,
          date: new Date(entryObj.date),
          title: entryObj.title,
          content: entryObj.content,
          mood: entryObj.mood,
          prompts: entryObj.prompts ? JSON.parse(entryObj.prompts) : undefined,
          tags: entryObj.tags ? JSON.parse(entryObj.tags) : [],
          isPrivate: Boolean(entryObj.is_private),
          createdAt: new Date(entryObj.created_at),
          updatedAt: new Date(entryObj.updated_at),
        };
      });
      
      setEntries(entriesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      const db = await getDb();
      
      db.run(
        `INSERT INTO journal_entries (user_id, type, date, title, content, mood, prompts, tags, is_private) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          currentUserId,
          entryData.type,
          entryData.date.toISOString(),
          entryData.title || null,
          entryData.content,
          entryData.mood || null,
          entryData.prompts ? JSON.stringify(entryData.prompts) : null,
          entryData.tags ? JSON.stringify(entryData.tags) : null,
          entryData.isPrivate,
        ]
      );
      
      await persistDb();
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal entry');
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    setError(null);
    try {
      const db = await getDb();
      
      const setClause = [];
      const values = [];
      
      if (updates.title !== undefined) {
        setClause.push('title = ?');
        values.push(updates.title);
      }
      if (updates.content !== undefined) {
        setClause.push('content = ?');
        values.push(updates.content);
      }
      if (updates.mood !== undefined) {
        setClause.push('mood = ?');
        values.push(updates.mood);
      }
      if (updates.prompts !== undefined) {
        setClause.push('prompts = ?');
        values.push(JSON.stringify(updates.prompts));
      }
      if (updates.tags !== undefined) {
        setClause.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }
      if (updates.isPrivate !== undefined) {
        setClause.push('is_private = ?');
        values.push(updates.isPrivate);
      }
      
      setClause.push('updated_at = datetime("now")');
      values.push(id, currentUserId);
      
      db.run(
        `UPDATE journal_entries SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
      
      await persistDb();
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journal entry');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
        [id, currentUserId]
      );
      await persistDb();
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
    initializeJournal();
  }, []);

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