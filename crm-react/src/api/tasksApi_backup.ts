import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Tasks API Service
 * API service functions for task operations (separate /api/tasks backend)
 */

import { can, getCurrentRole } from '@/utils/rbac';
import { getAuthHeaders as getAuthHeadersUtil } from '@/utils/auth';

export type TaskRow = {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'backlog';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:mm format
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  relatedEntity?: { id: string; type: 'lead' | 'contact' | 'deal' | 'company'; name?: string };
  remarks?: string;
  documentationFilename?: string;
  documentationType?: string;
  hasDocumentation?: boolean;
};

import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/tasks`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '';
  let userRole = '';
  let userEmail = '';
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || '';
      userRole = u.role || '';
      userEmail = u.email || '';
    } catch {}
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(userRole ? { 'X-User-Role': userRole } : {}),
    ...(userEmail ? { 'X-User-Email': userEmail } : {}),
  };
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      // Error reading response
    }
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  if (response.status === 204) return null as any;
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return null as any;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    try { return JSON.parse(text); } catch { return text as any; }
  }
  return response.json();
};

// Backend <-> Frontend mappers
const mapBackendToTaskRow = (b: any): TaskRow => {
  // Sanitize string fields to prevent XSS
  const sanitizeString = (str: any) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"'&]/g, '');
  };

  return {
    id: (b.taskId ?? b.id ?? '').toString(),
    title: sanitizeString(b.title) ?? '',
    description: sanitizeString(b.description) ?? '',
    priority: (b.priority?.toLowerCase() as TaskRow['priority']) ?? 'medium',
    status: (b.status?.toLowerCase() as TaskRow['status']) ?? 'pending',
    dueDate: b.dueDate ?? undefined,
    ownerId: (b.ownerId ?? '').toString(),
    ownerName: sanitizeString(b.ownerName) ?? undefined,
    ownerEmail: sanitizeString(b.ownerEmail) ?? undefined,
    createdById: b.createdBy?.toString(),
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    tags: Array.isArray(b.tags) ? b.tags.map(sanitizeString) : b.tags,
    relatedEntity: b.relatedType && b.relatedId ? {
      id: b.relatedId.toString(),
      type: b.relatedType,
      name: sanitizeString(b.relatedEntityName)
    } : undefined,
    remarks: sanitizeString(b.remarks) ?? undefined,
    documentationFilename: sanitizeString(b.documentationFilename) ?? undefined,
    documentationType: sanitizeString(b.documentationType) ?? undefined,
    hasDocumentation: b.hasDocumentation ?? false,
  };
};

const normalizeEnum = (s?: string) => s ? s.trim().toUpperCase().replace('-', '_').replace(' ', '_') : undefined;
const extractNumericId = (id?: string) => (id ? Number(String(id).match(/(\d+)$/)?.[1] ?? id) : undefined);

const assertCan = (action: 'View' | 'Create' | 'Edit' | 'Delete') => {
  const role = getCurrentRole();
  if (!can(role, 'Tasks', action)) {
    throw new Error('Permission denied');
  }
};

export const tasksApi = {
  getAssignedTasks: async () => {
    const role = getCurrentRole();
    if (role !== 'Sales_Manager') {
      throw new Error('Access denied: Sales Manager only');
    }

    const res = await fetch(`${API_BASE_URL}/manager/assigned`, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    const rawList = Array.isArray(data) ? data : data?.data || [];
    const mappedTasks = rawList.map(mapBackendToTaskRow);
    return { data: mappedTasks, success: true, message: 'Assigned tasks retrieved successfully' };
  },
  // Get sales executives for task assignment
  getSalesExecutives: async () => {
    const headers = getAuthHeaders();
    const userRole = headers['X-User-Role'];
    
    // For Sales VP, get Sales Managers under their hierarchy
    if (userRole === 'Sales_VP') {
      try {

        const res = await fetch('/api/sales-vp/managers', { headers });
        if (res.ok) {
          const data = await res.json();
          const allManagers = Array.isArray(data) ? data : [];
          // Filter for Sales Managers where manager_id = current user_id
          const managers = allManagers.filter((user: any) => 
            user.managerId?.toString() === currentUserId
          );
          
          if (managers.length > 0) {
            return {
              data: managers.map((manager: any) => ({
                id: manager.userId?.toString() || '',
                name: manager.fullName || manager.username || manager.email || 'Unknown',
                email: manager.email || '',
                role: 'Sales_Manager',
              })),
              success: true,
              message: `Found ${managers.length} assignable managers`
            };
          }
        }
      } catch (error) {
        logger.error('Error fetching assignable managers:', error);
      }
    }
    
    // For Sales Manager, get only their assignable executives
    if (userRole === 'Sales_Manager') {
      try {
        const res = await fetch('/api/sales-manager/assignable-executives', { headers });
        if (res.ok) {
          const data = await res.json();
          const executives = Array.isArray(data?.data) ? data.data : [];
          
          if (executives.length > 0) {
            return {
              data: executives.map((exec: any) => ({
                id: exec.userId?.toString() || '',
                name: exec.fullName || exec.username || exec.email || 'Unknown',
                email: exec.email || '',
                role: exec.role || 'Sales Executive',
              })),
              success: true,
              message: `Found ${executives.length} assignable executives`
            };
          }
        }
      } catch (error) {
        logger.error('Error fetching assignable executives:', error);
      }
    }
    
    // Fallback: Get all sales executives
    try {
      const res = await fetch('/api/users/sales-executives', { headers });
      if (res.ok) {
        const data = await res.json();
        const executives = Array.isArray(data) ? data : [];
        
        return {
          data: executives.map((user: any) => ({
            id: user.userId?.toString() || '',
            name: user.fullName || user.username || user.email || 'Unknown',
            email: user.email || '',
            role: user.role || 'Sales Executive',
          })),
          success: true,
          message: `Found ${executives.length} sales executives`
        };
      }
    } catch (error) {
      logger.error('Error fetching sales executives:', error);
    }
    
    return { data: [], success: false, message: 'Failed to load sales executives' };
  },

  // Original method (keeping as backup)
  getSalesExecutivesOriginal: async () => {
    const role = getCurrentRole();
    if (!can(role, 'Tasks', 'View')) throw new Error('Permission denied');

    // Get current user info from localStorage
    let currentUserId = '';
    let currentUserRole = '';
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('tech_tammina_session');
      if (userStr) {
        const user = JSON.parse(userStr);
        currentUserId = user.id || user.userId || '';
        currentUserRole = user.role || '';
      }
    } catch (e) {
      logger.error('Error parsing user data:', e);
    }

    // For Sales Manager or Sales VP, get their assignable executives
    if (currentUserRole === 'Sales_Manager' || currentUserRole === 'Sales_VP') {
      try {
        const executivesUrl = '/sales-manager/assignable-executives';

        const res = await fetch(executivesUrl, { headers: getAuthHeaders() });
        const data = await handleApiResponse(res);
        const executives = Array.isArray(data?.data) ? data.data : [];

        return {
          data: executives.map((exec: any) => ({
            id: exec.userId?.toString() || exec.id?.toString() || '',
            name: exec.fullName || exec.username || exec.name || exec.email || 'Unknown',
            email: exec.email || '',
            role: exec.role || 'Sales Executive',
          })),
          success: true,
          message: 'Assignable executives retrieved successfully'
        };
      } catch (error) {
        logger.error('Error fetching assignable executives:', error);
        // Fallback to all executives if hierarchy API fails
      }
    }

    // Fallback: Get all sales executives (for other roles or if hierarchy fails)
    const res = await fetch('/users/sales-executives', { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    const executives = Array.isArray(data) ? data : [];
    return {
      data: executives.map((user: any) => ({
        id: user.userId?.toString() || '',
        name: user.fullName || user.username || user.email || 'Unknown',
        email: user.email || '',
        role: user.role || 'Sales Executive',
      })),
      success: true,
      message: 'Sales executives retrieved successfully'
    };
  },

  // Get hierarchical sales executives (for managers/VPs)
  getHierarchicalExecutives: async () => {
    const role = getCurrentRole();
    if (!can(role, 'Tasks', 'View')) throw new Error('Permission denied');

    const executivesUrl = '/executives';

    const res = await fetch(executivesUrl, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    const executives = Array.isArray(data) ? data : [];

    return {
      data: executives.map((exec: any) => ({
        id: exec.id?.toString() || '',
        name: exec.fullName || exec.name || exec.username || 'Unknown',
        email: exec.email || '',
        role: 'Sales Executive',
        managerId: exec.managerId,
      })),
      success: true,
      message: 'Hierarchical executives retrieved successfully'
    };
  },

  list: async (params?: { q?: string; ownerId?: string; createdBy?: string; status?: string; type?: string; priority?: string }) => {
    try {
      assertCan('View');
    } catch (e) {
      // RBAC check failed, proceeding anyway
    }

    // Build query parameters for the tasks API
    const queryParams = new URLSearchParams();
    if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
    if (params?.createdBy) queryParams.append('createdBy', params.createdBy);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.priority) queryParams.append('priority', params.priority);

    const url = `${API_BASE_URL}?${queryParams.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);

    // Fetch from task API instead of activities API
    const tasksUrl = API_BASE_URL;
    const tasksRes = await fetch(tasksUrl, { headers: getAuthHeaders() });
    const tasksData = await handleApiResponse(tasksRes);

    // Get the data array
    const rawList = Array.isArray(tasksData) ? tasksData : tasksData?.data || [];

    // Apply filters
    let filteredTasks = rawList;

    if (params?.ownerId) {
      filteredTasks = filteredTasks.filter((task: any) =>
        String(task.ownerId) === params.ownerId
      );
    }

    if (params?.createdBy) {
      filteredTasks = filteredTasks.filter((task: any) =>
        String(task.createdBy) === params.createdBy
      );
    }

    // Apply other filters
    if (params?.status) {
      filteredTasks = filteredTasks.filter((task: any) =>
        (task.status || '').toLowerCase() === params.status!.toLowerCase()
      );
    }



    if (params?.priority) {
      filteredTasks = filteredTasks.filter((task: any) =>
        (task.priority || '').toLowerCase() === params.priority!.toLowerCase()
      );
    }

    const mappedTasks = filteredTasks.map(mapBackendToTaskRow);
    return { data: mappedTasks, success: true, message: 'Tasks retrieved successfully' };
  },

  get: async (id: string) => {
    assertCan('View');
    // Fetch from task API instead of activities API
    const tasksUrl = API_BASE_URL + '/' + id;
    const taskRes = await fetch(tasksUrl, { headers: getAuthHeaders() });
    const taskData = await handleApiResponse(taskRes);

    return { data: mapBackendToTaskRow(taskData), success: true, message: 'Task retrieved successfully' };
  },

  create: async (task: TaskRow) => {
    assertCan('Create');
    
    // Get current user info for createdBy
    let currentUserId = null;
    try {
      const userStr = localStorage.getItem('tech_tammina_session') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        currentUserId = extractNumericId(user?.id || user?.userId);
      }
    } catch {
      // Invalid JSON in localStorage
    }
    
    // Convert ISO date to LocalDate format
    let dueDateFormatted = null;
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      dueDateFormatted = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    const body = {
      taskId: null,
      title: task.title,
      description: task.description ?? '',
      priority: task.priority.toUpperCase(), // Convert to uppercase for enum
      status: task.status.toUpperCase(), // Convert to uppercase for enum
      dueDate: dueDateFormatted,
      dueTime: (task as any).dueTime || null,
      ownerId: extractNumericId(task.ownerId),
      createdBy: extractNumericId(task.createdById) ?? currentUserId ?? 1,
      relatedType: task.relatedEntity?.type,
      relatedId: task.relatedEntity?.id ? extractNumericId(task.relatedEntity.id) : undefined,
      documents: (task as any).documents || null,
      documentName: (task as any).documentName || null,
    };
    
    logger.info('Creating task with data:', JSON.stringify(body, null, 2));
    
    const res = await fetch(API_BASE_URL, { 
      method: 'POST', 
      headers: getAuthHeaders(), 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      logger.error('Task creation failed:', res.status, res.statusText, errorText);
      throw new Error(`Failed to create task: ${errorText || 'Server error'}`);
    }
    
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task created successfully' };
  },

  update: async (id: string, task: Partial<TaskRow>) => {
    assertCan('Edit');
    const numericId = extractNumericId(id);
    const body = {
      taskId: numericId,
      title: task.title,
      description: task.description,
      priority: task.priority ? normalizeEnum(task.priority) : undefined,
      status: task.status ? normalizeEnum(task.status) : undefined,
      dueDate: task.dueDate ?? null,
      ownerId: task.ownerId ? extractNumericId(task.ownerId) : undefined,
      createdBy: task.createdById ? extractNumericId(task.createdById) : undefined,
      relatedType: task.relatedEntity?.type,
      relatedId: task.relatedEntity?.id ? extractNumericId(task.relatedEntity.id) : undefined,
    };
    const res = await fetch(`${API_BASE_URL}/${numericId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) });
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task updated successfully' };
  },

  delete: async (id: string) => {
    assertCan('Delete');
    const numericId = extractNumericId(id);
    const res = await fetch(`${API_BASE_URL}/${numericId}`, { method: 'DELETE', headers: getAuthHeaders() });
    await handleApiResponse(res);
    return { data: undefined, success: true, message: 'Task deleted successfully' };
  },

  // Executive-specific endpoints
  getCategorizedTasks: async (filters?: { priority?: string; startDate?: string; endDate?: string }) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Executive') {
      throw new Error('Access denied: Executive tasks only');
    }

    const params = new URLSearchParams();
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const url = `${API_BASE_URL}/executive/categorized${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true, message: 'Categorized tasks retrieved successfully' };
  },

  getTaskDetails: async (id: string) => {
    const numericId = extractNumericId(id);
    const res = await fetch(`${API_BASE_URL}/${numericId}/details`, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task details retrieved successfully' };
  },

  startTask: async (id: string, remarks?: string) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Executive') {
      throw new Error('Access denied: Executive action only');
    }

    const numericId = extractNumericId(id);
    const body = { remarks: remarks || 'Task started' };
    const res = await fetch(`${API_BASE_URL}/${numericId}/start`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task started successfully' };
  },

  completeTask: async (id: string, remarks?: string) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Executive') {
      throw new Error('Access denied: Executive action only');
    }

    const numericId = extractNumericId(id);
    const body = { remarks: remarks || 'Task completed' };
    const res = await fetch(`${API_BASE_URL}/${numericId}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task completed successfully' };
  },

  updateTaskRemarks: async (id: string, remarks: string) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Executive') {
      throw new Error('Access denied: Executive action only');
    }

    const numericId = extractNumericId(id);
    const body = { remarks };
    const res = await fetch(`${API_BASE_URL}/${numericId}/remarks`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await handleApiResponse(res);
    return { data: mapBackendToTaskRow(data), success: true, message: 'Task remarks updated successfully' };
  },

  // Documentation management
  uploadDocumentation: async (id: string, file: File) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Manager') {
      throw new Error('Access denied: Sales Manager only');
    }

    const numericId = extractNumericId(id);
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    const res = await fetch(`${API_BASE_URL}/${numericId}/upload-documentation`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await handleApiResponse(res);
    return { data, success: true, message: 'Documentation uploaded successfully' };
  },

  downloadDocumentation: async (id: string) => {
    const numericId = extractNumericId(id);
    const res = await fetch(`${API_BASE_URL}/${numericId}/download-documentation`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      throw new Error('Failed to download documentation');
    }
    
    return res.blob();
  },

  deleteDocumentation: async (id: string) => {
    const role = getCurrentRole();
    if (role !== 'Sales_Manager') {
      throw new Error('Access denied: Sales Manager only');
    }

    const numericId = extractNumericId(id);
    const res = await fetch(`${API_BASE_URL}/${numericId}/documentation`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(res);
    return { data, success: true, message: 'Documentation deleted successfully' };
  },
};

