export interface StrategicInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'risk' | 'rebalance' | 'momentum';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  actions?: string[];
  confidence: number; // 0-100
  category: 'performance' | 'balance' | 'burnout' | 'growth' | 'efficiency';
  createdAt: Date;
  dismissedAt?: Date;
}

export interface PortfolioAnalysis {
  currentBalance: {
    stockId: string;
    name: string;
    currentWeight: number;
    actualActivity: number; // percentage of recent activity
    imbalance: number; // difference between weight and activity
  }[];
  overallHealth: 'excellent' | 'good' | 'concerning' | 'critical';
  burnoutRisk: number; // 0-100
  momentumScore: number; // 0-100
  efficiencyScore: number; // 0-100
  recommendations: {
    type: 'increase' | 'decrease' | 'maintain';
    stockId: string;
    reason: string;
    impact: 'low' | 'medium' | 'high';
  }[];
}

export interface StrategicMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  settings: {
    taskLoadMultiplier: number; // 0.5 = easier, 1.5 = harder
    burnoutThreshold: number; // 0-100
    decayRate: number; // daily score decay
    focusAreas: string[]; // stock categories to prioritize
    restAreas: string[]; // stock categories to de-emphasize
  };
  isActive: boolean;
}

export interface PatternDetection {
  id: string;
  pattern: string;
  description: string;
  frequency: number; // how often it occurs
  lastOccurrence: Date;
  predictedNext?: Date;
  interventions: string[];
  confidence: number;
}

export interface LifeTrajectory {
  timeframe: 30 | 60 | 90; // days
  currentPath: {
    stockId: string;
    projectedScore: number;
    confidence: number;
  }[];
  optimizedPath: {
    stockId: string;
    projectedScore: number;
    requiredChanges: string[];
  }[];
  scenarios: {
    name: string;
    description: string;
    impact: number; // overall index change
    effort: 'low' | 'medium' | 'high';
  }[];
}

export interface StrategicBrainState {
  insights: StrategicInsight[];
  portfolioAnalysis: PortfolioAnalysis;
  activeMode: StrategicMode;
  availableModes: StrategicMode[];
  patterns: PatternDetection[];
  trajectory: LifeTrajectory;
  lastAnalysis: Date;
  advisorPersonality: 'zen' | 'energetic' | 'analytical' | 'supportive';
}