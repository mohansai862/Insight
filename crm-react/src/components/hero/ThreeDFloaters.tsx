import React from 'react';
import { motion } from 'framer-motion';

// 3D-like floaters using perspective + rotateX/Y on hover/move
export default function ThreeDFloaters({ className = '' }: { className?: string }) {
  const items = [
    { color: 'from-cyan-400 to-blue-600', size: 'w-16 h-16', delay: 0 },
    { color: 'from-fuchsia-400 to-purple-600', size: 'w-12 h-12', delay: 0.8 },
    { color: 'from-emerald-400 to-teal-600', size: 'w-14 h-14', delay: 1.6 },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none [perspective:1000px] ${className}`}>
      {items.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute top-1/3 left-1/4 ${b.size} rounded-xl bg-gradient-to-br ${b.color} opacity-70 blur-[0.5px]`}
          initial={{ y: 0, rotateX: 0, rotateY: 0 }}
          animate={{ y: [0, -14, 0], rotateX: [0, 8, 0], rotateY: [0, -8, 0] }}
          transition={{ duration: 6 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
          style={{ filter: 'drop-shadow(0 8px 25px rgba(59,130,246,0.25))' }}
        />
      ))}
    </div>
  );
}