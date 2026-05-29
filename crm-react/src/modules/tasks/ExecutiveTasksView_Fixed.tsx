import { logger } from '@/utils/logger';
/**
 * Sales Executive Tasks View
 * Professional task management interface with modern design
 */

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Play,
  RefreshCw,
  MessageSquare,
  User,
  Target,
  TrendingUp,
  Activity,
  Download,
  FileText,
  Search
} from 'lucide-react';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/lib/store';
import { formatDateTime, getPriorityColor } from '@/utils';
import { toast } from 'react-hot-toast';

interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low' ;
  dueDate?: string;
  dueTime?: string;
  remarks?: string;
  createdByName?: string;
  createdByEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  hasDocumentation?: boolean;
  documentName?: string;
  attachmentCount?: number;
  attachmentNames?: string[];
}

interface CategorizedTasks {
  pending: Task[];
  inProgress: Task[];
  completed: Task[];
  overdue: Task[];
}

const ExecutiveTasksView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [showRemarksModal, setShowRemarksModal] = React.useState(false);
  const [remarks, setRemarks] = React.useState('');
  const [currentAction, setCurrentAction] = React.useState<'start' | 'complete' | 'update' | null>(null);

  // Character count state for remarks
  const remarksLength = remarks.length;
  const maxLength = 200;
  
  const getCharacterCountColor = () => {
    if (remarksLength >= maxLength) return 'text-red-500';
    if (remarksLength >= 178) return 'text-orange-500';
    return 'text-gray-500';
  };
  
  const getCharacterMessage = () => {
    if (remarksLength >= maxLength) return 'Character limit reached';
    if (remarksLength >= 178) return 'Approaching character limit';
    return '';
  };

  // Filters with robust localStorage persistence
  const [priorityFilter, setPriorityFilter] = React.useState(() => {
    try {
      const currentSession = localStorage.getItem('tech_tammina_session');
      const lastSession = localStorage.getItem('executiveTasksLastSession');
      
      // Clear filters if session changed (logout/login)
      if (currentSession !== lastSession) {
        localStorage.removeItem('executiveTasksPriorityFilter');
        localStorage.removeItem('executiveTasksSearchQuery');
        localStorage.setItem('executiveTasksLastSession', currentSession || '');
        return '';
      }
      
      return localStorage.getItem('executiveTasksPriorityFilter') || '';
    } catch {
      return '';
    }
  });
  const [priorityDropdownOpen, setPriorityDropdownOpen] = React.useState(false);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = React.useState(() => {
    try {
      return localStorage.getItem('executiveTasksSearchQuery') || '';
    } catch {
      return '';
    }
  });
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Persist priority filter changes immediately
  React.useEffect(() => {
    try {
      if (priorityFilter) {
        localStorage.setItem('executiveTasksPriorityFilter', priorityFilter);
      } else {
        localStorage.removeItem('executiveTasksPriorityFilter');
      }
      
      // Update session tracking
      const currentSession = localStorage.getItem('tech_tammina_session');
      localStorage.setItem('executiveTasksLastSession', currentSession || '');
    } catch {
      // Handle localStorage errors silently
    }
  }, [priorityFilter]);

  // Persist search query changes immediately
  React.useEffect(() => {
    try {
      if (searchQuery) {
        localStorage.setItem('executiveTasksSearchQuery', searchQuery);
      } else {
        localStorage.removeItem('executiveTasksSearchQuery');
      }
    } catch {
      // Handle localStorage errors silently
    }
  }, [searchQuery]);

  const { user } = useAppSelector(s => s.auth);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false);
      }
    };

    if (priorityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [priorityDropdownOpen]);

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const session = localStorage.getItem('tech_tammina_session');
    let userId = '';
    let userRole = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        userId = u.id || '';
        userRole = u.role || '';
      } catch {}
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...(userRole ? { 'X-User-Role': userRole } : {}),
    };
  };

  // Use React Query for better cache management and real-time updates
  const { data: tasks = { pending: [], inProgress: [], completed: [], overdue: [] }, isLoading, error, refetch } = useQuery({
    queryKey: ['executiveTasks', priorityFilter, searchQuery, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/tasks/executive/categorized${params.toString() ? '?' + params.toString() : ''}`;
      
      logger.info('Loading tasks from:', url);
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Error response:', errorText);
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Tasks data:', data);
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 100, // Auto-refresh every 30 seconds for real-time updates
    placeholderData: (previousData: any) => previousData,
  });

  const showTaskDetails = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/details`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const task = await response.json();
        setSelectedTask(task);
        setShowDetailsModal(true);
      }
    } catch (err) {
      logger.error('Error loading task details:', err);
    }
  };

  const startTask = (task: Task) => {
    setSelectedTask(task);
    setCurrentAction('start');
    setRemarks('');
    setShowRemarksModal(true);
  };

  const completeTask = (task: Task) => {
    setSelectedTask(task);
    setCurrentAction('complete');
    setRemarks('');
    setShowRemarksModal(true);
  };

  const updateRemarks = (task: Task) => {
    setSelectedTask(task);
    setCurrentAction('update');
    setRemarks(task.remarks || '');
    setShowRemarksModal(true);
  };

  const handleTaskAction = async () => {
    if (!selectedTask || !currentAction) return;

    try {
      let url = '';
      let body = { remarks };

      switch (currentAction) {
        case 'start':
          url = `/api/tasks/${selectedTask.taskId}/start`;
          break;
        case 'complete':
          url = `/api/tasks/${selectedTask.taskId}/complete`;
          break;
        case 'update':
          url = `/api/tasks/${selectedTask.taskId}/remarks`;
          break;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowRemarksModal(false);
        setSelectedTask(null);
        setCurrentAction(null);
        
        // Invalidate and refetch tasks for immediate updates
        queryClient.invalidateQueries({ queryKey: ['executiveTasks'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        refetch();
      } else {
        throw new Error('Failed to update task');
      }
    } catch (err) {
      logger.error('Error updating task:', err);
      alert('Error updating task');
    }
  };

  const downloadDocument = async (taskId: number, filename?: string) => {
    try {
      const url = `/api/tasks/${taskId}/download-documentation${filename ? `?fileName=${encodeURIComponent(filename)}` : ''}`;
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = filename || `task_${taskId}_document.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(fileUrl);
        document.body.removeChild(a);
      } else {
        alert('Failed to download document');
      }
    } catch (err) {
      logger.error('Error downloading document:', err);
      alert('Error downloading document');
    }
  };



  // Track if component is being unmounted due to navigation
  const isNavigatingRef = React.useRef(false);

  // Clear filter only when actually navigating away
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      isNavigatingRef.current = true;
    };
    
    const handlePopState = () => {
      isNavigatingRef.current = true;
    };
    
    // Listen for route changes (navigation to other pages)
    const handleRouteChange = () => {
      isNavigatingRef.current = true;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleRouteChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleRouteChange);
      
      // Always clear filters when component unmounts (navigating to other pages)
      localStorage.removeItem('executiveTasksPriorityFilter');
      localStorage.removeItem('executiveTasksSearchQuery');
    };
  }, []);

  // Prevent background scrolling when modals are open
  React.useEffect(() => {
    if (showDetailsModal || showRemarksModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailsModal, showRemarksModal]);

  // No need for manual useEffect - React Query handles this automatically

  const renderTaskCard = (task: Task) => (
    <motion.div
      key={task.taskId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`group relative bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${
        task.priority === 'High' ? 'ring-2 ring-red-100' : ''
      }`}
    >
      {/* Priority indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 ${
        task.priority === 'High' ? 'bg-black' :
        task.priority === 'Medium' ? 'bg-blue-600' :
        task.priority === 'Low' ? 'bg-gray-600' :
        'bg-gray-400'
      }`}></div>
      
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-black text-lg leading-tight">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description}</p>
            )}
          </div>
          <Badge className={`ml-3 ${getPriorityColor(task.priority.toLowerCase())} font-medium`}>
            {task.priority}
          </Badge>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 space-x-4">
          {task.createdByName && (
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span className="text-gray-700">{task.createdByName}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-gray-700">{formatDateTime(task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : ''))}</span>
            </div>
          )}
        </div>
        
        {task.remarks && (
          <div className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded">
            <div className="flex items-start">
              <MessageSquare className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{task.remarks}</p>
            </div>
          </div>
        )}
        

        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-600 hover:text-blue-600"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => showTaskDetails(task.taskId)}
          >
            View Details
          </Button>
          
          <div className="flex items-center space-x-2">
            {task.status === 'Pending' && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => startTask(task)}
              >
                Start
              </Button>
            )}
            
            {task.status === 'In_Progress' && (
              <Button
                size="sm"
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded border-2 border-gray-400 dark:border-gray-300"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => completeTask(task)}
              >
                Complete
              </Button>
            )}
            
            {task.status !== 'Completed' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-600 hover:text-black"
                leftIcon={<MessageSquare className="w-4 h-4" />}
                onClick={() => updateRemarks(task)}
              >
                Update
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderTaskCategory = (title: string, icon: React.ReactNode, tasks: Task[], gradientColor: string) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 min-w-[400px]">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              gradientColor === 'blue' ? 'bg-blue-600' :
              gradientColor === 'green' ? 'bg-green-600' :
              gradientColor === 'gray' && title === 'Overdue' ? 'bg-gray-800' :
              'bg-gray-600'
            }`}>
              <div className="text-white">{icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">{title}</h3>
              {/* <p className="text-gray-600 text-sm">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p> */}
            </div>
          </div>
          <div className="text-2xl font-bold text-black">{tasks.length}</div>
        </div>
      </div>
      
      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center min-h-80">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="text-gray-400">{icon}</div>
              </div>
              <h4 className="text-base font-medium text-black mb-1">No {title.toLowerCase()}</h4>
              <p className="text-gray-500 text-sm">All clear!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.taskId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-black text-sm">{task.title}</h4>
                  <Badge className={`ml-2 ${getPriorityColor(task.priority.toLowerCase())} text-xs`}>
                    {task.priority}
                  </Badge>
                </div>
                
                {task.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{task.description}</p>
                )}
                

                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    {task.createdByName && (
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {task.createdByName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDateTime(task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : ''))}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => showTaskDetails(task.taskId)}
                      className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 shadow-sm"
                    >
                      <Eye className="w-3 h-3 mr-1.5" />
                      View
                    </button>
                    
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => startTask(task)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors duration-200 shadow-sm"
                      >
                        <Play className="w-3 h-3 mr-1.5" />
                        Start
                      </button>
                    )}
                    
                    {task.status === 'In_Progress' && (
                      <button
                        onClick={() => completeTask(task)}
                        className="inline-flex items-center px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors duration-200 shadow-sm border-2 border-gray-400 dark:border-gray-300"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h3>
          <p className="text-red-600 mb-4">{error instanceof Error ? error.message : 'Failed to load tasks'}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Modern Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Executive Tasks Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">

                  Manage your assigned tasks efficiently
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by task title"
                  className="w-64 pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-blue-500"
                  style={{ boxShadow: 'none' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Priority Filter */}
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                  className="flex items-center justify-between w-40 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <span className="truncate">{priorityFilter || 'All Priorities'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${priorityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {priorityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handlePriorityChange('');
                          setPriorityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          !priorityFilter ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                        }`}
                      >
                        All Priorities
                      </button>
                      {['High', 'Medium', 'Low'].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            handlePriorityChange(priority);
                            setPriorityDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            priorityFilter === priority ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => {
                  setPriorityFilter('');
                  refetch();
                }} 
                variant="ghost" 
                className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Pending', count: tasks.pending.length, icon: Clock, color: 'bg-gray-600', bg: 'bg-gray-50', text: 'text-black' },
            { label: 'In Progress', count: tasks.inProgress.length, icon: Play, color: 'bg-blue-600', bg: 'bg-blue-50', text: 'text-blue-800' },
            { label: 'Completed', count: tasks.completed.length, icon: CheckCircle2, color: 'bg-green-600', bg: 'bg-green-50', text: 'text-green-800' },
            { label: 'Overdue', count: tasks.overdue.length, icon: AlertCircle, color: 'bg-gray-800', bg: 'bg-gray-100', text: 'text-black' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm flex-1 min-w-[200px]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-black dark:text-white mt-2">{stat.count}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>



        {/* Task Categories */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1,2,3].map(j => (
                    <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {renderTaskCategory(
              'Pending',
              <Clock className="w-5 h-5" />,
              tasks.pending,
              'gray'
            )}
            {renderTaskCategory(
              'In Progress',
              <Play className="w-5 h-5" />,
              tasks.inProgress,
              'blue'
            )}
            {renderTaskCategory(
              'Completed',
              <CheckCircle2 className="w-5 h-5" />,
              tasks.completed,
              'green'
            )}
            {renderTaskCategory(
              'Overdue',
              <AlertCircle className="w-5 h-5" />,
              tasks.overdue,
              'gray'
            )}
          </div>
        )}
        
        {/* Task Details Modal */}
        {showDetailsModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: 0, padding: 0 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-black dark:text-white">Task Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {selectedTask && (
                <div className="p-6 space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">{selectedTask.title}</h3>
                    {selectedTask.description && (
                      <p className="text-black dark:text-gray-100 leading-relaxed">{selectedTask.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Priority</span>
                        <div className="mt-2">
                          <Badge className={getPriorityColor(selectedTask.priority.toLowerCase())}>
                            {selectedTask.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</span>
                        <p className="text-lg font-medium text-black dark:text-white mt-2">{selectedTask.status === 'In_Progress' ? 'In Progress' : selectedTask.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Due Date</span>
                        <p className="text-lg font-medium text-black dark:text-white mt-2">{selectedTask.dueDate ? formatDateTime(selectedTask.dueDate + (selectedTask.dueTime ? `T${selectedTask.dueTime}:00` : '')) : 'No due date'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Assigned By</span>
                        <p className="text-lg font-medium text-black dark:text-white mt-2">{selectedTask.createdByName || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTask.remarks && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3 block">Current Remarks</span>
                      <p className="text-black dark:text-gray-100 leading-relaxed">{selectedTask.remarks}</p>
                    </div>
                  )}
                  
                  {selectedTask.hasDocumentation && selectedTask.documentName && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                        {selectedTask.documentName.split(', ').map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{fileName.trim()}</span>
                            </div>
                            <button
                              onClick={() => downloadDocument(selectedTask.taskId, fileName.trim())}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                              title="Download document"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remarks Modal */}
        {showRemarksModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: 0, padding: 0 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {currentAction === 'start' ? '🚀 Start Task' :
                   currentAction === 'complete' ? '✅ Complete Task' :
                   '📝 Update Progress'}
                </h2>
                <button 
                  onClick={() => {
                    setShowRemarksModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {currentAction !== 'start' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                      {currentAction === 'complete' ? '🎯 Completion summary (optional):' : '📊 Progress update:'}
                    </label>
                    <div className="relative">
                      <textarea
                        value={remarks}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue.length <= maxLength) {
                            setRemarks(newValue);
                          }
                        }}
                        rows={5}
                        maxLength={maxLength}
                        className="w-full px-3 py-2 pb-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder={
                          currentAction === 'complete' ? 'Add completion notes' :
                          'Current progress and next steps...'
                        }
                      />
                      <div className="absolute bottom-1 right-2 pointer-events-none">
                        <span className={`text-xs ${
                          remarksLength >= maxLength ? 'text-red-600' :
                          remarksLength >= 178 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {remarksLength >= maxLength ? 'Character limit reached - ' :
                           remarksLength >= 178 ? 'Approaching 200 character limit - ' : ''}{remarksLength}/200
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => {
                      setShowRemarksModal(false);
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTaskAction}
                    disabled={remarksLength > maxLength}
                    className={`px-6 py-2 rounded-md text-white transition-colors border ${
                      remarksLength > maxLength 
                        ? 'bg-gray-400 cursor-not-allowed border-gray-400' 
                        : currentAction === 'start' ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' :
                          currentAction === 'complete' ? 'bg-black hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 border-gray-600 dark:border-gray-500' :
                          'bg-gray-600 hover:bg-gray-700 border-gray-600'
                    }`}
                  >
                    {currentAction === 'start' ? '🚀 Start Task' :
                     currentAction === 'complete' ? '✅ Complete Task' :
                     '📝 Update Progress'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveTasksView;
