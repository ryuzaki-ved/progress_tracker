import React from 'react';
import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="glass-panel border-b border-white/5 px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-background/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search stocks, tasks, or analytics..."
              className="relative pl-10 pr-4 py-2 w-96 border border-white/10 rounded-lg bg-black/20 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-black/40 transition-all duration-300"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400 font-mono">
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
            <User className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-400 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};