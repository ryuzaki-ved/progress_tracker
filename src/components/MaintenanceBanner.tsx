import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export const MaintenanceBanner: React.FC = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance-status');
        
        if (response.ok) {
          const result = await response.json();
          setIsMaintenanceMode(result.data?.maintenanceMode || false);
        }
      } catch (err) {
        console.error('Failed to check maintenance mode:', err);
      }
    };

    checkMaintenanceMode();
    // Check every 10 seconds
    const interval = setInterval(checkMaintenanceMode, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isMaintenanceMode) return null;

  return (
    <div className="w-full bg-amber-900/40 border-b border-amber-600/50 px-4 py-3 flex items-center gap-3 text-amber-200">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="font-semibold">System Maintenance Mode</p>
        <p className="text-xs text-amber-100">The system is currently in maintenance mode. Limited functionality is available.</p>
      </div>
    </div>
  );
};
