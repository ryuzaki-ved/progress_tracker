import { Stock, Task, IndexData } from '../types';

export const mockStocks: Stock[] = [
  {
    id: '1',
    name: 'Career Development',
    icon: 'briefcase',
    category: 'Professional',
    currentScore: 750,
    change: 15,
    changePercent: 2.04,
    volatility: 'medium',
    lastActivity: new Date('2024-01-15'),
    color: 'bg-blue-500',
    weight: 0.3,
    history: [
      { date: new Date('2024-01-08'), value: 720 },
      { date: new Date('2024-01-09'), value: 725 },
      { date: new Date('2024-01-10'), value: 730 },
      { date: new Date('2024-01-11'), value: 735 },
      { date: new Date('2024-01-12'), value: 740 },
      { date: new Date('2024-01-13'), value: 745 },
      { date: new Date('2024-01-14'), value: 750 },
    ]
  },
  {
    id: '2',
    name: 'Health & Fitness',
    icon: 'heart',
    category: 'Personal',
    currentScore: 820,
    change: 25,
    changePercent: 3.14,
    volatility: 'low',
    lastActivity: new Date('2024-01-15'),
    color: 'bg-green-500',
    weight: 0.25,
    history: [
      { date: new Date('2024-01-08'), value: 795 },
      { date: new Date('2024-01-09'), value: 800 },
      { date: new Date('2024-01-10'), value: 805 },
      { date: new Date('2024-01-11'), value: 810 },
      { date: new Date('2024-01-12'), value: 815 },
      { date: new Date('2024-01-13'), value: 815 },
      { date: new Date('2024-01-14'), value: 820 },
    ]
  },
  {
    id: '3',
    name: 'Side Projects',
    icon: 'rocket',
    category: 'Creative',
    currentScore: 680,
    change: -10,
    changePercent: -1.45,
    volatility: 'high',
    lastActivity: new Date('2024-01-14'),
    color: 'bg-purple-500',
    weight: 0.2,
    history: [
      { date: new Date('2024-01-08'), value: 690 },
      { date: new Date('2024-01-09'), value: 695 },
      { date: new Date('2024-01-10'), value: 700 },
      { date: new Date('2024-01-11'), value: 695 },
      { date: new Date('2024-01-12'), value: 690 },
      { date: new Date('2024-01-13'), value: 685 },
      { date: new Date('2024-01-14'), value: 680 },
    ]
  },
  {
    id: '4',
    name: 'Learning',
    icon: 'book-open',
    category: 'Education',
    currentScore: 720,
    change: 5,
    changePercent: 0.70,
    volatility: 'medium',
    lastActivity: new Date('2024-01-15'),
    color: 'bg-orange-500',
    weight: 0.15,
    history: [
      { date: new Date('2024-01-08'), value: 715 },
      { date: new Date('2024-01-09'), value: 716 },
      { date: new Date('2024-01-10'), value: 717 },
      { date: new Date('2024-01-11'), value: 718 },
      { date: new Date('2024-01-12'), value: 719 },
      { date: new Date('2024-01-13'), value: 720 },
      { date: new Date('2024-01-14'), value: 720 },
    ]
  },
  {
    id: '5',
    name: 'Relationships',
    icon: 'users',
    category: 'Social',
    currentScore: 780,
    change: 8,
    changePercent: 1.04,
    volatility: 'low',
    lastActivity: new Date('2024-01-15'),
    color: 'bg-pink-500',
    weight: 0.1,
    history: [
      { date: new Date('2024-01-08'), value: 772 },
      { date: new Date('2024-01-09'), value: 774 },
      { date: new Date('2024-01-10'), value: 776 },
      { date: new Date('2024-01-11'), value: 778 },
      { date: new Date('2024-01-12'), value: 780 },
      { date: new Date('2024-01-13'), value: 778 },
      { date: new Date('2024-01-14'), value: 780 },
    ]
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete React certification',
    description: 'Finish the advanced React course and get certified',
    dueDate: new Date('2024-01-20'),
    priority: 'high',
    status: 'pending',
    stockId: '1',
    points: 50,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    title: 'Morning workout',
    description: 'Complete 30-minute cardio session',
    dueDate: new Date('2024-01-16'),
    priority: 'medium',
    status: 'completed',
    stockId: '2',
    points: 20,
    createdAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    title: 'Update portfolio website',
    description: 'Add new projects and improve design',
    dueDate: new Date('2024-01-18'),
    priority: 'medium',
    status: 'overdue',
    stockId: '3',
    points: 30,
    createdAt: new Date('2024-01-12'),
  },
  {
    id: '4',
    title: 'Read TypeScript handbook',
    description: 'Study advanced TypeScript concepts',
    dueDate: new Date('2024-01-22'),
    priority: 'low',
    status: 'pending',
    stockId: '4',
    points: 25,
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '5',
    title: 'Call mom',
    description: 'Weekly catch-up call with family',
    dueDate: new Date('2024-01-17'),
    priority: 'high',
    status: 'pending',
    stockId: '5',
    points: 15,
    createdAt: new Date('2024-01-15'),
  },
];

export const mockIndexData: IndexData = {
  value: 748.2,
  change: 12.4,
  changePercent: 1.68,
  history: [
    { date: new Date('2024-01-08'), value: 735.8 },
    { date: new Date('2024-01-09'), value: 738.2 },
    { date: new Date('2024-01-10'), value: 740.5 },
    { date: new Date('2024-01-11'), value: 742.8 },
    { date: new Date('2024-01-12'), value: 745.1 },
    { date: new Date('2024-01-13'), value: 746.3 },
    { date: new Date('2024-01-14'), value: 748.2 },
  ]
};