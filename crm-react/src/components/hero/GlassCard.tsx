import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  title,
  subtitle,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl p-5 md:p-6 backdrop-blur-glass bg-white/10 dark:bg-black/20 shadow-glass border border-white/20 dark:border-white/10 hover:shadow-large transition-shadow"
    >
      {/* Glow edge */}
      <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
      <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-cyan-500/20 via-primary-500/20 to-fuchsia-500/20 opacity-70 blur-md" />

      <div className="relative">
        <h4 className="font-semibold text-white text-lg md:text-xl">{title}</h4>
        <p className="text-white/80 text-sm md:text-base mt-1">{subtitle}</p>
      </div>
    </motion.div>
  );
}