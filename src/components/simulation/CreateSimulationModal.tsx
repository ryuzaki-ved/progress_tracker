import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Plus, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useSimulation } from '../../hooks/useSimulation';
import { useStocks } from '../../hooks/useStocks';

interface CreateSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSimulationModal: React.FC<CreateSimulationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { stocks } = useStocks();
  const { createSimulation, enterSimulationMode, updateSimulation, simulations } = useSimulation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    projectedDuration: 30,
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a simulation name');
      return;
    }

    console.log('Creating simulation with data:', formData);
    console.log('Available stocks:', stocks);
    
    if (!formData.name.trim()) return;

    const simulation = createSimulation(formData.name, formData.description);
    console.log('Created simulation:', simulation);
    
    // Immediately update with additional metadata and get the updated simulation from state
    updateSimulation(simulation.id, {
      tags: formData.tags,
      projectedDuration: formData.projectedDuration,
    });
    
    // Find the updated simulation in the simulations array (after updateSimulation)
    const updatedSim = simulations.find(s => s.id === simulation.id);
    console.log('Updated simulation found:', updatedSim);
    
    if (updatedSim) {
      enterSimulationMode({ ...updatedSim, tags: formData.tags, projectedDuration: formData.projectedDuration });
    } else {
      // fallback: enter with the original simulation + metadata
      console.log('Using fallback simulation');
      enterSimulationMode({ ...simulation, tags: formData.tags, projectedDuration: formData.projectedDuration });
    }
    
    onClose();
    // Reset form
    setFormData({
      name: '',
      description: '',
      tags: [],
      projectedDuration: 30,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">Create New Simulation</h2>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">Design your alternate life strategy</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Simulation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 placeholder-purple-500 dark:placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g., Summer Growth Sprint, Work-Life Balance Reset"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 placeholder-purple-500 dark:placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="What are you trying to achieve with this strategy?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Projected Duration: {formData.projectedDuration} days
                </label>
                <input
                  type="range"
                  min="7"
                  max="365"
                  step="7"
                  value={formData.projectedDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectedDuration: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-purple-200 dark:bg-purple-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <span>1 week</span>
                  <span>1 year</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Tags
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 placeholder-purple-500 dark:placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Add a tag..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">What happens next?</h4>
                    <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <li>• Your current state will be cloned into a safe sandbox</li>
                      <li>• You can freely experiment with changes</li>
                      <li>• AI will analyze the impact of your strategy</li>
                      <li>• Compare results before applying to real life</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.name.trim()}
                  onClick={(e) => console.log('Submit button clicked', e)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create & Enter
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};