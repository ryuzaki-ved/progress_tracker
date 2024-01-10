import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Trash2, 
  Copy, 
  Download, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Target,
  BarChart3
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSimulation } from '../../hooks/useSimulation';
import { SimulationState } from '../../types/simulation';
import { format } from 'date-fns';

interface SimulationDashboardProps {
  onCreateNew: () => void;
  onViewComparison: (simulation: SimulationState) => void;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({
  onCreateNew,
  onViewComparison,
}) => {
  const { 
    simulations, 
    templates, 
    enterSimulationMode, 
    deleteSimulation,
    createFromTemplate,
    applySimulation
  } = useSimulation();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleEnterSimulation = (simulation: SimulationState) => {
    enterSimulationMode(simulation);
  };

  const handleApplySimulation = async (simulationId: string) => {
    const confirmed = await applySimulation(simulationId);
    if (confirmed) {
      // Show success message or redirect
      console.log('Simulation applied successfully!');
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const simulation = createFromTemplate(template);
      enterSimulationMode(simulation);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap className="w-8 h-8 mr-3 text-purple-600" />
            Simulation Mode
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Experiment with alternate life strategies in a safe sandbox environment
          </p>
        </div>
        
        <Button onClick={onCreateNew} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Simulation
        </Button>
      </div>

      {/* Quick Start Templates */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
          🚀 Quick Start Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-purple-400 bg-purple-100 dark:bg-purple-800/50'
                  : 'border-purple-200 dark:border-purple-600 hover:border-purple-300 dark:hover:border-purple-500'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{template.icon}</div>
                <div className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  {template.name}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  {template.description}
                </div>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFromTemplate(template.id);
                  }}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Try This
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Existing Simulations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Simulations ({simulations.length})
          </h3>
        </div>

        {simulations.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Simulations Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first simulation to start experimenting with alternate life strategies
            </p>
            <Button onClick={onCreateNew} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Simulation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((simulation, index) => (
              <motion.div
                key={simulation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {simulation.name}
                        </h4>
                        {simulation.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      {simulation.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {simulation.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewComparison(simulation)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSimulation(simulation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Index Change</span>
                      <span className={`font-semibold ${
                        simulation.projectedChanges.indexChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {simulation.projectedChanges.indexChange > 0 ? '+' : ''}
                        {simulation.projectedChanges.indexChange.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                      <span className={`font-semibold ${getRiskColor(simulation.projectedChanges.riskLevel)}`}>
                        {simulation.projectedChanges.riskLevel}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Balance Score</span>
                      <span className="font-semibold text-blue-600">
                        {simulation.projectedChanges.balanceScore.toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(simulation.confidence)}`}>
                        {simulation.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {simulation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {simulation.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleEnterSimulation(simulation)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Enter Simulation
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplySimulation(simulation.id)}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Create a copy of the simulation
                          const copy = {
                            ...simulation,
                            id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: `${simulation.name} (Copy)`,
                            createdAt: new Date(),
                            lastModified: new Date(),
                            isActive: false,
                          };
                          // This would be handled by the simulation hook
                          console.log('Copy simulation:', copy);
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                    Created {format(simulation.createdAt, 'MMM d, yyyy')}
                    {simulation.lastModified.getTime() !== simulation.createdAt.getTime() && (
                      <span> • Modified {format(simulation.lastModified, 'MMM d')}</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};