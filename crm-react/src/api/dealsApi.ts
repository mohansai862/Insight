import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Deals API Service
 * API service functions for deal operations
 */

import type { Deal } from '@/types';
import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/deals`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '';
  let userRole = '';
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || '';
      const rawRole = (u.role || '').toString().toLowerCase();
      userRole =
        rawRole === 'it_admin' || rawRole === 'it admin' || rawRole === 'admin' || rawRole === 'administrator'
          ? 'IT_Admin'
          : rawRole === 'ceo' || rawRole === 'chief executive officer' || rawRole === 'chief executive'
          ? 'CEO'
          : rawRole === 'sales_vp' || rawRole === 'sales vp' || rawRole === 'vp_sales' || rawRole === 'vp sales' || rawRole === 'vp'
          ? 'Sales_VP'
          : rawRole === 'sales_manager' || rawRole === 'sales manager' || rawRole === 'manager' || rawRole === 'team_lead' || rawRole === 'team lead'
          ? 'Sales_Manager'
          : rawRole === 'sales_executive' || rawRole === 'sales executive' || rawRole === 'sales' || rawRole === 'rep'
          ? 'Sales_Executive'
          : (u.role || '');
    } catch {}
  }
  // If no role present, let backend default to Sales_Manager (do not send header)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(userRole ? { 'X-User-Role': userRole } : {}),
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  // Handle 204 No Content or empty body
  if (response.status === 204) return [];
  
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return [];
  
  try {
    const text = await response.text();
    if (!text.trim()) return [];
    return JSON.parse(text);
  } catch (error) {
    logger.error('Failed to parse response:', error);
    return [];
  }
};

// Helper function to extract numeric ID from string ID (handles prefixes like "deal_12")
const extractNumericId = (id: string): number | null => {
  if (!id) return null;

  // If it's already a number, return it
  if (!isNaN(Number(id))) return Number(id);

  // Extract numeric part from string with prefix (e.g., "deal_12" -> 12)
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

// Helper to map backend DealDTO to frontend Deal
export const mapBackendToDeal = (backendDeal: any): Deal => {
  // Debug logging
  logger.info('🔍 mapBackendToDeal - Input:', {
    dealName: backendDeal.dealName,
    accountName: backendDeal.accountName,
    createdBy: backendDeal.createdBy,
    account: backendDeal.account ? {
      accountId: backendDeal.account.accountId,
      accountName: backendDeal.account.accountName
    } : null
  });
  // Map backend stage enum values to frontend stage IDs
  const normalizeBackendStage = (stage: string): Deal['stage'] => {
    if (!stage) return 'qualified';
    const normalized = stage.toLowerCase().replace(/_/g, '').trim();
    switch (normalized) {
      case 'qualification':
        return 'qualified';
      case 'proposal':
        return 'proposal';
      case 'negotiation':
        return 'negotiation';
      case 'closedwon':
      case 'closed_won':
        return 'won';
      case 'closedlost':
      case 'closed_lost':
        return 'lost';
      default:
        return 'qualified'; // Default for unknown stages
    }
  };

  return {
    id: backendDeal.dealId?.toString() || backendDeal.id?.toString() || '',
    name: backendDeal.dealName || '',
    stage: normalizeBackendStage(backendDeal.stage),
    value: backendDeal.dealValue || 0,
    currency: 'INR', // Default currency
    // Use backend probability when available; fall back to 50 to preserve previous behavior
    probability: backendDeal.probability != null ? backendDeal.probability : 50,
    ownerId: (backendDeal.createdBy?.userId ?? backendDeal.createdBy ?? '').toString(),
    owner: backendDeal.createdBy
      ? {
          id: backendDeal.createdBy.userId?.toString() || '',
          name: `${backendDeal.createdBy.firstName || ''} ${backendDeal.createdBy.lastName || ''}`.trim() || backendDeal.createdBy.username || backendDeal.createdBy.email || 'System',
          email: backendDeal.createdBy.email || '',
          role: 'sales',
          department: 'Sales',
          isActive: true,
          createdAt: '',
          updatedAt: '',
          lastLoginAt: '',
        }
      : undefined,
    companyId: (backendDeal.account?.accountId ?? backendDeal.accountId ?? '').toString(),
    // Map company name directly from account for display purposes
    company: backendDeal.accountName || (backendDeal.account ? backendDeal.account.accountName : '') || '',
    companyObject: backendDeal.account
      ? {
          id: backendDeal.account.accountId?.toString() || '',
          name: backendDeal.account.accountName || '',
          website: backendDeal.account.website || '',
          industry: backendDeal.account.industry || '',
          size: '11-50', // Default size
          revenue: backendDeal.account.revenue || 0,
          address: undefined,
          contacts: [],
          deals: [],
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
    contactId: (backendDeal.contact?.contactId ?? backendDeal.contactId ?? '').toString(),
    contact: backendDeal.contact
      ? {
          id: backendDeal.contact.contactId?.toString() || '',
          name: `${backendDeal.contact.firstName || ''} ${backendDeal.contact.lastName || ''}`.trim(),
          email: backendDeal.contact.email || '',
          phoneNumber: backendDeal.contact.phoneNumber || '',
          companyId: backendDeal.contact.account?.accountId?.toString() || '',
          company: backendDeal.contact.account?.accountName || '',
          title: backendDeal.contact.designation || '',
          linkedin: backendDeal.contact.linkedin || '',
          type: 'primary',
          status: 'active',
          ownerId: backendDeal.contact.createdBy?.userId?.toString() || '',
          owner: backendDeal.contact.createdBy
            ? {
                id: backendDeal.contact.createdBy.userId?.toString() || '',
                name: `${backendDeal.contact.createdBy.firstName || ''} ${backendDeal.contact.createdBy.lastName || ''}`.trim() || backendDeal.contact.createdBy.username || backendDeal.contact.createdBy.email || 'System',
                email: backendDeal.contact.createdBy.email || '',
                role: 'sales',
                department: 'Sales',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                lastLoginAt: '',
              }
            : undefined,
          tags: [],
          notes: [],
          lastActivityAt: '',
          avatar: '',
          location: '',
          socialProfiles: [],
          customFields: {},
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
    // Map to existing frontend field; backend uses expectedCloseDate/closedDate
    closeDate: backendDeal.expectedCloseDate || backendDeal.closedDate || '',
    closedDate: backendDeal.closedDate || '',
    products: [], // Not provided by backend
    notes: [], // Not provided by backend
    activities: [], // Not provided by backend
    customFields: {},
    // Ensure loss remarks are surfaced to the UI
    remarks: backendDeal.remarks,
    leadName: backendDeal.leadName,
    createdAt: backendDeal.createdAt || new Date().toISOString(),
    updatedAt: backendDeal.updatedAt || null,
  };
};

// Normalize incoming frontend deal payload to backend DealDTO shape
const mapDealToBackend = (deal: any): any => {
  const normalizeStage = (s?: string): string | null => {
    if (!s) return null;
    const key = s.toString().trim().toLowerCase().replace(/\s+/g, '_');
    switch (key) {
      case 'qualified':
      case 'qualification':
        return 'Qualification';
      case 'proposal':
        return 'Proposal';
      case 'negotiation':
        return 'Negotiation';
      case 'won':
      case 'closed_won':
      case 'closed-won':
      case 'closedwon':
        return 'Closed_Won';
      case 'lost':
      case 'closed_lost':
      case 'closed-lost':
      case 'closedlost':
        return 'Closed_Lost';
      case 'prospecting':
        // No enum for Prospecting on backend; default to Qualification
        return 'Qualification';
      default:
        return 'Qualification';
    }
  };

  const toInt = (v: any): number | null => (v != null && v !== '' ? parseInt(v, 10) : null);

  const accountId = toInt(deal.accountId ?? deal.companyId ?? deal.company);
  logger.info('Mapping deal to backend:', {
    original: deal,
    accountId: accountId,
    companyField: deal.company,
    companyIdField: deal.companyId,
    accountIdField: deal.accountId,
  });

  const sessionUserId = (() => {
    try {
      const s = localStorage.getItem('tech_tammina_session');
      if (s) {
        const p = JSON.parse(s);
        return p.id;
      }
    } catch {}
    return null;
  })();

  return {
    dealName: deal.dealName ?? deal.name ?? '',
    dealValue: deal.dealValue ?? deal.value ?? 0,
    stage: normalizeStage(deal.stage),
    accountId: accountId,
    contactId: toInt(deal.contactId),
    probability: deal.probability ?? null,
    expectedCloseDate: deal.expectedCloseDate ?? deal.closeDate ?? null,
    closedDate: deal.closedDate ?? null,
    remarks: deal.remarks ?? null,
    createdBy: toInt(deal.createdBy ?? deal.ownerId ?? sessionUserId),
  };
};

// API service functions
export const dealsApi = {
  // Create a new deal
  create: async (data: any): Promise<{ data: Deal; success: boolean; message: string }> => {
    const backendData = mapDealToBackend(data);
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToDeal(result),
      success: true,
      message: 'Deal created successfully',
    };
  },

  // Get all deals
  list: async (params?: { q?: string; page?: number; limit?: number; filters?: any }): Promise<{ data: Deal[]; pagination: any; success: boolean; message: string }> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.filters?.accountId) {
        searchParams.append('accountId', params.filters.accountId.toString());
      }
      // Add sorting to get newest deals first
      searchParams.append('sort', 'createdAt,desc');
      
      const url = `${API_BASE_URL}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      // Fetching deals from API
      const response = await fetch(url, { headers: getAuthHeaders() });
      // Response received
      
      const data = await handleApiResponse(response);
      // Processing API response

      logger.info('🔍 Raw API response:', data);

      let rawList = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && Array.isArray(data.data)) {
        rawList = data.data;
      } else if (data && Array.isArray(data.content)) {
        rawList = data.content;
      }
      
      // Processing deals list

      const mappedData = rawList.map(mapBackendToDeal);
      logger.info('🔍 Mapped deals:', mappedData.map(d => ({ id: d.id, name: d.name, stage: d.stage })));
      
      // Sort by creation date (newest first) as fallback if backend doesn't sort
      const sortedData = mappedData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Data mapping completed

      return {
        data: sortedData,
        pagination: {
          page: 1,
          limit: 20,
          total: sortedData.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        success: true,
        message: 'Deals retrieved successfully',
      };
    } catch (error) {
      logger.error('❌ dealsApi.list error:', error);
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        success: false,
        message: 'Failed to retrieve deals',
      };
    }
  },

  // Get a single deal by ID
  get: async (id: string): Promise<{ data: Deal; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid deal ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse(response);
    return {
      data: mapBackendToDeal(data),
      success: true,
      message: 'Deal retrieved successfully',
    };
  },

  // Update a deal
  update: async (id: string, data: any): Promise<{ data: Deal; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid deal ID format');
    }
    // Normalize incoming payload to backend DealDTO shape (ensures proper stage mapping, etc.)
    const backendData = mapDealToBackend(data);
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToDeal(result),
      success: true,
      message: 'Deal updated successfully',
    };
  },

  // Delete a deal
  delete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid deal ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Deal deleted successfully',
    };
  },
};

