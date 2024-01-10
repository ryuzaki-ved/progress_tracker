import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, Save, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSimulation } from '../../hooks/useSimulation';

export const SimulationModeToggle: React.FC = () => {
  const { isSimulationMode, activeSimulation, exitSimulationMode } = useSimulation();

  if (!isSimulationMode || !activeSimulation) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Simulation Mode</span>
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {activeSimulation.name}
                  </span>
                </div>
                <div className="text-sm opacity-90">
                  Experimenting with alternate timeline • Changes won't affect real data
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center space-x-1 text-sm"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Live Simulation</span>
              </motion.div>

              <Button
                variant="ghost"
                size="sm"
                onClick={exitSimulationMode}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Simulation
              </Button>
            </div>
          </div>
        </div>

        {/* Animated border */}
        <motion.div
          className="h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400"
          animate={{
            background: [
              'linear-gradient(90deg, #fbbf24, #f472b6, #3b82f6)',
              'linear-gradient(90deg, #f472b6, #3b82f6, #fbbf24)',
              'linear-gradient(90deg, #3b82f6, #fbbf24, #f472b6)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
    </AnimatePresence>
  );
};