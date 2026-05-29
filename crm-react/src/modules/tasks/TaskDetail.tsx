import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Task Detail View
 * Detailed task information with related entities and activity
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useTask } from '@/hooks/useApi';
import { taskDocumentsApi } from '@/api/taskDocumentsApi';
import { formatDate, formatDateTime, formatRelativeTime, getPriorityColor, formatFileSize } from '@/utils';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useTask(id!);
  const [documentPreview, setDocumentPreview] = React.useState<{ url: string; name: string; type: string } | null>(null);

  const task = data?.data;

  // Trigger notification refresh when task is loaded for sales executives
  React.useEffect(() => {
    if (task && !isLoading) {
      const session = localStorage.getItem('tech_tammina_session');
      if (session) {
        try {
          const user = JSON.parse(session);
          if (user.role === 'Sales_Executive') {
            // Delay to allow backend to process the notification update
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshNotifications'));
            }, 500);
          }
        } catch {}
      }
    }
  }, [task, isLoading]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Error loading task: {error?.message || 'Task not found'}</p>
          <Button as={Link} to="/crm/Tasks" variant="ghost" className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'todo':
        return <CheckSquare className="w-4 h-4" />;
      case 'follow_up':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isOverdue = (() => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
    
    const now = new Date();
    const taskDate = new Date(task.dueDate);
    
    // If task date is before today, it's overdue
    if (taskDate.getTime() < now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000))) {
      return true;
    }
    
    // If task date is today, check the time
    if (taskDate.toDateString() === now.toDateString() && task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const taskDateTime = new Date(taskDate);
      taskDateTime.setHours(hours, minutes, 0, 0);
      return taskDateTime.getTime() < now.getTime();
    }
    
    return false;
  })();

  // Use actual timestamps from backend
  const createdAt = task.createdAt;
  const completedAt = task.status === 'completed' ? task.updatedAt : undefined;
  
  const getCurrentUser = () => {
    try {
      const session = localStorage.getItem('tech_tammina_session');
      if (session) {
        const user = JSON.parse(session);
        return {
          id: parseInt(user.id),
          name: user.fullName || user.username || user.email || 'Unknown User',
          role: user.role
        };
      }
    } catch {}
    return { id: null, name: 'Unknown User', role: null };
  };
  
  const currentUser = getCurrentUser();

  const handleViewDocument = async (fileName: string) => {
    try {
      const session = JSON.parse(localStorage.getItem('tech_tammina_session') || '{}');
      const fileExtension = fileName.toLowerCase().split('.').pop();
      
      const response = await fetch(taskDocumentsApi.viewUrl(id!, fileName.trim()), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'X-User-Id': session.id || session.userId || '',
          'X-User-Role': session.role || ''
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Open supported formats in new tab
        if (['pdf', 'png', 'jpg', 'jpeg', 'txt'].includes(fileExtension)) {
          window.open(url, '_blank');
          return;
        }
        
        // Show popup for unsupported formats
        setDocumentPreview({
          url,
          name: fileName.trim(),
          type: fileExtension
        });
      }
    } catch (error) {
      logger.error('Failed to view document:', error);
    }
  };


  
  // Debug: Log task data to see what we're getting
  logger.info('Task data:', task);
  logger.info('Document metadata:', {
    documentName: task.documentName,
    documentSize: (task as any).documentSize,
    documentUploadedAt: (task as any).documentUploadedAt,
    updatedAt: task.updatedAt,
    createdAt: task.createdAt
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const fromCalendar = sessionStorage.getItem('fromTasksCalendar');
              if (fromCalendar === 'true') {
                sessionStorage.removeItem('fromTasksCalendar');
                navigate('/crm/Tasks/calendar');
              } else {
                navigate('/crm/Tasks');
              }
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h1>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {(task as any).type && (
                      <Badge
                        className={`inline-flex items-center space-x-1 ${
                          (task as any).type === 'call' ? 'bg-blue-100 text-blue-800' :
                          (task as any).type === 'email' ? 'bg-green-100 text-green-800' :
                          (task as any).type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                          (task as any).type === 'todo' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}
                        size="sm"
                      >
                        {getTypeIcon((task as any).type)}
                        <span className="capitalize">{(task as any).type.replace('_', ' ')}</span>
                      </Badge>
                    )}



                    <Badge
                      variant={task.status === 'cancelled' ? 'default' : 
                        task.status === 'completed' ? 'success' :
                        task.status === 'in_progress' ? 'info' :
                        'warning'
                      }
                      className={task.status === 'cancelled' ? '!bg-gray-100 !text-gray-800 !border-gray-200 dark:!bg-gray-700 dark:!text-gray-100 dark:!border-gray-600' : ''}
                      size="sm"
                    >
                      {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>

                    <Badge className={getPriorityColor(task.priority || 'medium')} size="sm">
                      {(task.priority || 'Medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                    </Badge>

                    {isOverdue && (
                      <Badge variant="error" size="sm">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-3">
                  {task.dueDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                        <p className={`font-medium text-gray-900 dark:text-gray-100`}>
                          {formatDate(task.dueDate)}{task.dueTime ? ` ${task.dueTime}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  

                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{createdAt ? formatDateTime(createdAt) : 'Not available'}</p>
                    </div>
                  </div>
                  
                  {completedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(completedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Entity */}
          {task.relatedEntity && (
            <Card>
              <CardHeader>
                <CardTitle>Related {task.relatedEntity.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    {task.relatedEntity.type === 'lead' && <User className="w-6 h-6 text-blue-600" />}
                    {task.relatedEntity.type === 'contact' && <User className="w-6 h-6 text-blue-600" />}
                    {task.relatedEntity.type === 'deal' && <Building className="w-6 h-6 text-blue-600" />}
                  </div>
                  <div>
                    <Link
                      to={`/crm/${task.relatedEntity.type}s/${task.relatedEntity.id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors"
                    >
                      {task.relatedEntity.name}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {task.relatedEntity.type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity log */}
                {[
                  {
                    id: '1',
                    action: 'Task created',
                    description: `Task "${task.title}" was created`,
                    timestamp: createdAt,
                    user: task.createdByName || (task.createdById ? `User ${task.createdById}` : (currentUser.id === task.ownerId ? currentUser.name : 'System')),
                  },
                  ...(task.status === 'completed' && completedAt ? [{
                    id: '2',
                    action: 'Task completed',
                    description: 'Task marked as completed',
                    timestamp: completedAt,
                    user: task.ownerName || 'System',
                  }] : []),
                ].map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.action}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned To */}
          <Card>
            <CardContent className="pt-1">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col justify-center min-h-[2.5rem]">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 leading-tight">Assigned To</p>
                  <p className="font-normal text-gray-900 dark:text-gray-100 leading-tight">
                    {task.ownerName || 'Not Assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Stage</span>
                <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                  {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
              

              
              {task.dueDate && task.status !== 'completed' && task.status !== 'cancelled' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</span>
                  <span className={`font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {isOverdue ? 'Overdue' : (() => {
                      const now = new Date();
                      const dueDate = new Date(task.dueDate);
                      
                      // Normalize dates to start of day for accurate day calculation
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const taskDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                      
                      const diffMs = taskDueDate.getTime() - today.getTime();
                      
                      if (diffMs < 0) return 'Overdue';
                      
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      
                      // If it's the same day and we have time, check time difference
                      if (diffDays === 0 && task.dueTime) {
                        const dueDateTime = new Date(task.dueDate + `T${task.dueTime}:00`);
                        const timeDiffMs = dueDateTime.getTime() - now.getTime();
                        
                        if (timeDiffMs <= 0) return 'Overdue';
                        
                        const diffHours = Math.floor(timeDiffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
                        
                        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
                      }
                      
                      return diffDays === 0 ? 'Today' : `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {createdAt ? formatDateTime(createdAt) : 'Not available'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(task as any).type && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  <Badge
                    className={`inline-flex items-center space-x-1 ${
                      (task as any).type === 'call' ? 'bg-blue-100 text-blue-800' :
                      (task as any).type === 'email' ? 'bg-green-100 text-green-800' :
                      (task as any).type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                      (task as any).type === 'todo' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                    size="sm"
                  >
                    {getTypeIcon((task as any).type)}
                    <span className="capitalize">{(task as any).type.replace('_', ' ')}</span>
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                <Badge className={getPriorityColor(task.priority || 'medium')} size="sm">
                  {(task.priority || 'Medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                </Badge>
              </div>

              {task.relatedEntity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Related To</span>
                  <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                    {task.relatedEntity.type}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                {((task.documentName && task.documentName.trim()) || (task.documentationFilename && task.documentationFilename.trim())) ? (
                  (task.documentName || task.documentationFilename || '').split(', ').map((fileName: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {fileName.trim()}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                          {(() => {
                            const documentSizes = (task as any).documentSizes;
                            const documentNames = task.documentName || task.documentationFilename || '';
                            
                            if (documentSizes && documentSizes.trim()) {
                              if (documentNames.includes(', ')) {
                                // Multiple files - get individual size
                                const sizes = documentSizes.split(',').map(s => s.trim()).filter(s => s);
                                const names = documentNames.split(', ').map(n => n.trim()).filter(n => n);
                                
                                // Make sure we have a size for this file index
                                if (index < sizes.length && sizes[index] && parseInt(sizes[index]) > 0) {
                                  return (
                                    <>
                                      <span>{formatFileSize(parseInt(sizes[index]))}</span>
                                      <span>•</span>
                                      <span>Uploaded {formatRelativeTime((task as any).documentUploadedAt || task.updatedAt)}</span>
                                    </>
                                  );
                                } else {
                                  // Fallback: try to calculate average size if total size available
                                  const totalSize = sizes.reduce((sum, size) => sum + (parseInt(size) || 0), 0);
                                  if (totalSize > 0 && names.length > 0) {
                                    const avgSize = Math.floor(totalSize / names.length);
                                    return (
                                      <>
                                        <span>{formatFileSize(avgSize)}</span>
                                        <span>•</span>
                                        <span>Uploaded {formatRelativeTime((task as any).documentUploadedAt || task.updatedAt)}</span>
                                      </>
                                    );
                                  }
                                }
                              } else {
                                // Single file
                                const fileSize = parseInt(documentSizes.trim());
                                if (fileSize > 0) {
                                  return (
                                    <>
                                      <span>{formatFileSize(fileSize)}</span>
                                      <span>•</span>
                                      <span>Uploaded {formatRelativeTime((task as any).documentUploadedAt || task.updatedAt)}</span>
                                    </>
                                  );
                                }
                              }
                            }
                            return (
                              <>
                                <span>Size: Unknown</span>
                                <span>•</span>
                                <span>Upload date: Unknown</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex space-x-2 mt-1">
                          <button
                            onClick={() => handleViewDocument(fileName)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/tasks/${id}/download-documentation?fileName=${encodeURIComponent(fileName.trim())}`);
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = fileName.trim();
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                }
                              } catch (error) {
                                logger.error('Error downloading document:', error);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Executive Remarks */}
          {(task as any).remarks && (
            <Card>
              <CardHeader>
                <CardTitle>Executive Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{(task as any).remarks}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {documentPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => {
          URL.revokeObjectURL(documentPreview.url);
          setDocumentPreview(null);
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{documentPreview.name}</h3>
              <button onClick={() => {
                URL.revokeObjectURL(documentPreview.url);
                setDocumentPreview(null);
              }} className="text-gray-500 hover:text-gray-700 ml-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h3>
              <p className="text-gray-600 mb-6">
                {documentPreview.type.toUpperCase()} files need to be downloaded to view.
              </p>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = documentPreview.url;
                  link.download = documentPreview.name;
                  link.click();
                }}
                variant="primary"
                className="w-full"
              >
                Download File
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TaskDetail;
