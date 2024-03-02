import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(false);
  }, [hideTrigger]);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.top + rect.height / 2;
      let left = rect.right + 12;

      if (placement === 'left') {
        left = rect.left - 12;
      } else if (placement === 'top') {
        top = rect.top - 12;
        left = rect.left + rect.width / 2;
      } else if (placement === 'bottom') {
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2;
      }

      // Adjust vertical position to account for tooltip height
      const tooltipHeight = 32; // Approximate tooltip height
      top = top - tooltipHeight / 2;

      setPosition({ top, left });
    }
  }, [visible, placement]);

  // Only render tooltip logic if show is true
  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        {children}
      </div>
      
      {show && createPortal(
        <AnimatePresence>
          {visible && (
                         <motion.div
               key="tooltip"
               initial={{ opacity: 0, scale: 0.95, y: 0, x: 0 }}
               animate={{
                 opacity: 1,
                 scale: 1,
                 y: placement === 'top' ? -8 : placement === 'bottom' ? 8 : 0,
                 x: placement === 'right' ? 12 : placement === 'left' ? -12 : 0,
               }}
               exit={{ opacity: 0, scale: 0.95, y: 0, x: 0 }}
               transition={{ duration: 0.18, type: 'spring', stiffness: 350, damping: 22 }}
               className="fixed z-[99999] whitespace-nowrap pointer-events-none"
               style={{
                 top: position.top,
                 left: position.left,
                 transform: placement === 'top' || placement === 'bottom' 
                   ? 'translateX(-50%)' 
                   : placement === 'left' || placement === 'right'
                   ? 'translateY(-50%)'
                   : 'none'
               }}
             >
              <div className="bg-gray-900 text-gray-100 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-800 font-medium">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}; 