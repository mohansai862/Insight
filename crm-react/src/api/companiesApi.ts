import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Companies API Service
 * API service functions for company operations
 */

import type { Company } from '@/types';
import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/accounts`;

const getAuthHeaders = (skipUserHeaders = false) => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');

  // Default values for testing when no session
  let userId = '1';
  let userRole = 'sales_manager';

  if (session) {
    try {
      const u = JSON.parse(session);
      if (u.id) userId = String(u.id);
      if (u.role) userRole = String(u.role);
    } catch {}
  }

  // Normalize roles coming from the session to what the backend expects
  const normalizedRole = (() => {
    const role = userRole?.toString().toLowerCase();
    switch (role) {
      case 'it_admin':
      case 'it admin':
      case 'admin':
      case 'administrator':
        return 'IT_ADMIN';
      case 'sales_vp':
      case 'sales vp':
      case 'vp_sales':
      case 'vp sales':
      case 'vp':
        return 'SALES_VP';
      case 'sales_manager':
      case 'sales manager':
      case 'manager':
      case 'team_lead':
      case 'team lead':
        return 'SALES_MANAGER';
      case 'sales_executive':
      case 'sales executive':
      case 'sales':
      case 'rep':
        return 'SALES_EXECUTIVE';
      default:
        // If no role or unrecognized, default to SALES_MANAGER for broader access
        return 'SALES_MANAGER';
    }
  })();



  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!skipUserHeaders ? { 'X-User-Id': userId } : {}),
    ...(!skipUserHeaders ? { 'X-User-Role': normalizedRole } : {}),
  };
};

// Helper function to extract numeric ID from string ID
const extractNumericId = (id: string): number => {
  // If ID is already a number, return it
  if (typeof id === 'number') return id;

  // Extract numeric part from string like "company_12" or "account_123"
  const match = id.toString().match(/\d+/);
  const numericId = match ? parseInt(match[0], 10) : 0;

  // Validate numeric ID extraction

  return numericId;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    // Try to parse detail message from backend (409, 500, etc.)
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      const message = json.message || json.error || text;
      throw new Error(`API Error: ${response.status} - ${message}`);
    } catch {
      throw new Error(`API Error: ${response.status} - ${text}`);
    }
  }
  // Handle 204 No Content and empty body
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

// Helper to map frontend form data to backend AccountDTO
const mapCompanyToBackend = (company: any): any => {
  return {
    accountName: company.accountName || company.name,
    industry: company.industry,
    country: company.country || company.address?.country || '',
    companyLocation: company.city || company.address?.city || '',
    contactOwner: company.contactOwner ? parseInt(company.contactOwner) : null,
    contactName: company.contactName,
    email: company.email,
    phoneNumber: company.phoneNumber,
    jobTitle: company.jobTitle,
    website: company.website,
    numberOfEmployees: company.numberOfEmployees ? parseInt(company.numberOfEmployees) : null,
    createdBy: company.createdBy ? parseInt(company.createdBy) : null,
  };
};

const mapBackendToCompany = (backendAccount: any): Company => {
  logger.info('🔄 Mapping backend account:', backendAccount);
  logger.info('   Website from backend:', backendAccount.website);
  logger.info('   CompanyLocation from backend:', backendAccount.companyLocation);
  
  const mapped = {
    id: backendAccount.accountId?.toString() || '',
    name: backendAccount.accountName || '',
    website: backendAccount.website || '',
    industry: backendAccount.industry || '',
    size: undefined,
    revenue: 0,
    numberOfEmployees: backendAccount.numberOfEmployees,
    companyLocation: backendAccount.companyLocation || '',
    address: {
      street: '',
      city: backendAccount.companyLocation || '',
      state: '',
      country: backendAccount.country || '',
      zipCode: '',
    },
    createdAt: backendAccount.createdAt || new Date().toISOString(),
    updatedAt: backendAccount.updatedAt || null,
    contactName: backendAccount.contactName,
    email: backendAccount.email,
    phoneNumber: backendAccount.phoneNumber,
    jobTitle: backendAccount.jobTitle,
    createdBy: backendAccount.createdBy,
    contactOwner: backendAccount.contactOwner,
  } as any;
  
  logger.info('   Mapped website:', mapped.website);
  logger.info('   Mapped companyLocation:', mapped.companyLocation);
  
  return mapped;
};

// API service functions
export const companiesApi = {
  // Create a new company
  create: async (data: any): Promise<{ data: Company; success: boolean; message: string }> => {
    try {
      const backendData = mapCompanyToBackend(data);
      logger.info('Creating account with data:', backendData);
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create account';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return {
        data: mapBackendToCompany(result),
        success: true,
        message: 'Account created successfully',
      };
    } catch (error: any) {
      logger.error('Account creation error:', error);
      throw error;
    }
  },

// Get all companies
list: async (params?: { q?: string; page?: number; limit?: number; filters?: any; ownerId?: string; createdById?: string }): Promise<{ data: Company[]; pagination: any; success: boolean; message: string }> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    // Add filters for industry or other fields if provided
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    // Add owner and creator filters like leads API
    if (params?.ownerId) {
      const match = String(params.ownerId).match(/(\d+)$/);
      const id = match ? match[1] : params.ownerId;
      searchParams.append('ownerId', id);
    }
    if (params?.createdById) {
      const match = String(params.createdById).match(/(\d+)$/);
      const id = match ? match[1] : params.createdById;
      searchParams.append('createdById', id);
    }

    const url = `${API_BASE_URL}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const headers = getAuthHeaders();
    
    logger.info('🔍 Fetching accounts from:', url);
    logger.info('📋 Request headers:', headers);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    logger.info('📦 Raw API response:', data);

    // Backend returns direct array of AccountDTO objects
    const mappedData = Array.isArray(data) ? data.map(mapBackendToCompany) : [];
    logger.info('🔄 Mapped companies:', mappedData.length, 'items');

    return {
      data: mappedData,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: mappedData.length,
        totalPages: Math.ceil(mappedData.length / (params?.limit || 20)),
        hasNext: false,
        hasPrev: false,
      },
      success: true,
      message: 'Companies retrieved successfully',
    };
  } catch (error) {
    logger.error('❌ Companies API error:', error);
    throw error;
  }
},

  // Get a single company by ID
  get: async (id: string): Promise<{ data: Company; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid company ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);
    return {
      data: mapBackendToCompany(data),
      success: true,
      message: 'Company retrieved successfully',
    };
  },

  // Update a company
  update: async (id: string, data: any): Promise<{ data: Company; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid company ID format');
    }
    const backendData = mapCompanyToBackend(data);
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToCompany(result),
      success: true,
      message: 'Company updated successfully',
    };
  },

  // Delete a company
  delete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid company ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Company deleted successfully',
    };
  },

  // Force delete a company (delete with associated records)
  forceDelete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid company ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}?force=true`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Company force deleted successfully',
    };
  },

  // Reassign company data to another company
  reassign: async (sourceId: string, targetId: string, options: { moveContacts?: boolean; deleteSource?: boolean }): Promise<{ data: undefined; success: boolean; message: string }> => {
    const sourceNumericId = extractNumericId(sourceId);
    const targetNumericId = extractNumericId(targetId);
    if (!sourceNumericId || !targetNumericId) {
      throw new Error('Invalid company ID format');
    }
    const searchParams = new URLSearchParams();
    if (options.moveContacts) searchParams.append('moveContacts', 'true');
    if (options.deleteSource) searchParams.append('deleteSource', 'true');
    
    const response = await fetch(`${API_BASE_URL}/${sourceNumericId}/reassign/${targetNumericId}?${searchParams.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Company data reassigned successfully',
    };
  },
};

