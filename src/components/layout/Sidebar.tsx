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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/stocks', icon: TrendingUp, label: 'Stocks' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <motion.div
      layout
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      <div className="flex-1 flex flex-col p-6">
        <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}> 
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            style={{ display: isCollapsed ? 'none' : 'block' }}
          >
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">LifeStock</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your potential</p>
          </motion.div>
        </div>
        
        <nav className="space-y-2 flex-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive 
                      ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                  whileHover={{ x: isCollapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.98 }}
                  title={item.label}
                  layout
                  transition={{ type: 'spring', stiffness: 200, damping: 30, delay: isCollapsed ? 0 : idx * 0.03 }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    className="font-medium"
                    initial={false}
                    animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    style={{ display: isCollapsed ? 'none' : 'inline' }}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
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