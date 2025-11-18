/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#05050A', // Ultra-deep cosmic dark
        surface: '#0B0D17', // Very slight elevation
        surfaceHover: '#131626',
        primary: {
          DEFAULT: '#8B5CF6', // Violet
          hover: '#7C3AED',
          dark: '#5B21B6',
          glow: '#C4B5FD',
        },
        accent: {
          DEFAULT: '#EC4899', // Pink/Rose
          hover: '#DB2777',
          glow: '#FBCFE8',
        },
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber
        error: '#EF4444',   // Red
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Body
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], // Headers
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'spin-slow': 'spin 12s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(139, 92, 246, 0.6), 0 0 10px rgba(139, 92, 246, 0.4)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
      },
      boxShadow: {
        'neon-sm': '0 0 10px theme("colors.primary.DEFAULT"), 0 0 5px theme("colors.primary.DEFAULT")',
        'neon-accent': '0 0 10px theme("colors.accent.DEFAULT"), 0 0 5px theme("colors.accent.DEFAULT")',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'elevated': '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
      },
      dropShadow: {
        'glow': '0 0 8px rgba(139, 92, 246, 0.5)',
        'glow-success': '0 0 8px rgba(16, 185, 129, 0.5)',
        'glow-error': '0 0 8px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
};