import { useState, useEffect, useMemo } from 'react';
import { StockForecast, StrategyGoal, LoadSimulation, NeglectAlert, WhatIfScenario } from '../types';
import { useStocks } from './useStocks';
import { useTasks } from './useTasks';
import { useIndex } from './useIndex';
import { addDays, subDays, differenceInDays, startOfDay } from 'date-fns';

export const useForecasting = () => {
  const { stocks } = useStocks();
  const { tasks } = useTasks();
  const { indexData } = useIndex();
  const [strategyGoals, setStrategyGoals] = useState<StrategyGoal[]>([]);
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate momentum and forecast for each stock
  const stockForecasts = useMemo((): StockForecast[] => {
    return stocks.map(stock => {
      const stockTasks = tasks.filter(t => t.stockId === stock.id);
      const recentTasks = stockTasks.filter(t => 
        t.createdAt && t.createdAt >= subDays(new Date(), 28)
      );
      
      // Calculate momentum based on recent activity and score changes
      const completedRecent = recentTasks.filter(t => t.status === 'completed').length;
      const totalRecent = recentTasks.length;
      const completionRate = totalRecent > 0 ? completedRecent / totalRecent : 0;
      
      // Simple momentum calculation
      let momentum: 'rising' | 'falling' | 'stable' = 'stable';
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      
      if (stock.changePercent > 5) {
        momentum = 'rising';
        confidence = completionRate > 0.7 ? 'high' : 'medium';
      } else if (stock.changePercent < -5) {
        momentum = 'falling';
        confidence = completionRate < 0.3 ? 'high' : 'medium';
      } else {
        momentum = 'stable';
        confidence = 'medium';
      }
      
      // Project future score (simplified linear projection)
      const projectedChange = stock.changePercent * 0.7; // Dampened projection
      const projectedScore = Math.max(0, stock.currentScore + projectedChange);
      
      // Calculate tasks needed to stabilize/improve
      const tasksNeeded = momentum === 'falling' ? Math.ceil(Math.abs(projectedChange) / 10) : 0;
      const hoursNeeded = tasksNeeded * 1.5; // Assume 1.5 hours per task average
      
      // Risk assessment
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (projectedScore < 200) riskLevel = 'critical';
      else if (projectedScore < 350) riskLevel = 'high';
      else if (projectedScore < 450) riskLevel = 'medium';
      
      // Generate recommendation
      let recommendation = '';
      if (momentum === 'falling') {
        recommendation = `Needs ${tasksNeeded} tasks this week to stabilize`;
      } else if (momentum === 'rising') {
        recommendation = 'Maintain current momentum with consistent activity';
      } else {
        recommendation = 'Consider adding 1-2 tasks to boost performance';
      }
      
      return {
        stockId: stock.id,
        momentum,
        confidence,
        projectedScore,
        projectedChange,
        projectedChangePercent: (projectedChange / stock.currentScore) * 100,
        tasksNeeded,
        hoursNeeded,
        riskLevel,
        recommendation,
        forecastPeriod: 7,
      };
    });
  }, [stocks, tasks]);

  // Generate neglect alerts
  const neglectAlerts = useMemo((): NeglectAlert[] => {
    const alerts: NeglectAlert[] = [];
    
    stockForecasts.forEach(forecast => {
      const stock = stocks.find(s => s.id === forecast.stockId);
      if (!stock) return;
      
      if (forecast.riskLevel === 'critical' || forecast.riskLevel === 'high') {
        const declinePercent = Math.abs(stock.changePercent);
        let severity: 'warning' | 'urgent' | 'critical' = 'warning';
        
        if (forecast.riskLevel === 'critical') severity = 'critical';
        else if (declinePercent > 20) severity = 'urgent';
        
        alerts.push({
          id: `alert-${stock.id}`,
          stockId: stock.id,
          severity,
          declinePercent,
          timeframe: 21, // 3 weeks
          projectedZeroDate: forecast.projectedScore < 100 ? addDays(new Date(), 30) : undefined,
          actionRequired: forecast.recommendation,
          isOnHold: false,
          createdAt: new Date(),
        });
      }
    });
    
    return alerts;
  }, [stockForecasts, stocks]);

  // Create strategy goal
  const createStrategyGoal = (
    stockId: string,
    targetChangePercent: number,
    timeframe: 30 | 60 | 90
  ) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    
    const targetScore = stock.currentScore * (1 + targetChangePercent / 100);
    const scoreIncrease = targetScore - stock.currentScore;
    const tasksRequired = Math.ceil(scoreIncrease / 15); // Assume 15 points per task
    
    // Calculate weekly milestones
    const weeks = Math.ceil(timeframe / 7);
    const weeklyIncrease = scoreIncrease / weeks;
    const weeklyMilestones = Array.from({ length: weeks }, (_, i) => 
      stock.currentScore + (weeklyIncrease * (i + 1))
    );
    
    const goal: StrategyGoal = {
      id: `goal-${Date.now()}`,
      stockId,
      targetScore,
      targetChangePercent,
      timeframe,
      currentProgress: 0,
      weeklyMilestones,
      tasksRequired,
      isOnTrack: true,
      createdAt: new Date(),
    };
    
    setStrategyGoals(prev => [...prev, goal]);
  };

  // Simulate load changes
  const simulateLoad = (changes: LoadSimulation['changes']): LoadSimulation => {
    const projectedImpact = changes.map(change => {
      const pointsPerTask = 15; // Average points per task
      const scoreChange = change.additionalTasks * pointsPerTask;
      const stock = stocks.find(s => s.id === change.stockId);
      const percentChange = stock ? (scoreChange / stock.currentScore) * 100 : 0;
      
      return {
        stockId: change.stockId,
        scoreChange,
        percentChange,
      };
    });
    
    // Calculate overall index change
    const totalWeightedChange = projectedImpact.reduce((sum, impact) => {
      const stock = stocks.find(s => s.id === impact.stockId);
      return sum + (impact.scoreChange * (stock?.weight || 0));
    }, 0);
    
    const currentIndex = indexData?.value || 500;
    const overallIndexChange = (totalWeightedChange / currentIndex) * 100;
    
    return {
      scenario: 'Load Simulation',
      changes,
      projectedImpact,
      overallIndexChange,
    };
  };

  // Create what-if scenario
  const createWhatIfScenario = (
    name: string,
    description: string,
    changes: WhatIfScenario['changes']
  ): WhatIfScenario => {
    // Calculate projected results based on changes
    const stockChanges: { stockId: string; change: number }[] = [];
    let indexChange = 0;
    
    changes.forEach(change => {
      switch (change.type) {
        case 'add_task':
          if (change.stockId && change.taskData) {
            const points = change.taskData.points || 15;
            stockChanges.push({ stockId: change.stockId, change: points });
          }
          break;
        case 'change_weight':
          if (change.stockId && change.weightChange) {
            const stock = stocks.find(s => s.id === change.stockId);
            if (stock) {
              const impact = stock.currentScore * change.weightChange;
              indexChange += impact;
            }
          }
          break;
        // Add more cases as needed
      }
    });
    
    const scenario: WhatIfScenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      changes,
      projectedResults: {
        indexChange,
        stockChanges,
        timeframe: 30,
      },
      isSaved: false,
      createdAt: new Date(),
    };
    
    setWhatIfScenarios(prev => [...prev, scenario]);
    return scenario;
  };

  // Save scenario
  const saveScenario = (scenarioId: string) => {
    setWhatIfScenarios(prev => 
      prev.map(scenario => 
        scenario.id === scenarioId 
          ? { ...scenario, isSaved: true }
          : scenario
      )
    );
  };

  // Delete scenario
  const deleteScenario = (scenarioId: string) => {
    setWhatIfScenarios(prev => prev.filter(s => s.id !== scenarioId));
  };

  // Update strategy goal progress
  const updateGoalProgress = (goalId: string) => {
    setStrategyGoals(prev => 
      prev.map(goal => {
        if (goal.id !== goalId) return goal;
        
        const stock = stocks.find(s => s.id === goal.stockId);
        if (!stock) return goal;
        
        const progress = ((stock.currentScore - (goal.targetScore - (goal.targetScore - stock.currentScore))) / goal.targetScore) * 100;
        const isOnTrack = progress >= (Date.now() - goal.createdAt.getTime()) / (goal.timeframe * 24 * 60 * 60 * 1000) * 100;
        
        return {
          ...goal,
          currentProgress: Math.max(0, Math.min(100, progress)),
          isOnTrack,
        };
      })
    );
  };

  // Update goal progress when stocks change
  useEffect(() => {
    strategyGoals.forEach(goal => updateGoalProgress(goal.id));
  }, [stocks]);

  return {
    stockForecasts,
    strategyGoals,
    neglectAlerts,
    whatIfScenarios,
    loading,
    createStrategyGoal,
    simulateLoad,
    createWhatIfScenario,
    saveScenario,
    deleteScenario,
    updateGoalProgress,
  };
};