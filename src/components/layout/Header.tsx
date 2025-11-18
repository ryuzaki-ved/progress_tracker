import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Menu, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="relative group hidden sm:block">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search stocks, tasks, or analytics..."
              className="relative pl-10 pr-4 py-2 w-64 md:w-96 border border-white/10 rounded-lg bg-black/20 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-black/40 transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          </Button>

          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-gray-400 hover:text-white hover:bg-white/5 flex items-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">{user?.username}</span>
            </Button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm text-white font-medium truncate">{user?.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { navigate('/admin'); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center transition-colors"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-700 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
