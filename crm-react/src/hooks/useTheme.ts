import { logger } from '@/utils/logger';
import { useEffect } from 'react';
import { useAppSelector } from '@/lib/store';

export const useTheme = () => {
  const { theme } = useAppSelector(state => state.preferences);

  useEffect(() => {
    requestAnimationFrame(() => {
      const root = document.documentElement;
      
      // Apply theme mode
      if (theme.mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Apply primary color as CSS variables with validation
      const primaryColor = theme.primaryColor;
      
      // Validate hex color format
      const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor);
      if (!isValidHex) {
        logger.warn('Invalid hex color format:', primaryColor);
        return;
      }
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const rgb = hexToRgb(primaryColor);
      if (rgb) {
        const setColorProperty = (name: string, r: number, g: number, b: number) => {
          root.style.setProperty(name, `rgb(${r} ${g} ${b})`);
        };
        
        setColorProperty('--color-primary-50', Math.min(255, rgb.r + 40), Math.min(255, rgb.g + 40), Math.min(255, rgb.b + 40));
        setColorProperty('--color-primary-100', Math.min(255, rgb.r + 30), Math.min(255, rgb.g + 30), Math.min(255, rgb.b + 30));
        setColorProperty('--color-primary-200', Math.min(255, rgb.r + 20), Math.min(255, rgb.g + 20), Math.min(255, rgb.b + 20));
        setColorProperty('--color-primary-300', Math.min(255, rgb.r + 10), Math.min(255, rgb.g + 10), Math.min(255, rgb.b + 10));
        setColorProperty('--color-primary-400', rgb.r, rgb.g, rgb.b);
        setColorProperty('--color-primary-500', rgb.r, rgb.g, rgb.b);
        setColorProperty('--color-primary-600', Math.max(0, rgb.r - 10), Math.max(0, rgb.g - 10), Math.max(0, rgb.b - 10));
        setColorProperty('--color-primary-700', Math.max(0, rgb.r - 20), Math.max(0, rgb.g - 20), Math.max(0, rgb.b - 20));
        setColorProperty('--color-primary-800', Math.max(0, rgb.r - 30), Math.max(0, rgb.g - 30), Math.max(0, rgb.b - 30));
        setColorProperty('--color-primary-900', Math.max(0, rgb.r - 40), Math.max(0, rgb.g - 40), Math.max(0, rgb.b - 40));
      }
    });
  }, [theme.mode, theme.primaryColor]);

  return theme;
};