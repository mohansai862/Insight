/**
 * Tech Tammina CRM - Skeleton Component
 * Loading placeholders with shimmer animation
 */

import React from 'react';
import { cn } from '@/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer';
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'shimmer',
      width,
      height,
      rounded = 'md',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';
    
    const variantClasses = {
      default: '',
      shimmer: 'skeleton-shimmer',
    };

    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    const inlineStyles = {
      ...style,
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          roundedClasses[rounded],
          className
        )}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Predefined skeleton components
const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
        className="last:w-3/4"
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} height={20} className="flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} height={16} className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonChart: React.FC<{
  type?: 'bar' | 'line' | 'pie';
  className?: string;
}> = ({ type = 'bar', className }) => (
  <div className={cn('p-4', className)}>
    {type === 'bar' && (
      <div className="flex items-end justify-between h-32 space-x-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            width={24}
            height={Math.random() * 80 + 20}
            className="flex-shrink-0"
          />
        ))}
      </div>
    )}
    
    {type === 'line' && (
      <div className="relative h-32">
        <Skeleton height="100%" width="100%" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full transform -translate-y-1/2"
                style={{ left: `${index * 25}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )}
    
    {type === 'pie' && (
      <div className="flex items-center justify-center h-32">
        <Skeleton width={96} height={96} rounded="full" />
      </div>
    )}
  </div>
);

const SkeletonMetric: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('p-4 space-y-2', className)}>
    <Skeleton height={14} width="60%" />
    <Skeleton height={24} width="40%" />
    <Skeleton height={12} width="80%" />
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonMetric,
};