import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Tag, Pin, Palette, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Note } from '../../types';

interface AddEditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialNote?: Note;
  categories: string[];
  allTags: string[];
}

const NOTE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#F97316', // Orange-600
];

const DEFAULT_CATEGORIES = [
  'General',
  'Work',
  'Personal',
  'Ideas',
  'Meeting Notes',
  'Research',
  'Todo',
  'Archive',
];

export const AddEditNoteModal: React.FC<AddEditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialNote,
  categories,
  allTags,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [] as string[],
    isPinned: false,
    isArchived: false,
    color: '#3B82F6',
  });
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setFormData({
        title: initialNote.title,
        content: initialNote.content,
        category: initialNote.category,
        tags: [...initialNote.tags],
        isPinned: initialNote.isPinned,
        isArchived: initialNote.isArchived,
        color: initialNote.color,
      });
    } else if (isOpen) {
      setFormData({
        title: '',
        content: '',
        category: 'General',
        tags: [],
        isPinned: false,
        isArchived: false,
        color: '#3B82F6',
      });
    }
  }, [initialNote, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setShowNewCategory(false);
      setNewCategory('');
    }
  };

  const availableCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {initialNote ? 'Edit Note' : 'Create New Note'}
                  </h2>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {initialNote ? 'Update your note' : 'Capture your thoughts and ideas'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-blue-200 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 placeholder-blue-500 dark:placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
                  placeholder="Enter note title..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Content *
                </label>
                <textarea
                  id="note-content"
                  className="journal-textarea w-full min-h-[120px] px-4 py-3 border border-blue-200 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 placeholder-blue-500 dark:placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold resize-y"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note here..."
                  required
                  style={{ background: `linear-gradient(0deg, ${formData.color}10 0%, ${formData.color}10 100%), ${formData.color}10` }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Markdown supported:</strong> <br />
                  <span><code>**bold**</code> for <strong>bold</strong>, <code>*italic*</code> for <em>italic</em>, <code>~~strikethrough~~</code> for <del>strikethrough</del>, <code>__underline__</code> for <u>underline</u></span><br />
                  <span><code>[ ]</code> Task item (checkbox), <code>[x]</code> Completed task item (checked)</span>
                </div>
              </div>

              {/* Category and Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Category
                  </label>
                  <div className="space-y-2">
                    <select
                      value={showNewCategory ? '' : formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewCategory(true);
                        } else {
                          setFormData(prev => ({ ...prev, category: e.target.value }));
                          setShowNewCategory(false);
                        }
                      }}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                    >
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="new">+ Add New Category</option>
                    </select>
                    
                    {showNewCategory && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                          className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 placeholder-blue-500 dark:placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Category name..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCategory}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {NOTE_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-400 scale-110 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 placeholder-blue-500 dark:placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Add a tag..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTag}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Existing tags */}
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {allTags.filter(tag => !formData.tags.includes(tag)).slice(0, 10).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center">
                    <Pin className="w-4 h-4 mr-1" />
                    Pin this note
                  </span>
                </label>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}
            </form>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-blue-200 dark:border-blue-600">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {formData.content.length} characters
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {initialNote ? 'Update Note' : 'Create Note'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};