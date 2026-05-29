import React, { useEffect, useRef } from 'react';

// Lightweight canvas particle system (no external deps)
// - Optimized for low CPU by capping particles and using requestAnimationFrame
// - Reacts to mouse position for subtle attraction
export default function Particles({
  density = 0.00012,
  maxParticles = 140,
  color = 'rgba(59, 130, 246, 0.6)', // blue-500 with alpha
  className = '',
}: {
  density?: number;
  maxParticles?: number;
  color?: string;
  className?: string;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      init();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };

    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: Particle[] = [];

    const countFor = () => Math.min(Math.floor(width * height * density), maxParticles);

    const init = () => {
      const count = countFor();
      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 1.8 + 0.6,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      for (const p of particles) {
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist2 = dx * dx + dy * dy;
        const force = dist2 > 1 ? Math.min(40 / dist2, 0.06) : 0; // tiny attraction
        p.vx += dx * force;
        p.vy += dy * force;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985; // friction
        p.vy *= 0.985;

        // wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf.current = requestAnimationFrame(step);
    };

    init();
    step();

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [density, maxParticles, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}