/**
 * Tech Tammina CRM - Button Component
 * Accessible button with multiple variants and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: any;
  to?: string;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
      {
        'w-full': fullWidth,
      }
    );

    const variantClasses = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-[1.02] hover:shadow-medium active:scale-[0.98] active:translate-y-px',
      secondary: 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-ink dark:text-gray-100 border border-gray-200 dark:border-gray-600 hover:scale-[1.02] hover:shadow-soft active:scale-[0.98] active:translate-y-px',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:scale-[1.02] active:scale-[0.98] active:translate-y-px',
      outline: 'bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-600 hover:border-primary-300 dark:hover:border-primary-500 hover:scale-[1.02] active:scale-[0.98] active:translate-y-px',
      danger: 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02] hover:shadow-medium active:scale-[0.98] active:translate-y-px',
      success: 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] hover:shadow-medium active:scale-[0.98] active:translate-y-px',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Support polymorphic rendering: e.g., as={Link} to="/path"
    const { as: AsComponent, to, href, ...rest } = props as any;

    if (AsComponent) {
      return (
        <AsComponent
          ref={ref as any}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          to={to}
          href={href}
          aria-disabled={disabled || loading}
          {...rest}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin preserve-icon-color" />}
          {!loading && leftIcon && <span className="mr-2 preserve-icon-color">{leftIcon}</span>}
          {children}
          {!loading && rightIcon && <span className="ml-2 preserve-icon-color">{rightIcon}</span>}
        </AsComponent>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        whileTap={{ scale: 0.98 }}
        {...rest}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin preserve-icon-color" />}
        {!loading && leftIcon && <span className="mr-2 preserve-icon-color">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2 preserve-icon-color">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;