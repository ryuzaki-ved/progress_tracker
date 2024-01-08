import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { SmartCalendarView } from '../components/calendar/SmartCalendarView';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useStocks } from '../hooks/useStocks';

export const Calendar: React.FC = () => {
  const { tasks, loading: tasksLoading, createTask, refetch } = useTasks();
  const { stocks, loading: stocksLoading } = useStocks();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  if (tasksLoading || stocksLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const handleCreateTask = (date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowAddModal(true);
  };

  const handleTaskSubmit = async (taskData: any) => {
    await createTask(taskData);
    setShowAddModal(false);
    setSelectedDate(null);
    setSelectedTime(undefined);
    refetch();
    setCalendarRefresh(r => r + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Smart calendar with time management and scheduling assistance</p>
        </div>
      </div>

      <SmartCalendarView onCreateTask={handleCreateTask} key={calendarRefresh} />

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleTaskSubmit}
        stocks={stocks}
        defaultDate={selectedDate || undefined}
        defaultTime={selectedTime}
      />
    </div>
  );
};