import { logger } from '@/utils/logger';
import { authApi } from './authApi';
import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/lead-assignment`;

const handleApiResponse = async (response: Response) => {
  logger.info('API Response status:', response.status);
  logger.info('API Response headers:', response.headers);
  
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    logger.error('API Error:', response.status, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  logger.info('API Response data:', data);
  return data;
};

export interface Lead {
  leadId: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  leadStatus: string;
  leadSource: string;
  country: string;
  companyLocation: string;
  prospectValue: number;
  createdAt: string;
  assignedTo?: {
    userId: number;
    firstName: string;
    lastName: string;
  };
  createdBy?: {
    userId: number;
    firstName: string;
    lastName: string;
  };
}

export interface SalesExecutive {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const leadAssignmentApi = {
  getUnassignedLeads: async (): Promise<{ data: Lead[] }> => {
    const headers = {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    };
    
    // FORCE the headers to ensure they're correct
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userId) headers['X-User-Id'] = userId;
    if (userRole) headers['X-User-Role'] = userRole;
    
    logger.info('=== FRONTEND API CALL ===');
    logger.info('URL:', `${API_BASE_URL}/unassigned`);
    logger.info('Headers being sent:', headers);
    logger.info('localStorage userId:', localStorage.getItem('userId'));
    logger.info('localStorage userRole:', localStorage.getItem('userRole'));
    
    const response = await fetch(`${API_BASE_URL}/unassigned`, {
      method: 'GET',
      headers,
    });
    const data = await handleApiResponse(response);
    return { data };
  },

  getSalesExecutives: async (): Promise<{ data: SalesExecutive[] }> => {
    const headers = {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    };
    
    // Ensure headers are properly set
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Fallback to session data if localStorage is empty
    const session = localStorage.getItem('tech_tammina_session');
    let sessionData = null;
    if (session) {
      try {
        sessionData = JSON.parse(session);
      } catch (e) {
        logger.error('Error parsing session data:', e);
      }
    }
    
    const finalUserId = userId || (sessionData?.id?.toString());
    const finalUserRole = userRole || sessionData?.role;
    
    if (finalUserId) headers['X-User-Id'] = finalUserId;
    if (finalUserRole) headers['X-User-Role'] = finalUserRole;
    
    logger.info('=== SALES EXECUTIVES (FORCED FILTER) API CALL ===');
    logger.info('Final User ID:', finalUserId);
    logger.info('Final User Role:', finalUserRole);
    logger.info('Headers:', headers);
    
    // Use endpoint that forces filtering by manager ID even if role header is missing/mis-set
    const url = `${API_BASE_URL}/direct-sales-executives?userId=${encodeURIComponent(finalUserId || '')}&userRole=${encodeURIComponent(finalUserRole || '')}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    const data = await handleApiResponse(response);
    return { data };
  },

  getSalesExecutivesForLead: async (leadId: number): Promise<{ data: SalesExecutive[] }> => {
    const headers = {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    };
    
    // Ensure headers are properly set
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Fallback to session data if localStorage is empty
    const session = localStorage.getItem('tech_tammina_session');
    let sessionData = null;
    if (session) {
      try {
        sessionData = JSON.parse(session);
      } catch (e) {
        logger.error('Error parsing session data:', e);
      }
    }
    
    const finalUserId = userId || (sessionData?.id?.toString());
    const finalUserRole = userRole || sessionData?.role;
    
    if (finalUserId) headers['X-User-Id'] = finalUserId;
    if (finalUserRole) headers['X-User-Role'] = finalUserRole;
    
    logger.info('=== EXECUTIVES FOR LEAD API CALL ===', leadId);
    logger.info('Final User ID:', finalUserId);
    logger.info('Final User Role:', finalUserRole);
    
    const response = await fetch(`${API_BASE_URL}/sales-executives-for-lead/${leadId}`, {
      method: 'GET',
      headers,
    });
    const data = await handleApiResponse(response);
    return { data };
  },

  assignLead: async (leadId: number, executiveId: number) => {
    const headers = {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    };
    
    // FORCE the headers to ensure they're correct
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userId) headers['X-User-Id'] = userId;
    if (userRole) headers['X-User-Role'] = userRole;
    
    const response = await fetch(`${API_BASE_URL}/assign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ leadId, executiveId }),
    });
    return handleApiResponse(response);
  },

  reassignLead: async (leadId: number, newExecutiveId: number) => {
    const response = await fetch(`${API_BASE_URL}/reassign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
      body: JSON.stringify({ leadId, newExecutiveId }),
    });
    return handleApiResponse(response);
  },

  getLeadsByExecutive: async (executiveId: number): Promise<{ data: Lead[] }> => {
    const response = await fetch(`${API_BASE_URL}/assigned/${executiveId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
    });
    const data = await handleApiResponse(response);
    return { data };
  },

  bulkAssign: async (leadIds: number[], executiveId: number) => {
    const headers = {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    };
    
    // Ensure headers are properly set
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const session = localStorage.getItem('tech_tammina_session');
    let sessionData = null;
    if (session) {
      try { sessionData = JSON.parse(session); } catch (e) {}
    }
    
    const finalUserId = userId || (sessionData?.id?.toString());
    const finalUserRole = userRole || sessionData?.role;
    
    if (finalUserId) headers['X-User-Id'] = finalUserId;
    if (finalUserRole) headers['X-User-Role'] = finalUserRole;
    
    const response = await fetch(`${API_BASE_URL}/bulk-assign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ leadIds, executiveId }),
    });
    return handleApiResponse(response);
  },

  unassignLead: async (leadId: number) => {
    const response = await fetch(`${API_BASE_URL}/unassign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
      body: JSON.stringify({ leadId }),
    });
    return handleApiResponse(response);
  },

  requestReassignment: async (leadId: number, reason: string) => {
    const response = await fetch(`${API_BASE_URL}/request-reassignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
      body: JSON.stringify({ leadId, reason }),
    });
    return handleApiResponse(response);
  },

  approveReassignment: async (requestId: number, newExecutiveId: number) => {
    const response = await fetch(`${API_BASE_URL}/approve-reassignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
      body: JSON.stringify({ requestId, newExecutiveId }),
    });
    return handleApiResponse(response);
  },

  rejectReassignment: async (requestId: number) => {
    const response = await fetch(`${API_BASE_URL}/reject-reassignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
      body: JSON.stringify({ requestId }),
    });
    return handleApiResponse(response);
  },

};
