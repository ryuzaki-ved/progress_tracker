import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  show?: boolean; // Only show tooltip if true (e.g., sidebar is collapsed)
  placement?: 'right' | 'top' | 'bottom' | 'left';
  className?: string;
  hideTrigger?: any; // When this changes, tooltip will hide
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  show = true,
  placement = 'right',
  className = '',
  hideTrigger,
}) => {
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    setVisible(false);
  }, [hideTrigger]);

  // Only render tooltip logic if show is true
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {children}
      <AnimatePresence>
        {show && visible && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.95, y: 0, x: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y:
                placement === 'right' || placement === 'left'
                  ? '-50%'
                  : placement === 'top'
                  ? -8
                  : placement === 'bottom'
                  ? 8
                  : 0,
              x:
                placement === 'right'
                  ? 12
                  : placement === 'left'
                  ? -12
                  : 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 0, x: 0 }}
            transition={{ duration: 0.18, type: 'spring', stiffness: 350, damping: 22 }}
            className={`absolute z-50 whitespace-nowrap pointer-events-none ${
              placement === 'right'
                ? 'left-full top-1/2 ml-2'
                : placement === 'left'
                ? 'right-full top-1/2 mr-2'
                : placement === 'top'
                ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
                : 'top-full left-1/2 -translate-x-1/2 mt-2'
            } ${className}`}
          >
            <div className="bg-gray-900 text-gray-100 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-800 font-medium">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 