import React from 'react';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-neon hover:shadow-neon-accent transition-all duration-300 border border-transparent',
    secondary: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/10',
    outline: 'border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary shadow-neon-sm',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    destructive: 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 hover:text-red-300 shadow-lg shadow-red-500/20',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Skewed white stripe animation
const stripeAnim = keyframes`
  0% {
    left: -60%;
    opacity: 0;
  }
  20% {
    opacity: 0.7;
  }
  50% {
    left: 60%;
    opacity: 1;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    opacity: 0;
  }
`;

export const PlaceOrderButton = styled.button`
  position: relative;
  display: inline-block;
  width: 100%;
  padding: 0.85em 0;
  background: transparent;
  border: 2px solid rgb(61, 106, 255);
  border-radius: 7px;
  color: #fff;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 2px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px 0 rgba(61, 106, 255, 0.08);
  transition: background 0.2s ease-out, box-shadow 0.2s ease-out, border 0.2s, color 0.2s;
  outline: none;
  z-index: 1;

  &:hover {
    background: rgb(61, 106, 255);
    box-shadow: 0 0 30px 5px rgba(0, 142, 236, 0.815);
    border-color: rgb(61, 106, 255);
  }

  &:hover .stripe {
    animation: ${stripeAnim} 0.9s forwards;
  }

  &:active {
    background: transparent;
    box-shadow: none;
    border-color: rgb(61, 106, 255);
    color: #fff;
    transition: background 0.2s ease-in, box-shadow 0.2s ease-in;
  }

  .stripe {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.0) 100%);
    box-shadow: 0 0 30px 10px #fff;
    opacity: 0;
    transform: skewX(-20deg);
    pointer-events: none;
    z-index: 2;
  }

  @media (max-width: 500px) {
    font-size: 12px;
    padding: 0.7em 0;
  }
`;