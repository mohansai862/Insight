import { logger } from '@/utils/logger';
import type { LeadRow } from '@/modules/leads/LeadsManagement';
import type { ContactRow } from '@/types';

export interface UserDTO {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  managerId?: number;
}

export interface LeadDTO {
  leadId: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phoneNumber?: string;
  status: string;
  createdAt: string;
  createdBy?: UserDTO;
  assignedTo?: UserDTO;
}

export interface ContactDTO {
  contactId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  designation?: string;
  companyName?: string;
  type?: string;
  status?: string;
  createdAt: string;
  createdBy?: UserDTO;
  ownerId?: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '1'; // Default fallback
  let userRole = 'Sales_VP'; // Default fallback

  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || u.userId || '1';
      userRole = u.role || 'Sales_VP';
    } catch (e) {
      logger.warn('Failed to parse session data:', e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-User-Id': userId,
    'X-User-Role': userRole,
  };

  return headers;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch {}

    let errorMessage = '';
    switch (response.status) {
      case 403:
        errorMessage = 'Access Denied - You do not have permission for this action';
        break;
      default:
        errorMessage = `API Error: ${response.status} - ${errorText || 'Unknown error'}`;
    }

    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    try { return JSON.parse(text); } catch { return text as any; }
  }
  return response.json();
};

// Helper to map backend ContactDTO to frontend ContactRow
const mapBackendToContactRow = (backendContact: any): ContactRow => {
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

// Helper to map backend LeadDTO to frontend LeadRow
const mapBackendToLeadRow = (backendLead: any): LeadRow => {
  let firstName = '';
  let lastName = '';
  if (backendLead.firstName || backendLead.lastName) {
    firstName = backendLead.firstName || '';
    lastName = backendLead.lastName || '';
  } else if (typeof backendLead.name === 'string' && backendLead.name.trim()) {
    const parts = backendLead.name.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ');
  }

  const rawId = backendLead.leadId ?? backendLead.id;
  const rawSource = backendLead.leadSource ?? backendLead.source ?? 'Website';
  const rawStatus = backendLead.leadStatus ?? backendLead.status ?? 'New';

  const companyName = (
    typeof backendLead.companyName === 'string' && backendLead.companyName
  ) ?? (
    typeof backendLead.company === 'string' ? backendLead.company : (backendLead.company?.name as string | undefined)
  ) ?? (
    backendLead.company_name as string | undefined
  ) ?? (
    typeof backendLead.organization === 'string' ? backendLead.organization : (backendLead.organization?.name as string | undefined)
  ) ?? (
    backendLead.accountName as string | undefined
  ) ?? (
    (backendLead.account && typeof backendLead.account === 'object' ? backendLead.account.name : undefined)
  ) ?? '';

  const createdById = (
    backendLead.createdById ?? backendLead.createdBy?.id ?? ''
  )?.toString?.() || '';
  const createdBy = backendLead.createdByName || backendLead.createdBy?.username || backendLead.createdBy?.email || 'System';
  const ownerId = (
    backendLead.assignedTo ?? backendLead.assignedToId ?? backendLead.assignedTo?.id ?? backendLead.ownerId ?? ''
  )?.toString?.() || '';

  const sourceMap: { [key: string]: string } = {
    'Website': 'website',
    'Email': 'email',
    'Campaign': 'campaign',
    'Cold Call': 'cold_call',
    'Referral': 'referral',
    'Event': 'event',
    'Other': 'other',
    'Cold_Call': 'cold_call',
    'website': 'website',
    'email': 'email',
    'campaign': 'campaign',
    'cold_call': 'cold_call',
    'referral': 'referral',
    'event': 'event',
    'other': 'other',
  };
  const frontendSource = sourceMap[String(rawSource)] || 'other';

  return {
    id: rawId?.toString() || '',
    leadId: rawId?.toString() || '',
    source: frontendSource as any,
    firstName,
    lastName,
    companyName,
    designation: backendLead.designation || backendLead.title || '',
    email: backendLead.email || '',
    phoneNumber: backendLead.phoneNumber || backendLead.phone || '',
    linkedIn: backendLead.linkedin || backendLead.linkedIn || '',
    industry: backendLead.industry || '',
    country: backendLead.country || '',
    companyLocation: backendLead.companyLocation || '',
    status: String(rawStatus).toLowerCase() as any,
    createdAt: backendLead.createdAt || new Date().toISOString(),
    createdBy,
    createdById,
    ownerId,
    updatedAt: backendLead.updatedAt || new Date().toISOString(),
    convertedAccountId: backendLead.convertedAccountId,
    convertedContactId: backendLead.convertedContactId,
    convertedDealId: backendLead.convertedDealId,
    customerLocation: backendLead.customerLocation,
    technologies: backendLead.technologies,
    prospectValue: backendLead.prospectValue,
    numberOfEmployees: backendLead.numberOfEmployees,
    decisionAuthority: backendLead.decisionAuthority,
  };
};

import { environment } from '@/lib/environment';

export const vpApi = {
  // Get managers under the logged-in VP
  getManagers: async (): Promise<{ data: UserDTO[]; total: number }> => {
    const response = await fetch(`${environment.apiURL}/sales-vp/managers`, {
      headers: getAuthHeaders()
    });
    return await handleApiResponse(response);
  },

  // Get executives under a specific manager
  getExecutivesUnderManager: async (managerId: number): Promise<{ data: UserDTO[]; total: number }> => {
    const response = await fetch(`${environment.apiURL}/sales-vp/managers/${managerId}/executives`, {
      headers: getAuthHeaders()
    });
    return await handleApiResponse(response);
  },

  // Get leads for a specific executive under the VP's hierarchy
  getLeadsForExecutive: async (executiveId: number, search?: string): Promise<{ data: LeadRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/executives/${executiveId}/leads?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend leads to frontend format
    const mappedData = data.data.map(mapBackendToLeadRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get leads for a specific manager under the VP's hierarchy
  getLeadsForManager: async (managerId: number, search?: string): Promise<{ data: LeadRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/managers/${managerId}/leads?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend leads to frontend format
    const mappedData = data.data.map(mapBackendToLeadRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get all leads under the VP's hierarchy
  getVPLeads: async (search?: string): Promise<{ data: LeadRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/leads?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend leads to frontend format
    const mappedData = data.data.map(mapBackendToLeadRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get VP's own leads
  getMyLeads: async (search?: string): Promise<{ data: LeadRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/my-leads?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend leads to frontend format
    const mappedData = data.data.map(mapBackendToLeadRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get contacts for a specific executive under the VP's hierarchy
  getContactsForExecutive: async (executiveId: number, search?: string): Promise<{ data: ContactRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/executives/${executiveId}/contacts?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend contacts to frontend format
    const mappedData = data.data.map(mapBackendToContactRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get contacts for a specific manager under the VP's hierarchy
  getContactsForManager: async (managerId: number, search?: string): Promise<{ data: ContactRow[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);

    const response = await fetch(`${environment.apiURL}/sales-vp/managers/${managerId}/contacts?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend contacts to frontend format
    const mappedData = data.data.map(mapBackendToContactRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get all contacts under the VP's hierarchy
  getVPContacts: async (search?: string, params?: { page?: number; size?: number }): Promise<{ data: ContactRow[]; total: number; page: number; size: number; totalElements?: number; totalPages?: number }> => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.append('q', search);
    if (params?.page !== undefined) urlParams.append('page', params.page.toString());
    if (params?.size !== undefined) urlParams.append('size', params.size.toString());

    const response = await fetch(`${environment.apiURL}/sales-vp/contacts?${urlParams}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend contacts to frontend format
    const mappedData = data.data.map(mapBackendToContactRow);

    return {
      ...data,
      data: mappedData
    };
  },

  // Get VP's own contacts
  getMyContacts: async (search?: string, params?: { page?: number; size?: number }): Promise<{ data: ContactRow[]; total: number; page: number; size: number; totalElements?: number; totalPages?: number }> => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.append('q', search);
    if (params?.page !== undefined) urlParams.append('page', params.page.toString());
    if (params?.size !== undefined) urlParams.append('size', params.size.toString());

    const response = await fetch(`${environment.apiURL}/sales-vp/my-contacts?${urlParams}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Map backend contacts to frontend format
    const mappedData = data.data.map(mapBackendToContactRow);

    return {
      ...data,
      data: mappedData
    };
  },
};