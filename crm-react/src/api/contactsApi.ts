import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Contacts API Service
 * API service functions for contact operations
 */

import { companiesApi } from '@/api/companiesApi';
import type { Contact } from '@/types';
import { environment } from '@/lib/environment';

// API Base URL - dynamic environment configuration
const API_BASE_URL = `${environment.apiURL}/contacts`;

const getAuthHeaders = (skipUserHeaders = false) => {
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
    ...(!skipUserHeaders && userId ? { 'X-User-Id': userId } : {}),
    ...(!skipUserHeaders && userRole ? { 'X-User-Role': userRole } : {}),
  };
};

// Helper function to extract numeric ID from string ID
const extractNumericId = (id: string): number => {
  // If ID is already a number, return it
  if (typeof id === 'number') return id;

  // Extract numeric part from string like "contact_12" or "seed_123"
  const match = id.toString().match(/\d+/);
  const numericId = match ? parseInt(match[0], 10) : 0;

  // Validate numeric ID extraction

  return numericId;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// Helper to map frontend Contact to backend ContactDTO
// Accepts both shapes used across the app:
// 1) { firstName, lastName, email, phone, mobile, designation, linkedin, accountId, ownerId }
// 2) { name, email, phone, mobile, designation, linkedin, companyId, ownerId }
const mapContactToBackend = (contact: any): any => {
  // Prefer explicit first/last names; fallback to splitting name
  const hasExplicitNames = Boolean(contact.firstName || contact.lastName);
  const nameParts = (contact.name || '').toString().trim().split(' ').filter(Boolean);
  const firstName = contact.firstName || nameParts[0] || '';
  const lastName = contact.lastName || nameParts.slice(1).join(' ') || '';

  // Normalize account/company id expected by backend as accountId
  const rawAccountId = contact.accountId ?? contact.companyId;
  const accountId = rawAccountId != null && rawAccountId !== ''
    ? parseInt(rawAccountId, 10)
    : null;

  // Backend ContactDTO fields:
  return {
    firstName,
    lastName,
    email: contact.email ?? null,
    phoneNumber: contact.phoneNumber ?? null,
    designation: contact.designation ?? contact.title ?? null,
    linkedin: contact.linkedin ?? null,
    accountId, // REQUIRED by backend
    type: contact.type ?? 'lead',
    status: contact.status ?? 'active',
    remarks: contact.remarks ?? null,
    // Send createdBy; backend also supports contactOwner via other flows
    createdBy: contact.ownerId != null && contact.ownerId !== '' ? parseInt(contact.ownerId, 10) : null,
    reassignTo: contact.reassignTo != null && contact.reassignTo !== '' ? parseInt(contact.reassignTo, 10) : null,
  };
};

// Helper to map backend ContactDTO to frontend Contact
const mapBackendToContact = (backendContact: any): Contact => {
  return {
    id: backendContact.contactId?.toString() || '',
    firstName: backendContact.firstName || '',
    lastName: backendContact.lastName || '',
    name: `${backendContact.firstName || ''} ${backendContact.lastName || ''}`.trim(),
    email: backendContact.email || '',
    phoneNumber: backendContact.phoneNumber || '',
    countryCode: backendContact.countryCode || '+91',
    companyId: backendContact.accountId?.toString() || '',
    company: backendContact.companyName || backendContact.accountName || '', // Use companyName from backend ContactDTO
    companyName: backendContact.companyName || backendContact.accountName || '', // Add companyName field
    title: backendContact.designation || '',
    designation: backendContact.designation || '', // Add designation field
    linkedin: backendContact.linkedin,
    location: backendContact.location || '',
    type: backendContact.type || 'lead',
    status: backendContact.status || 'active',
    ownerId: backendContact.contactOwner?.toString() || backendContact.createdBy?.toString() || '',
    ownerName: backendContact.createdByName || '',
    owner: (backendContact.contactOwner || backendContact.createdBy) ? {
      id: (backendContact.contactOwner || backendContact.createdBy)?.toString() || '',
      name: backendContact.createdByName || 'System User',
      email: '',
      role: 'sales',
      department: 'Sales',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      lastLoginAt: '',
    } : undefined,
    tags: [],
    notes: [],
    remarks: backendContact.remarks || '',
    createdAt: backendContact.createdAt || new Date().toISOString(),
    updatedAt: backendContact.updatedAt || new Date().toISOString(),
    lastActivityAt: backendContact.updatedAt || backendContact.createdAt,
  };
};

// Helper function to enrich contacts with company names
const enrichContactsWithCompanyNames = async (contacts: Contact[]): Promise<Contact[]> => {
  // Get unique company IDs that need company names
  const companyIdsToFetch = contacts
    .filter(contact => contact.companyId && !contact.company)
    .map(contact => contact.companyId)
    .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

  if (companyIdsToFetch.length === 0) {
    return contacts;
  }

  try {
    // Fetch all companies
    const companiesResponse = await companiesApi.list();
    const companies = companiesResponse.data;

    // Create a map of company ID to company name
    const companyMap = new Map<string, string>();
    companies.forEach((company: any) => {
      companyMap.set(company.id, company.name);
    });

    // Enrich contacts with company names
    return contacts.map(contact => {
      if (contact.companyId && !contact.company) {
        const companyName = companyMap.get(contact.companyId);
        if (companyName) {
          return { ...contact, company: companyName };
        }
      }
      return contact;
    });
  } catch (error) {
    logger.error('Error fetching company names for contacts:', error);
    return contacts; // Return original contacts if enrichment fails
  }
};

// API service functions
export const contactsApi = {
  // Create a new contact
  create: async (data: any): Promise<{ data: Contact; success: boolean; message: string }> => {
    const backendData = mapContactToBackend(data);
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToContact(result),
      success: true,
      message: 'Contact created successfully',
    };
  },

  // Get all contacts
  list: async (params?: { q?: string; page?: number; limit?: number; filters?: any; ownerId?: string; createdById?: string }): Promise<{ data: Contact[]; pagination: any; success: boolean; message: string }> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.filters?.accountId) searchParams.append('accountId', params.filters.accountId.toString());
    
    // Add type and status filters
    if (params?.filters?.type && params.filters.type.length > 0) {
      params.filters.type.forEach((type: string) => {
        if (type) searchParams.append('type', type);
      });
    }
    if (params?.filters?.status && params.filters.status.length > 0) {
      params.filters.status.forEach((status: string) => {
        if (status) searchParams.append('status', status);
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
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(response);

    let mappedData = Array.isArray(data) ? data.map(mapBackendToContact) : [];

    // Apply client-side filtering for search if backend doesn't handle it
    if (params?.q && params.q.trim()) {
      const searchTerm = params.q.toLowerCase().trim();
      mappedData = mappedData.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
        (contact.company && contact.company.toLowerCase().includes(searchTerm)) ||
        (contact.phoneNumber && contact.phoneNumber.includes(searchTerm))
      );
    }

    // Enrich contacts with company names
    mappedData = await enrichContactsWithCompanyNames(mappedData);

    // Sort by last activity (updatedAt) in descending order - latest first
    mappedData.sort((a, b) => {
      const dateA = new Date(a.lastActivityAt || a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.lastActivityAt || b.updatedAt || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

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
      message: 'Contacts retrieved successfully',
    };
  },

  // Get a single contact by ID
  get: async (id: string): Promise<{ data: Contact; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid contact ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      headers: getAuthHeaders()
    });
    const data = await handleApiResponse(response);
    return {
      data: mapBackendToContact(data),
      success: true,
      message: 'Contact retrieved successfully',
    };
  },

  // Update a contact
  update: async (id: string, data: any): Promise<{ data: Contact; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid contact ID format');
    }
    const backendData = mapContactToBackend(data);
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToContact(result),
      success: true,
      message: 'Contact updated successfully',
    };
  },

  // Delete a contact
  delete: async (id: string): Promise<{ data: undefined; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid contact ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    return {
      data: undefined,
      success: true,
      message: 'Contact deleted successfully',
    };
  },

  // Update contact remarks
  updateRemarks: async (id: string, remarks: string): Promise<{ data: Contact; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid contact ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}/remarks`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });
    const result = await handleApiResponse(response);
    return {
      data: mapBackendToContact(result),
      success: true,
      message: 'Remarks updated successfully',
    };
  },

  // Get contact owner email for Outlook integration
  getOwnerEmail: async (id: string): Promise<{ ownerEmail: string; success: boolean; message: string }> => {
    const numericId = extractNumericId(id);
    if (!numericId) {
      throw new Error('Invalid contact ID format');
    }
    const response = await fetch(`${API_BASE_URL}/${numericId}/owner-email`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return {
      ownerEmail: result.ownerEmail,
      success: true,
      message: 'Owner email retrieved successfully',
    };
  },
};

// Get contact statistics based on account_id
export const getContactStats = async (id: string): Promise<{ data: { totalDeals: number; dealValue: number; accountId: number }; success: boolean; message: string }> => {
  const numericId = extractNumericId(id);
  if (!numericId) {
    throw new Error('Invalid contact ID format');
  }
  const response = await fetch(`${API_BASE_URL}/${numericId}/stats`, {
    headers: getAuthHeaders(),
  });
  const result = await handleApiResponse(response);
  return {
    data: result,
    success: true,
    message: 'Contact stats retrieved successfully',
  };
};