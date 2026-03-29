import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Award, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PerformanceBonds: React.FC = () => {
  const [bonds, setBonds] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Performance Bonds</h1>
          <p className="text-gray-400">Track and manage your performance bonds</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Bond
        </Button>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6"
        >
          <Card className="p-6 border border-primary/20 bg-primary/5">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Bond</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bond Name</label>
                <input 
                  type="text" 
                  placeholder="Enter bond name..."
                  className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Amount</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
                  <input 
                    type="number" 
                    placeholder="30"
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="primary">Create Bond</Button>
                <Button 
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {bonds.length === 0 ? (
        <Card className="p-12 text-center border border-white/10">
          <div className="flex justify-center mb-4">
            <Award className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Performance Bonds Yet</h3>
          <p className="text-gray-400 mb-6">Create your first performance bond to track your goals</p>
          <Button 
            onClick={() => setShowAddForm(true)}
            variant="primary"
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Your First Bond
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bonds.map((bond, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 border border-white/10 hover:border-primary/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold text-white">{bond.name}</h3>
                      <p className="text-sm text-gray-400">{bond.duration} days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">${bond.amount}</p>
                    <p className="text-sm text-primary flex items-center gap-1 justify-end">
                      <Zap className="w-3 h-3" />
                      Active
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
