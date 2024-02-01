import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Archive, 
  Edit3, 
  Trash2, 
  Copy, 
  Tag,
  Grid3X3,
  List,
  StickyNote,
  Hash,
  Folder
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AddEditNoteModal } from '../components/modals/AddEditNoteModal';
import { useNotes } from '../hooks/useNotes';
import { Note } from '../types';
import { format } from 'date-fns';

export const Notes: React.FC = () => {
  const { 
    notes, 
    loading, 
    createNote, 
    updateNote, 
    deleteNote, 
    togglePin, 
    toggleArchive, 
    duplicateNote,
    searchNotes,
    getNotesByCategory,
    getCategories,
    getAllTags
  } = useNotes();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  const categories = getCategories();
  const allTags = getAllTags();

  // Filter notes based on search, category, tag, and archive status
  let filteredNotes = notes.filter(note => note.isArchived === showArchived);
  
  if (searchQuery) {
    filteredNotes = searchNotes(searchQuery).filter(note => note.isArchived === showArchived);
  }
  
  if (selectedCategory !== 'all') {
    filteredNotes = filteredNotes.filter(note => note.category === selectedCategory);
  }
  
  if (selectedTag !== 'all') {
    filteredNotes = filteredNotes.filter(note => note.tags.includes(selectedTag));
  }

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
  };

  const handleSubmitNote = async (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await createNote(noteData);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note && window.confirm(`Delete note "${note.title}"? This cannot be undone.`)) {
      await deleteNote(noteId);
    }
  };

  const NoteCard: React.FC<{ note: Note; index: number }> = ({ note, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card 
        hover 
        className={`h-full cursor-pointer border-l-4 relative overflow-hidden ${
          note.isPinned ? 'ring-2 ring-yellow-200 dark:ring-yellow-700' : ''
        }`}
        style={{ borderLeftColor: note.color }}
        onClick={() => handleEditNote(note)}
      >
        {/* Pin indicator */}
        {note.isPinned && (
          <div className="absolute top-2 right-2">
            <Pin className="w-4 h-4 text-yellow-500 fill-current" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                {note.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Folder className="w-3 h-3" />
                <span>{note.category}</span>
                <span>•</span>
                <span>{format(note.updatedAt, 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
            {note.content}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                className={note.isPinned ? 'text-yellow-600' : 'text-gray-400'}
              >
                <Pin className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNote(note.id);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArchive(note.id);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Archive className="w-3 h-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const NoteListItem: React.FC<{ note: Note; index: number }> = ({ note, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card 
        hover 
        className={`cursor-pointer border-l-4 ${
          note.isPinned ? 'ring-2 ring-yellow-200 dark:ring-yellow-700' : ''
        }`}
        style={{ borderLeftColor: note.color }}
        onClick={() => handleEditNote(note)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {note.isPinned && <Pin className="w-4 h-4 text-yellow-500 fill-current" />}
              <h3 className="font-semibold text-gray-900 dark:text-white">{note.title}</h3>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                {note.category}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {note.content}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{format(note.updatedAt, 'MMM d, yyyy h:mm a')}</span>
              {note.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Hash className="w-3 h-3" />
                  <span>{note.tags.slice(0, 2).join(', ')}</span>
                  {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              className={note.isPinned ? 'text-yellow-600' : 'text-gray-400'}
            >
              <Pin className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                duplicateNote(note.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleArchive(note.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Archive className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <StickyNote className="w-8 h-8 mr-3 text-blue-600" />
            Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Capture and organize your thoughts, ideas, and important information
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters & Search</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Search notes..."
              />
            </div>

            {/* Category Filter */}
            <div>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <select 
                value={selectedTag} 
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Archive Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showArchived ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="w-full"
              >
                <Archive className="w-4 h-4 mr-2" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </Button>
            </div>
          </div>
          
          {/* Active Filters Summary */}
          {(searchQuery || selectedCategory !== 'all' || selectedTag !== 'all' || showArchived) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <span className="font-medium">Active filters:</span>
              {searchQuery && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Search: "{searchQuery}"</span>}
              {selectedCategory !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Category: {selectedCategory}</span>}
              {selectedTag !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Tag: #{selectedTag}</span>}
              {showArchived && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Archived</span>}
              <span className="ml-2 text-gray-500">({filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} shown)</span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {notes.filter(n => !n.isArchived).length}
            </div>
            <div className="text-sm text-gray-600">Active Notes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {notes.filter(n => n.isPinned && !n.isArchived).length}
            </div>
            <div className="text-sm text-gray-600">Pinned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {categories.length}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {allTags.length}
            </div>
            <div className="text-sm text-gray-600">Tags</div>
          </div>
        </div>
      </Card>

      {/* Notes Content */}
      {filteredNotes.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || selectedCategory !== 'all' || selectedTag !== 'all' 
              ? 'No notes match your filters' 
              : showArchived 
              ? 'No archived notes' 
              : 'Start taking notes'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory !== 'all' || selectedTag !== 'all'
              ? 'Try adjusting your search or filters'
              : showArchived
              ? 'Archive notes to see them here'
              : 'Create your first note to capture your thoughts and ideas'
            }
          </p>
          {!showArchived && (
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Note
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-4 flex items-center">
                <Pin className="w-5 h-5 mr-2 fill-current" />
                Pinned Notes
              </h2>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-3'
              }>
                {pinnedNotes.map((note, index) => 
                  viewMode === 'grid' 
                    ? <NoteCard key={note.id} note={note} index={index} />
                    : <NoteListItem key={note.id} note={note} index={index} />
                )}
              </div>
            </div>
          )}

          {/* Regular Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                  <StickyNote className="w-5 h-5 mr-2" />
                  {showArchived ? 'Archived Notes' : 'All Notes'}
                </h2>
              )}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-3'
              }>
                {unpinnedNotes.map((note, index) => 
                  viewMode === 'grid' 
                    ? <NoteCard key={note.id} note={note} index={index} />
                    : <NoteListItem key={note.id} note={note} index={index} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      <AddEditNoteModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitNote}
        initialNote={editingNote || undefined}
        categories={categories}
        allTags={allTags}
      />
    </div>
  );
};