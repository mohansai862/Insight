import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

export default function AnimatedCta({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 300, damping: 30 });
  const sy = useSpring(my, { stiffness: 300, damping: 30 });

  const bg = useMotionTemplate`radial-gradient(120px 120px at ${sx}px ${sy}px, rgba(59,130,246,.35), transparent 60%)`;

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`relative inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold text-white transition-colors bg-gradient-to-r from-primary-600 to-indigo-600 shadow-large hover:from-primary-500 hover:to-indigo-500 focus:outline-none ${className}`}
    >
      {/* Glow ring */}
      <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-400/40 to-fuchsia-500/40 blur-md" aria-hidden />

      {/* Ripple effect */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: bg as unknown as string }}
        aria-hidden
      />

      {/* Text */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Morphing border */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-2xl border border-white/20"
        animate={{ borderRadius: [16, 22, 18, 24, 16] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.button>
  );
}