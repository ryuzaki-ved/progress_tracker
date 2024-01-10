export interface SimulationState {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  isActive: boolean;
  
  // Cloned data from real state
  stocks: import('./index').Stock[];
  tasks: import('./index').Task[];
  indexHistory: { date: Date; value: number }[];
  currentIndexValue: number;
  
  // Simulation-specific metadata
  tags: string[];
  color: string;
  projectedDuration: number; // days
  confidence: 'low' | 'medium' | 'high';
  
  // Comparison metrics
  projectedChanges: {
    indexChange: number;
    stockChanges: { stockId: string; change: number; percentage: number }[];
    riskLevel: 'low' | 'medium' | 'high';
    burnoutRisk: number; // 0-100
    balanceScore: number; // 0-100
  };
}

export interface SimulationComparison {
  realState: {
    indexValue: number;
    stocks: import('./index').Stock[];
    recentTrend: 'rising' | 'falling' | 'stable';
  };
  simulatedState: {
    indexValue: number;
    stocks: import('./index').Stock[];
    projectedTrend: 'rising' | 'falling' | 'stable';
  };
  insights: SimulationInsight[];
}

export interface SimulationInsight {
  id: string;
  type: 'improvement' | 'warning' | 'neutral' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: 'productivity' | 'balance' | 'growth' | 'risk';
  confidence: number; // 0-100
}

export interface SimulationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'balance' | 'growth' | 'recovery';
  changes: {
    stockWeightChanges?: { stockId: string; newWeight: number }[];
    taskChanges?: { action: 'add' | 'remove' | 'modify'; taskData: any }[];
    routineChanges?: { type: string; data: any }[];
  };
}