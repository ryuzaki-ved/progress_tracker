import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  AlertTriangle, 
  Lightbulb,
  Calendar as CalendarIcon,
  BarChart3,
  Shuffle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { TimeBudgetBar } from './TimeBudgetBar';
import { RescheduleSuggestions } from './RescheduleSuggestions';
import { LoadIndicator } from './LoadIndicator';
import { useTimeManagement } from '../../hooks/useTimeManagement';
import { useTasks } from '../../hooks/useTasks';
import { useStocks } from '../../hooks/useStocks';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';

interface SmartCalendarViewProps {
  onCreateTask: (date: Date, time?: string) => void;
}

export const SmartCalendarView: React.FC<SmartCalendarViewProps> = ({ onCreateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const { 
    weeklyLoadInfo, 
    dailyBudgetMinutes, 
    setDailyBudgetMinutes,
    generateReschedulesuggestions,
    detectIssues,
    autoBalanceWeek
  } = useTimeManagement();
  
  const { updateTask } = useTasks();
  const { stocks } = useStocks();

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const currentDayLoad = weeklyLoadInfo.find(day => 
    day.date.toDateString() === currentDate.toDateString()
  );

  const issues = detectIssues();
  const suggestions = generateReschedulesuggestions();
  const balancesuggestions = autoBalanceWeek();

  const handleTaskReschedule = async (taskId: string, newDate: Date, newTime?: string) => {
    try {
      await updateTask(taskId, { 
        dueDate: newDate,
        scheduledTime: newTime 
      });
    } catch (error) {
      console.error('Failed to reschedule task:', error);
    }
  };

  const handleAutoBalance = () => {
    balancesuggestions.forEach(async ({ taskId, newDate }) => {
      await handleTaskReschedule(taskId, newDate);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Controls */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {viewMode === 'day' 
                ? format(currentDate, 'EEEE, MMMM d, yyyy')
                : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
              }
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'day' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Week
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowSuggestions(!showSuggestions)}>
              <Lightbulb className="w-4 h-4 mr-1" />
              Smart Tips
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Clock className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Time Budget Bar for Current Day */}
        {viewMode === 'day' && currentDayLoad && (
          <TimeBudgetBar dayLoad={currentDayLoad} />
        )}

        {/* Issues Alert */}
        {issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mt-4"
          >
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Schedule Issues Detected</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  {issues.slice(0, 3).map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
                {balancesuggestions.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    onClick={handleAutoBalance}
                  >
                    <Shuffle className="w-4 h-4 mr-1" />
                    Auto-Balance Week
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Management Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Time Budget: {Math.round(dailyBudgetMinutes / 60)}h {dailyBudgetMinutes % 60}m
                  </label>
                  <input
                    type="range"
                    min="120"
                    max="720"
                    step="30"
                    value={dailyBudgetMinutes}
                    onChange={(e) => setDailyBudgetMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>2h</span>
                    <span>12h</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Task Duration
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="15">15 minutes</option>
                    <option value="30" selected>30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <RescheduleSuggestions 
              suggestions={suggestions}
              onApplySuggestion={handleTaskReschedule}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Load Overview */}
      {viewMode === 'week' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Weekly Load Overview
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {weeklyLoadInfo.map((dayLoad, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {format(dayLoad.date, 'EEE')}
                </div>
                <LoadIndicator dayLoad={dayLoad} compact />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(dayLoad.totalScheduledMinutes / 60)}h
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Calendar View */}
      <Card className="min-h-[600px]">
        {viewMode === 'day' ? (
          <DayView 
            date={currentDate}
            onCreateTask={onCreateTask}
            onRescheduleTask={handleTaskReschedule}
          />
        ) : (
          <WeekView 
            weekStart={startOfWeek(currentDate)}
            onCreateTask={onCreateTask}
            onRescheduleTask={handleTaskReschedule}
          />
        )}
      </Card>
    </div>
  );
};