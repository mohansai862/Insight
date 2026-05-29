import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedSvgBg({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {/* Animated gradient blobs */}
      <motion.circle cx="200" cy="200" r="180" fill="url(#g2)" animate={{ cx: [200, 220, 180, 200], cy: [200, 170, 210, 200] }} transition={{ duration: 20, repeat: Infinity }} />
      <motion.circle cx="620" cy="420" r="220" fill="url(#g1)" animate={{ cx: [620, 640, 600, 620], cy: [420, 400, 440, 420] }} transition={{ duration: 26, repeat: Infinity }} />

      {/* Subtle grid */}
      <g stroke="rgba(255,255,255,.07)" strokeWidth="1">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={600} />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`h-${i}`} x1={0} y1={i * 40} x2={800} y2={i * 40} />
        ))}
      </g>

      {/* Orbits */}
      <motion.circle cx="400" cy="300" r="160" stroke="#60A5FA33" strokeWidth="1" fill="none" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} />
      <motion.circle cx="400" cy="300" r="280" stroke="#A78BFA22" strokeWidth="1" fill="none" animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }} />
    </motion.svg>
  );
}