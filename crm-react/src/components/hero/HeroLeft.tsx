import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSvgBg from './AnimatedSvgBg';
import ParallaxLayers from './ParallaxLayers';
import Particles from './Particles';
import ThreeDFloaters from './ThreeDFloaters';
import GlassCard from './GlassCard';
import AnimatedCta from './AnimatedCta';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export type HeroLeftProps = {
  eyebrowText?: string;
  title?: string;
  description?: string;
  ctaLabels?: string[]; // First label uses AnimatedCta, others are buttons
  footerText?: string;
};

export default function HeroLeft({
  eyebrowText = 'Next‑gen CRM experience',
  title = 'Automate. Personalize. Scale.',
  description = 'Reimagine growth with intelligent workflows, connected conversations, and insights that drive action.',
  ctaLabels = ['Leads', 'Contacts', 'Deals', 'Reports'],
  footerText = `© ${new Date().getFullYear()} Tech Tammina. All rights reserved.`,
}: HeroLeftProps): JSX.Element {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-indigo-800 to-slate-900" />
      <AnimatedSvgBg />
      <ParallaxLayers />
      <ThreeDFloaters />
      <Particles color="rgba(99,102,241,0.35)" />

      {/* Foreground content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 lg:px-16"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-cyan-300/90 text-sm md:text-base">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {eyebrowText}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-3 font-display text-white text-2xl md:text-3xl lg:text-4xl leading-tight"
        >
          {title}
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-3 max-w-xl text-white/80 text-sm md:text-base">
          {description}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-3">
          {/* Removed CTA badges */}
        </motion.div>

        {/* Micro-interaction glass cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <GlassCard title="Pipeline Health" subtitle="Stage conversion and drop-offs" />
          <GlassCard title="Revenue Forecast" subtitle="Projected vs actual revenue" delay={0.1} />
          <GlassCard title="Top Performers" subtitle="Win rates by rep and team" delay={0.2} />
          <GlassCard title="Engagement Trends" subtitle="Email, calls, meetings insight" delay={0.3} />
        </div>

        <motion.p variants={fadeUp} className="mt-8 text-white/60 text-xs">
          {footerText}
        </motion.p>
      </motion.div>

      {/* Top gradient sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
    </div>
  );
}