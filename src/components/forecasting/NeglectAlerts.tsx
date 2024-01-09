import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Pause, Play, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { NeglectAlert, Stock } from '../../types';

interface NeglectAlertsProps {
  alerts: NeglectAlert[];
  stocks: Stock[];
  onPutOnHold: (alertId: string) => void;
  onReactivate: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

export const NeglectAlerts: React.FC<NeglectAlertsProps> = ({
  alerts,
  stocks,
  onPutOnHold,
  onReactivate,
  onDismiss,
}) => {
  const getSeverityColor = (severity: NeglectAlert['severity']) => {
    switch (severity) {
      case 'warning': return 'from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700';
      case 'urgent': return 'from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-700';
      case 'critical': return 'from-red-50 to-pink-50 border-red-200 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-700';
    }
  };

  const getSeverityIcon = (severity: NeglectAlert['severity']) => {
    const baseClasses = "w-5 h-5";
    switch (severity) {
      case 'warning': return <AlertTriangle className={`${baseClasses} text-yellow-600`} />;
      case 'urgent': return <AlertTriangle className={`${baseClasses} text-orange-600`} />;
      case 'critical': return <AlertTriangle className={`${baseClasses} text-red-600`} />;
    }
  };

  const getSeverityText = (severity: NeglectAlert['severity']) => {
    switch (severity) {
      case 'warning': return 'Warning';
      case 'urgent': return 'Urgent';
      case 'critical': return 'Critical';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          All Stocks Healthy
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No neglect risks detected. Keep up the great work!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Neglect Risk Alerts
        </h3>
        <span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const stock = stocks.find(s => s.id === alert.stockId);
          if (!stock) return null;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-r ${getSeverityColor(alert.severity)} ${
                alert.isOnHold ? 'opacity-60' : ''
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-4 h-4 ${stock.color} rounded`} />
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {stock.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            alert.severity === 'urgent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {getSeverityText(alert.severity)}
                          </span>
                          {alert.isOnHold && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs font-medium">
                              On Hold
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                          Declined {alert.declinePercent.toFixed(1)}% over {alert.timeframe} days
                        </p>
                        
                        <div className="bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg p-3 mb-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Action Required:</strong> {alert.actionRequired}
                          </div>
                        </div>
                        
                        {alert.projectedZeroDate && (
                          <div className="flex items-center space-x-2 text-sm text-red-700 dark:text-red-300">
                            <Clock className="w-4 h-4" />
                            <span>
                              Projected to reach zero: {alert.projectedZeroDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {alert.isOnHold ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReactivate(alert.id)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPutOnHold(alert.id)}
                          className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Put on Hold
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};