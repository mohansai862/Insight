/**
 * Tech Tammina CRM - Input Component
 * Accessible input with validation states and icons
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      fullWidth = true,
      type = 'text',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputId = id || React.useId();

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseClasses = cn(
      'w-full px-3 py-2 text-base transition-all duration-120 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'w-auto': !fullWidth,
      }
    );

    const variantClasses = {
      default: cn(
        'border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        {
          'border-red-300 dark:border-red-500 focus:ring-red-500': error,
        }
      ),
      filled: cn(
        'border-0 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary-500',
        {
          'bg-red-50 dark:bg-red-900/20 focus:ring-red-500': error,
        }
      ),
      outlined: cn(
        'border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-gray-900 dark:text-gray-100 focus:border-primary-500',
        {
          'border-red-300 dark:border-red-500 focus:border-red-500': error,
        }
      ),
    };

    const iconClasses = 'absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500';

    return (
      <div className={cn('space-y-2', { 'w-full': fullWidth, 'w-auto': !fullWidth })}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(iconClasses, 'left-3')}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              baseClasses,
              variantClasses[variant],
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon || isPassword,
              },
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              className={cn(iconClasses, 'right-3 hover:text-gray-600 dark:hover:text-gray-300')}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
          
          {rightIcon && !isPassword && (
            <div className={cn(iconClasses, 'right-3')}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1"
          >
            {error && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </>
            )}
            {!error && helperText && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{helperText}</span>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;