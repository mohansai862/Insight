/**
 * CEO API - Organization-wide access to all Sales VP data with filtering
 */

import { environment } from '@/lib/environment';
import { authApi } from './authApi';
import type { Lead, Contact, Deal, User, Account } from '@/types';

const API_BASE_URL = `${environment.apiURL}/ceo`;

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export interface CEOLeadsParams {
  q?: string;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  salesVpId?: number;
  managerId?: number;
  executiveId?: number;
}

export interface CEOContactsParams {
  q?: string;
  startDate?: string;
  endDate?: string;
  salesVpId?: number;
  managerId?: number;
  executiveId?: number;
}

export interface CEODealsParams {
  q?: string;
  salesVpId?: number;
  managerId?: number;
  executiveId?: number;
}

export interface CEOAccountsParams {
  q?: string;
  startDate?: string;
  endDate?: string;
  salesVpId?: number;
  managerId?: number;
  executiveId?: number;
}

export const ceoApi = {
  // Get all leads across organization with optional Sales VP filtering
  getLeads: async (params: CEOLeadsParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/leads?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get all deals across organization with optional Sales VP filtering
  getDeals: async (params: CEODealsParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/deals?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get all contacts across organization with hierarchical filtering
  getContacts: async (params: CEOContactsParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/contacts?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get dashboard counts for CEO
  getDashboardCounts: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/counts`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get all Sales VPs in the organization
  getSalesVPs: async (): Promise<{ data: User[]; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/sales-vps`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get managers under a specific Sales VP
  getManagersUnderSalesVP: async (salesVpId: number): Promise<{ data: User[]; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/sales-vps/${salesVpId}/managers`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get executives under a specific manager
  getExecutivesUnderManager: async (managerId: number): Promise<{ data: User[]; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/managers/${managerId}/executives`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get leads for a specific Sales VP
  getLeadsForSalesVP: async (salesVpId: number, params: Omit<CEOLeadsParams, 'salesVpId'> = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/sales-vps/${salesVpId}/leads?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get contacts for a specific Sales VP
  getContactsForSalesVP: async (salesVpId: number, params: Omit<CEOContactsParams, 'salesVpId'> = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/sales-vps/${salesVpId}/contacts?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get all accounts across organization with hierarchical filtering
  getAccounts: async (params: CEOAccountsParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/accounts?${queryParams}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get individual account details for CEO
  getAccountDetails: async (accountId: number) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get individual contact details for CEO
  getContactDetails: async (contactId: number) => {
    const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get individual lead details for CEO
  getLeadDetails: async (leadId: number) => {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
      headers: authApi.getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};