import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 400px;
  height: 50px;
  border: 2.5px solid #00cfff;
  border-radius: 30px;
  position: relative;
  background: linear-gradient(135deg, #181f2b 60%, #232b3a 100%);
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 0 24px 4px #00cfff99, 0 0 60px 8px #00cfff33;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 40px 8px #00cfffcc, 0 0 80px 16px #00cfff44;
    border-color: #00eaff;
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
          background: isSell
            ? 'linear-gradient(135deg, #2b1a1a 60%, #ff3c6a 100%)'
            : 'linear-gradient(135deg, #0e2a3a 60%, #00cfff 100%)',
          boxShadow: isSell
            ? '0 0 32px 8px #ff3c6a99, 0 0 80px 16px #ff3c6a44'
            : '0 0 32px 8px #00cfff99, 0 0 80px 16px #00cfff44',
          borderRadius: '30px',
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
          color: value === 'buy' ? '#00cfff' : '#4e5a6e',
          fontWeight: value === 'buy' ? 'bold' : 'normal',
          scale: value === 'buy' ? 1.08 : 1,
          textShadow: value === 'buy'
            ? '0 0 8px #00eaff, 0 0 16px #00cfff, 0 1px 2px #00cfff99'
            : '0 0 2px #222',
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
          {option1Label.toUpperCase()}
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
          color: value === 'sell' ? '#ff3c6a' : '#4e5a6e',
          fontWeight: value === 'sell' ? 'bold' : 'normal',
          scale: value === 'sell' ? 1.08 : 1,
          textShadow: value === 'sell'
            ? '0 0 8px #ff3c6a, 0 0 16px #ff3c6a, 0 1px 2px #ff3c6a99'
            : '0 0 2px #222',
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
          {option2Label.toUpperCase()}
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
          borderColor: isSell ? '#ff3c6a' : '#00cfff',
          boxShadow: isSell
            ? '0 0 0 4px #ff3c6a66, 0 0 24px 4px #ff3c6a99'
            : '0 0 0 4px #00cfff66, 0 0 24px 4px #00cfff99',
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
          background: isSell ? 'rgba(255, 60, 106, 0.18)' : 'rgba(0, 207, 255, 0.18)',
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
      {/* Scanline/pulse effect */}
      <motion.div
        key={value + '-scanline'}
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.12, 0.22, 0.12],
          background:
            value === 'buy'
              ? 'repeating-linear-gradient(90deg, #00eaff33 0 2px, transparent 2px 8px)'
              : 'repeating-linear-gradient(90deg, #ff3c6a33 0 2px, transparent 2px 8px)',
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ zIndex: 30 }}
      />
    </Container>
  );
};