import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationDashboard } from '../components/simulation/SimulationDashboard';
import { SimulationComparison } from '../components/simulation/SimulationComparison';
import { CreateSimulationModal } from '../components/simulation/CreateSimulationModal';
import { SimulationModeToggle } from '../components/simulation/SimulationModeToggle';
import { SimulationState } from '../types/simulation';
import { useSimulation } from '../hooks/useSimulation';
import { useStocks } from '../hooks/useStocks';

export const Simulation: React.FC = () => {
  const { isSimulationMode, simulations, activeSimulation } = useSimulation();
  const { stocks } = useStocks();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingComparison, setViewingComparison] = useState<SimulationState | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('Simulation Page - isSimulationMode:', isSimulationMode);
    console.log('Simulation Page - activeSimulation:', activeSimulation);
    console.log('Simulation Page - simulations:', simulations);
    console.log('Simulation Page - stocks:', stocks);
  }, [isSimulationMode, activeSimulation, simulations, stocks]);

  const handleCreateNew = () => {
    console.log('Create new simulation clicked');
    setShowCreateModal(true);
  };

  const handleViewComparison = (simulation: SimulationState) => {
    console.log('View comparison clicked for simulation:', simulation);
    setViewingComparison(simulation);
  };

  const handleCloseComparison = () => {
    console.log('Close comparison clicked');
    setViewingComparison(null);
  };

  return (
    <>
      <SimulationModeToggle />
      
      <div className={`p-6 space-y-6 ${isSimulationMode ? 'pt-20' : ''}`}>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded text-xs">
            <div>Simulation Mode: {isSimulationMode ? 'ON' : 'OFF'}</div>
            <div>Active Simulation: {activeSimulation?.name || 'None'}</div>
            <div>Total Simulations: {simulations.length}</div>
            <div>Stocks Available: {stocks.length}</div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {viewingComparison ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SimulationComparison
                simulation={viewingComparison}
                onClose={handleCloseComparison}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SimulationDashboard
                onCreateNew={handleCreateNew}
                onViewComparison={handleViewComparison}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CreateSimulationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </>
  );
};