import React, { useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Parallax container that reacts to mouse and tilt using motion values
export default function ParallaxLayers({ className = '' }: { className?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Smooth springed values
  const sx = useSpring(mx, { stiffness: 40, damping: 12 });
  const sy = useSpring(my, { stiffness: 40, damping: 12 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(x);
    my.set(y);
  };

  const layers = useMemo(
    () => [
      { depth: 8, className: 'bg-gradient-to-br from-primary-500/30 to-primary-700/30 blur-2xl rounded-full', x: 40, y: 40, size: 'w-64 h-64' },
      { depth: 5, className: 'bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 blur-3xl rounded-full', x: -60, y: 30, size: 'w-80 h-80' },
      { depth: 3, className: 'bg-gradient-to-tr from-purple-500/20 to-pink-400/20 blur-2xl rounded-full', x: 30, y: -40, size: 'w-56 h-56' },
    ],
    []
  );

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} onMouseMove={handleMove}>
      {layers.map((l, i) => {
        const tx = useTransform(sx, (v) => v * l.x);
        const ty = useTransform(sy, (v) => v * l.y);
        return (
          <motion.span
            key={i}
            style={{ x: tx, y: ty }}
            className={`absolute ${l.size}`} 
            aria-hidden
          >
            <span className={`absolute inset-0 ${l.className}`} />
          </motion.span>
        );
      })}
    </div>
  );
}