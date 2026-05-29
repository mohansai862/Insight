import { logger } from '@/utils/logger';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsApi } from '@/api/notificationsApi';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  decrementCount: () => void;
  resetCount: () => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      logger.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const decrementCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const resetCount = () => {
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    refreshCount();
    // Poll every 100 milliseconds for real-time updates
    const interval = setInterval(refreshCount, 100);
    
    // Listen for custom refresh events
    const handleRefreshNotifications = () => {
      refreshCount();
    };
    
    window.addEventListener('refreshNotifications', handleRefreshNotifications);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, decrementCount, resetCount, clearAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
