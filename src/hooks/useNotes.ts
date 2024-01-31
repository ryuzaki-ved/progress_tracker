import { useState, useEffect } from 'react';
import { getDb, persistDb } from '../lib/sqlite';
import { Note } from '../types';

const currentUserId = 1;

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC',
        [currentUserId]
      );
      
      const rows = res[0]?.values || [];
      const columns = res[0]?.columns || [];
      
      const notesList: Note[] = rows.map((row: any[]) => {
        const noteObj: any = {};
        columns.forEach((col, i) => (noteObj[col] = row[i]));
        
        return {
          id: noteObj.id.toString(),
          userId: noteObj.user_id.toString(),
          title: noteObj.title,
          content: noteObj.content,
          category: noteObj.category || 'General',
          tags: noteObj.tags ? JSON.parse(noteObj.tags) : [],
          isPinned: Boolean(noteObj.is_pinned),
          isArchived: Boolean(noteObj.is_archived),
          color: noteObj.color || '#3B82F6',
          createdAt: new Date(noteObj.created_at),
          updatedAt: new Date(noteObj.updated_at),
        };
      });
      
      setNotes(notesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      const db = await getDb();
      
      db.run(
        `INSERT INTO notes (user_id, title, content, category, tags, is_pinned, is_archived, color) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          currentUserId,
          noteData.title,
          noteData.content,
          noteData.category,
          JSON.stringify(noteData.tags),
          noteData.isPinned,
          noteData.isArchived,
          noteData.color,
        ]
      );
      
      await persistDb();
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
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
      if (updates.category !== undefined) {
        setClause.push('category = ?');
        values.push(updates.category);
      }
      if (updates.tags !== undefined) {
        setClause.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }
      if (updates.isPinned !== undefined) {
        setClause.push('is_pinned = ?');
        values.push(updates.isPinned);
      }
      if (updates.isArchived !== undefined) {
        setClause.push('is_archived = ?');
        values.push(updates.isArchived);
      }
      if (updates.color !== undefined) {
        setClause.push('color = ?');
        values.push(updates.color);
      }
      
      setClause.push('updated_at = datetime("now")');
      values.push(id, currentUserId);
      
      db.run(
        `UPDATE notes SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
      
      await persistDb();
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    setError(null);
    try {
      const db = await getDb();
      db.run(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [id, currentUserId]
      );
      await persistDb();
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      throw err;
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isPinned: !note.isPinned });
    }
  };

  const toggleArchive = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isArchived: !note.isArchived });
    }
  };

  const duplicateNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await createNote({
        title: `${note.title} (Copy)`,
        content: note.content,
        category: note.category,
        tags: [...note.tags],
        isPinned: false,
        isArchived: false,
        color: note.color,
      });
    }
  };

  const searchNotes = (query: string) => {
    if (!query.trim()) return notes;
    
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      note.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getNotesByCategory = (category: string) => {
    if (category === 'all') return notes;
    return notes.filter(note => note.category === category);
  };

  const getCategories = () => {
    const categories = new Set(notes.map(note => note.category));
    return Array.from(categories).sort();
  };

  const getAllTags = () => {
    const tags = new Set(notes.flatMap(note => note.tags));
    return Array.from(tags).sort();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    duplicateNote,
    searchNotes,
    getNotesByCategory,
    getCategories,
    getAllTags,
    refetch: fetchNotes,
  };
};