import React from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PatternDetection } from '../../types/strategicBrain';
import { format, addDays } from 'date-fns';

interface PatternDetectionPanelProps {
  patterns: PatternDetection[];
}

export const PatternDetectionPanel: React.FC<PatternDetectionPanelProps> = ({
  patterns,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFrequencyDescription = (frequency: number) => {
    if (frequency >= 0.8) return 'Very Common';
    if (frequency >= 0.6) return 'Common';
    if (frequency >= 0.4) return 'Occasional';
    return 'Rare';
  };

  return (
    <Card>
      <div className="flex items-center space-x-3 mb-6">
        <Search className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pattern Detection</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-discovered patterns in your productivity behavior
          </p>
        </div>
      </div>

      {patterns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Building Pattern Database
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Keep tracking your activities to unlock behavioral insights
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {pattern.pattern}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
                      {pattern.confidence}% confidence
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                      {getFrequencyDescription(pattern.frequency)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {pattern.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Last occurred: {format(pattern.lastOccurrence, 'MMM d, yyyy')}</span>
                </div>
                
                {pattern.predictedNext && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Predicted next: {format(pattern.predictedNext, 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {/* Interventions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    Suggested Interventions
                  </span>
                </div>
                <div className="space-y-1">
                  {pattern.interventions.map((intervention, idx) => (
                    <div key={idx} className="text-sm text-blue-700 dark:text-blue-300">
                      • {intervention}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-3">
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                  Apply Intervention
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-600">
                  Dismiss Pattern
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
};