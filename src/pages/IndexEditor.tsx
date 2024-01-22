import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Save, TrendingUp, Edit3, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIndex } from '../hooks/useIndex';
import { format, subDays, addDays, startOfDay } from 'date-fns';

export const IndexEditor: React.FC = () => {
  const { indexData, loading, error, updateMultipleIndexValues, refetch } = useIndex();
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return format(subDays(today, 30), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  });
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Generate date range data
  const generateDateRangeData = () => {
    if (!indexData?.history) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = [];
    
    for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
      const dateString = format(date, 'yyyy-MM-dd');
      const existingEntry = indexData.history.find(h => 
        format(h.date, 'yyyy-MM-dd') === dateString
      );
      
      dateRange.push({
        date: dateString,
        displayDate: format(date, 'MMM d, yyyy'),
        value: existingEntry?.value || 500,
        hasData: !!existingEntry,
      });
    }
    
    return dateRange.reverse(); // Show most recent first
  };

  const dateRangeData = generateDateRangeData();

  const handleValueChange = (date: string, value: number) => {
    setEditValues(prev => ({ ...prev, [date]: value }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(editValues).length === 0) {
      setSaveMessage('No changes to save');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await updateMultipleIndexValues(editValues);
      setEditValues({});
      setSaveMessage('Index values updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Failed to save changes. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    setEditValues({});
  };

  const hasChanges = Object.keys(editValues).length > 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading index data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Edit3 className="w-8 h-8 mr-3 text-blue-600" />
            Index Value Editor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Edit historical index values and see changes reflected in your charts
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || saving}
            className={hasChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes {hasChanges && `(${Object.keys(editValues).length})`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            saveMessage.includes('successfully') 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
          }`}
        >
          {saveMessage}
        </motion.div>
      )}

      {/* Date Range Selector */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dateRangeData.length} days selected
          </div>
        </div>
      </Card>

      {/* Index Values Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Index Values</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Values range from 0 to 2000
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700 p-4 rounded-lg mb-4">
            Error loading index data: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Current Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Edit Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {dateRangeData.map((entry, index) => {
                const currentValue = editValues[entry.date] !== undefined ? editValues[entry.date] : entry.value;
                const hasEdit = editValues[entry.date] !== undefined;
                
                return (
                  <motion.tr
                    key={entry.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entry.displayDate}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.date}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {entry.value.toFixed(1)}
                        </span>
                        {!entry.hasData && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="2000"
                        step="0.1"
                        value={currentValue}
                        onChange={(e) => handleValueChange(entry.date, parseFloat(e.target.value) || 0)}
                        className={`w-24 px-3 py-2 border rounded-lg text-sm ${
                          hasEdit 
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      {hasEdit ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Modified
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Unchanged
                          </span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {dateRangeData.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Data in Range
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select a different date range to view and edit index values
            </p>
          </div>
        )}
      </Card>

      {/* Summary */}
      {hasChanges && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Pending Changes
              </h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                You have {Object.keys(editValues).length} unsaved change{Object.keys(editValues).length !== 1 ? 's' : ''}. 
                Click "Save Changes" to apply them to your charts.
              </p>
            </div>
            <Button 
              onClick={handleSaveChanges} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Now'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};