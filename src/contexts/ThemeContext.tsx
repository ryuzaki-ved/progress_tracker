import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ACCENT_COLORS = {
  blue: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryDark: '#1D4ED8',
    bg: 'bg-blue-500',
    bgHover: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-500',
  },
  green: {
    primary: '#10B981',
    primaryHover: '#059669',
    primaryDark: '#047857',
    bg: 'bg-green-500',
    bgHover: 'bg-green-600',
    text: 'text-green-600',
    border: 'border-green-500',
  },
  purple: {
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryDark: '#6D28D9',
    bg: 'bg-purple-500',
    bgHover: 'bg-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-500',
  },
  orange: {
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryDark: '#B45309',
    bg: 'bg-orange-500',
    bgHover: 'bg-orange-600',
    text: 'text-orange-600',
    border: 'border-orange-500',
  },
  pink: {
    primary: '#EC4899',
    primaryHover: '#DB2777',
    primaryDark: '#BE185D',
    bg: 'bg-pink-500',
    bgHover: 'bg-pink-600',
    text: 'text-pink-600',
    border: 'border-pink-500',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'system';
  });
  
  const [accent, setAccent] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('theme-accent');
    return (saved as AccentColor) || 'blue';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;
      
      if (mode === 'dark') {
        shouldBeDark = true;
      } else if (mode === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(shouldBeDark);
      
      // Update document classes
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update CSS custom properties for accent color
      const accentConfig = ACCENT_COLORS[accent];
      document.documentElement.style.setProperty('--color-primary', accentConfig.primary);
      document.documentElement.style.setProperty('--color-primary-hover', accentConfig.primaryHover);
      document.documentElement.style.setProperty('--color-primary-dark', accentConfig.primaryDark);
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, accent]);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const handleSetAccent = (newAccent: AccentColor) => {
    setAccent(newAccent);
    localStorage.setItem('theme-accent', newAccent);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        isDark,
        setMode: handleSetMode,
        setAccent: handleSetAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};