import { logger } from '@/utils/logger';
import { environment } from '@/lib/environment';

// API Base URL
const API_BASE_URL = `${environment.apiURL}/contracts`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '1';
  let userRole = 'Sales_Manager';
  
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || u.userId || '1';
      userRole = u.role || 'Sales_Manager';
    } catch (e) {
      logger.warn('Failed to parse session data:', e);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-User-Id': userId,
    'X-User-Role': userRole,
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { 
      errorText = await response.text(); 
      try {
        const errorJson = JSON.parse(errorText);
        errorText = errorJson.message || errorJson.error || errorText;
      } catch {}
    } catch {}
    
    let errorMessage = '';
    switch (response.status) {
      case 400:
        errorMessage = errorText || 'Invalid data provided';
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
        errorMessage = errorText || 'Server error - Please try again later';
        break;
      default:
        errorMessage = errorText || `API Error: ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) return null;
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return null;
  
  return response.json();
};

export interface Contract {
  contractId?: number;
  contractNumber: string;
  contractName: string;
  contractDate: string;
  startDate?: string;
  endDate?: string;
  contractValue?: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  clientName: string;
  description?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractsResponse {
  content: Contract[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  message?: string;
}

export interface ContractFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const contractsApi = {
  getContracts: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'contractDate',
    sortDir: string = 'desc',
    filters: ContractFilters = {}
  ): Promise<ContractsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    // Add filters if they exist and are not empty
    logger.info('Building API params with filters:', filters);
    
    if (filters.search?.trim()) {
      params.append('search', filters.search.trim());
      logger.info('Added search param:', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params.append('status', filters.status.trim());
      logger.info('Added status param:', filters.status.trim());
    }
    if (filters.startDate?.trim()) {
      // Ensure ISO date format
      const startDate = filters.startDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        params.append('startDate', startDate);
        logger.info('Added startDate param:', startDate);
      } else {
        logger.warn('Invalid startDate format:', startDate);
      }
    }
    if (filters.endDate?.trim()) {
      // Ensure ISO date format
      const endDate = filters.endDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        params.append('endDate', endDate);
        logger.info('Added endDate param:', endDate);
      } else {
        logger.warn('Invalid endDate format:', endDate);
      }
    }
    
    logger.info('Final API URL:', `${API_BASE_URL}?${params.toString()}`);

    const url = `${API_BASE_URL}?${params.toString()}`;
    logger.info('Making API request to:', url);
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    logger.info('API response status:', response.status);
    return handleApiResponse(response);
  },

  getContractById: async (id: number): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  createContract: async (contract: Omit<Contract, 'contractId'>): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contract)
    });
    return handleApiResponse(response);
  },

  updateContract: async (id: number, contract: Contract): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(contract)
    });
    return handleApiResponse(response);
  },

  deleteContract: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleApiResponse(response);
  },
};
