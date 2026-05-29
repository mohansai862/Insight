/**
 * Tech Tammina CRM - Avatar Component
 * User avatars with fallback initials and status indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn, getInitials, getAvatarColor } from '@/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  fallbackColor?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name = '',
      size = 'md',
      status,
      showStatus = false,
      fallbackColor,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    };

    const statusSizeClasses = {
      xs: 'w-2 h-2',
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    };

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };

    const initials = getInitials(name);
    const avatarColor = fallbackColor || getAvatarColor(name);
    const shouldShowImage = src && !imageError && imageLoaded;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex', className)}
        {...props}
      >
        <motion.div
          className={cn(
            'relative flex items-center justify-center rounded-full overflow-hidden',
            sizeClasses[size],
            {
              [avatarColor]: !shouldShowImage,
              'bg-gray-200': shouldShowImage,
            }
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {src && !imageError && (
            <img
              src={src}
              alt={alt || name}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-200',
                {
                  'opacity-0': !imageLoaded,
                  'opacity-100': imageLoaded,
                }
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {(!src || imageError || !imageLoaded) && (
            <span
              className={cn(
                'font-medium text-white select-none',
                {
                  'opacity-0': shouldShowImage,
                  'opacity-100': !shouldShowImage,
                }
              )}
            >
              {initials}
            </span>
          )}
        </motion.div>

        {showStatus && status && (
          <motion.div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-gray-800',
              statusSizeClasses[size],
              statusColors[status]
            )}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group Component
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: 'tight' | 'normal' | 'loose';
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max = 5,
      size = 'md',
      spacing = 'normal',
      className,
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;

    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="relative">
            {React.cloneElement(child as React.ReactElement, {
              size,
              className: 'ring-2 ring-white dark:ring-gray-800',
            })}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            className="ring-2 ring-white dark:ring-gray-800"
            fallbackColor="bg-gray-500"
          />
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };