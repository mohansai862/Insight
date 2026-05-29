/**
 * Tech Tammina CRM - Badge Component
 * Status indicators and tags with semantic colors
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full border transition-all duration-120';

    const variantClasses = {
      default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600',
      primary: 'bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-100 border-primary-200 dark:border-primary-700',
      success: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
      warning: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
      error: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
      danger: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
      info: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <motion.span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.12 }}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={onRemove}
            aria-label="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;