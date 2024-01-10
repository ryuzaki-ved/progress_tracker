import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationDashboard } from '../components/simulation/SimulationDashboard';
import { SimulationComparison } from '../components/simulation/SimulationComparison';
import { CreateSimulationModal } from '../components/simulation/CreateSimulationModal';
import { SimulationModeToggle } from '../components/simulation/SimulationModeToggle';
import { SimulationState } from '../types/simulation';
import { useSimulation } from '../hooks/useSimulation';

export const Simulation: React.FC = () => {
  const { isSimulationMode } = useSimulation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingComparison, setViewingComparison] = useState<SimulationState | null>(null);

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleViewComparison = (simulation: SimulationState) => {
    setViewingComparison(simulation);
  };

  const handleCloseComparison = () => {
    setViewingComparison(null);
  };

  return (
    <>
      <SimulationModeToggle />
      
      <div className={`p-6 space-y-6 ${isSimulationMode ? 'pt-20' : ''}`}>
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