import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Settings API
 * API service for role-based settings operations
 */

export interface SettingsOption {
  key: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface SettingsData {
  role: string;
  options: SettingsOption[];
  timestamp: number;
}

// API Base URL - relative path for integrated setup
const API_BASE_URL = '';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '';
  let userRole = '';
  
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.userId || u.user_id || u.id || '';
      userRole = u.role || '';
    } catch (e) {
      logger.error('Error parsing session:', e);
    }
  }
  
  // Fallback to default values for testing
  if (!userId) {
    userId = '1';
  }
  if (!userRole) {
    userRole = 'sales_executive';
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': 'Bearer fake-token' }),
    'X-User-Id': userId,
    'X-User-Role': userRole,
  };
  
  return headers;
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    logger.error('Settings API Error:', response.status, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const settingsApi = {
  // Get settings for current user's role
  getCurrentUserSettings: async (): Promise<SettingsData> => {
    const response = await fetch(`${API_BASE_URL}/api/settings/current`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get settings for specific role (with access control)
  getSettingsByRole: async (role: string): Promise<SettingsData> => {
    const response = await fetch(`${API_BASE_URL}/api/settings/${role}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },
};
