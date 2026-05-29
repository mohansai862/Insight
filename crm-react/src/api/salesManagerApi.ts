/**
 * Sales Manager API functions
 * Handles API calls for team executives and leads management
 */

import type { LeadRow } from '@/modules/leads/LeadsManagement';
import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/sales-manager`;
const LEADS_API_BASE_URL = `${environment.apiURL}/leads`;
const EXECUTIVES_API_BASE_URL = `${environment.apiURL}/sales-manager`;

// Helper function to get auth headers
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

// Helper to map backend ContactDTO to frontend ContactRow
const mapBackendToContactRow = (backendContact: any): any => {
  return {
    id: (backendContact.contactId ?? backendContact.id)?.toString() || '',
    name: `${backendContact.firstName || ''} ${backendContact.lastName || ''}`.trim(),
    firstName: backendContact.firstName || '',
    lastName: backendContact.lastName || '',
    email: backendContact.email || '',
    phoneNumber: backendContact.phoneNumber || '',
    company: backendContact.companyName || backendContact.account?.accountName || '',
    title: backendContact.designation || '',
    type: backendContact.type || 'lead',
    status: backendContact.status || 'active',
    createdAt: backendContact.createdAt || new Date().toISOString(),
    ownerId: backendContact.reassignTo?.toString() || backendContact.createdBy?.toString() || '',
    ownerName: backendContact.createdByName || '',
    lastActivityAt: backendContact.updatedAt || backendContact.createdAt,
  };
};

export interface UserDTO {
  userId: number;
  username: string;
  email: string;
  phoneNumber?: string;
  role: string;
  managerId?: number;
  createdAt: string;
}

export interface ExecutiveWithLeadCount extends UserDTO {
  leadCount: number;
  tasksCount: number;
  communicationsCount: number;
}

export interface ManagerWithExecutiveCount extends UserDTO {
  leadCount: number; // Reused for executive count
}

export interface ExecutivesResponse {
  data: ExecutiveWithLeadCount[];
  total: number;
  page: number;
  size: number;
}

export interface LeadsResponse {
  data: LeadRow[];
  total: number;
  page: number;
  size: number;
}

/**
 * Get list of executives under the logged-in sales manager
 */
export const getExecutives = async (): Promise<ExecutivesResponse> => {
  const response = await fetch(`${API_BASE_URL}/executives`, {
    headers: getAuthHeaders()
  });
  const data = await handleApiResponse(response);
  
  // Handle both array and object response formats
  const executives = Array.isArray(data) ? data : (data?.data || []);
  
  return {
    data: executives.map((exec: any) => ({
      userId: exec.userId || exec.id,
      username: exec.username || exec.name || `${exec.firstName || ''} ${exec.lastName || ''}`.trim(),
      email: exec.email,
      phoneNumber: exec.phoneNumber || exec.contactNo,
      role: exec.role || 'Sales_Executive',
      managerId: exec.managerId,
      createdAt: exec.createdAt || new Date().toISOString(),
      leadCount: exec.leadCount || 0,
      tasksCount: exec.tasksCount || 0,
      communicationsCount: exec.communicationsCount || 0,
    })),
    total: executives.length,
    page: 0,
    size: executives.length,
  };
};

/**
 * Get list of executives under a specific manager
 */
export const getExecutivesUnderManager = async (managerId: number): Promise<ExecutivesResponse> => {
  const response = await fetch(`${API_BASE_URL}/manager/${managerId}/executives`, {
    headers: getAuthHeaders()
  });
  const data = await handleApiResponse(response);
  
  // Transform to match expected response format
  const executives = Array.isArray(data) ? data : (data?.data || []);
  
  return {
    data: executives.map((exec: any) => ({
      userId: exec.userId || exec.id,
      username: exec.username || exec.name || (exec.firstName && exec.lastName ? `${exec.firstName} ${exec.lastName}` : exec.firstName || exec.lastName || 'Unknown'),
      email: exec.email,
      phoneNumber: exec.phoneNumber || exec.contactNo,
      role: exec.role || 'Sales_Executive',
      managerId: exec.managerId,
      createdAt: exec.createdAt || new Date().toISOString(),
      leadCount: exec.leadCount || 0,
      tasksCount: exec.tasksCount || 0,
      communicationsCount: exec.communicationsCount || 0,
    })),
    total: executives.length,
    page: 0,
    size: executives.length,
  };
};

/**
 * Get leads for a specific executive
 */
export const getExecutiveLeads = async (
  executiveId: number,
  search?: string,
  page = 0,
  size = 20,
  sort = 'createdAt',
  order = 'desc'
): Promise<LeadsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
    order: order,
  });

  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${API_BASE_URL}/manager/executives/${executiveId}/leads?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleApiResponse(response);
};

/**
 * Get tasks for a specific executive created by the logged-in manager
 */
export const getExecutiveTasks = async (
  executiveId: number,
  search?: string,
  page = 0,
  size = 20,
  sort = 'createdAt',
  order = 'desc'
): Promise<any> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
    order: order,
  });

  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${EXECUTIVES_API_BASE_URL}/executive/${executiveId}/tasks?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleApiResponse(response);
};

/**
 * Get communications for a specific executive created by the logged-in manager
 */
export const getExecutiveCommunications = async (
  executiveId: number,
  search?: string,
  page = 0,
  size = 20,
  sort = 'createdAt',
  order = 'desc'
): Promise<any> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
    order: order,
  });

  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${API_BASE_URL}/manager/executives/${executiveId}/communications?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleApiResponse(response);
};

/**
 * Get contacts for a specific executive
 */
export const getExecutiveContacts = async (
  executiveId: number,
  search?: string
): Promise<{ data: any[]; total: number; page: number; size: number }> => {
  const params = new URLSearchParams();
  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${API_BASE_URL}/manager/executives/${executiveId}/contacts?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  const data = await handleApiResponse(response);

  // Map backend contacts to frontend format
  const mappedData = (data.data || []).map(mapBackendToContactRow);

  return {
    ...data,
    data: mappedData
  };
};

/**
 * Get VP contacts for sales manager
 */
export const getVPContacts = async (
  search?: string
): Promise<{ data: any[]; total: number; page: number; size: number }> => {
  const params = new URLSearchParams();
  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${API_BASE_URL}/vp-contacts?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  const data = await handleApiResponse(response);

  // Map backend contacts to frontend format
  const mappedData = (data.data || []).map(mapBackendToContactRow);

  return {
    ...data,
    data: mappedData
  };
};

/**
 * Get all leads for the logged-in sales manager
 */
export const getManagerLeads = async (
  search?: string,
  page = 0,
  size = 20,
  sort = 'createdAt',
  order = 'desc'
): Promise<LeadsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
    order: order,
  });

  if (search) {
    params.append('q', search);
  }

  const response = await fetch(
    `${API_BASE_URL}/leads?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleApiResponse(response);
};

export const salesManagerApi = {
  getExecutives,
  getExecutivesUnderManager,
  getExecutiveLeads,
  getExecutiveTasks,
  getExecutiveCommunications,
  getExecutiveContacts,
  getVPContacts,
  getManagerLeads,
};
