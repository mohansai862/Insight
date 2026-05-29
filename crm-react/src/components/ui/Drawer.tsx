/**
 * Tech Tammina CRM - Drawer Component
 * Accessible right-side panel with overlay and framer-motion animations
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-full max-w-md',
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-2xl',
  xl: 'w-full max-w-3xl',
};

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'lg',
  children,
  className,
  headerRight,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't close drawer on ESC if a modal is open
      const modalOpen = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (e.key === 'Escape' && isOpen && !modalOpen) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => panelRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 drawer-container" style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
            aria-describedby={description ? 'drawer-description' : undefined}
            className={cn(
              'drawer-panel absolute right-0 top-0 bottom-0 h-full bg-white dark:bg-gray-800 shadow-large border-l border-gray-200 dark:border-gray-700 flex flex-col',
              sizeClasses[size],
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            style={{ margin: 0, padding: 0, top: 0 }}
          >
            {(title || description) && (
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800" style={{ margin: 0, marginTop: 0 }}>
                <div className="pr-2">
                  {title && (
                    <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100" style={{ margin: 0, marginTop: 0 }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="drawer-description" className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {headerRight}
                  <button
                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={onClose}
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800" style={{ margin: 0, padding: 0 }}>
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Drawer;