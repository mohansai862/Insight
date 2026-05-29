import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Task Form
 * Create and edit task form with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Flag,
  Save,
  Tag,
  Upload,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  X,
  ChevronDown
} from 'lucide-react';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import CustomTimePicker from '@/components/ui/CustomTimePicker';
import Input from '@/components/ui/Input';
import UploadModal from '@/components/ui/UploadModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { useCreateTask, useTask, useUpdateTask } from '@/hooks/useApi';
import { tasksApi } from '@/api/tasksApi';
import { useAppSelector } from '@/lib/store';
import { isManagerOrVP, getCurrentRole } from '@/utils/rbac';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const REQUIRED_MESSAGE = 'This field is required';

// Form validation schema
const taskSchema = z.object({
  title: z.string()
    .min(1, REQUIRED_MESSAGE)
    .max(200, 'Title is too long')
    .refine(val => val.trim().length > 0, {
      message: REQUIRED_MESSAGE
    })
    .refine(val => !/^\d+$/.test(val.trim()), {
      message: 'Task title cannot contain only numbers'
    })
    .refine(val => !/^[^a-zA-Z0-9\s]+$/.test(val.trim()), {
      message: 'Task title cannot contain only special characters'
    }),
  description: z.string().max(400, 'Description cannot exceed 400 characters').optional(),

  priority: z.string().min(1, REQUIRED_MESSAGE).refine((val) => ['low', 'medium', 'high'].includes(val), {
    message: 'Invalid priority value'
  }),
  status: z.string().min(1, REQUIRED_MESSAGE).refine((val) => ['pending', 'in_progress', 'completed', 'cancelled'].includes(val), {
    message: 'Invalid status value'
  }),
  dueDate: z.string().min(1, REQUIRED_MESSAGE),
  dueTime: z.string().min(1, REQUIRED_MESSAGE),
  assigneeId: z.string().min(1, REQUIRED_MESSAGE),
  relatedEntityType: z.enum(['lead', 'contact', 'deal']).optional(),
  relatedEntityId: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Skip due date/time validation if status is completed, cancelled, or in_progress
  if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'in_progress') {
    return;
  }
  
  if (data.dueDate) {
    try {
      // Parse dd-mm-yyyy format
      const [day, month, year] = data.dueDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in past
      if (selectedDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due date cannot be in the past',
          path: ['dueDate']
        });
      }
      
      // Check if time is in past for today's date
      if (selectedDate.getTime() === today.getTime() && data.dueTime) {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        if (data.dueTime < currentTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Due time cannot be in the past',
            path: ['dueTime']
          });
        }
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format',
        path: ['dueDate']
      });
    }
  }
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [searchParams] = useSearchParams();
  const fromCalendar = location.state?.fromCalendar || false;

  const { user } = useAppSelector(s => s.auth);
  const createdById = user?.id;

  const [salesExecutives, setSalesExecutives] = React.useState<any[]>([]);
  const [loadingExecutives, setLoadingExecutives] = React.useState(true);
  const [executivesError, setExecutivesError] = React.useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [confirmedFiles, setConfirmedFiles] = React.useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<number | null>(null);
  const [filesConfirmed, setFilesConfirmed] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<{ docId: number; docName: string; fileIndex?: number } | null>(null);
  const [pendingDeletes, setPendingDeletes] = React.useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [initialFormValues, setInitialFormValues] = React.useState<Partial<TaskFormData>>({});
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = React.useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = React.useState(false);
  const [assigneeSearchMode, setAssigneeSearchMode] = React.useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = React.useState('');
  const [highlightedAssigneeIndex, setHighlightedAssigneeIndex] = React.useState(-1);
  const assigneeItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchSalesExecutives = async () => {
      try {
        setExecutivesError(null);
        logger.info('Fetching sales executives for user role:', user?.role);
        const response = await tasksApi.getSalesExecutives();
        logger.info('Sales executives API response:', response);
        if (response.success) {
          logger.info('Sales executives data:', response.data);
          setSalesExecutives(response.data);
        } else {
          logger.error('Failed to load sales executives:', response.message);
          setExecutivesError('Failed to load sales executives');
        }
      } catch (error) {
        logger.error('Error fetching sales executives:', error);
        setExecutivesError('Error loading sales executives');
      } finally {
        setLoadingExecutives(false);
      }
    };
    fetchSalesExecutives();
  }, [user?.role]);

  const { data, isLoading } = useTask(id!, { enabled: isEditing });
  const task = data?.data;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    control,
    setError,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: '',
      status: (getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP') && !isEditing ? 'pending' : '',
      dueDate: '',
      dueTime: '',
      assigneeId: '',
    },
    shouldFocusError: false,
  });

  const renderFieldError = (message?: string) => {
    if (!message) return null;
    const normalizedMessage = message.trim().toLowerCase() === 'required' ? REQUIRED_MESSAGE : message;
    return (
      <div className="flex items-center space-x-1 mt-1">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">{normalizedMessage}</span>
      </div>
    );
  };

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const handleTaskFormError = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    requestAnimationFrame(() => {
      submitButtonRef.current?.focus();
    });
  };

  // Form persistence system with user-specific keys
  const currentRole = getCurrentRole();
  const userId = user?.id || 'anonymous';
  const storageKey = `taskForm_${currentRole}_${userId}`;
  const formValues = watch();
  const isRestoringRef = React.useRef(false);
  const formDataRef = React.useRef<Partial<TaskFormData>>({});
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Track form changes for unsaved changes detection
  React.useEffect(() => {
    if (isEditing && Object.keys(initialFormValues).length > 0) {
      const currentValues = watch();
      const hasFormChanges = Object.keys(initialFormValues).some(key => {
        const initialValue = initialFormValues[key as keyof TaskFormData];
        const currentValue = currentValues[key as keyof TaskFormData];
        return initialValue !== currentValue;
      });
      const hasDocumentChanges = confirmedFiles.length > 0 || pendingDeletes.length > 0;
      setHasUnsavedChanges(hasFormChanges || hasDocumentChanges);
    }
  }, [formValues, initialFormValues, isEditing, watch, confirmedFiles.length, pendingDeletes.length]);

  // Immediate save function with user-specific storage
  const saveFormData = React.useCallback((data: Partial<TaskFormData>) => {
    if (!isEditing && !isRestoringRef.current) {
      const hasData = Object.values(data).some(value => value && String(value).trim() !== '');
      if (hasData) {
        const dataToSave = JSON.stringify(data);
        formDataRef.current = { ...data };
        localStorage.setItem(storageKey, dataToSave);
        sessionStorage.setItem(storageKey, dataToSave);
        (window as any)[`taskFormBackup_${storageKey}`] = data;
      }
    }
  }, [isEditing, storageKey]);

  // Save on every form change with debouncing
  React.useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveFormData(formValues);
    }, 100);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formValues, saveFormData]);

  // Restore form data function
  const restoreFormData = React.useCallback(() => {
    if (!isEditing && !isRestoringRef.current) {
      let savedData = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
      
      if (!savedData && (window as any)[`taskFormBackup_${storageKey}`]) {
        savedData = JSON.stringify((window as any)[`taskFormBackup_${storageKey}`]);
      }
      
      if (!savedData && Object.keys(formDataRef.current).length > 0) {
        savedData = JSON.stringify(formDataRef.current);
      }
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          isRestoringRef.current = true;
          
          Object.entries(parsedData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              setValue(key as keyof TaskFormData, value, { shouldValidate: false });
            }
          });
          
          formDataRef.current = parsedData;
          
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        } catch (error) {
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
        }
      }
    }
  }, [setValue, isEditing, storageKey]);

  // Restore on mount
  React.useEffect(() => {
    restoreFormData();
    // Clear dueTime for new tasks to show HH:MM placeholder
    if (!isEditing) {
      setValue('dueTime', '', { shouldValidate: false });
    }
  }, [restoreFormData, isEditing, setValue]);

  // Theme change detection and restoration
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(() => restoreFormData(), 0);
      setTimeout(() => restoreFormData(), 50);
      setTimeout(() => restoreFormData(), 100);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => restoreFormData(), 50);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [restoreFormData]);

  // Save before page unload
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isEditing) {
        saveFormData(watch());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveFormData, watch, isEditing]);

  // Clear form data on logout detection
  React.useEffect(() => {
    const clearFormDataOnLogout = () => {
      if (!isEditing) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        delete (window as any)[`taskFormBackup_${storageKey}`];
        formDataRef.current = {};
      }
    };

    // Listen for storage changes (logout detection)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tech_tammina_authenticated' && e.newValue === null) {
        clearFormDataOnLogout();
      }
    };

    // Listen for beforeunload to catch logout
    const handleBeforeUnload = () => {
      if (!localStorage.getItem('tech_tammina_authenticated')) {
        clearFormDataOnLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final cleanup check
      if (!isEditing && !localStorage.getItem('tech_tammina_authenticated')) {
        clearFormDataOnLogout();
      }
    };
  }, [storageKey, isEditing]);

  // Click outside handlers for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
        setAssigneeSearchMode(false);
        setAssigneeSearchQuery('');
        setHighlightedAssigneeIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed hasValidationErrors variable - error summary banner removed

  // Check if Sales Manager is editing their own task (My Task)
  const isManagerEditingOwnTask = React.useMemo(() => {
    return getCurrentRole() === 'Sales_Manager' &&
      isEditing &&
      task &&
      (task as any).ownerId === user?.id;
  }, [isEditing, task, user?.id]);

  React.useEffect(() => {
    if (isEditing && task && salesExecutives.length > 0) {
      // Prevent editing cancelled tasks for VP and Manager
      const currentRole = getCurrentRole();
      const taskStatus = task.status?.toLowerCase();
      const isMyTask = (task as any).ownerId === user?.id;
      
      if (taskStatus === 'cancelled' && (currentRole === 'Sales_VP' || (currentRole === 'Sales_Manager' && !isMyTask))) {
        navigate('/crm/Tasks');
        return;
      }
      
      const dueDateTime = task.dueDate ? new Date(task.dueDate) : null;
      const assigneeId = (task as any).ownerId || (task as any).owner?.id || '';
      
      // Convert yyyy-mm-dd to dd-mm-yyyy for display
      const convertToDisplayFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        } catch {
          return '';
        }
      };
      
      // For manager editing their own task, don't pre-fill status if it's pending
      const isManagerOwnTask = getCurrentRole() === 'Sales_Manager' && (task as any).ownerId === user?.id;
      const statusValue = (isManagerOwnTask && taskStatus === 'pending') ? '' : (taskStatus || '');

      const formData = {
        title: task.title,
        description: task.description || '',
        priority: task.priority?.toLowerCase() as any || 'medium',
        status: statusValue,
        dueDate: convertToDisplayFormat(task.dueDate || ''),
        dueTime: task.dueTime || '',
        assigneeId: assigneeId,
        relatedEntityType: (task as any).relatedEntity?.type as any || undefined,
        relatedEntityId: (task as any).relatedEntity?.id || undefined,
        tags: '',
        notes: '',
      };
      reset(formData);
      setInitialFormValues(formData);
      setHasUnsavedChanges(false);
    }
  }, [task, isEditing, reset, salesExecutives, user?.id, navigate]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      let documentsArray = null;
      let documentNames = null;
      let totalFileSize = 0;
      if (confirmedFiles.length > 0) {
        try {
          const maxSize = 10 * 1024 * 1024;
          const allDocuments = [];
          const allNames = [];

          const oversizedFiles = [];
          for (const file of confirmedFiles) {
            totalFileSize += file.size; // Add actual file size

            if (file.size > maxSize) {
              oversizedFiles.push(file.name);
            }
          }
          
          if (oversizedFiles.length > 0) {
            const errorMessage = `Files too large (max 10MB): ${oversizedFiles.join(', ')}`;
            setUploadError(errorMessage);
            toast.error(errorMessage);
            return;
          }
          
          for (const file of confirmedFiles) {

            try {
              const arrayBuffer = await file.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);

              const sizeBytes = [
                (uint8Array.length >> 24) & 0xFF,
                (uint8Array.length >> 16) & 0xFF,
                (uint8Array.length >> 8) & 0xFF,
                uint8Array.length & 0xFF
              ];

              allDocuments.push(...sizeBytes);

              const chunkSize = 65536;
              for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.slice(i, i + chunkSize);
                allDocuments.push(...Array.from(chunk));
              }

              allNames.push(file.name);
            } catch (fileError) {
              logger.error('Error processing file:', file.name, fileError);
              const errorMessage = `Failed to process file: ${file.name}`;
              setUploadError(errorMessage);
              toast.error(errorMessage);
              return;
            }
          }

          documentsArray = allDocuments;
          documentNames = allNames.join(', ');
        } catch (error) {
          logger.error('File processing error:', error);
          const errorMessage = `Failed to process files: ${error.message}`;
          setUploadError(errorMessage);
          toast.error(errorMessage);
          return;
        }
      }

      // Convert dd-mm-yyyy to yyyy-mm-dd for API
      const convertDateFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const [day, month, year] = dateStr.split('-');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch {
          return dateStr; // Return as-is if conversion fails
        }
      };

      const taskData = {
        title: data.title,
        description: data.description,
        priority: data.priority.toUpperCase(),
        status: data.status.toUpperCase(),
        ownerId: data.assigneeId,
        createdBy: createdById,
        dueDate: convertDateFormat(data.dueDate) || null,
        dueTime: data.dueTime || null,
        tags,
        notes: data.notes,
        relatedId: (data.relatedEntityType && data.relatedEntityId) ? parseInt(data.relatedEntityId) : null,
        documents: documentsArray && documentsArray.length > 0 ? documentsArray : null,
        documentName: documentNames || null,
        documentSizes: confirmedFiles.length > 0 ? confirmedFiles.map(f => f.size).join(',') : null
      };

      logger.info('Task data being sent:', {
        ...taskData,
        documents: taskData.documents ? `Array(${taskData.documents.length})` : null
      });

      delete (taskData as any).assigneeId;
      delete (taskData as any).relatedEntityType;
      delete (taskData as any).relatedEntityId;

      let savedTask;
      if (isEditing && id) {
        savedTask = await updateTask.mutateAsync({ id, data: taskData as any });
        
        // Handle pending document deletions for editing
        if (pendingDeletes.length > 0) {
          for (const fileName of pendingDeletes) {
            try {
              await fetch(`/api/tasks/${id}/documentation?fileName=${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
                headers: {
                  'X-User-Id': user?.id || '1',
                  'X-User-Role': getCurrentRole()
                }
              });
            } catch (error) {
              logger.error('Error deleting document:', fileName, error);
            }
          }
        }
      } else {
        savedTask = await createTask.mutateAsync(taskData as any);
      }

      // Force immediate cache refresh for real-time updates BEFORE navigation
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assignedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['executiveTasks'] });
      
      // Clear saved form data on successful submission
      if (!isEditing) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        delete (window as any)[`taskFormBackup_${storageKey}`];
        formDataRef.current = {};
        
        // Clear pending deletes
        setPendingDeletes([]);
        
        // Reset form to initial state
        reset({
          title: '',
          description: '',
          priority: '',
          status: (getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP') ? 'pending' : '',
          dueDate: '',
          dueTime: '',
          assigneeId: '',
          relatedEntityType: undefined,
          relatedEntityId: undefined,
          tags: '',
          notes: ''
        });
      }
      
      // Clear unsaved changes state
      setHasUnsavedChanges(false);
      
      // Store calendar focus month/year for Sales Manager/VP when created from calendar view
      let calendarFocus: { month: number; year: number } | null = null;
      if (!isEditing && fromCalendar && isManagerOrVP() && data.dueDate) {
        try {
          const [day, month, year] = data.dueDate.split('-').map(Number);
          if (!Number.isNaN(month) && !Number.isNaN(year)) {
            calendarFocus = { month, year };
            sessionStorage.setItem('taskCalendarFocus', JSON.stringify(calendarFocus));
          }
        } catch {}
      }

      // Navigate back to calendar if task was created from calendar view
      if (!isEditing && fromCalendar) {
        navigate('/crm/Tasks/calendar', {
          replace: true,
          state: calendarFocus ? { calendarFocus } : undefined
        });
      } else {
        navigate('/crm/Tasks', { replace: true });
      }
    } catch (error) {
      logger.error('Error saving task:', error);
      
      // Handle validation errors from backend
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach(field => {
          const rawMessage = backendErrors[field];
          const normalizedMessage = typeof rawMessage === 'string' && rawMessage.trim().toLowerCase() === 'required'
            ? REQUIRED_MESSAGE
            : rawMessage;
          setError(field as keyof TaskFormData, { type: 'manual', message: normalizedMessage });
        });
        return; // Don't show toast, field errors are displayed
      }
      
      // Handle different types of errors
      if (error?.response?.status === 409) {
        // Data integrity constraint violation
        toast.error('Data integrity constraint violation');
      } else if (error?.message?.includes('too large') || error?.message?.includes('10MB')) {
        // File size error
        toast.error('Files too large (max 10MB each)');
      } else {
        // Generic error
        const action = isEditing ? 'update' : 'create';
        toast.error(`Failed to ${action} task`);
      }
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      if (!isEditing) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        delete (window as any)[`taskFormBackup_${storageKey}`];
      }
      navigate(fromCalendar ? '/crm/Tasks/calendar' : '/crm/Tasks');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    // Clear pending uploads and deletes when discarding changes
    setConfirmedFiles([]);
    setPendingDeletes([]);
    if (!isEditing) {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      delete (window as any)[`taskFormBackup_${storageKey}`];
    }
    navigate(fromCalendar ? '/crm/Tasks/calendar' : '/crm/Tasks');
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            as={Link}
            to={fromCalendar ? "/crm/Tasks/calendar" : "/crm/Tasks"}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              if (!isEditing) {
                localStorage.removeItem(storageKey);
                sessionStorage.removeItem(storageKey);
                delete (window as any)[`taskFormBackup_${storageKey}`];
              }
            }}
          >
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h1>
            {/* <p className="text-gray-600 mt-1">
              {isEditing ? 'Update task information' : 'Create a new task or activity'}
            </p> */}
          </div>
        </div>
      </div>

      {/* Removed error summary banner - only inline field validation errors are shown */}

      <form onSubmit={handleSubmit(onSubmit, handleTaskFormError)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5" />
                  <span>Task Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="Enter task title"
                    error={errors.title?.message}
                    disabled={(() => {
                      const isManager = getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP';
                      const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                      return isEditing && isManager && isMyTask;
                    })()}
                    className={(() => {
                      const isManager = getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP';
                      const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                      const isManagerEditingOwnTask = isEditing && isManager && isMyTask;
                      return isManagerEditingOwnTask ? 'bg-gray-100 cursor-not-allowed' : '';
                    })()}
                    onChange={(e) => {
                      setValue('title', e.target.value, { shouldValidate: true });
                      if (!isEditing) saveFormData({ ...watch(), title: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      {...register('description')}
                      rows={4}
                      maxLength={200}
                      className="w-full px-3 py-2 pb-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-0 resize-none"
                      placeholder="Describe what needs to be done"
                      disabled={(() => {
                        const isManager = getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP';
                        const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                        const isManagerEditingOwnTask = isEditing && isManager && isMyTask;
                        return isManagerEditingOwnTask;
                      })()}
                      style={(() => {
                        const isManager = getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP';
                        const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                        const isManagerEditingOwnTask = isEditing && isManager && isMyTask;
                        return isManagerEditingOwnTask ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {};
                      })()}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setValue('description', e.target.value);
                          if (!isEditing) saveFormData({ ...watch(), description: e.target.value });
                        }
                      }}
                    />
                    <div className="absolute bottom-1 right-2 pointer-events-none">
                      <span className={`text-xs ${
                        (watch('description')?.length || 0) >= 200 ? 'text-red-600' :
                        (watch('description')?.length || 0) >= 178 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {(watch('description')?.length || 0) >= 200 ? 'Character limit reached - ' :
                         (watch('description')?.length || 0) >= 178 ? 'Approaching 200 character limit - ' : ''}{watch('description')?.length || 0}/200
                      </span>
                    </div>
                  </div>
                  {renderFieldError(errors.description?.message)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomDatePicker
                      label="Due Date *"
                      value={watch('dueDate')}
                      onChange={(value) => {
                        setValue('dueDate', value, { shouldValidate: true });
                        if (!isEditing) saveFormData({ ...watch(), dueDate: value });
                      }}
                      placeholder="dd-mm-yyyy"
                      futureOnly={true}
                      error={errors.dueDate?.message}
                      disabled={isManagerEditingOwnTask}
                    />
                  </div>
                  <div>
                    <CustomTimePicker
                      label="Due Time *"
                      value={watch('dueTime')}
                      onChange={(value) => {
                        setValue('dueTime', value, { shouldValidate: true });
                        if (!isEditing) saveFormData({ ...watch(), dueTime: value });
                      }}
                      selectedDate={watch('dueDate') ? (() => {
                        const [day, month, year] = watch('dueDate').split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : undefined}
                      className={isManagerEditingOwnTask ? 'opacity-50 pointer-events-none' : ''}
                      disabled={isManagerEditingOwnTask}
                    />
                    {renderFieldError(errors.dueTime?.message)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {(getCurrentRole() === 'Sales_Manager' || getCurrentRole() === 'Sales_VP') && !isManagerEditingOwnTask && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Documentation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing && ((task?.documentName && task.documentName.trim()) || (task?.documentationFilename && task.documentationFilename.trim())) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Existing Documents:</p>
                      <div className="max-h-48 overflow-y-scroll overflow-x-hidden space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                      {(task.documentName || task.documentationFilename || '').split(', ').filter((fileName: string) => {
                        return !pendingDeletes.includes(fileName.trim());
                      }).map((fileName: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">{fileName.trim()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/tasks/${id}/download-documentation?fileName=${encodeURIComponent(fileName.trim())}`, {
                                    headers: {
                                      'X-User-Id': user?.id || '1',
                                      'X-User-Role': getCurrentRole()
                                    }
                                  });
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
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {(() => {
                              const currentRole = getCurrentRole();
                              const isMyTask = task && (task as any).ownerId === user?.id;
                              
                              // Show delete button for:
                              // - Sales VP (always)
                              // - Sales Manager (only for assigned tasks, not their own tasks)
                              // - NOT for Sales Executive
                              const canDelete = currentRole === 'Sales_VP' || 
                                              (currentRole === 'Sales_Manager' && !isMyTask);
                              
                              return canDelete;
                            })() && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDelete({ 
                                    docId: 0, // Not used for tasks
                                    docName: fileName.trim(),
                                    fileIndex: index
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {/* Marked for Deletion */}
                  {pendingDeletes.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                        Marked for Deletion ({pendingDeletes.length})
                      </h4>
                      <div className="space-y-1">
                        {pendingDeletes.map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <span className="text-red-800 dark:text-red-200 line-through">{fileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingDeletes(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                              title="Undo delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      multiple
                      value=""
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const maxFileSize = 10 * 1024 * 1024; // 10MB
                          const oversizedFiles = files.filter(file => file.size > maxFileSize);
                          
                          if (oversizedFiles.length > 0) {
                            toast.error(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
                            setUploadError(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          
                          if (files.length > 20) {
                            toast.error('Maximum 20 files can be uploaded at once');
                            setUploadError('Maximum 20 files can be uploaded at once');
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          
                          // Check for duplicates with existing documents
                          const duplicates: string[] = [];
                          const existingFileNames = new Set<string>();
                          
                          // Collect existing document names from task
                          if (task?.documentName && task.documentName.trim()) {
                            if (task.documentName.includes(', ')) {
                              task.documentName.split(', ').forEach(name => {
                                existingFileNames.add(name.trim().toLowerCase());
                              });
                            } else {
                              existingFileNames.add(task.documentName.toLowerCase());
                            }
                          }
                          
                          // Collect already confirmed file names
                          confirmedFiles.forEach(file => {
                            existingFileNames.add(file.name.toLowerCase());
                          });
                          
                          // Check for duplicates in new files
                          files.forEach(file => {
                            if (existingFileNames.has(file.name.toLowerCase())) {
                              duplicates.push(file.name);
                            }
                          });
                          
                          if (duplicates.length > 0) {
                            setUploadError(`Document${duplicates.length > 1 ? 's' : ''} already added: ${duplicates.join(', ')}`);
                          } else {
                            setUploadError(null);
                          }
                          
                          // Show confirmation modal
                          setPendingFiles(files);
                          setShowUploadModal(true);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                      key={confirmedFiles.length} // Reset input when files change
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Upload Documents
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported Files PDF, DOC, XLS, PPT, Images (Max 10MB each)
                      </p>
                      {confirmedFiles.length > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✓ {confirmedFiles.length} file(s) ready to {isEditing ? 'add' : 'upload'}
                        </p>
                      )}
                    </label>
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-800 dark:text-red-300">{uploadError}</span>
                      </div>
                    </div>
                  )}

                  {confirmedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                      <div className="max-h-48 overflow-y-scroll overflow-x-hidden space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                      {confirmedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await new Promise<boolean>((resolve) => {
                                const name = file.name;
                                let truncatedName;
                                if (name.length <= 30) {
                                  truncatedName = name;
                                } else {
                                  const lastDot = name.lastIndexOf('.');
                                  if (lastDot === -1) {
                                    truncatedName = name.substring(0, 30) + '...';
                                  } else {
                                    const extension = name.substring(lastDot);
                                    const filename = name.substring(0, lastDot);
                                    const maxFilenameLength = 30 - extension.length - 3; // 3 for '...'
                                    truncatedName = filename.substring(0, maxFilenameLength) + '...' + extension;
                                  }
                                }
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                modal.innerHTML = `
                                  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Remove File</h3>
                                    <p class="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to remove ${truncatedName} from the upload list?</p>
                                    <div class="flex justify-end space-x-3">
                                      <button id="cancel-btn" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white border border-gray-600 rounded-md transition-colors">Cancel</button>
                                      <button id="remove-btn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Remove</button>
                                    </div>
                                  </div>
                                `;
                                document.body.appendChild(modal);
                                
                                modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
                                  document.body.removeChild(modal);
                                  resolve(false);
                                });
                                
                                modal.querySelector('#remove-btn')?.addEventListener('click', () => {
                                  document.body.removeChild(modal);
                                  resolve(true);
                                });
                              });
                              
                              if (confirmed) {
                                setConfirmedFiles(prev => prev.filter((_, i) => i !== index));
                                setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}


                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const currentRole = getCurrentRole();
                  const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                  const isAssignedTask = isEditing && task && (task as any).createdBy === user?.id && (task as any).ownerId !== user?.id;

                  // Manager creating new task
                  if ((currentRole === 'Sales_Manager' || currentRole === 'Sales_VP') && !isEditing) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Pending</div>
                        <input type="hidden" {...register('status')} value="pending" />
                      </div>
                    );
                  }

                  // Sales Manager editing any task - show current status and cancelled option
                  if (currentRole === 'Sales_Manager' && isEditing && !isMyTask) {
                    const currentStatus = task?.status?.toLowerCase() || 'pending';
                    
                    // If task is completed, make it static
                    if (currentStatus === 'completed') {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Completed</div>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <input type="hidden" {...field} value="completed" />
                            )}
                          />
                        </div>
                      );
                    }
                    
                    // If task is cancelled, make it static
                    if (currentStatus === 'cancelled') {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Cancelled</div>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <input type="hidden" {...field} value="cancelled" />
                            )}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                          >
                            <span>
                              {watch('status') === 'cancelled' ? 'Cancelled' :
                                currentStatus === 'in_progress' ? 'In Progress' :
                                currentStatus === 'pending' ? 'Pending' :
                                currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} (Current)
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isStatusDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                              <div className="p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', currentStatus, { shouldValidate: true, shouldDirty: true });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === currentStatus ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  {currentStatus === 'in_progress' ? 'In Progress' :
                                    currentStatus === 'pending' ? 'Pending' :
                                    currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} (Current)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', 'cancelled', { shouldValidate: true, shouldDirty: true });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === 'cancelled' ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  Cancelled
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <input type="hidden" {...field} />
                          )}
                        />
                        {renderFieldError(errors.status?.message)}
                      </div>
                    );
                  }

                  // Sales VP editing any task - show current status and cancelled option
                  if (currentRole === 'Sales_VP' && isEditing) {
                    const currentStatus = task?.status?.toLowerCase() || 'pending';
                    
                    // If task is completed, make it static
                    if (currentStatus === 'completed') {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Completed</div>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <input type="hidden" {...field} value="completed" />
                            )}
                          />
                        </div>
                      );
                    }
                    
                    // If task is cancelled, make it static
                    if (currentStatus === 'cancelled') {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Cancelled</div>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <input type="hidden" {...field} value="cancelled" />
                            )}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                          >
                            <span>
                              {watch('status') === 'cancelled' ? 'Cancelled' :
                                currentStatus === 'in_progress' ? 'In Progress' :
                                currentStatus === 'pending' ? 'Pending' :
                                currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} (Current)
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isStatusDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                              <div className="p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', currentStatus, { shouldValidate: true, shouldDirty: true });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === currentStatus ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  {currentStatus === 'in_progress' ? 'In Progress' :
                                    currentStatus === 'pending' ? 'Pending' :
                                    currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} (Current)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', 'cancelled', { shouldValidate: true, shouldDirty: true });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === 'cancelled' ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  Cancelled
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <input type="hidden" {...field} />
                          )}
                        />
                        {renderFieldError(errors.status?.message)}
                      </div>
                    );
                  }

                  // Manager editing their own task
                  if ((currentRole === 'Sales_Manager' || currentRole === 'Sales_VP') && isMyTask) {
                    const currentStatus = watch('status');
                    
                    // If task is completed, make it static
                    if (currentStatus === 'completed') {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">Completed</div>
                          <input type="hidden" {...register('status')} value="completed" />
                          <p className="text-xs text-gray-500 mt-1">
                            Task is completed
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                          >
                            <span>
                              {currentStatus === 'in_progress' ? 'In Progress' :
                                currentStatus === 'completed' ? 'Completed' :
                                currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : 'Select Status'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isStatusDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                              <div className="p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', 'in_progress');
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === 'in_progress' ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  In Progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue('status', 'completed');
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === 'completed' ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  Completed
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <input type="hidden" {...register('status')} />
                        {renderFieldError(errors.status?.message)}
                        <p className="text-xs text-gray-500 mt-1">
                          Update your task progress
                        </p>
                      </div>
                    );
                  }

                  // Default for Sales Executive
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <div className="relative" ref={statusDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                        >
                          <span>
                            {watch('status') === 'pending' ? 'Pending' :
                              watch('status') === 'in_progress' ? 'In Progress' :
                              watch('status') === 'completed' ? 'Completed' :
                              watch('status') === 'cancelled' ? 'Cancelled' :
                              'Select Status'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                              {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setValue('status', status as any);
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watch('status') === status ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input type="hidden" {...register('status')} />
                      {renderFieldError(errors.status?.message)}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <div className="relative" ref={priorityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                      disabled={getCurrentRole() === 'Sales_Manager' && isEditing && task && (task as any).ownerId === user?.id}
                      className={`flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 text-sm font-medium ${
                        getCurrentRole() === 'Sales_Manager' && isEditing && task && (task as any).ownerId === user?.id
                          ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                          : 'bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      <span>{watch('priority') ? watch('priority').charAt(0).toUpperCase() + watch('priority').slice(1) : 'Select Priority'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPriorityDropdownOpen && !(getCurrentRole() === 'Sales_Manager' && isEditing && task && (task as any).ownerId === user?.id) && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          {['low', 'medium', 'high'].map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => {
                                setValue('priority', priority as any, { shouldValidate: true });
                                setIsPriorityDropdownOpen(false);
                                if (!isEditing) saveFormData({ ...watch(), priority: priority as any });
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                watch('priority') === priority ? 'bg-primary-50 text-primary-600' : ''
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...register('priority')} />
                  {renderFieldError(errors.priority?.message)}
                </div>

                {(() => {
                  const currentRole = getCurrentRole();
                  const isMyTask = isEditing && task && (task as any).ownerId === user?.id;
                  
                  // Show assignment dropdown for:
                  // - Sales VP (always)
                  // - Sales Manager when creating new task
                  // - Sales Manager when editing assigned tasks (not their own tasks)
                  const showAssignment = currentRole === 'Sales_VP' || 
                                       (currentRole === 'Sales_Manager' && (!isEditing || !isMyTask));
                  
                  return showAssignment;
                })() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getCurrentRole() === 'Sales_VP' ? 'Assign to Sales Manager *' : 'Assign to Sales Executive *'}
                    </label>
                    <div className="relative" ref={assigneeDropdownRef}>
                      <input
                        type="text"
                        value={assigneeSearchMode ? assigneeSearchQuery : (watch('assigneeId') ? (() => {
                          const selectedUser = salesExecutives.find(u => u.id === watch('assigneeId'));
                          const currentAssigneeId = (task as any)?.ownerId || (task as any)?.owner?.id;
                          const isCurrent = isEditing && currentAssigneeId === selectedUser?.id;
                          return selectedUser ? `${selectedUser.name}${isCurrent ? ' (Current)' : ''}` : 'Select user';
                        })() : 'Select user')}
                        onChange={(e) => {
                          setAssigneeSearchQuery(e.target.value);
                          setIsAssigneeDropdownOpen(true);
                          setHighlightedAssigneeIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          const filteredExecutives = salesExecutives
                            .filter(u => getCurrentRole() === 'Sales_Manager' ? u.role !== 'Sales_Manager' : true)
                            .filter(u => u.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()));
                          
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setIsAssigneeDropdownOpen(false);
                            setAssigneeSearchMode(false);
                            setAssigneeSearchQuery('');
                            setHighlightedAssigneeIndex(-1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedAssigneeIndex(prev => {
                              const newIndex = prev < filteredExecutives.length - 1 ? prev + 1 : prev;
                              setTimeout(() => assigneeItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                              return newIndex;
                            });
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedAssigneeIndex(prev => {
                              const newIndex = prev > 0 ? prev - 1 : 0;
                              setTimeout(() => assigneeItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                              return newIndex;
                            });
                          } else if (e.key === 'Enter' && highlightedAssigneeIndex >= 0) {
                            e.preventDefault();
                            const user = filteredExecutives[highlightedAssigneeIndex];
                            if (user) {
                              setValue('assigneeId', user.id, { shouldValidate: true });
                              setIsAssigneeDropdownOpen(false);
                              setHighlightedAssigneeIndex(-1);
                              setAssigneeSearchMode(false);
                              setAssigneeSearchQuery('');
                              if (!isEditing) saveFormData({ ...watch(), assigneeId: user.id });
                            }
                          } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                            setAssigneeSearchMode(true);
                          }
                        }}
                        onClick={() => {
                          setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                          if (!isAssigneeDropdownOpen) {
                            setAssigneeSearchMode(false);
                            setAssigneeSearchQuery('');
                            setHighlightedAssigneeIndex(-1);
                          }
                        }}
                        readOnly={!assigneeSearchMode}
                        disabled={loadingExecutives}
                        className={`h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px] ${loadingExecutives ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`}
                        style={{ outline: 'none', boxShadow: 'none' }}
                      />
                      {(assigneeSearchQuery && assigneeSearchMode) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigneeSearchQuery('');
                            setAssigneeSearchMode(false);
                          }}
                          className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                          title="Clear search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                      
                      {isAssigneeDropdownOpen && !loadingExecutives && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                          <div className="p-2">
                            {(() => {
                              const filteredExecs = salesExecutives
                                .filter(u => getCurrentRole() === 'Sales_Manager' ? u.role !== 'Sales_Manager' : true)
                                .filter(u => u.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()));
                              
                              if (filteredExecs.length === 0) {
                                return (
                                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                    {getCurrentRole() === 'Sales_VP' ? 'No managers found' : 'No executives found'}
                                  </div>
                                );
                              }
                              
                              return filteredExecs.map((u, index) => {
                                const currentAssigneeId = (task as any)?.ownerId || (task as any)?.owner?.id;
                                const isCurrent = isEditing && currentAssigneeId === u.id;
                                return (
                                  <button
                                    key={u.id}
                                    ref={el => assigneeItemRefs.current[index] = el}
                                    type="button"
                                    onClick={() => {
                                      setValue('assigneeId', u.id, { shouldValidate: true });
                                      setIsAssigneeDropdownOpen(false);
                                      setHighlightedAssigneeIndex(-1);
                                      setAssigneeSearchMode(false);
                                      setAssigneeSearchQuery('');
                                      if (!isEditing) saveFormData({ ...watch(), assigneeId: u.id });
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      highlightedAssigneeIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                      watch('assigneeId') === u.id ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {(() => {
                                      const label = u.name + (isCurrent ? ' (Current)' : '');
                                      if (!assigneeSearchQuery) return label;
                                      const index = label.toLowerCase().indexOf(assigneeSearchQuery.toLowerCase());
                                      if (index === -1) return label;
                                      return (
                                        <>
                                          {label.slice(0, index)}
                                          <strong>{label.slice(index, index + assigneeSearchQuery.length)}</strong>
                                          {label.slice(index + assigneeSearchQuery.length)}
                                        </>
                                      );
                                    })()}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="hidden" {...register('assigneeId')} />

                    {renderFieldError(errors.assigneeId?.message)}
                    {executivesError && (
                      <p className="text-sm text-red-600 mt-1">{executivesError}</p>
                    )}
                    {getCurrentRole() === 'Sales_Manager' ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing only sales executives (excluding managers)
                      </p>
                    ) : getCurrentRole() === 'Sales_VP' ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing only managers under your management
                      </p>
                    ) : isManagerOrVP(getCurrentRole()) ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing only executives under your management
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    ref={submitButtonRef}
                    type="submit"
                    variant="primary"
                    className="w-full"
                    leftIcon={<Save className="w-4 h-4" />}
                    disabled={isSubmitting}
                  >
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Upload Confirmation Modal */}
      <UploadModal
        isOpen={showUploadModal}
        files={pendingFiles}
        uploading={false}
        entityType="task"
        onUpload={() => {
          if (pendingFiles.length > 0 && !uploadError) {
            // Add valid files
            setUploadedFiles(prev => [...prev, ...pendingFiles]);
            setConfirmedFiles(prev => [...prev, ...pendingFiles]);
            setFilesConfirmed(true);
            
            // Show success message
            toast.success(`${pendingFiles.length} file(s) selected for upload`);
            
            setShowUploadModal(false);
            setPendingFiles([]);
            setFileToDelete(null);
          }
        }}
        onCancel={() => {
          setShowUploadModal(false);
          setPendingFiles([]);
          setUploadError(null);
          // Force file input reset
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }}
        error={uploadError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete ${confirmDelete?.docName ? (() => {
          const name = confirmDelete.docName;
          if (name.length <= 15) return name;
          const lastDot = name.lastIndexOf('.');
          if (lastDot === -1) return name.substring(0, 15) + '...';
          const extension = name.substring(lastDot);
          const filename = name.substring(0, lastDot);
          const maxFilenameLength = 15 - extension.length - 3; // 3 for '...'
          return filename.substring(0, maxFilenameLength) + '...' + extension;
        })() : ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            setPendingDeletes(prev => [...prev, confirmDelete.docName]);
            toast.success('Document marked for deletion');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
        showIcon={false}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Unsaved Changes"
        size="xs"
        closeOnOverlayClick={false}
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            You have unsaved changes. Are you sure you want to cancel?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowCancelConfirm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Continue
            </Button>
            <Button
              variant="ghost"
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Discard
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default TaskForm;
