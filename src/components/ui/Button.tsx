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
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary',
    ghost: 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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