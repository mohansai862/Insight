/**
 * Tech Tammina CRM - Tasks Calendar View
 * Calendar view for tasks and activities
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/lib/store';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Filter,
  Clock,
  CheckSquare,
  Phone,
  Mail,
  Users,
  ChevronDown,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useTasks, useAssignedTasks } from '@/hooks/useApi';
import { formatDate, getPriorityColor, getStatusColor } from '@/utils';
import { can, getCurrentRole, isManagerOrVP } from '@/utils/rbac';

const TasksCalendar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = getCurrentRole();
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 'anonymous';
  const filterKey = `taskCalendarFilter_${userId}`;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPriority, setSelectedPriority] = useState<string>(() => {
    const saved = sessionStorage.getItem(filterKey);
    return saved ? JSON.parse(saved).priority : '';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    const saved = sessionStorage.getItem(filterKey);
    return saved ? JSON.parse(saved).status : '';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  const [tasks, setTasks] = React.useState([]);
  
  // Focus calendar on due date month when returning from calendar-based task creation
  React.useEffect(() => {
    if (!isManagerOrVP()) return;

    const stateFocus = (location.state as any)?.calendarFocus;
    if (stateFocus?.month && stateFocus?.year) {
      const month = Number(stateFocus.month);
      const year = Number(stateFocus.year);
      if (!Number.isNaN(month) && !Number.isNaN(year)) {
        setCurrentDate(new Date(year, month - 1, 1));
        return;
      }
    }

    const focusValue = sessionStorage.getItem('taskCalendarFocus');
    if (!focusValue) return;
    try {
      const parsed = JSON.parse(focusValue);
      const month = Number(parsed?.month);
      const year = Number(parsed?.year);
      if (!Number.isNaN(month) && !Number.isNaN(year)) {
        setCurrentDate(new Date(year, month - 1, 1));
      }
    } catch {
      // ignore invalid stored data
    } finally {
      sessionStorage.removeItem('taskCalendarFocus');
    }
  }, [location.state, userId]);

  // Clear filters on mount if not authenticated
  React.useEffect(() => {
    if (!localStorage.getItem('tech_tammina_authenticated')) {
      sessionStorage.removeItem(filterKey);
    }
  }, [filterKey]);
  
  // Clear filters when navigating away
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem(filterKey);
    };
  }, [filterKey]);
  
  // Check if returning from task details
  React.useEffect(() => {
    const returnTask = sessionStorage.getItem('returnToCalendarTask');
    if (returnTask) {
      try {
        const task = JSON.parse(returnTask);
        setSelectedTask(task);
        setShowTaskModal(true);
        sessionStorage.removeItem('returnToCalendarTask');
      } catch (error) {
        console.error('Error parsing return task:', error);
      }
    }
  }, []);

  // Fetch tasks with role-based filtering (same as TasksList)
  const { data: tasksData } = useTasks({
    search: '',
    page: 1,
    limit: 10000, // Get all tasks for calendar view
    filters: {
      // Role-based filtering:
      // - Sales executive: only tasks assigned to them
      // - Sales manager: backend handles filtering (both created and assigned)
      // - Sales VP: tasks created by them
      ...(currentRole === 'Sales_Executive' && user?.id ? { assignedTo: [user.id] } : {}),
      ...(currentRole === 'Sales_VP' && user?.id ? { createdById: [user.id] } : {}),
    },
  });

  // Fetch assigned tasks for Sales Manager
  const { data: assignedTasksData } = useAssignedTasks({
    search: '',
    filters: {}
  });

  // Update tasks when data changes
  React.useEffect(() => {
    let allTasks = [];
    
    // Add main tasks
    if (tasksData?.data) {
      allTasks = [...tasksData.data];
    }
    
    // Add assigned tasks for Sales Manager
    if (currentRole === 'Sales_Manager' && assignedTasksData?.data) {
      allTasks = [...allTasks, ...assignedTasksData.data];
    }
    
    // Ensure each task has an id field
    const tasksWithIds = allTasks.map((task: any) => ({
      ...task,
      id: task.id || task.taskId || task.task_id
    }));
    
    setTasks(tasksWithIds);
  }, [tasksData, assignedTasksData, currentRole]);

  // Persist filter state
  React.useEffect(() => {
    sessionStorage.setItem(filterKey, JSON.stringify({ priority: selectedPriority, status: selectedStatus }));
  }, [selectedPriority, selectedStatus, filterKey]);

  // Clear filters on logout
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!localStorage.getItem('tech_tammina_authenticated')) {
        sessionStorage.removeItem(filterKey);
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tech_tammina_authenticated' && e.newValue === null) {
        sessionStorage.removeItem(filterKey);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [filterKey]);

  // Click outside handlers for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (showTaskModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTaskModal]);

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const dateMatches = (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
      
      if (!dateMatches) return false;
      
      // Apply priority filter
      if (selectedPriority && task.priority?.toLowerCase() !== selectedPriority.toLowerCase()) {
        return false;
      }
      
      // Apply status filter
      if (selectedStatus) {
        if (selectedStatus === 'overdue') {
          // Show only overdue tasks (but not completed/cancelled)
          if (!isTaskOverdue(task)) {
            return false;
          }
        } else {
          // Show tasks with specific status (including cancelled)
          if (task.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    return filteredTasks;
  };

  // Check if task is overdue
  const isTaskOverdue = (task: any) => {
    const status = task.status?.toLowerCase();
    if (!task.dueDate || status === 'completed' || status === 'cancelled') return false;
    
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

  // Get task badge color based on status priority
  const getTaskBadgeColor = (task: any) => {
    // Status takes priority over overdue logic - use case-insensitive comparison
    const status = task.status?.toLowerCase();
    if (status === 'completed') {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300';
    }
    if (status === 'cancelled') {
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border border-gray-300';
    }
    // Overdue takes priority over status for pending/in_progress tasks
    if (isTaskOverdue(task)) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300';
    }
    if (status === 'pending') {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300';
    }
    if (status === 'in_progress') {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300';
    }
    // Default priority-based colors
    if (task.priority === 'urgent') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
    if (task.priority === 'high') {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    }
    if (task.priority === 'medium') {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    }
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'meeting':
        return <Users className="w-3 h-3" />;
      default:
        return <CheckSquare className="w-3 h-3" />;
    }
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/crm/Tasks')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks Calendar</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage tasks by date</p>
            </div>
          </div>
        <div className="flex items-center space-x-3">
          <div className="relative" ref={filterDropdownRef}>
            <Button 
              variant="ghost" 
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filter
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-40">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <div className="relative" ref={priorityDropdownRef}>
                      <button
                        onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <span>{selectedPriority ? selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1) : 'All Priorities'}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isPriorityDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          <div className="p-2">
                            {[{value: '', label: 'All Priorities'}, {value: 'high', label: 'High'}, {value: 'medium', label: 'Medium'}, {value: 'low', label: 'Low'}].map((option) => (
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <div className="relative" ref={statusDropdownRef}>
                      <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <span>{selectedStatus ? (selectedStatus === 'in_progress' ? 'In Progress' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)) : 'All Status'}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          <div className="p-2">
                            {[{value: '', label: 'All Status'}, {value: 'pending', label: 'Pending'}, {value: 'in_progress', label: 'In Progress'}, {value: 'completed', label: 'Completed'}, {value: 'cancelled', label: 'Cancelled'}, {value: 'overdue', label: 'Overdue'}].map((option) => (
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
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedPriority('');
                        setSelectedStatus('');
                        sessionStorage.removeItem(filterKey);
                        setIsPriorityDropdownOpen(false);
                        setIsStatusDropdownOpen(false);
                        setIsFilterOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      size="sm" 
                      variant="primary"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {can(currentRole, 'Tasks', 'Create') && currentRole !== 'Sales_Executive' && (
            <Button 
              as={Link} 
              to="/crm/Tasks/new" 
              state={{ fromCalendar: true }}
              variant="primary" 
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Task
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = 
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();
              const dayTasks = getTasksForDate(day);

              return (
                <div
                  key={index}
                  className={`h-32 p-2 border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col ${
                    isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                  } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-2 flex-shrink-0 ${
                    isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                  } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="flex-1 space-y-1 overflow-hidden min-h-0">
                    {dayTasks.slice(0, 3).map((task) => {
                      return (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity min-h-[20px] ${getTaskBadgeColor(task)}`}
                          title={`${isTaskOverdue(task) && task.status?.toLowerCase() !== 'completed' && task.status?.toLowerCase() !== 'cancelled' ? '' : ''}${task.title}`}
                          onClick={() => {
                            console.log('Task clicked:', task);
                            console.log('Task ID:', task.id);
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            {getTaskIcon(task.type)}
                            <span className="truncate flex-1">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTasksForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks scheduled for this date</p>
              ) : (
                getTasksForDate(selectedDate).map((task) => {
                  const isOverdue = isTaskOverdue(task);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        task.type === 'call' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        task.type === 'email' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        task.type === 'meeting' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {getTaskIcon(task.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? `${task.title}` : task.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {task.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" size="sm">
                            Overdue
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                        {task.dueTime && (
                          <span className={`text-xs ${
                            isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {task.dueTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Today's Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getTasksForDate(new Date()).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks scheduled for today</p>
            ) : (
              getTasksForDate(new Date()).map((task) => {
                const isOverdue = isTaskOverdue(task);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      task.type === 'call' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      task.type === 'email' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      task.type === 'meeting' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getTaskIcon(task.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${
                        isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? `${task.title}` : task.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {task.description || 'No description'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" size="sm">
                          Overdue
                        </Badge>
                      )}
                      <Badge className={getPriorityColor(task.priority)} size="sm">
                        {task.priority}
                      </Badge>
                      {task.dueTime && (
                        <span className={`text-xs ${
                          isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {task.dueTime}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden" style={{ marginTop: 0 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${
                isTaskOverdue(selectedTask) && selectedTask.status?.toLowerCase() !== 'completed' && selectedTask.status?.toLowerCase() !== 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {isTaskOverdue(selectedTask) && selectedTask.status?.toLowerCase() !== 'completed' && selectedTask.status?.toLowerCase() !== 'cancelled' ? '⚠️ Overdue Task' : '📋 Task Details'}
              </h2>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className={`p-4 rounded-lg border ${
                isTaskOverdue(selectedTask) && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              }`}>
                <h3 className={`text-xl font-bold mb-2 ${
                  isTaskOverdue(selectedTask) && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled'
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className={`leading-relaxed ${
                    isTaskOverdue(selectedTask) && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled'
                      ? 'text-red-600 dark:text-red-200' 
                      : 'text-blue-600 dark:text-blue-200'
                  }`}>{selectedTask.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 h-20 flex flex-col justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Priority</span>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedTask.priority || 'medium')}`}>
                        {selectedTask.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 h-20 flex flex-col justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</span>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isTaskOverdue(selectedTask) ? 'overdue' : selectedTask.status)}`}>
                        {isTaskOverdue(selectedTask) ? 'Overdue' : selectedTask.status === 'in_progress' ? 'In Progress' : selectedTask.status?.replace('_', ' ').charAt(0).toUpperCase() + selectedTask.status?.replace('_', ' ').slice(1) || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 h-20 flex flex-col justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Due Date</span>
                    <p className={`text-lg font-medium mt-2 ${
                      isTaskOverdue(selectedTask) && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled'
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No due date'}
                      {selectedTask.dueTime && ` at ${selectedTask.dueTime}`}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 h-20 flex flex-col justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Assigned To</span>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">{selectedTask.ownerName || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
              
              {isTaskOverdue(selectedTask) && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border-l-4 border-red-500">
                  <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2">⏰ This task is overdue!</h4>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Please complete this task as soon as possible to avoid further delays.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button 
                  onClick={() => setShowTaskModal(false)}
                  variant="ghost"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedTask?.id) {
                      sessionStorage.setItem('returnToCalendarTask', JSON.stringify(selectedTask));
                      sessionStorage.setItem('fromTasksCalendar', 'true');
                      navigate(`/crm/Tasks/${selectedTask.id}`);
                      setShowTaskModal(false);
                    } else {
                      console.error('Task ID is undefined:', selectedTask);
                    }
                  }}
                  variant="primary"
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
};

export default TasksCalendar;
