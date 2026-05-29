/**
* Tech Tammina CRM - Tasks List
* Task management with filters, priorities, and quick actions
*/

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Users,
  Download,
  Trash2,
  Paperclip
} from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useTasks, useAssignedTasks } from '@/hooks/useApi';
import { useAppSelector } from '@/lib/store';
import { formatDateTime, getPriorityColor, getStatusColor } from '@/utils';
import { can, getCurrentRole } from '@/utils/rbac';
import { clearOtherModulesPagination } from '@/utils/pagination';
import ExecutiveTasksView from './ExecutiveTasksView_Fixed';
import AssignedTaskActions from './AssignedTaskActions';
import toast from 'react-hot-toast';
import { useDeleteTask, useUpdateTask } from '@/hooks/useApi';

const TaskMoreActions: React.FC<{ task: TaskRow }> = ({ task }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<'top' | 'bottom'>('bottom');
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const currentRole = getCurrentRole();
  const navigate = useNavigate();

  // Check if task is cancelled or completed
  const isCancelled = task.status && task.status.toLowerCase() === 'cancelled';
  const isCompleted = task.status && task.status.toLowerCase() === 'completed';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200;
      
      setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isOpen]);

  const handleMarkComplete = async () => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'completed' } });
      toast.success('Task marked as completed');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Task</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to delete this task? This will remove it from the executive's task list as well.</p>
          <div class="flex justify-end space-x-3">
            <button id="cancel-btn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button id="delete-btn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      modal.querySelector('#delete-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
    });

    if (confirmed) {
      try {
        await deleteTask.mutateAsync(task.id);
        toast.success('Task deleted successfully');
        setIsOpen(false);
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };



  return (
    <div className="relative" ref={dropdownRef}>
      <div ref={buttonRef}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<MoreVertical className="w-4 h-4" />}
          onClick={() => setIsOpen(!isOpen)}
        >
          
        </Button>
      </div>
      {isOpen && (
        <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50 ${
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="py-1">
            <button
              onClick={() => {
                sessionStorage.setItem('returningToTasksList', 'true');
                navigate(`/crm/Tasks/${task.id}`);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            {!isCancelled && !isCompleted && (
              <button
                onClick={() => {
                  navigate(`/crm/Tasks/${task.id}/edit`);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </button>
            )}



            {((currentRole === "Sales_VP")) && !isCompleted && (
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskRow {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  remarks?: string;
  documentationFilename?: string;
  documentationType?: string;
  hasDocumentation?: boolean;
  ownerName?: string;
  createdByName?: string;
}

const TasksList: React.FC = () => {
  const currentRole = getCurrentRole();
  const navigate = useNavigate();

  // Show executive view for Sales Executive role
  if (currentRole === 'Sales_Executive') {
    return <ExecutiveTasksView />;
  }
  const [searchQuery, setSearchQuery] = React.useState(() => {
    return localStorage.getItem('tasksSearchQuery') || '';
  });
  const [selectedType, setSelectedType] = React.useState<string>(() => {
    return localStorage.getItem('tasksSelectedType') || '';
  });
  const [selectedStatus, setSelectedStatus] = React.useState<string>(() => {
    return localStorage.getItem('tasksSelectedStatus') || '';
  });
  const [selectedPriority, setSelectedPriority] = React.useState<string>(() => {
    return localStorage.getItem('tasksSelectedPriority') || '';
  });

  // Dropdown states
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = React.useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = React.useState(false);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);

  // Clear filters only when navigating away from tasks module
  React.useEffect(() => {
    sessionStorage.setItem('inTasksModule', 'true');
    
    return () => {
      setTimeout(() => {
        const stillInTasks = window.location.pathname.startsWith('/crm/Tasks');
        const returningToList = sessionStorage.getItem('returningToTasksList') === 'true';
        
        if (!stillInTasks && !returningToList) {
          localStorage.removeItem('tasksSearchQuery');
          localStorage.removeItem('tasksSelectedType');
          localStorage.removeItem('tasksSelectedStatus');
          localStorage.removeItem('tasksSelectedPriority');
          sessionStorage.removeItem('inTasksModule');
        }
        
        // Clear the returning flag after checking
        if (returningToList) {
          sessionStorage.removeItem('returningToTasksList');
        }
      }, 100);
    };
  }, []);

  // Save filters to localStorage
  React.useEffect(() => {
    localStorage.setItem('tasksSearchQuery', searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    localStorage.setItem('tasksSelectedType', selectedType);
  }, [selectedType]);

  React.useEffect(() => {
    localStorage.setItem('tasksSelectedStatus', selectedStatus);
  }, [selectedStatus]);

  React.useEffect(() => {
    localStorage.setItem('tasksSelectedPriority', selectedPriority);
  }, [selectedPriority]);

  // Reset page when filters change
  React.useEffect(() => {
    if (searchQuery || selectedType || selectedStatus || selectedPriority) {
      setCurrentPage(1);
      localStorage.setItem('tasksPage', '1');
    }
  }, [searchQuery, selectedType, selectedStatus, selectedPriority]);

  const { user } = useAppSelector(s => s.auth);

  const [currentPage, setCurrentPage] = React.useState(() => {
    const saved = localStorage.getItem('tasksPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [pageSize] = React.useState(10);

  // Save page to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('tasksPage', currentPage.toString());
  }, [currentPage]);

  // Clear other modules' pagination when this module loads
  React.useEffect(() => {
    clearOtherModulesPagination('tasksPage');
  }, []);

  // Click outside handlers for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading, error } = useTasks({
    search: (() => {
      // Normalize: trim, collapse spaces, lowercase
      const normalized = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
      // Send only first token to backend (backend returns superset)
      return normalized.split(' ')[0] || '';
    })(),
    page: currentPage,
    limit: pageSize,
    filters: {
      ...(selectedType && { type: [selectedType] }),
      ...(selectedStatus && selectedStatus !== 'overdue' && { status: [selectedStatus] }),
      ...(selectedPriority && { priority: [selectedPriority] }),
      // Role-based filtering:
      // - Sales executive: only tasks assigned to them
      // - Sales manager: backend handles filtering (both created and assigned)
      // - Sales VP: tasks created by them
      ...(currentRole === 'Sales_Executive' && user?.id ? { assignedTo: [user.id] } : {}),
      ...(currentRole === 'Sales_VP' && user?.id ? { createdById: [user.id] } : {}),
    },
  });

  // Fetch assigned tasks for Sales Manager with search
  const { data: assignedTasksData, isLoading: assignedTasksLoading } = useAssignedTasks({
    search: (() => {
      const normalized = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
      return normalized.split(' ')[0] || '';
    })(),
    filters: {
      ...(selectedStatus && selectedStatus !== 'overdue' && { status: [selectedStatus] }),
      ...(selectedPriority && { priority: [selectedPriority] }),
    }
  });
  
  const isOverdue = (task: TaskRow) => {
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
  };
  
  // Filter with multi-part name matching
  const filteredTasks = React.useMemo(() => {
    let rawTasks = data?.data || [];
    
    // Apply client-side search filter with normalization
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
      const tokens = normalizedQuery.split(' ');
      
      // Prevent space-only searches
      if (tokens.length > 0 && tokens.some(t => t)) {
        if (tokens.length === 1) {
          // Single word: match any field (partial ok)
          const token = tokens[0];
          rawTasks = rawTasks.filter(task => 
            task.title?.toLowerCase().includes(token) ||
            task.ownerName?.toLowerCase().includes(token) ||
            task.createdByName?.toLowerCase().includes(token)
          );
        } else {
          // Multiple words: each word must match start of each title part in order
          rawTasks = rawTasks.filter(task => {
            const title = (task.title || '').toLowerCase();
            const titleParts = title.split(/\s+/);
            
            // Check if we have enough title parts
            if (titleParts.length < tokens.length) return false;
            
            // Each token must match the start of corresponding title part
            return tokens.every((token, i) => titleParts[i]?.startsWith(token));
          });
        }
      }
    }
    
    // Apply status filter
    if (selectedStatus === 'overdue') {
      return rawTasks.filter(task => isOverdue(task));
    } else if (selectedStatus && selectedStatus !== 'overdue') {
      return rawTasks.filter(task => task.status === selectedStatus && !isOverdue(task));
    }
    return rawTasks;
  }, [data?.data, searchQuery, selectedStatus]);
  
  const assignedTasks: TaskRow[] = currentRole === 'Sales_Manager' ? (assignedTasksData?.data || []) : [];

  const tasks: TaskRow[] = filteredTasks;
  const pagination = data?.pagination;

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'todo', label: 'To-Do' },
    { value: 'follow_up', label: 'Follow Up' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'todo':
        return <CheckSquare className="w-4 h-4" />;
      case 'follow_up':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'follow_up':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Group tasks by status for metrics - use assigned tasks for Sales Manager
  const taskMetrics = React.useMemo(() => {
    const dataSource = currentRole === 'Sales_Manager' ? tasks : tasks;
    const total = dataSource.length;
    
    // First identify overdue tasks
    const overdueTasks = dataSource.filter(t => isOverdue(t));
    const overdueTaskIds = new Set(overdueTasks.map(t => t.id));
    
    // Count other statuses excluding overdue tasks
    const completed = dataSource.filter(t => t.status === 'completed' && !overdueTaskIds.has(t.id)).length;
    const pending = dataSource.filter(t => t.status === 'pending' && !overdueTaskIds.has(t.id)).length;
    const inProgress = dataSource.filter(t => t.status === 'in_progress' && !overdueTaskIds.has(t.id)).length;
    const overdue = overdueTasks.length;
    
    const today = dataSource.filter(t => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled' || overdueTaskIds.has(t.id)) return false;
      const taskDate = new Date(t.dueDate).toDateString();
      const todayDate = new Date().toDateString();
      return taskDate === todayDate;
    }).length;

    return { total, completed, pending, inProgress, overdue, today };
  }, [tasks]);

  if (error) {
    // Handle 404 error gracefully with user-friendly message
    if (error.message && error.message.includes('404')) {
      return (
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-yellow-600 font-semibold text-lg">
              Tasks feature is currently unavailable. Please try again later.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading tasks: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentRole === 'Sales_Manager' ? 'My Task' :
              currentRole === 'Sales_VP' ? "Manager's Task" : 'Manager Tasks'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentRole === 'Sales_Manager' ? 'Tasks assigned to you by Sales VP' :
              currentRole === 'Sales_VP' ? 'Tasks assigned to your Sales Managers' : 'Tasks assigned to you'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/crm/Tasks/calendar"
            variant="ghost"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Calendar View
          </Button>
          {/* Removed All Tasks filter for Sales Manager and Sales VP */}
          {can(currentRole, 'Tasks', 'Create') && getCurrentRole() !== 'Sales_Executive' && (
            <Button
              as={Link}
              to="/crm/Tasks/new"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Task Metrics */}
      <div className="w-full flex flex-col md:flex-row gap-4">
        {[
          {
            label: 'Total Tasks',
            value: taskMetrics.total.toString(),
            icon: <CheckSquare className="w-5 h-5 text-blue-600" />,
            color: ''
          },
          {
            label: 'Completed',
            value: taskMetrics.completed.toString(),
            icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
            color: ''
          },
          {
            label: 'Pending',
            value: taskMetrics.pending.toString(),
            icon: <Clock className="w-5 h-5 text-yellow-600" />,
            color: ''
          },
          {
            label: 'Due Today',
            value: taskMetrics.today.toString(),
            icon: <Calendar className="w-5 h-5 text-purple-600" />,
            color: ''
          },
          {
            label: 'Overdue',
            value: taskMetrics.overdue.toString(),
            icon: <AlertCircle className="w-5 h-5 text-red-600" />,
            color: ''
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-1 min-w-0"
          >
            <Card>
              <CardContent className="px-4 py-3 h-20 flex items-center">
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 mb-1 truncate">
                      {metric.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {currentRole !== 'Sales_Manager' && currentRole !== 'Sales_VP' && (
                <div className="relative" ref={typeDropdownRef}>
                  <button
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <span>{typeOptions.find(opt => opt.value === selectedType)?.label || 'All Types'}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-40">
                      <div className="p-2">
                        {typeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedType(option.value);
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                              selectedType === option.value ? 'bg-primary-50 text-primary-600' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 min-w-[140px]"
                >
                  <span className="truncate">{statusOptions.find(opt => opt.value === selectedStatus)?.label || 'All Status'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-40">
                    <div className="p-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedStatus(option.value);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                            selectedStatus === option.value ? 'bg-primary-50 text-primary-600' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 min-w-[140px]"
                >
                  <span className="truncate">{priorityOptions.find(opt => opt.value === selectedPriority)?.label || 'All Priorities'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPriorityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-40">
                    <div className="p-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedPriority(option.value);
                            setIsPriorityDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                            selectedPriority === option.value ? 'bg-primary-50 text-primary-600' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Tasks - Full list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentRole === 'Sales_Manager' ? 'My Task' :
              currentRole === 'Sales_VP' ? "Manager's Task" : 'Manager Tasks'} ({
                (selectedStatus || selectedPriority || selectedType || searchQuery) 
                  ? tasks.length 
                  : (pagination?.total || tasks.length)
              })
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-6">{searchQuery || selectedType || selectedStatus || selectedPriority ? 'Try adjusting your filters' : ''}</p>
              {!searchQuery && !selectedType && !selectedStatus && !selectedPriority && can(currentRole, 'Tasks', 'Create') && currentRole !== 'Sales_Executive' && currentRole !== 'Sales_Manager' && (
                <Button as={Link} to="/crm/Tasks/new" variant="primary">Create Your First Task</Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className={`p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isOverdue(task) ? 'border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center w-full">
                      {/* Title */}
                      <div className="col-span-2 text-sm text-gray-900 flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sessionStorage.setItem('returningToTasksList', 'true');
                            navigate(`/crm/Tasks/${task.id}`);
                          }} 
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left truncate"
                        >
                          {task.title}
                        </button>
                        {task.remarks && currentRole === 'Sales_Manager' && (
                          <Bell className="w-4 h-4 text-blue-500 flex-shrink-0 preserve-icon-color" title="Task has executive remarks" />
                        )}
                        {task.hasDocumentation && (
                          <Paperclip className="w-4 h-4 text-green-500 flex-shrink-0 preserve-icon-color" title="Task has documentation attached" />
                        )}
                      </div>

                      {/* Assigned To - Only show for Sales VP */}
                      {currentRole === 'Sales_VP' && (
                        <div className="col-span-3 text-sm text-gray-600">
                          {task.ownerName || 'Unassigned'}
                        </div>
                      )}
                      {currentRole !== 'Sales_VP' && (
                        <div className="col-span-3"></div>
                      )}

                      {/* Priority */}
                      <div className="col-span-2 flex items-center">
                        <Badge className={getPriorityColor(task.priority || 'medium')}>
                          {(task.priority || 'Medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <Badge className={`${getStatusColor(isOverdue(task) ? 'overdue' : task.status)} ${task.status === 'cancelled' ? '!bg-gray-100 !text-gray-800 !border-gray-200 dark:!bg-gray-700 dark:!text-gray-100 dark:!border-gray-600' : ''}`}>
                          {isOverdue(task) ? 'Overdue' : task.status === 'in_progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1) || 'Pending'}
                        </Badge>
                      </div>

                      {/* Due date */}
                      <div className="col-span-2 flex items-center">
                        {task.dueDate && (
                          <span className={`inline-flex items-center text-sm ${isOverdue(task) ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDateTime(task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : ''))}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end">
                        <TaskMoreActions task={task} />
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Assigned Tasks Section - Only for Sales Manager */}
      {currentRole === 'Sales_Manager' && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Tasks ({assignedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTasksLoading ? (
              <SkeletonTable rows={3} columns={7} />
            ) : assignedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned tasks</h3>
                <p className="text-gray-500">Tasks you assign to executives will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedTasks.map((task, index) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className={`p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isOverdue(task) ? 'border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center w-full">
                      {/* Title */}
                      <div className="col-span-2 text-sm text-gray-900 flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sessionStorage.setItem('returningToTasksList', 'true');
                            navigate(`/crm/Tasks/${task.id}`);
                          }} 
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left truncate"
                        >
                          {task.title}
                        </button>
                        {task.remarks && (
                          <Bell className="w-4 h-4 text-blue-500 flex-shrink-0 preserve-icon-color" title="Task has executive remarks" />
                        )}
                        {task.hasDocumentation && (
                          <Paperclip className="w-4 h-4 text-green-500 flex-shrink-0 preserve-icon-color" title="Task has documentation attached" />
                        )}
                      </div>

                      {/* Assigned To */}
                      <div className="col-span-3 text-sm text-gray-600">
                        {task.ownerName || 'Unassigned'}
                      </div>

                      {/* Priority */}
                      <div className="col-span-2 flex items-center">
                        <Badge className={getPriorityColor(task.priority || 'medium')}>
                          {(task.priority || 'Medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <Badge className={`${getStatusColor(isOverdue(task) ? 'overdue' : task.status)} ${task.status === 'cancelled' ? '!bg-gray-100 !text-gray-800 !border-gray-200 dark:!bg-gray-700 dark:!text-gray-100 dark:!border-gray-600' : ''}`}>
                          {isOverdue(task) ? 'Overdue' : task.status === 'in_progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1) || 'Pending'}
                        </Badge>
                      </div>

                      {/* Due date */}
                      <div className="col-span-2 flex items-center">
                        {task.dueDate && (
                          <span className={`inline-flex items-center text-sm ${isOverdue(task) ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDateTime(task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : ''))}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end">
                        <AssignedTaskActions task={task} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TasksList;
