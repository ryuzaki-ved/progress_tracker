import { useState, useEffect, useMemo } from 'react';
import { 
  StrategicBrainState, 
  StrategicInsight, 
  PortfolioAnalysis, 
  StrategicMode,
  PatternDetection,
  LifeTrajectory
} from '../types/strategicBrain';
import { useStocks } from './useStocks';
import { useTasks } from './useTasks';
import { useIndex } from './useIndex';
import { subDays, differenceInDays, format, addDays } from 'date-fns';

const STRATEGIC_MODES: StrategicMode[] = [
  {
    id: 'balanced',
    name: 'Balanced Growth',
    description: 'Steady progress across all life areas',
    icon: '⚖️',
    color: 'bg-blue-500',
    settings: {
      taskLoadMultiplier: 1.0,
      burnoutThreshold: 70,
      decayRate: 0.5,
      focusAreas: [],
      restAreas: [],
    },
    isActive: true,
  },
  {
    id: 'sprint',
    name: 'Growth Sprint',
    description: 'Aggressive growth with burnout protection',
    icon: '🚀',
    color: 'bg-red-500',
    settings: {
      taskLoadMultiplier: 1.4,
      burnoutThreshold: 85,
      decayRate: 0.3,
      focusAreas: ['Professional', 'Education'],
      restAreas: [],
    },
    isActive: false,
  },
  {
    id: 'recovery',
    name: 'Recovery Mode',
    description: 'Gentle pacing with wellness focus',
    icon: '🌱',
    color: 'bg-green-500',
    settings: {
      taskLoadMultiplier: 0.7,
      burnoutThreshold: 50,
      decayRate: 0.2,
      focusAreas: ['Health', 'Personal'],
      restAreas: ['Professional'],
    },
    isActive: false,
  },
  {
    id: 'stabilize',
    name: 'Stabilize',
    description: 'Maintain current levels, reduce volatility',
    icon: '🧘',
    color: 'bg-purple-500',
    settings: {
      taskLoadMultiplier: 0.9,
      burnoutThreshold: 60,
      decayRate: 0.1,
      focusAreas: [],
      restAreas: [],
    },
    isActive: false,
  },
];

export const useStrategicBrain = () => {
  const { stocks } = useStocks();
  const { tasks } = useTasks();
  const { indexData } = useIndex();
  
  const [strategicModes, setStrategicModes] = useState<StrategicMode[]>(STRATEGIC_MODES);
  const [advisorPersonality, setAdvisorPersonality] = useState<'zen' | 'energetic' | 'analytical' | 'supportive'>(() => {
    // Load from localStorage or default to analytical
    const saved = localStorage.getItem('advisor-personality');
    return (saved as 'zen' | 'energetic' | 'analytical' | 'supportive') || 'analytical';
  });
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);

  // Calculate portfolio analysis
  const portfolioAnalysis = useMemo((): PortfolioAnalysis => {
    const now = new Date();
    const last14Days = subDays(now, 14);
    
    // Calculate actual activity vs intended weight for each stock
    const currentBalance = stocks.map(stock => {
      const stockTasks = tasks.filter(task => 
        task.stockId === stock.id && 
        task.createdAt >= last14Days
      );
      const completedTasks = stockTasks.filter(task => task.status === 'completed');
      const totalActivity = tasks.filter(task => task.createdAt >= last14Days).length;
      
      const actualActivity = totalActivity > 0 ? (stockTasks.length / totalActivity) * 100 : 0;
      const imbalance = actualActivity - (stock.weight * 100);
      
      return {
        stockId: stock.id,
        name: stock.name,
        currentWeight: stock.weight * 100,
        actualActivity,
        imbalance,
      };
    });

    // Calculate overall health metrics
    const avgImbalance = currentBalance.reduce((sum, item) => sum + Math.abs(item.imbalance), 0) / currentBalance.length;
    const overallHealth = avgImbalance < 10 ? 'excellent' : avgImbalance < 20 ? 'good' : avgImbalance < 35 ? 'concerning' : 'critical';
    
    // Calculate burnout risk
    const recentTaskLoad = tasks.filter(task => 
      task.createdAt >= subDays(now, 7) && task.status !== 'cancelled'
    ).length;
    const burnoutRisk = Math.min(100, (recentTaskLoad / 7) * 10); // Rough calculation
    
    // Calculate momentum (recent completion rate)
    const recentTasks = tasks.filter(task => task.createdAt >= subDays(now, 7));
    const completionRate = recentTasks.length > 0 ? 
      (recentTasks.filter(task => task.status === 'completed').length / recentTasks.length) * 100 : 0;
    const momentumScore = completionRate;
    
    // Calculate efficiency (points per task)
    const avgPoints = recentTasks.length > 0 ? 
      recentTasks.reduce((sum, task) => sum + task.points, 0) / recentTasks.length : 0;
    const efficiencyScore = Math.min(100, (avgPoints / 15) * 100); // Assuming 15 is good average
    
    // Generate recommendations
    const recommendations = currentBalance
      .filter(item => Math.abs(item.imbalance) > 15)
      .map(item => ({
        type: item.imbalance > 0 ? 'decrease' as const : 'increase' as const,
        stockId: item.stockId,
        reason: item.imbalance > 0 
          ? `Over-invested: ${item.imbalance.toFixed(1)}% above target`
          : `Under-invested: ${Math.abs(item.imbalance).toFixed(1)}% below target`,
        impact: Math.abs(item.imbalance) > 25 ? 'high' as const : 'medium' as const,
      }));

    return {
      currentBalance,
      overallHealth,
      burnoutRisk,
      momentumScore,
      efficiencyScore,
      recommendations,
    };
  }, [stocks, tasks]);

  // Generate strategic insights
  const generateInsights = () => {
    const newInsights: StrategicInsight[] = [];
    const now = new Date();

    // Burnout risk insight
    if (portfolioAnalysis.burnoutRisk > 70) {
      newInsights.push({
        id: `burnout-${now.getTime()}`,
        type: 'risk',
        severity: portfolioAnalysis.burnoutRisk > 85 ? 'critical' : 'high',
        title: 'High Burnout Risk Detected',
        description: `Your task load is ${portfolioAnalysis.burnoutRisk.toFixed(0)}% above sustainable levels. Consider switching to Recovery Mode.`,
        actionable: true,
        actions: ['Switch to Recovery Mode', 'Defer non-critical tasks', 'Schedule rest time'],
        confidence: 85,
        category: 'burnout',
        createdAt: now,
      });
    }

    // Portfolio imbalance insight
    const majorImbalances = portfolioAnalysis.currentBalance.filter(item => Math.abs(item.imbalance) > 20);
    if (majorImbalances.length > 0) {
      const worst = majorImbalances.reduce((prev, curr) => 
        Math.abs(curr.imbalance) > Math.abs(prev.imbalance) ? curr : prev
      );
      
      newInsights.push({
        id: `imbalance-${now.getTime()}`,
        type: 'rebalance',
        severity: 'medium',
        title: 'Portfolio Imbalance Detected',
        description: `${worst.name} is ${Math.abs(worst.imbalance).toFixed(1)}% ${worst.imbalance > 0 ? 'over' : 'under'}-weighted in your recent activity.`,
        actionable: true,
        actions: worst.imbalance > 0 
          ? [`Reduce ${worst.name} tasks`, 'Focus on other areas']
          : [`Add more ${worst.name} tasks`, 'Schedule dedicated time'],
        confidence: 75,
        category: 'balance',
        createdAt: now,
      });
    }

    // Momentum opportunity
    if (portfolioAnalysis.momentumScore > 80) {
      newInsights.push({
        id: `momentum-${now.getTime()}`,
        type: 'opportunity',
        severity: 'low',
        title: 'High Momentum Detected',
        description: `You're completing ${portfolioAnalysis.momentumScore.toFixed(0)}% of tasks. Consider increasing your goals or switching to Growth Sprint mode.`,
        actionable: true,
        actions: ['Switch to Growth Sprint', 'Add stretch goals', 'Increase task difficulty'],
        confidence: 90,
        category: 'growth',
        createdAt: now,
      });
    }

    // Low momentum warning
    if (portfolioAnalysis.momentumScore < 40) {
      newInsights.push({
        id: `low-momentum-${now.getTime()}`,
        type: 'risk',
        severity: 'medium',
        title: 'Low Momentum Alert',
        description: `Only ${portfolioAnalysis.momentumScore.toFixed(0)}% task completion rate. Consider simplifying your approach.`,
        actionable: true,
        actions: ['Switch to Stabilize mode', 'Reduce task complexity', 'Focus on quick wins'],
        confidence: 80,
        category: 'performance',
        createdAt: now,
      });
    }

    setInsights(prev => [...prev.filter(insight => !insight.dismissedAt), ...newInsights]);
  };

  // Detect patterns in user behavior
  const detectPatterns = () => {
    const now = new Date();
    const last30Days = subDays(now, 30);
    const recentTasks = tasks.filter(task => task.createdAt >= last30Days);
    
    const newPatterns: PatternDetection[] = [];

    // Weekly cycle pattern
    const tasksByDay = recentTasks.reduce((acc, task) => {
      const day = task.createdAt.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const weekendTasks = (tasksByDay[0] || 0) + (tasksByDay[6] || 0);
    const weekdayTasks = Object.entries(tasksByDay)
      .filter(([day]) => parseInt(day) >= 1 && parseInt(day) <= 5)
      .reduce((sum, [, count]) => sum + count, 0);

    if (weekendTasks < weekdayTasks * 0.2) {
      newPatterns.push({
        id: 'weekend-drop',
        pattern: 'Weekend Productivity Drop',
        description: 'You tend to be much less active on weekends. Consider light maintenance tasks.',
        frequency: 0.8,
        lastOccurrence: now,
        interventions: ['Schedule light weekend tasks', 'Plan weekend reviews', 'Set weekend goals'],
        confidence: 85,
      });
    }

    // Overcommitment pattern
    const tasksByWeek = recentTasks.reduce((acc, task) => {
      const week = Math.floor(differenceInDays(task.createdAt, last30Days) / 7);
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const weekCounts = Object.values(tasksByWeek);
    const avgWeekly = weekCounts.reduce((sum, count) => sum + count, 0) / weekCounts.length;
    const hasSpikes = weekCounts.some(count => count > avgWeekly * 1.5);

    if (hasSpikes) {
      newPatterns.push({
        id: 'overcommitment-spikes',
        pattern: 'Periodic Overcommitment',
        description: 'You tend to create too many tasks in bursts, leading to overwhelm.',
        frequency: 0.6,
        lastOccurrence: now,
        interventions: ['Set weekly task limits', 'Use task budgeting', 'Spread tasks evenly'],
        confidence: 70,
      });
    }

    setPatterns(newPatterns);
  };

  // Generate life trajectory forecast
  const generateTrajectory = (timeframe: 30 | 60 | 90): LifeTrajectory => {
    const currentPath = stocks.map(stock => ({
      stockId: stock.id,
      projectedScore: stock.currentScore + (stock.changePercent * timeframe / 30),
      confidence: 70,
    }));

    const optimizedPath = stocks.map(stock => ({
      stockId: stock.id,
      projectedScore: stock.currentScore * 1.2, // 20% improvement
      requiredChanges: [
        `Add 2-3 ${stock.name} tasks per week`,
        'Maintain consistent daily progress',
        'Focus on high-impact activities',
      ],
    }));

    const scenarios = [
      {
        name: 'Current Pace',
        description: 'Continue with existing habits and task patterns',
        impact: indexData?.changePercent || 0,
        effort: 'low' as const,
      },
      {
        name: 'Optimized Balance',
        description: 'Rebalance portfolio according to recommendations',
        impact: (indexData?.changePercent || 0) * 1.3,
        effort: 'medium' as const,
      },
      {
        name: 'Growth Sprint',
        description: 'Aggressive improvement across all areas',
        impact: (indexData?.changePercent || 0) * 1.8,
        effort: 'high' as const,
      },
    ];

    return {
      timeframe,
      currentPath,
      optimizedPath,
      scenarios,
    };
  };

  // Switch strategic mode
  const switchMode = (modeId: string) => {
    setStrategicModes(prev => prev.map(mode => ({
      ...mode,
      isActive: mode.id === modeId,
    })));
  };

  // Dismiss insight
  const dismissInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, dismissedAt: new Date() }
        : insight
    ));
  };

  // Update advisor personality and save to localStorage
  const updateAdvisorPersonality = (personality: 'zen' | 'energetic' | 'analytical' | 'supportive') => {
    setAdvisorPersonality(personality);
    localStorage.setItem('advisor-personality', personality);
  };
  // Run analysis periodically
  useEffect(() => {
    if (stocks.length > 0 && tasks.length > 0) {
      generateInsights();
      detectPatterns();
    }
  }, [stocks, tasks, portfolioAnalysis]);

  const activeMode = strategicModes.find(mode => mode.isActive) || strategicModes[0];
  const trajectory = generateTrajectory(30);

  const strategicBrainState: StrategicBrainState = {
    insights: insights.filter(insight => !insight.dismissedAt),
    portfolioAnalysis,
    activeMode,
    availableModes: strategicModes,
    patterns,
    trajectory,
    lastAnalysis: new Date(),
    advisorPersonality,
  };

  return {
    strategicBrain: strategicBrainState,
    switchMode,
    dismissInsight,
    setAdvisorPersonality: updateAdvisorPersonality,
    generateTrajectory,
  };
};