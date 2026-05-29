import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Leads API Service
 * API service functions for lead operations
 */

import type { LeadRow } from '@/modules/leads/LeadsManagement';
import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/leads`;

// Web Service Base URL for lead assignment operations
const WEB_API_BASE_URL = environment.apiURL.replace('/api', '/web');

// Leads API configured

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '1'; // Default fallback
  let userRole = 'Sales_Manager'; // Default fallback
  
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || u.userId || '1';
      userRole = u.role || 'Sales_Manager';
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
  
  // Auth headers prepared
  return headers;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    let errorDetails = '';
    
    try { 
      errorText = await response.text(); 
      // Try to parse JSON error response
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch {
        errorDetails = errorText;
      }
    } catch {}
    
    // Provide more specific error messages based on status code
    let errorMessage = '';
    switch (response.status) {
      case 400:
        errorMessage = errorDetails || 'Invalid data provided';
        break;
      case 401:
        errorMessage = 'Unauthorized - Please log in again';
        break;
      case 403:
        errorMessage = 'Access Denied - You do not have permission for this action';
        break;
      case 404:
        errorMessage = 'Not Found - The requested resource was not found';
        break;
      case 500:
        // Parse JSON error messages if they exist
        if (typeof errorDetails === 'string' && errorDetails.includes('{"errors":{')) {
          try {
            const parsed = JSON.parse(errorDetails.replace(/&quot;/g, '"'));
            if (parsed.errors) {
              // Format field errors into a readable message
              const fieldErrors = Object.entries(parsed.errors);
              errorMessage = fieldErrors.map(([field, message]) => `${field}: ${message}`).join(', ');
            } else {
              errorMessage = errorDetails || 'Server error - Please try again later';
            }
          } catch (parseError) {
            errorMessage = errorDetails || 'Server error - Please try again later';
          }
        } else {
          errorMessage = errorDetails || 'Server error - Please try again later';
        }
        break;
      case 502:
      case 503:
      case 504:
        errorMessage = 'Service temporarily unavailable - Please try again later';
        break;
      default:
        errorMessage = errorDetails || `API Error: ${response.status}`;
    }
    
    throw new Error(errorMessage);
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

// Helper function to extract numeric ID from string ID (handles prefixes like "seed_12")
const extractNumericId = (id: string): number | null => {
  if (!id) return null;

  // If it's already a number, return it
  if (!isNaN(Number(id))) return Number(id);

  // Extract numeric part from string with prefix (e.g., "seed_12" -> 12)
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

// Helper to map frontend Lead to backend LeadDTO
const mapLeadToBackend = (lead: any): any => {
  // Handle name: if firstName/lastName exist, use them; else split name
  let firstName = lead.firstName || '';
  let lastName = lead.lastName || '';
  if (!firstName && !lastName && lead.name) {
    const nameParts = lead.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ');
  }

  // LeadSource mapping (must match enum exactly)
  const sourceMap: { [key: string]: string } = {
    website: 'Website',
    email: 'Email', 
    campaign: 'Campaign',
    cold_call: 'Cold_Call',
    referral: 'Referral',
    event: 'Event',
    other: 'Other',
    // Handle capitalized versions
    Website: 'Website',
    Email: 'Email',
    Campaign: 'Campaign',
    Event: 'Event',
    Referral: 'Referral',
    Other: 'Other',
    // Handle direct enum values
    Cold_Call: 'Cold_Call',
  };
  const leadSource = sourceMap[lead.source] || lead.source || 'Website'; // Default to Website instead of Other
  // Source mapping for backend compatibility

  // LeadStatus mapping (must match enum exactly)
  const statusMap: { [key: string]: string } = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    unqualified: 'Unqualified',
    converted: 'Converted',
  };
  const leadStatus = statusMap[lead.status?.toLowerCase()] || 'New';

  // Use leadId if provided directly, otherwise extract from id
  const leadId = lead.leadId ? extractNumericId(lead.leadId) : extractNumericId(lead.id);

  const mappedLead = {
    id: leadId,
    firstName: firstName,
    lastName: lastName,
    companyName: lead.companyName ?? lead.company ?? lead.company_name ?? lead.Company ?? lead.organization ?? lead.accountName,
    designation: lead.designation,
    email: lead.email,
    countryCode: lead.countryCode || '+91',
    phoneNumber: lead.phoneNumber || lead.phone,
    linkedin: lead.linkedIn || lead.linkedin || '',
    industry: lead.industry,
    country: lead.country,
    companyLocation: lead.companyLocation || lead.city,
    status: leadStatus,
    source: leadSource,
    assignedToId: lead.ownerId ? parseInt(lead.ownerId) : null,
    // Only include conversion fields when actually converting
    ...(leadStatus === 'Converted' ? {
      convertedAccountId: lead.convertedAccountId,
      convertedContactId: lead.convertedContactId,
      convertedDealId: lead.convertedDealId,
    } : {}),
    customerLocation: lead.customerLocation || '',
    technologies: lead.technologies || '',
    prospectValue: lead.prospectValue || lead.value || null,
    numberOfEmployees: lead.numberOfEmployees || null,
    decisionAuthority: lead.decisionAuthority || '',
  };
  logger.info('🔍 mapLeadToBackend - Input:', lead);
  logger.info('🔍 mapLeadToBackend - Output:', mappedLead);
  logger.info('🔍 mapLeadToBackend - Special fields mapping:', {
    'input.customerLocation': lead.customerLocation,
    'output.customerLocation': mappedLead.customerLocation,
    'input.prospectValue': lead.prospectValue,
    'input.value': lead.value,
    'output.prospectValue': mappedLead.prospectValue,
    'input.decisionAuthority': lead.decisionAuthority,
    'output.decisionAuthority': mappedLead.decisionAuthority
  });
  return mappedLead;
};

// Helper to map backend LeadDTO to frontend LeadRow
const mapBackendToLeadRow = (backendLead: any): LeadRow => {
  // Resolve first/last name robustly
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

  // Support both leadId/id, leadSource/source, leadStatus/status from backend
  const rawId = backendLead.leadId ?? backendLead.id;
  const rawSource = backendLead.leadSource ?? backendLead.source ?? 'Website';
  const rawStatus = backendLead.leadStatus ?? backendLead.status ?? 'New';

  // Company name tolerant mapping (supports nested objects and various keys)
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

  // Backend may expose IDs directly or via nested objects; normalize both
  const createdById = (
    backendLead.createdById ?? backendLead.createdBy?.id ?? ''
  )?.toString?.() || '';
  const createdBy = backendLead.createdByName || backendLead.createdBy?.username || backendLead.createdBy?.email || 'System';
  const ownerId = (
    backendLead.assignedTo ?? backendLead.assignedToId ?? backendLead.assignedTo?.id ?? backendLead.ownerId ?? ''
  )?.toString?.() || '';

  // Convert backend enum to frontend format
  const sourceMap: { [key: string]: string } = {
    // Backend sends display format (with spaces)
    'Website': 'website',
    'Email': 'email',
    'Campaign': 'campaign',
    'Cold Call': 'cold_call',
    'Referral': 'referral',
    'Event': 'event',
    'Other': 'other',
    // Handle direct enum values (with underscores)
    'Cold_Call': 'cold_call',
    // Handle lowercase values
    'website': 'website',
    'email': 'email',
    'campaign': 'campaign',
    'cold_call': 'cold_call',
    'referral': 'referral',
    'event': 'event',
    'other': 'other',
  };
  const frontendSource = sourceMap[String(rawSource)] || 'other';
  // Source mapping completed

  return {
    id: rawId?.toString() || '',
    leadId: rawId?.toString() || '',
    source: frontendSource as any,
    firstName,
    lastName,
    companyName,
    designation: backendLead.designation || backendLead.title || '',
    email: backendLead.email || '',
    countryCode: backendLead.countryCode || '',
    phoneNumber: backendLead.phoneNumber || backendLead.phone || '',
    linkedIn: backendLead.linkedin || backendLead.linkedIn || '',
    industry: backendLead.industry || '',
    country: backendLead.country || '',
    companyLocation: backendLead.companyLocation || backendLead.city || '',
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
    reassignmentPending: backendLead.reassignmentPending || false,
  };
};

// API service functions
export const leadsApi = {
  // Export the mapping function for external use
  mapLeadToBackend,

  // Create a new lead
  create: async (data: any): Promise<{ data: LeadRow; success: boolean; message: string }> => {
    // Map all form data to backend format
    const backendData = mapLeadToBackend(data);
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToLeadRow(result),
      success: true,
      message: 'Lead created successfully',
    };
  },

  // Get all leads
  list: async (params?: { q?: string; page?: number; limit?: number; ownerId?: string; assignedToId?: string; createdById?: string; status?: string; source?: string; startDate?: string; endDate?: string; executive?: string }): Promise<{ data: LeadRow[]; pagination: any; success: boolean; message: string }> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('size', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.executive) searchParams.append('executive', params.executive);
    
    const appendNumeric = (key: string, val?: string) => {
      if (!val) return;
      const match = String(val).match(/(\d+)$/);
      const id = match ? match[1] : val;
      searchParams.append(key, id);
    };
    appendNumeric('ownerId', params?.ownerId);
    appendNumeric('assignedToId', params?.assignedToId);
    appendNumeric('createdById', params?.createdById);

    const url = `${API_BASE_URL}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(response);

    // Handle paginated response format from backend
    if (data && typeof data === 'object' && 'data' in data) {
      // Backend returns paginated format: { data: [], totalElements: 0, totalPages: 0, currentPage: 0, size: 10 }
      const mappedData = (data.data || []).map(mapBackendToLeadRow);
      return {
        data: mappedData,
        pagination: {
          page: data.currentPage || 0,
          limit: data.size || 10,
          total: data.totalElements || 0,
          totalPages: data.totalPages || 0,
          hasNext: data.hasNext || false,
          hasPrev: data.hasPrevious || false,
        },
        success: true,
        message: 'Leads retrieved successfully',
      };
    }

    // Fallback for array response
    const rawList = Array.isArray(data) ? data : [];
    const mappedData = rawList.map(mapBackendToLeadRow);

    return {
      data: mappedData,
      pagination: {
        page: params?.page || 0,
        limit: params?.limit || 10,
        total: mappedData.length,
        totalPages: Math.ceil(mappedData.length / (params?.limit || 10)),
        hasNext: false,
        hasPrev: false,
      },
      success: true,
      message: 'Leads retrieved successfully',
    };
  },

  // Get a single lead by ID
  get: async (id: string): Promise<{ data: LeadRow; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid lead ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);
    const mappedData = mapBackendToLeadRow(data);
    return {
      data: mappedData,
      success: true,
      message: 'Lead retrieved successfully',
    };
  },

  // Update a lead
  update: async (id: string, data: any): Promise<{ data: LeadRow; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid lead ID format');
    }
    const backendData = mapLeadToBackend(data);
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToLeadRow(result),
      success: true,
      message: 'Lead updated successfully',
    };
  },

  // Convert a lead by updating status to Converted and creating account/contact
  convertLead: async (id: string, conversionData?: any): Promise<{ data: any; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid lead ID format');
    }

    const headers = getAuthHeaders();
    // Ensure required fields are present
    const payload = {
      companyName: conversionData?.companyName || 'Unknown Company',
      contactName: conversionData?.contactName || 'Unknown Contact',
      contactEmail: conversionData?.contactEmail || '',
      ...conversionData
    };

    try {
      const response = await fetch(`${API_BASE_URL}/${numericId}/convert`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conversion failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        data: result,
        success: true,
        message: 'Lead converted successfully - Account and Contact created',
      };
    } catch (error: any) {
      throw error;
    }
  },


  // Delete a lead
  delete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid lead ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Lead deleted successfully',
    };
  },

  // Filter leads by executive (for Sales Managers)
  filterByExecutive: async (executiveId: number, q?: string): Promise<{ data: LeadRow[]; success: boolean; message: string }> => {
    const searchParams = new URLSearchParams();
    searchParams.append('executiveId', executiveId.toString());
    if (q) searchParams.append('q', q);

    const url = `${API_BASE_URL}/filterByExecutive?${searchParams.toString()}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(response);

    // Support various payload shapes: array | {data: []} | {content: []}
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.content)
      ? (data as any).content
      : [];

    const mappedData = rawList.map(mapBackendToLeadRow);

    return {
      data: mappedData,
      success: true,
      message: 'Leads filtered successfully',
    };
  },

  // Get all leads for manager (when no executive is selected)
  getManagerLeads: async (q?: string): Promise<{ data: LeadRow[]; success: boolean; message: string }> => {
    const searchParams = new URLSearchParams();
    if (q) searchParams.append('q', q);

    const url = `${API_BASE_URL}/manager-leads${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(response);

    // Support various payload shapes: array | {data: []} | {content: []}
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.content)
      ? (data as any).content
      : [];

    const mappedData = rawList.map(mapBackendToLeadRow);

    return {
      data: mappedData,
      success: true,
      message: 'Manager leads retrieved successfully',
    };
  },
  
  // Request reassignment of a lead (for Sales Executives)
  requestReassignment: async (id: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid lead ID format');
    }
    
    const response = await fetch(`${API_BASE_URL}/${numericId}/request-reassignment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    
    const result = await handleApiResponse(response);
    return {
      success: result.success || true,
      message: result.message || 'Reassignment request submitted successfully',
    };
  },
  
  // Get pending reassignment requests (for Sales Managers)
  getPendingReassignmentRequests: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/reassignment-requests/pending`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },
  
  // Get my pending reassignment requests (for Sales Executives)
  getMyPendingReassignmentRequests: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/reassignment-requests/my-pending`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },
  
  // Approve reassignment request (for Sales Managers)
  approveReassignmentRequest: async (requestId: number): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/lead-assignment/simple-approve-reassignment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ requestId }),
    });
    const result = await handleApiResponse(response);
    return {
      success: result.success || true,
      message: result.message || 'Request approved successfully',
    };
  },
  
  // Reject reassignment request (for Sales Managers)
  rejectReassignmentRequest: async (requestId: number): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/lead-assignment/simple-reject-reassignment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ requestId }),
    });
    const result = await handleApiResponse(response);
    return {
      success: result.success || true,
      message: result.message || 'Request rejected successfully',
    };
  },
  
  // Get leads for assignment (approved reassignment requests)
  getLeadsForAssignment: async (): Promise<{ data: LeadRow[]; success: boolean; message: string }> => {
    const response = await fetch(`${WEB_API_BASE_URL}/lead-assignment/unassigned`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse(response);
    
    // Support various payload shapes: array | {data: []} | {content: []}
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.content)
      ? (data as any).content
      : [];

    const mappedData = rawList.map(mapBackendToLeadRow);

    return {
      data: mappedData,
      success: true,
      message: 'Leads for assignment retrieved successfully',
    };
  },
  
  // Upload Excel file with leads
  uploadExcel: async (file: File): Promise<{ 
    success: boolean; 
    message: string; 
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    errors: string[];
    createdLeads: LeadRow[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const authHeaders = getAuthHeaders();
    // Remove Content-Type header to let browser set it with boundary for multipart
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;
    
    const response = await fetch(`${API_BASE_URL}/upload-excel`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });
    
    const result = await response.json(); // Don't use handleApiResponse as we want to handle errors differently
    
    if (!response.ok) {
      // Return the detailed error response from backend with clean messages
      return {
        success: false,
        message: result.message || 'Failed to upload Excel file',
        totalRecords: result.totalRecords || 0,
        successfulRecords: result.successfulRecords || 0,
        failedRecords: result.failedRecords || 1,
        errors: result.errors || [result.message || 'Upload failed'],
        createdLeads: [],
      };
    }
    
    return {
      success: result.success || true,
      message: result.message || 'Leads uploaded successfully',
      totalRecords: result.totalRecords || 0,
      successfulRecords: result.successfulRecords || 0,
      failedRecords: result.failedRecords || 0,
      errors: result.errors || [],
      createdLeads: (result.createdLeads || []).map(mapBackendToLeadRow),
    };
  },
};