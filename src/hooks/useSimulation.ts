import { useState, useEffect } from 'react';
import { SimulationState, SimulationComparison, SimulationInsight, SimulationTemplate } from '../types/simulation';
import { useStocks } from './useStocks';
import { useTasks } from './useTasks';
import { useIndex } from './useIndex';
import { Stock, Task } from '../types';
import { calculateIndexValue, calculateStockScore } from '../utils/stockUtils';

const SIMULATION_TEMPLATES: SimulationTemplate[] = [
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth',
    description: 'Focus heavily on career and skill development',
    icon: '🚀',
    category: 'growth',
    changes: {
      stockWeightChanges: [
        { stockId: 'career', newWeight: 0.4 },
        { stockId: 'learning', newWeight: 0.3 },
      ],
    },
  },
  {
    id: 'work-life-balance',
    name: 'Work-Life Balance',
    description: 'Prioritize health and relationships over career',
    icon: '⚖️',
    category: 'balance',
    changes: {
      stockWeightChanges: [
        { stockId: 'health', newWeight: 0.3 },
        { stockId: 'relationships', newWeight: 0.25 },
        { stockId: 'career', newWeight: 0.2 },
      ],
    },
  },
  {
    id: 'recovery-mode',
    name: 'Recovery Mode',
    description: 'Reduce workload and focus on self-care',
    icon: '🌱',
    category: 'recovery',
    changes: {
      stockWeightChanges: [
        { stockId: 'health', newWeight: 0.4 },
        { stockId: 'career', newWeight: 0.15 },
      ],
    },
  },
  {
    id: 'productivity-boost',
    name: 'Productivity Boost',
    description: 'Optimize for maximum output and efficiency',
    icon: '⚡',
    category: 'productivity',
    changes: {},
  },
];

export const useSimulation = () => {
  const { stocks } = useStocks();
  const { tasks } = useTasks();
  const { indexData } = useIndex();
  
  const [simulations, setSimulations] = useState<SimulationState[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationState | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load simulations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('productivity-simulations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSimulations(parsed.map((sim: any) => ({
          ...sim,
          createdAt: new Date(sim.createdAt),
          lastModified: new Date(sim.lastModified),
        })));
      } catch (error) {
        console.error('Failed to load simulations:', error);
      }
    }
  }, []);

  // Save simulations to localStorage
  const saveSimulations = (sims: SimulationState[]) => {
    localStorage.setItem('productivity-simulations', JSON.stringify(sims));
    setSimulations(sims);
  };

  // Create new simulation from current state
  const createSimulation = (name: string, description?: string): SimulationState => {
    const simulation: SimulationState = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      lastModified: new Date(),
      isActive: false,
      
      // Clone current state
      stocks: stocks.map(stock => ({ ...stock })),
      tasks: tasks.map(task => ({ ...task })),
      indexHistory: indexData?.history.map(h => ({ ...h })) || [],
      currentIndexValue: indexData?.value || 500,
      
      tags: [],
      color: '#8B5CF6', // Purple theme for simulations
      projectedDuration: 30,
      confidence: 'medium',
      
      projectedChanges: {
        indexChange: 0,
        stockChanges: [],
        riskLevel: 'medium',
        burnoutRisk: 50,
        balanceScore: 70,
      },
    };

    const updatedSims = [...simulations, simulation];
    saveSimulations(updatedSims);
    return simulation;
  };

  // Create simulation from template
  const createFromTemplate = (template: SimulationTemplate, name?: string): SimulationState => {
    const simulation = createSimulation(
      name || `${template.name} Strategy`,
      template.description
    );

    // Apply template changes
    if (template.changes.stockWeightChanges) {
      template.changes.stockWeightChanges.forEach(change => {
        const stockIndex = simulation.stocks.findIndex(s => s.id === change.stockId);
        if (stockIndex !== -1) {
          simulation.stocks[stockIndex].weight = change.newWeight;
        }
      });
    }

    // Recalculate projections
    const updatedSim = calculateProjections(simulation);
    const updatedSims = simulations.map(s => s.id === simulation.id ? updatedSim : s);
    saveSimulations(updatedSims);
    
    return updatedSim;
  };

  // Enter simulation mode
  const enterSimulationMode = (simulation: SimulationState) => {
    // Always recalculate projections before entering
    const recalculated = calculateProjections(simulation);
    setActiveSimulation(recalculated);
    setIsSimulationMode(true);
    // Mark simulation as active and update in localStorage
    const updatedSims = simulations.map(s =>
      s.id === recalculated.id
        ? { ...recalculated, isActive: true, lastModified: new Date() }
        : { ...s, isActive: false }
    );
    saveSimulations(updatedSims);
  };

  // Exit simulation mode
  const exitSimulationMode = () => {
    setIsSimulationMode(false);
    setActiveSimulation(null);
    
    // Mark all simulations as inactive
    const updatedSims = simulations.map(s => ({ ...s, isActive: false }));
    saveSimulations(updatedSims);
  };

  // Update simulation
  const updateSimulation = (simulationId: string, updates: Partial<SimulationState>) => {
    const updatedSims = simulations.map(sim => 
      sim.id === simulationId 
        ? { ...sim, ...updates, lastModified: new Date() }
        : sim
    );
    saveSimulations(updatedSims);
    
    if (activeSimulation?.id === simulationId) {
      setActiveSimulation({ ...activeSimulation, ...updates, lastModified: new Date() });
    }
  };

  // Delete simulation
  const deleteSimulation = (simulationId: string) => {
    const updatedSims = simulations.filter(s => s.id !== simulationId);
    saveSimulations(updatedSims);
    
    if (activeSimulation?.id === simulationId) {
      exitSimulationMode();
    }
  };

  // Calculate projections for simulation
  const calculateProjections = (simulation: SimulationState): SimulationState => {
    // Recalculate index value with new weights
    const newIndexValue = calculateIndexValue(simulation.stocks);
    const indexChange = newIndexValue - simulation.currentIndexValue;
    const indexChangePercent = (indexChange / simulation.currentIndexValue) * 100;

    // Calculate stock changes
    const stockChanges = simulation.stocks.map(simStock => {
      const originalStock = stocks.find(s => s.id === simStock.id);
      if (!originalStock) return { stockId: simStock.id, change: 0, percentage: 0 };
      
      const change = simStock.currentScore - originalStock.currentScore;
      const percentage = originalStock.currentScore > 0 ? (change / originalStock.currentScore) * 100 : 0;
      
      return { stockId: simStock.id, change, percentage };
    });

    // Calculate risk metrics
    const totalWeight = simulation.stocks.reduce((sum, s) => sum + s.weight, 0);
    const weightImbalance = Math.abs(1 - totalWeight);
    const maxWeight = Math.max(...simulation.stocks.map(s => s.weight));
    
    const burnoutRisk = Math.min(100, (maxWeight * 100) + (weightImbalance * 50));
    const balanceScore = Math.max(0, 100 - burnoutRisk);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (burnoutRisk > 70) riskLevel = 'high';
    else if (burnoutRisk > 40) riskLevel = 'medium';

    return {
      ...simulation,
      currentIndexValue: newIndexValue,
      projectedChanges: {
        indexChange: indexChangePercent,
        stockChanges,
        riskLevel,
        burnoutRisk,
        balanceScore,
      },
    };
  };

  // Generate insights for simulation
  const generateInsights = (simulation: SimulationState): SimulationInsight[] => {
    const insights: SimulationInsight[] = [];
    const { projectedChanges } = simulation;

    // Index change insights
    if (projectedChanges.indexChange > 10) {
      insights.push({
        id: 'index-improvement',
        type: 'improvement',
        title: 'Significant Growth Potential',
        description: `This strategy could increase your life index by ${projectedChanges.indexChange.toFixed(1)}%`,
        impact: 'high',
        category: 'growth',
        confidence: 85,
      });
    } else if (projectedChanges.indexChange < -5) {
      insights.push({
        id: 'index-decline',
        type: 'warning',
        title: 'Potential Performance Drop',
        description: `This approach might decrease your index by ${Math.abs(projectedChanges.indexChange).toFixed(1)}%`,
        impact: 'medium',
        category: 'risk',
        confidence: 75,
      });
    }

    // Burnout risk insights
    if (projectedChanges.burnoutRisk > 70) {
      insights.push({
        id: 'burnout-warning',
        type: 'warning',
        title: 'High Burnout Risk',
        description: `This strategy has a ${projectedChanges.burnoutRisk.toFixed(0)}% burnout risk. Consider rebalancing.`,
        impact: 'high',
        category: 'risk',
        confidence: 90,
      });
    } else if (projectedChanges.burnoutRisk < 30) {
      insights.push({
        id: 'sustainable-approach',
        type: 'improvement',
        title: 'Sustainable Approach',
        description: `Low burnout risk (${projectedChanges.burnoutRisk.toFixed(0)}%) makes this strategy sustainable long-term.`,
        impact: 'medium',
        category: 'balance',
        confidence: 80,
      });
    }

    // Balance insights
    if (projectedChanges.balanceScore > 80) {
      insights.push({
        id: 'well-balanced',
        type: 'achievement',
        title: 'Well-Balanced Strategy',
        description: `Excellent balance score of ${projectedChanges.balanceScore.toFixed(0)}% across life areas.`,
        impact: 'medium',
        category: 'balance',
        confidence: 85,
      });
    }

    // Stock-specific insights
    const biggestGainer = projectedChanges.stockChanges.reduce((max, change) => 
      change.percentage > max.percentage ? change : max, 
      { stockId: '', change: 0, percentage: -Infinity }
    );

    if (biggestGainer.percentage > 20) {
      const stock = simulation.stocks.find(s => s.id === biggestGainer.stockId);
      if (stock) {
        insights.push({
          id: 'stock-boost',
          type: 'improvement',
          title: `${stock.name} Acceleration`,
          description: `This strategy could boost ${stock.name} by ${biggestGainer.percentage.toFixed(1)}%`,
          impact: 'medium',
          category: 'growth',
          confidence: 70,
        });
      }
    }

    return insights;
  };

  // Compare simulation with reality
  const compareWithReality = (simulation: SimulationState): SimulationComparison => {
    const realTrend = indexData && indexData.history.length > 1 
      ? indexData.history[indexData.history.length - 1].value > indexData.history[0].value ? 'rising' : 'falling'
      : 'stable';

    const projectedTrend = simulation.projectedChanges.indexChange > 2 ? 'rising' 
      : simulation.projectedChanges.indexChange < -2 ? 'falling' : 'stable';

    return {
      realState: {
        indexValue: indexData?.value || 500,
        stocks: stocks,
        recentTrend: realTrend,
      },
      simulatedState: {
        indexValue: simulation.currentIndexValue,
        stocks: simulation.stocks,
        projectedTrend,
      },
      insights: generateInsights(simulation),
    };
  };

  // Apply simulation to reality
  const applySimulation = async (simulationId: string) => {
    const simulation = simulations.find(s => s.id === simulationId);
    if (!simulation) return;

    // This would integrate with your existing hooks to update real data
    // For now, we'll just show a confirmation
    return new Promise<boolean>((resolve) => {
      const confirmed = window.confirm(
        `Ready to step into this new timeline?\n\n` +
        `This will apply "${simulation.name}" strategy to your real data:\n` +
        `• Update stock weights\n` +
        `• Modify task priorities\n` +
        `• Adjust your life strategy\n\n` +
        `This action cannot be undone.`
      );
      resolve(confirmed);
    });
  };

  return {
    simulations,
    activeSimulation,
    isSimulationMode,
    loading,
    templates: SIMULATION_TEMPLATES,
    
    // Actions
    createSimulation,
    createFromTemplate,
    enterSimulationMode,
    exitSimulationMode,
    updateSimulation,
    deleteSimulation,
    calculateProjections,
    generateInsights,
    compareWithReality,
    applySimulation,
  };
};