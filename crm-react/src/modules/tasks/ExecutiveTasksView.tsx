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

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/lib/store';
import { formatDate, getPriorityColor } from '@/utils';
import { toast } from 'react-hot-toast';

interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low' | 'Backlog';
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
  const [tasks, setTasks] = React.useState<CategorizedTasks>({
    pending: [],
    inProgress: [],
    completed: [],
    overdue: []
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
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
      
      // Clear filter if session changed (logout/login)
      if (currentSession !== lastSession) {
        localStorage.removeItem('executiveTasksPriorityFilter');
        localStorage.setItem('executiveTasksLastSession', currentSession || '');
        return '';
      }
      
      return localStorage.getItem('executiveTasksPriorityFilter') || '';
    } catch {
      return '';
    }
  });
  const [searchQuery, setSearchQuery] = React.useState('');
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

  const { user } = useAppSelector(s => s.auth);

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

  const loadTasks = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/tasks/executive/categorized${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      logger.error('Load tasks error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const showTaskDetails = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/details`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const task = await response.json();
        setSelectedTask(task);
        setShowDetailsModal(true);
        
        // Refresh notifications after viewing task details to update unread count
        // This will reflect the automatic marking of task notifications as read
        setTimeout(() => {
          // Trigger a notification refresh if there's a notification context
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }, 500);
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
        loadTasks(false); // Reload tasks
        
        // Refresh notifications after task action to update unread count
        if (currentAction === 'start') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);
        }
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

  React.useEffect(() => {
    loadTasks(true); // Show loading on initial load
    
    // Calculate milliseconds until next minute starts
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    // Initial timeout to sync with minute boundary
    const initialTimeout = setTimeout(() => {
      loadTasks(false);
      
      // Then refresh every minute at :00 seconds
      const interval = setInterval(() => {
        loadTasks(false);
      }, 60000); // 60 seconds
      
      return () => clearInterval(interval);
    }, msUntilNextMinute);
    
    return () => {
      clearTimeout(initialTimeout);
    };
  }, [priorityFilter, searchQuery, startDate, endDate]);

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
      
      // Always clear filter when component unmounts (navigating to other pages)
      localStorage.removeItem('executiveTasksPriorityFilter');
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

  // Additional polling when window gains focus
  React.useEffect(() => {
    const handleFocus = () => loadTasks(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);te boundary
    const initialTimeout = setTimeout(() => {
      loadTasks(false);
      
      // Then refresh every minute at :00 seconds
      const interval = setInterval(() => {
        loadTasks(false);
      }, 100); // 60 seconds
      
      return () => clearInterval(interval);
    }, msUntilNextMinute);
    
    return () => {
      clearTimeout(initialTimeout);
      // Clear filter when leaving module
      localStorage.removeItem('executiveTasksPriorityFilter');
    };
  }, [priorityFilter, startDate, endDate]);

  // Save priority filter to localStorage
  React.useEffect(() => {
    localStorage.setItem('executiveTasksPriorityFilter', priorityFilter);
  }, [priorityFilter]);

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

  // Additional polling when window gains focus
  React.useEffect(() => {
    const handleFocus = () => loadTasks(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
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
              <span className="text-gray-700">{formatDate(task.dueDate)} {task.dueTime || ''}</span>
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
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
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
              <p className="text-gray-600 text-sm">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-black">{tasks.length}</div>
        </div>
      </div>
      
      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <div className="text-gray-400">{icon}</div>
            </div>
            <h4 className="text-base font-medium text-black mb-1">No {title.toLowerCase()}</h4>
            <p className="text-gray-500 text-sm">All clear!</p>
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
                        {formatDate(task.dueDate)}
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
                        className="inline-flex items-center px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors duration-200 shadow-sm"
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
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadTasks(true)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Modern Header */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">
                  Executive Tasks Dashboard
                </h1>
                <p className="text-gray-600 text-lg">

                  Manage your assigned tasks efficiently
                </p>
              </div>
            </div>
            <Button 
              onClick={() => loadTasks(true)} 
              variant="ghost" 
              className="text-gray-600 hover:text-black border border-gray-300"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
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
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex-1 min-w-[200px]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-black mt-2">{stat.count}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-black mb-2">Priority Filter</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="flex-1 min-w-[250px]">
                <label className="block text-sm font-semibold text-black mb-2">Search Tasks</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by task title"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate > today) {
                      toast.error('From date cannot be in the future');
                      return;
                    }
                    setStartDate(e.target.value);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate > today) {
                      toast.error('To date cannot be in the future');
                      return;
                    }
                    setEndDate(e.target.value);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <Button 
                onClick={() => {
                  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                    toast.error('From date cannot be greater than To date');
                    return;
                  }
                  loadTasks(true);
                }} 
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                leftIcon={<Filter className="w-4 h-4" />}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Task Categories */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1,2,3].map(j => (
                    <div key={j} className="h-16 bg-gray-200 rounded-md"></div>
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
          <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-bold text-black dark:text-white">Task Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {selectedTask && (
                <div className="p-6 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">{selectedTask.title}</h3>
                    {selectedTask.description && (
                      <p className="text-black dark:text-gray-100 leading-relaxed">{selectedTask.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Priority</span>
                        <div className="mt-2">
                          <Badge className={getPriorityColor(selectedTask.priority.toLowerCase())}>
                            {selectedTask.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</span>
                        <p className="text-lg font-medium text-black dark:text-white mt-2">{selectedTask.status}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Due Date</span>
                        <p className="text-lg font-medium text-black dark:text-white mt-2">{selectedTask.dueDate || 'No due date'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
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
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                        {selectedTask.documentName.split(', ').map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700 font-medium">{fileName.trim()}</span>
                            </div>
                            <button
                              onClick={() => downloadDocument(selectedTask.taskId, fileName.trim())}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
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
          <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {currentAction === 'start' ? '🚀 Start Task' :
                   currentAction === 'complete' ? '✅ Complete Task' :
                   '📝 Update Progress'}
                </h2>
                <button 
                  onClick={() => setShowRemarksModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-semibold text-black mb-3">
                    {currentAction === 'start' ? '💭 Initial thoughts and approach:' :
                     currentAction === 'complete' ? '🎯 Completion summary (optional):' :
                     '📊 Progress update:'}
                  </label>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder={
                      currentAction === 'start' ? 'I am starting this task and my approach will be...' :
                      currentAction === 'complete' ? 'Add completion notes' :
                      'Current progress and next steps...'
                    }
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className={`text-sm ${getCharacterCountColor()}`}>
                      {getCharacterMessage()}
                    </div>
                    <div className={`text-sm ${getCharacterCountColor()}`}>
                      {remarksLength} / {maxLength}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowRemarksModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTaskAction}
                    disabled={remarksLength > maxLength}
                    className={`px-6 py-2 rounded-md text-white transition-colors ${
                      remarksLength > maxLength 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : currentAction === 'start' ? 'bg-blue-600 hover:bg-blue-700' :
                          currentAction === 'complete' ? 'bg-black hover:bg-gray-800' :
                          'bg-gray-600 hover:bg-gray-700'
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
