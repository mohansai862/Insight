import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Activities API Service
 * API service functions for lead activity operations
 */


// Activity type for frontend (matching backend schema exactly)
export type ActivityRow = {
  activityId: number;
  leadId: number;
  activityType: 'CALL' | 'EMAIL' | 'MEETING';
  subject: string;
  description?: string;
  activityDate: string; // ISO date string
  createdBy: number;
  createdAt: string;
};

import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/activity`;

// Helper function to get auth headers
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

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  // Handle 204 No Content or empty body
  if (response.status === 204) return null as any;
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return null as any;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // try to parse text or return as-is
    const text = await response.text();
    try { return JSON.parse(text); } catch { return text as any; }
  }
  return response.json();
};

// Helper function to extract numeric ID from string ID
const extractNumericId = (id: string): number | null => {
  if (!id) return null;
  if (!isNaN(Number(id))) return Number(id);
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

// Helper to map backend Activity to frontend ActivityRow
const mapBackendToActivityRow = (backendActivity: any): ActivityRow => {
  logger.info('🔍 Mapping backend activity:', backendActivity);
  
  return {
    activityId: backendActivity.activityId || 0,
    leadId: backendActivity.leadId || 0,
    activityType: backendActivity.activityType || 'CALL',
    subject: backendActivity.subject || '',
    description: backendActivity.description || '',
    activityDate: backendActivity.activityDate || new Date().toISOString(),
    createdBy: backendActivity.createdBy || 0,
    createdAt: backendActivity.createdAt || new Date().toISOString(),
  };
};

  // Helper to map frontend ActivityRow to backend Activity
  const mapActivityRowToBackend = (activity: any): any => {
    // Get current user ID from session
    const getCurrentUserId = (): number => {
      try {
        const session = localStorage.getItem('tech_tammina_session');
        if (session) {
          const u = JSON.parse(session);
          const id = u.id || u.userId;
          if (id) return Number(id);
        }
      } catch (e) {
        // Could not parse session
      }
      return 1; // Default user ID
    };

    const currentUserId = getCurrentUserId();

    // Map frontend types to backend uppercase types
    const typeMapping: Record<string, string> = {
      'call': 'CALL',
      'CALL': 'CALL',
      'meeting': 'MEETING',
      'MEETING': 'MEETING',
      'email': 'EMAIL',
      'EMAIL': 'EMAIL'
    };
    
    const activityType = activity.activityType || activity.type || 'call';
    const mappedType = typeMapping[activityType] || typeMapping[activityType.toLowerCase()] || 'CALL';
    
    logger.info('🔍 Mapping activity type:', activityType, '->', mappedType);

    return {
      activityId: activity.activityId || null,
      leadId: Number(activity.leadId),
      activityType: mappedType,
      subject: activity.subject,
      description: activity.description || '',
      activityDate: activity.activityDate,
      createdBy: currentUserId,
    };
  };

// API service functions
export const activitiesApi = {
  // Create a new activity
  create: async (data: any): Promise<{ data: ActivityRow; success: boolean; message: string }> => {
    logger.info('🔍 Creating activity with data:', data);
    const backendData = mapActivityRowToBackend(data);
    logger.info('🔍 Mapped backend data:', backendData);
    
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    logger.info('🔍 Activity creation result:', result);
    
    return {
      data: mapBackendToActivityRow(result),
      success: true,
      message: 'Activity created successfully',
    };
  },

  // Get all activities
  list: async (params?: { leadId?: string; skipRoleFilter?: boolean }): Promise<{ data: ActivityRow[]; success: boolean; message: string }> => {
    let url = API_BASE_URL;
    if (params?.leadId) {
      const leadId = extractNumericId(params.leadId);
      if (leadId) {
        url += `/lead/${leadId}`;
        logger.info('🔍 Fetching activities for lead:', leadId, 'URL:', url);
      }
    } else {
      logger.info('🔍 Fetching all activities, URL:', url);
    }

    logger.info('🔍 Activities API request:', { url, headers: getAuthHeaders() });
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(response);
    logger.info('🔍 Activities API response:', data);

    // Support various payload shapes
    const rawList = Array.isArray(data) ? data : (data as any)?.data || [];
    logger.info('🔍 Raw activities list:', rawList);
    let mappedData = rawList.map(mapBackendToActivityRow);
    logger.info('🔍 Mapped activities data:', mappedData);

    return {
      data: mappedData,
      success: true,
      message: 'Activities retrieved successfully',
    };
  },

  // Get a single activity by ID
  get: async (id: string): Promise<{ data: ActivityRow; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid activity ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);
    return {
      data: mapBackendToActivityRow(data),
      success: true,
      message: 'Activity retrieved successfully',
    };
  },

  // Update an activity
  update: async (id: string, data: any): Promise<{ data: ActivityRow; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid activity ID format');
    }
    const backendData = mapActivityRowToBackend(data);
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToActivityRow(result),
      success: true,
      message: 'Activity updated successfully',
    };
  },

  // Delete an activity
  delete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid activity ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Activity deleted successfully',
    };
  },

  // Get deal activity timeline
  getDealTimeline: async (dealId: string): Promise<{ data: any[]; success: boolean; message: string }> => {
    const response = await fetch(`${environment.apiURL}/deals/${dealId}/activity`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);
    
    // Return the complete activity array from backend
    const activities = Array.isArray(data) ? data : (data as any)?.data || [];
    
    return {
      data: activities,
      success: true,
      message: 'Deal activity timeline retrieved successfully',
    };
  },
};

