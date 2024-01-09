import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Lock, Edit3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { JournalEntry } from '../../types';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onEditEntry: (entry: JournalEntry) => void;
  onCreateEntry: (date: Date, type: 'daily' | 'weekly' | 'monthly') => void;
}

const MOOD_EMOJIS = {
  great: '🌟',
  good: '😊',
  okay: '😐',
  tough: '😔',
  chaotic: '🌪️',
};

export const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  onEditEntry,
  onCreateEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterMood, setFilterMood] = useState<'all' | JournalEntry['mood']>('all');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    
    return matchesSearch && matchesType && matchesMood;
  });

  const getRelativeDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    if (isThisMonth(date)) return format(date, 'MMM d');
    return format(date, 'MMM d, yyyy');
  };

  const getEntryPreview = (entry: JournalEntry) => {
    if (entry.prompts?.whatWorked) {
      return entry.prompts.whatWorked.substring(0, 100) + '...';
    }
    return entry.content.substring(0, 100) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Journal Timeline</h2>
          <p className="text-gray-600 dark:text-gray-400">Your reflection journey</p>
        </div>
        <Button onClick={() => onCreateEntry(new Date(), 'daily')}>
          <Edit3 className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-amber-200 dark:border-amber-600 rounded-lg bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-500 dark:placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Search your thoughts..."
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-amber-200 dark:border-amber-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value as any)}
              className="border border-amber-200 dark:border-amber-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
            >
              <option value="all">All Moods</option>
              <option value="great">🌟 Great</option>
              <option value="good">😊 Good</option>
              <option value="okay">😐 Okay</option>
              <option value="tough">😔 Tough</option>
              <option value="chaotic">🌪️ Chaotic</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' || filterMood !== 'all' 
                ? 'No entries match your filters' 
                : 'Start your reflection journey'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterType !== 'all' || filterMood !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first journal entry to begin tracking your thoughts and progress'
              }
            </p>
            <Button onClick={() => onCreateEntry(new Date(), 'daily')}>
              <Edit3 className="w-4 h-4 mr-2" />
              Create First Entry
            </Button>
          </Card>
        ) : (
          filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                hover 
                className="cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-700"
                onClick={() => onEditEntry(entry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          {getRelativeDate(entry.date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-lg">{MOOD_EMOJIS[entry.mood || 'okay']}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.type === 'daily' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          entry.type === 'weekly' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {entry.type}
                        </span>
                      </div>
                      
                      {entry.isPrivate && (
                        <Lock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    
                    {entry.title && (
                      <h3 className="font-serif font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        {entry.title}
                      </h3>
                    )}
                    
                    <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                      {getEntryPreview(entry)}
                    </p>
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {entry.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-amber-600 dark:text-amber-400 ml-4">
                    {format(entry.createdAt, 'h:mm a')}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};