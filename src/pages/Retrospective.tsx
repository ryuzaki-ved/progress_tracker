import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, TrendingUp, Plus, Filter } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { JournalEditor } from '../components/journal/JournalEditor';
import { JournalTimeline } from '../components/journal/JournalTimeline';
import { WeeklyReviewModal } from '../components/reviews/WeeklyReviewModal';
import { ReflectionInsights } from '../components/reviews/ReflectionInsights';
import { useJournal } from '../hooks/useJournal';
import { useReviews } from '../hooks/useReviews';
import { JournalEntry } from '../types';
import { startOfWeek, format } from 'date-fns';

export const Retrospective: React.FC = () => {
  const { entries, loading: journalLoading, createEntry, updateEntry } = useJournal();
  const { reviews, insights, loading: reviewsLoading, createWeeklyReview, generateWeeklyStats, dismissInsight } = useReviews();
  
  const [activeTab, setActiveTab] = useState<'journal' | 'reviews' | 'insights'>('journal');
  const [showJournalEditor, setShowJournalEditor] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [journalType, setJournalType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (journalLoading || reviewsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading retrospective...</p>
        </div>
      </div>
    );
  }

  const handleCreateEntry = (date: Date, type: 'daily' | 'weekly' | 'monthly') => {
    setSelectedDate(date);
    setJournalType(type);
    setEditingEntry(null);
    setShowJournalEditor(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedDate(entry.date);
    setJournalType(entry.type);
    setShowJournalEditor(true);
  };

  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, entryData);
    } else {
      await createEntry(entryData);
    }
    setShowJournalEditor(false);
    setEditingEntry(null);
  };

  const handleCreateWeeklyReview = async (rating: any, journalEntryId?: string) => {
    const weekStart = startOfWeek(selectedDate);
    await createWeeklyReview(weekStart, rating, journalEntryId);
    setShowWeeklyReview(false);
  };

  const currentWeekStats = generateWeeklyStats(startOfWeek(new Date()));
  const currentWeekInsights = insights.filter(insight => insight.type === 'pattern' || insight.type === 'trend');

  const tabs = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'reviews', label: 'Weekly Reviews', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retrospective & Review</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Reflect on your journey and discover patterns in your productivity
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDate(startOfWeek(new Date()));
              setShowWeeklyReview(true);
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Weekly Review
          </Button>
          <Button onClick={() => handleCreateEntry(new Date(), 'daily')}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'journal' && (
          <JournalTimeline
            entries={entries}
            onEditEntry={handleEditEntry}
            onCreateEntry={handleCreateEntry}
          />
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Current Week Quick Review */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                    This Week's Progress
                  </h3>
                  <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                    {format(startOfWeek(new Date()), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedDate(startOfWeek(new Date()));
                    setShowWeeklyReview(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Review Week
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white dark:bg-indigo-900/30 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{currentWeekStats.tasksCompleted}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-indigo-900/30 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{currentWeekStats.tasksMissed}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Missed</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-indigo-900/30 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{currentWeekStats.streaksMaintained}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Streaks</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-indigo-900/30 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{currentWeekStats.indexChange.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Index Change</div>
                </div>
              </div>
            </Card>

            {/* Past Reviews */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Past Reviews</h3>
              {reviews.length === 0 ? (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Start Your Review Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Complete your first weekly review to track your progress over time
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedDate(startOfWeek(new Date()));
                      setShowWeeklyReview(true);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Create First Review
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover className="cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {format(review.weekStart, 'MMM d')} - {format(review.weekEnd, 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">
                              {review.rating === 'great' ? '🌟' :
                               review.rating === 'good' ? '😊' :
                               review.rating === 'okay' ? '😐' :
                               review.rating === 'tough' ? '😔' : '🌪️'}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <div className="font-semibold text-green-600">{review.stats.tasksCompleted}</div>
                            <div className="text-gray-500">Done</div>
                          </div>
                          <div>
                            <div className="font-semibold text-blue-600">{review.stats.streaksMaintained}</div>
                            <div className="text-gray-500">Streaks</div>
                          </div>
                          <div>
                            <div className="font-semibold text-purple-600">{review.stats.indexChange.toFixed(1)}%</div>
                            <div className="text-gray-500">Change</div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <ReflectionInsights
            insights={insights}
            onDismiss={dismissInsight}
          />
        )}
      </motion.div>

      {/* Modals */}
      <JournalEditor
        isOpen={showJournalEditor}
        onClose={() => {
          setShowJournalEditor(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry || undefined}
        date={selectedDate}
        type={journalType}
      />

      <WeeklyReviewModal
        isOpen={showWeeklyReview}
        onClose={() => setShowWeeklyReview(false)}
        onSave={handleCreateWeeklyReview}
        weekStart={selectedDate}
        stats={currentWeekStats}
        insights={currentWeekInsights.map(i => i.description)}
      />
    </div>
  );
};