import React, { useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';

export const MotivationalBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse parallax motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse movement
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  // Transforms for different layers to create depth
  const textX = useTransform(springX, [-0.5, 0.5], ['-20px', '20px']);
  const textY = useTransform(springY, [-0.5, 0.5], ['-20px', '20px']);
  
  const midX = useTransform(springX, [-0.5, 0.5], ['-40px', '40px']);
  const midY = useTransform(springY, [-0.5, 0.5], ['-40px', '40px']);

  const farX = useTransform(springX, [-0.5, 0.5], ['-60px', '60px']);
  const farY = useTransform(springY, [-0.5, 0.5], ['-60px', '60px']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 overflow-hidden bg-[#05050A] perspective-1000 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Background Glows (Amber/Red instead of Violet) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-500/5 blur-[100px] rounded-full" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #F59E0B 1px, transparent 1px), linear-gradient(to bottom, #F59E0B 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
        }}
      />

      {/* Floating 3D Elements */}
      <motion.div 
        style={{ x: farX, y: farY, rotateX: useTransform(springY, [-0.5, 0.5], [5, -5]), rotateY: useTransform(springX, [-0.5, 0.5], [-5, 5]) }}
        className="absolute inset-0 pointer-events-none select-none"
      >
        {/* DO IT NOW: Left / Middle area, BIG - STABLE COLOR */}
        <motion.div
          initial={{ opacity: 0, x: -150 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          style={{ x: textX, y: textY }}
          className="absolute top-[24%] left-[-5%] md:left-[3%]"
        >
          <h2 className="text-[10rem] md:text-[12rem] font-black tracking-tighter text-amber-500/55 filter blur-[1px] uppercase leading-none select-none">
            DO IT <br/> NOW
          </h2>
        </motion.div>

        {/* OR FORGET IT: UP (Top Right area) - FADED COLOR */}
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          style={{ x: midX, y: midY }}
          className="absolute top-[8%] right-[7%] text-right"
        >
          <h3 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-red-500/60 to-transparent uppercase italic border-r-8 border-red-500/10 pr-6">
            OR <br/> FORGET <br/> IT
          </h3>
        </motion.div>

        {/* LIFETIME: RIGHT SIDE (Bottom Right area) */}
        <motion.div
          initial={{ opacity: 0, x: 150 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 0.6, type: "spring", stiffness: 30 }}
          style={{ x: farX, y: farY }}
          className="absolute bottom-[18%] right-[3%] text-right"
        >
          <h1 className="text-8xl md:text-[8rem] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-t from-red-600 via-red-500 to-amber-500 drop-shadow-[0_0_60px_rgba(239,68,68,0.3)] filter brightness-125 uppercase">
            LIFETIME
          </h1>
          <div className="absolute -inset-20 bg-gradient-to-l from-red-600/10 via-transparent to-transparent blur-3xl -z-10 animate-pulse-slow" />
        </motion.div>
      </motion.div>

      {/* Particles / Noise Layer - Using a dot pattern instead of missing bg-noise */}
      <div 
        className="absolute inset-0 opacity-[0.1] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #F59E0B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 90%)'
        }}
      />
      
      {/* Decorative lines */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent transform -translate-y-1/2" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent transform -translate-x-1/2" />
    </div>
  );
};
