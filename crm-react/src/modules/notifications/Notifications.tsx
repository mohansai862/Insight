import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, CheckSquare, Clock, User, UserX, ThumbsUp, ThumbsDown, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { notificationsApi, Notification } from '@/api/notificationsApi';
import { leadsApi } from '@/api/leadsApi';
import { getCurrentRole } from '@/utils/rbac';
import { useNotificationContext } from '@/contexts/NotificationContext';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  
  const currentRole = getCurrentRole();
  const isManager = currentRole === 'Sales_Manager';
  const { decrementCount, resetCount, clearAllNotifications, refreshCount } = useNotificationContext();

  useEffect(() => {
    loadNotifications(true); // Show loading on initial load
    
    // Auto-refresh every 100ms for real-time notifications
    const interval = setInterval(() => {
      loadNotifications(false); // Don't show loading during background refresh
    }, 100); // 100 milliseconds
    
    return () => clearInterval(interval);
  }, []);

  // Additional polling when window gains focus
  useEffect(() => {
    const handleFocus = () => loadNotifications(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await notificationsApi.getUserNotifications();
      const notifications = response.data || [];
      // Sort notifications: unread first, then read
      const sortedNotifications = notifications.sort((a, b) => {
        if (a.isRead === b.isRead) {
          // If both have same read status, sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Unread notifications come first
        return a.isRead ? 1 : -1;
      });
      setNotifications(sortedNotifications);
    } catch (error) {
      logger.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  


  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setMarkingRead(notificationId);
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.notificationId === notificationId 
            ? { ...n, isRead: true }
            : n
        );
        // Sort notifications: unread first, then read
        return updated.sort((a, b) => {
          if (a.isRead === b.isRead) {
            // If both have same read status, sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          // Unread notifications come first
          return a.isRead ? 1 : -1;
        });
      });
      decrementCount();
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      logger.info('🔔 Marking', unreadNotifications.length, 'notifications as read...');
      
      // Try bulk operation first
      try {
        await notificationsApi.markAllAsRead();
        setNotifications(prev => {
          const updated = prev.map(n => ({ ...n, isRead: true }));
          // Sort notifications: unread first, then read
          return updated.sort((a, b) => {
            if (a.isRead === b.isRead) {
              // If both have same read status, sort by creation date (newest first)
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            // Unread notifications come first
            return a.isRead ? 1 : -1;
          });
        });
        resetCount();
        toast.success('All notifications marked as read');
        return;
      } catch (bulkError) {
        logger.info('Bulk operation failed, trying individual marking...');
      }
      
      // Fallback: Mark each unread notification individually
      let successCount = 0;
      for (const notification of unreadNotifications) {
        try {
          await notificationsApi.markAsRead(notification.notificationId);
          successCount++;
          setNotifications(prev => {
            const updated = prev.map(n => 
              n.notificationId === notification.notificationId 
                ? { ...n, isRead: true }
                : n
            );
            // Sort notifications: unread first, then read
            return updated.sort((a, b) => {
              if (a.isRead === b.isRead) {
                // If both have same read status, sort by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              // Unread notifications come first
              return a.isRead ? 1 : -1;
            });
          });
        } catch (error) {
          logger.error('Failed to mark notification', notification.notificationId, 'as read');
        }
      }
      
      if (successCount > 0) {
        resetCount();
        toast.success(`${successCount} notifications marked as read`);
      } else {
        toast.error('Failed to mark notifications as read');
      }
    } catch (error: any) {
      logger.error('🚨 Mark all as read failed:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAD_ASSIGNMENT':
        return <User className="w-5 h-5 text-blue-600 dark:text-blue-600 preserve-icon-color" />;
      case 'TASK_ASSIGNMENT':
        return <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-600 preserve-icon-color" />;
      case 'TASK_OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-600 preserve-icon-color" />;
      case 'REASSIGNMENT_REQUEST':
        return <UserX className="w-5 h-5 text-orange-600 dark:text-orange-600 preserve-icon-color" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-600 preserve-icon-color" />;
    }
  };

  const extractRequestId = (message: string): number | null => {
    const match = message.match(/\[RequestID:(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  };

  const cleanMessage = (message: string): string => {
    return message.replace(/\s*\[RequestID:\d+\]/, '');
  };

  const formatMessageWithBold = (message: string, notificationType: string): JSX.Element => {
    const cleanedMessage = cleanMessage(message);
    
    // Check if this is a reassignment request with "Reason:"
    const reasonMatch = cleanedMessage.match(/^(.+?)\s*\.\s*Reason:\s*(.+)$/);
    if (reasonMatch) {
      const mainMessage = reasonMatch[1];
      const reason = reasonMatch[2];
      return (
        <>
          {formatMessagePart(mainMessage, notificationType)}.
          <br />
          <span className="font-medium">Reason:</span> {reason}
        </>
      );
    }
    
    return formatMessagePart(cleanedMessage, notificationType);
  };
  
  const formatMessagePart = (message: string, notificationType?: string): JSX.Element => {
    // For Deal Won notifications, only bold text within single quotes
    if (notificationType === 'DEAL_WON') {
      const parts: JSX.Element[] = [];
      let lastIndex = 0;
      const quotePattern = /'([^']+)'/g;
      let match;
      
      while ((match = quotePattern.exec(message)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={`text-${lastIndex}`}>{message.substring(lastIndex, match.index)}</span>);
        }
        parts.push(
          <strong key={`bold-${match.index}`} className="font-semibold">{match[1]}</strong>
        );
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < message.length) {
        parts.push(<span key={`text-${lastIndex}`}>{message.substring(lastIndex)}</span>);
      }
      
      return parts.length > 0 ? <>{parts}</> : <>{message}</>;
    }
    
    // For all other notifications, use original pattern matching
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    const pattern1 = /(lead:|task:|deal:)\s*([^.]+?)(?=\s+by\s+|\s+within\s+|\.\s+|$)/gi;
    const pattern2 = /(lead|task|deal)\s+([^(]+?)(?=\s+\(|\s+has\s+|$)/gi;
    const pattern3 = /['"']([^'"']+)['"']/g;
    
    const matches: Array<{index: number, length: number, text: string, bold: string}> = [];
    
    let match;
    while ((match = pattern1.exec(message)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[1] + ' ',
        bold: match[2].trim()
      });
    }
    
    pattern2.lastIndex = 0;
    while ((match = pattern2.exec(message)) !== null) {
      const overlaps = matches.some(m => 
        match.index >= m.index && match.index < m.index + m.length
      );
      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[1] + ' ',
          bold: match[2].trim()
        });
      }
    }
    
    pattern3.lastIndex = 0;
    while ((match = pattern3.exec(message)) !== null) {
      const overlaps = matches.some(m => 
        match.index >= m.index && match.index < m.index + m.length
      );
      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length + 2,
          text: '',
          bold: match[1]
        });
      }
    }
    
    matches.sort((a, b) => a.index - b.index);
    
    matches.forEach((m, i) => {
      if (m.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{message.substring(lastIndex, m.index)}</span>);
      }
      parts.push(
        <span key={`match-${m.index}`}>
          {m.text}<strong className="font-semibold">{m.bold}</strong>
        </span>
      );
      lastIndex = m.index + m.length;
    });
    
    if (lastIndex < message.length) {
      parts.push(<span key={`text-${lastIndex}`}>{message.substring(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? <>{parts}</> : <>{message}</>;
  };

  const handleApproveFromNotification = async (requestId: number) => {
    try {
      setProcessingRequest(requestId);
      await leadsApi.approveReassignmentRequest(requestId);
      toast.success('Reassignment request approved');
      
      // Remove the notification from the list immediately
      setNotifications(prev => prev.filter(n => {
        const notificationRequestId = extractRequestId(n.message);
        return notificationRequestId !== requestId;
      }));
      decrementCount();
      refreshCount();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to approve request';
      if (errorMessage.includes('not pending') || errorMessage.includes('already processed')) {
        toast.error('This request has already been processed');
        // Remove the stale notification
        setNotifications(prev => prev.filter(n => {
          const notificationRequestId = extractRequestId(n.message);
          return notificationRequestId !== requestId;
        }));
        decrementCount();
        refreshCount();
      } else {
        toast.error(errorMessage);
      }
      loadNotifications(false); // Reload on error to get current state
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectFromNotification = async (requestId: number) => {
    try {
      setProcessingRequest(requestId);
      await leadsApi.rejectReassignmentRequest(requestId);
      toast.success('Reassignment request rejected');
      
      // Remove the notification from the list immediately
      setNotifications(prev => prev.filter(n => {
        const notificationRequestId = extractRequestId(n.message);
        return notificationRequestId !== requestId;
      }));
      decrementCount();
      refreshCount();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reject request';
      if (errorMessage.includes('not pending') || errorMessage.includes('already processed')) {
        toast.error('This request has already been processed');
        // Remove the stale notification
        setNotifications(prev => prev.filter(n => {
          const notificationRequestId = extractRequestId(n.message);
          return notificationRequestId !== requestId;
        }));
        decrementCount();
        refreshCount();
      } else {
        toast.error(errorMessage);
      }
      loadNotifications(false); // Reload on error to get current state
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleClearAllClick = () => {
    const pendingRequests = notifications.filter(n => 
      n.type === 'REASSIGNMENT_REQUEST' && extractRequestId(n.message)
    );
    
    if (pendingRequests.length > 0) {
      toast.error(`${pendingRequests.length} reassignment request${pendingRequests.length > 1 ? 's' : ''} need${pendingRequests.length === 1 ? 's' : ''} to be accepted or rejected first`);
      return;
    }
    
    setShowClearAllModal(true);
  };

  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAllNotifications();
      setNotifications([]);
      clearAllNotifications();
      setShowClearAllModal(false);
      toast.success('All notifications cleared');
    } catch (error) {
      logger.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-blue-100 mt-1">
                Stay updated with your latest activities and assignments
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 mt-2"
                onClick={handleMarkAllAsRead}
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </motion.div>



      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Your Notifications ({notifications.length})</span>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllClick}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">You'll see notifications here when you receive new assignments or updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.notificationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border rounded-lg transition-all ${
                    notification.isRead 
                      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' 
                      : 'border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge variant="default" size="sm">New</Badge>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                          {formatMessageWithBold(notification.message, notification.type)}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const formatted = new Date(notification.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              });
                              return formatted.replace(/(\d{4}),/, '$1');
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Show Accept/Decline buttons for reassignment requests */}
                      {notification.type === 'REASSIGNMENT_REQUEST' && isManager && (() => {
                        const requestId = extractRequestId(notification.message);
                        return requestId ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveFromNotification(requestId)}
                              loading={processingRequest === requestId}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectFromNotification(requestId)}
                              loading={processingRequest === requestId}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        ) : null;
                      })()}
                      
                      {/* Regular mark as read button */}
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          loading={markingRead === notification.notificationId}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearAllModal}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications?"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearAllModal(false)}
        confirmText="Clear All"
        cancelText="Cancel"
        variant="warning"
        showIcon={false}
      />
    </div>
  );
};

export default Notifications;
