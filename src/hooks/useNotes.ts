import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { Note } from '../types';

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`
  });

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notes', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notes');
      const result = await response.json();
      
      const notesList = result.data.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }));
      setNotes(notesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(noteData)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      throw err;
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) await updateNote(id, { isPinned: !note.isPinned });
  };

  const toggleArchive = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) await updateNote(id, { isArchived: !note.isArchived });
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
    if (user) {
        fetchNotes();
    } else {
        setNotes([]);
    }
    // eslint-disable-next-line
  }, [user]);

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
