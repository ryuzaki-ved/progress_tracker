import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Home, 
  PieChart, 
  Settings,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Zap,
  Beaker,
  Brain,
  DollarSign,
  Edit3,
  StickyNote
} from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { Tooltip } from '../ui/Tooltip';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/stocks', icon: TrendingUp, label: 'Stocks' },
  { path: '/trading-desk', icon: DollarSign, label: 'Trading Desk' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/forecasting', icon: Zap, label: 'Forecasting' },
  { path: '/strategic-brain', icon: Brain, label: 'Strategic Brain' },
  { path: '/retrospective', icon: BookOpen, label: 'Retrospective' },
  { path: '/simulation', icon: Beaker, label: 'Simulation' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/index-editor', icon: Edit3, label: 'Index Editor' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [tooltipHideKey, setTooltipHideKey] = useState(0);

  return (
    <motion.div
      layout
      className={`glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col z-50 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      animate={{ 
        width: isCollapsed ? 64 : 240,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30, 
        duration: 0.3,
      }}
    >
      <div className="flex-1 flex flex-col p-3">
        <div className={`flex items-center mb-6 w-full ${isCollapsed ? 'justify-center' : 'justify-center'}`}> 
          <Link to="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'} ${isCollapsed ? 'w-full' : 'w-full'} hover:opacity-80 transition-opacity duration-200`}>
            <div className="w-8 h-8 bg-primary/20 border border-primary/50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-neon-sm">
              <PieChart className="w-5 h-5 text-primary" />
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.35 }}
              style={{ display: isCollapsed ? 'none' : 'block' }}
              className="ml-3"
            >
              <h1 className="text-lg font-bold text-white font-display tracking-wide text-glow">LifeStock</h1>
            </motion.div>
          </Link>
        </div>
        
        <nav className="space-y-1 flex-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setTooltipHideKey(k => k + 1)} className="w-full block">
                <Tooltip content={item.label} show={isCollapsed} placement="right" hideTrigger={tooltipHideKey}>
                  <motion.div
                    className={`w-full flex items-center px-3 py-2 rounded-md transition-all duration-200 relative overflow-hidden ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-neon-sm' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                    whileHover={{ x: isCollapsed ? 0 : 2, backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebar"
                        className="absolute inset-0 bg-primary/5 rounded-md"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' : ''}`} />
                    <motion.span
                      className="font-medium text-sm"
                      initial={false}
                      animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 30, 
                        duration: 0.3,
                        mass: 1.0
                      }}
                      style={{ display: isCollapsed ? 'none' : 'inline' }}
                    >
                      {item.label}
                    </motion.span>
                  </motion.div>
                </Tooltip>
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Collapse/Expand Toggle Button at the bottom */}
      <motion.button
        onClick={toggleSidebar}
        className={`mb-4 mx-4 flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 ${
          isCollapsed ? 'justify-center' : 'space-x-3'
        }`}
        whileHover={{ x: isCollapsed ? 0 : 2 }}
        whileTap={{ scale: 0.98 }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ alignSelf: isCollapsed ? 'center' : 'flex-start' }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <>
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Collapse</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
};