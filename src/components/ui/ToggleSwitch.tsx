import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 400px;
  height: 50px;
  border: 2px solid #ffc000;
  border-radius: 30px;
  position: relative;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(255, 192, 0, 0.2);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 25px rgba(255, 192, 0, 0.3);
    border-color: #ffb000;
  }
  
  @media (max-width: 500px) {
    width: 100%;
    min-width: 220px;
    height: 44px;
  }
`;

const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  display: none;
`;

interface ToggleSwitchProps {
  value: 'buy' | 'sell';
  onChange: (value: 'buy' | 'sell') => void;
  option1Label?: string;
  option2Label?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onChange,
  option1Label = 'Buy',
  option2Label = 'Sell',
  className,
}) => {
  const isSell = value === 'sell';

  return (
    <Container className={className}>
      {/* Animated sliding background */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full z-10"
        animate={{
          x: isSell ? '100%' : '0%',
          backgroundColor: isSell ? '#e53935' : '#ffc000',
          boxShadow: isSell
            ? '0 4px 24px 0 rgba(229,57,53,0.25), 0 2px 10px rgba(229,57,53,0.3)'
            : '0 4px 24px 0 rgba(255,192,0,0.18), 0 2px 10px rgba(255,192,0,0.3)',
          borderRadius: isSell ? '30px' : '30px',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.4,
        }}
      />

      {/* Buy option */}
      <HiddenRadio
        id="buy"
        name="tradeType"
        checked={value === 'buy'}
        onChange={() => onChange('buy')}
      />
      <motion.label
        htmlFor="buy"
        className="flex-1 text-center z-20 cursor-pointer user-select-none relative"
        animate={{
          color: value === 'buy' ? '#212121' : '#7d7d7d',
          fontWeight: value === 'buy' ? 'bold' : 'normal',
          scale: value === 'buy' ? 1.05 : 1,
          textShadow: value === 'buy' ? '0 2px 8px #ffc00099, 0 1px 2px rgba(0,0,0,0.08)' : 'none',
          y: value === 'buy' ? -3 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
          duration: 0.3,
        }}
        whileHover={{
          scale: 1.02,
        }}
        whileTap={{
          scale: 0.98,
        }}
        style={{
          fontSize: '1.2rem',
          lineHeight: '50px',
        }}
      >
        <motion.span
          animate={{
            y: value === 'buy' ? -1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {option1Label}
        </motion.span>
        {/* Subtle glow effect when selected */}
        {value === 'buy' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }}
          />
        )}
      </motion.label>

      {/* Sell option */}
      <HiddenRadio
        id="sell"
        name="tradeType"
        checked={value === 'sell'}
        onChange={() => onChange('sell')}
      />
      <motion.label
        htmlFor="sell"
        className="flex-1 text-center z-20 cursor-pointer user-select-none relative"
        animate={{
          color: value === 'sell' ? '#fff' : '#7d7d7d',
          fontWeight: value === 'sell' ? 'bold' : 'normal',
          scale: value === 'sell' ? 1.05 : 1,
          textShadow: value === 'sell' ? '0 2px 8px #e5393599, 0 1px 2px rgba(0,0,0,0.12)' : 'none',
          y: value === 'sell' ? -3 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
          duration: 0.3,
        }}
        whileHover={{
          scale: 1.02,
        }}
        whileTap={{
          scale: 0.98,
        }}
        style={{
          fontSize: '1.2rem',
          lineHeight: '50px',
        }}
      >
        <motion.span
          animate={{
            y: value === 'sell' ? -1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {option2Label}
        </motion.span>
        {/* Subtle glow effect when selected */}
        {value === 'sell' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }}
          />
        )}
      </motion.label>

      {/* Animated border highlight */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          borderColor: isSell ? '#e53935' : '#ffc000',
          boxShadow: isSell
            ? '0 0 0 4px #e5393533, 0 0 12px 2px #e5393533'
            : '0 0 0 4px #ffc00033, 0 0 12px 2px #ffc00033',
        }}
        transition={{
          duration: 0.35,
        }}
        style={{
          borderWidth: 2,
          borderStyle: 'solid',
        }}
      />

      {/* Pulse effect on selection change */}
      <motion.div
        key={value} // This ensures the animation triggers on value change
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ 
          scale: 1,
          opacity: 0.6,
          background: isSell ? 'rgba(229, 57, 53, 0.2)' : 'rgba(255, 192, 0, 0.2)',
        }}
        animate={{ 
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.15, 0],
        }}
        transition={{
          duration: 0.7,
          ease: 'easeOut',
        }}
      />
    </Container>
  );
};