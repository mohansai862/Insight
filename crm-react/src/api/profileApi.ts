import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Profile API
 * API service for user profile operations
 */

export interface ProfileData {
  userId: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  fullName: string; // computed from firstName + lastName
  middleName?: string;
  countryCode?: string;
  phoneNumber?: string;
  gender?: string;
  // Fields missing in DB - will be null
  address?: string | null;
  companyLocation?: string | null;
  country?: string | null;
  department?: string | null;
  designation?: string | null;
  avatarUrl?: string | null;
  meta?: {
    missingFields: string[];
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  countryCode?: string;
}

// API Base URL - use web gateway for proper architectural flow
const API_BASE_URL = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '';
  let userRole = '';
  
  logger.info('Profile API - Session data:', session);
  
  if (session) {
    try {
      const u = JSON.parse(session);
      logger.info('Profile API - Parsed session:', u);
      // Get actual user ID from session - could be userId, user_id, or id
      userId = u.userId || u.user_id || u.id || '';
      userRole = u.role || '';
      logger.info('Profile API - Extracted userId:', userId, 'role:', userRole);
    } catch (e) {
      logger.error('Error parsing session:', e);
    }
  }
  
  // If no userId found, try to use a default for testing
  if (!userId) {
    logger.warn('No user ID found in session. Using default ID 1 for testing.');
    userId = '1'; // Default for testing when no session data
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(userRole ? { 'X-User-Role': userRole } : {}),
  };
  
  logger.info('Profile API - Final headers:', headers);
  return headers;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    logger.error('Profile API Error:', response.status, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  logger.info('Profile API - Parsed response:', data);
  return data;
};

export const profileApi = {
  // Get current user profile
  getCurrentProfile: async (): Promise<{ data: ProfileData }> => {
    const headers = getAuthHeaders();
    logger.info('Profile API - Making request to:', `${API_BASE_URL}/me`);
    logger.info('Profile API - Headers:', headers);
    
    // Add fake Authorization header if missing
    if (!headers.Authorization) {
      headers.Authorization = 'Bearer fake-token';
    }
    
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers
    });
    
    logger.info('Profile API - Response status:', response.status);
    const result = await handleApiResponse(response);
    logger.info('Profile API - Response data:', result);
    return result;
  },

  // Get user profile by ID
  getProfile: async (userId: string): Promise<{ data: ProfileData }> => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Update current user profile
  updateCurrentProfile: async (data: UpdateProfileData): Promise<{ data: ProfileData }> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  // Update user profile by ID
  updateProfile: async (userId: string, data: UpdateProfileData): Promise<{ data: ProfileData }> => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },
};
