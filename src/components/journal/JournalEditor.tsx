import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Lock, Unlock, Heart, Lightbulb, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { JournalEntry } from '../../types';

interface JournalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialEntry?: JournalEntry;
  date: Date;
  type: 'daily' | 'weekly' | 'monthly';
}

const MOOD_OPTIONS = [
  { value: 'great', emoji: '🌟', label: 'Great', color: 'text-green-600' },
  { value: 'good', emoji: '😊', label: 'Good', color: 'text-blue-600' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: 'text-yellow-600' },
  { value: 'tough', emoji: '😔', label: 'Tough', color: 'text-orange-600' },
  { value: 'chaotic', emoji: '🌪️', label: 'Chaotic', color: 'text-red-600' },
];

const PROMPTS = {
  daily: [
    { key: 'gratitude', icon: Heart, label: 'What am I grateful for today?' },
    { key: 'whatWorked', icon: Lightbulb, label: 'What worked well today?' },
    { key: 'whereStruggled', icon: Target, label: 'Where did I struggle?' },
  ],
  weekly: [
    { key: 'whatWorked', icon: Lightbulb, label: 'What worked well this week?' },
    { key: 'whereStruggled', icon: Target, label: 'Where did I struggle this week?' },
    { key: 'willImprove', icon: Target, label: 'What will I improve next week?' },
  ],
  monthly: [
    { key: 'whatWorked', icon: Lightbulb, label: 'What worked well this month?' },
    { key: 'whereStruggled', icon: Target, label: 'Where did I struggle this month?' },
    { key: 'willImprove', icon: Target, label: 'What will I focus on next month?' },
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  date,
  type,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('okay');
  const [prompts, setPrompts] = useState<JournalEntry['prompts']>({});
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title || '');
      setContent(initialEntry.content);
      setMood(initialEntry.mood || 'okay');
      setPrompts(initialEntry.prompts || {});
      setIsPrivate(initialEntry.isPrivate);
    } else {
      // Reset form
      setTitle('');
      setContent('');
      setMood('okay');
      setPrompts({});
      setIsPrivate(true);
      setCurrentPromptIndex(0);
    }
  }, [initialEntry, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        type,
        date,
        title: title.trim() || undefined,
        content: content.trim(),
        mood,
        prompts: Object.keys(prompts).length > 0 ? prompts : undefined,
        tags: [],
        isPrivate,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = (key: string, value: string) => {
    setPrompts(prev => ({ ...prev, [key]: value }));
  };

  const currentPrompts = PROMPTS[type];
  const currentPrompt = currentPrompts[currentPromptIndex];

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
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100">
                  {type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Monthly'} Reflection
                </h2>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="text-amber-700 dark:text-amber-300"
                >
                  {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                  How was your {type === 'daily' ? 'day' : type === 'weekly' ? 'week' : 'month'}?
                </label>
                <div className="flex space-x-3">
                  {MOOD_OPTIONS.map((option) => (
                    <motion.button
                      key={option.value}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        mood === option.value
                          ? 'border-amber-400 bg-amber-100 dark:bg-amber-800/50'
                          : 'border-amber-200 dark:border-amber-600 hover:border-amber-300 dark:hover:border-amber-500'
                      }`}
                      onClick={() => setMood(option.value as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className={`text-xs font-medium ${option.color}`}>
                        {option.label}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-200 dark:border-amber-600 rounded-lg bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-500 dark:placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-serif"
                  placeholder="Give this entry a title..."
                />
              </div>

              {/* Guided Prompts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Guided Reflection
                  </label>
                  <div className="flex space-x-1">
                    {currentPrompts.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPromptIndex
                            ? 'bg-amber-500'
                            : 'bg-amber-200 dark:bg-amber-600'
                        }`}
                        onClick={() => setCurrentPromptIndex(index)}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPromptIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                      <currentPrompt.icon className="w-4 h-4" />
                      <span className="font-medium">{currentPrompt.label}</span>
                    </div>
                    <textarea
                      value={prompts[currentPrompt.key] || ''}
                      onChange={(e) => updatePrompt(currentPrompt.key, e.target.value)}
                      className="w-full px-4 py-3 border border-amber-200 dark:border-amber-600 rounded-lg bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-500 dark:placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-serif resize-none journal-textarea"
                      rows={3}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPromptIndex(Math.max(0, currentPromptIndex - 1))}
                    disabled={currentPromptIndex === 0}
                    className="text-amber-600 dark:text-amber-400"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPromptIndex(Math.min(currentPrompts.length - 1, currentPromptIndex + 1))}
                    disabled={currentPromptIndex === currentPrompts.length - 1}
                    className="text-amber-600 dark:text-amber-400"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Free-form Content */}
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Additional thoughts
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-200 dark:border-amber-600 rounded-lg bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-500 dark:placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-serif resize-none journal-textarea"
                  rows={6}
                  placeholder="What else is on your mind? Let your thoughts flow..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-amber-200 dark:border-amber-600">
              <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>{isPrivate ? 'Private entry' : 'Shared entry'}</span>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !content.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Entry
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