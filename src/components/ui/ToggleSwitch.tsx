import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Edit3 } from 'lucide-react';

interface ToggleSwitchProps {
  value: string;
  onChange: (value: any) => void;
  option1Value?: string;
  option2Value?: string;
  option1Label?: string;
  option2Label?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onChange,
  option1Value = 'buy',
  option2Value = 'sell',
  option1Label = 'Buy',
  option2Label = 'Sell',
  className = '',
}) => {
  const isOpt1 = value === option1Value;
  const isOpt2 = value === option2Value;

  const Icon1 = option1Label.toLowerCase() === 'buy' ? TrendingUp : TrendingUp;
  const Icon2 = option2Label.toLowerCase() === 'write' ? Edit3 : TrendingDown;

  return (
    <div 
      className={`relative flex items-center w-full max-w-[400px] h-16 bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/5 rounded-full p-1.5 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] cursor-pointer overflow-hidden transition-all duration-300 ${className}`}
      onClick={() => onChange(isOpt1 ? option2Value : option1Value)}
      style={{
        boxShadow: isOpt1 ? 'inset 0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(16,185,129,0.05)' : 'inset 0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(244,63,94,0.05)'
      }}
    >
      {/* SLIDING THUMB */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full flex items-center justify-center overflow-hidden"
        animate={{
          left: isOpt1 ? '6px' : 'calc(50%)',
          background: isOpt1 ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)' : 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
          boxShadow: isOpt1 
            ? '0 8px 20px rgba(16,185,129,0.4), inset 0 1px 1px rgba(255,255,255,0.4)' 
            : '0 8px 20px rgba(244,63,94,0.4), inset 0 1px 1px rgba(255,255,255,0.4)'
        }}
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
      >
        {/* Sweeping Glass Sheen inside the thumb */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-30deg] w-[200%] pointer-events-none"
          initial={{ left: '-150%' }}
          animate={{ left: '150%' }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 1 }}
        />
      </motion.div>

      {/* TEXT LAYER */}
      <div className="relative flex w-full z-10 font-display font-extrabold text-lg tracking-wide pointer-events-none">
        <div 
          className={`flex-1 flex items-center justify-center space-x-2 transition-colors duration-300 ${isOpt1 ? 'text-white' : 'text-gray-500 hover:text-white/60 pointer-events-auto'}`}
          onClick={(e) => { e.stopPropagation(); onChange(option1Value); }}
        >
          <Icon1 className={`w-5 h-5 transition-colors duration-300 ${isOpt1 ? 'text-emerald-100' : 'opacity-40'}`} />
          <span className={`${isOpt1 ? 'drop-shadow-md' : ''}`}>{option1Label}</span>
        </div>
        
        <div 
          className={`flex-1 flex items-center justify-center space-x-2 transition-colors duration-300 ${isOpt2 ? 'text-white' : 'text-gray-500 hover:text-white/60 pointer-events-auto'}`}
          onClick={(e) => { e.stopPropagation(); onChange(option2Value); }}
        >
          <Icon2 className={`w-5 h-5 transition-colors duration-300 ${isOpt2 ? 'text-rose-100' : 'opacity-40'}`} />
          <span className={`${isOpt2 ? 'drop-shadow-md' : ''}`}>{option2Label}</span>
        </div>
      </div>
    </div>
  );
};
