import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Auth API Service
 * API service functions for authentication
 */

import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/auth`;

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// Auth API service functions
export const authApi = {
  // Login user
  login: async (email: string, password: string): Promise<{ message: string; role: string; userId: number; token: string }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const result = await handleApiResponse(response);
    
    // Store JWT token and user info in localStorage with validation
    if (result.token && typeof result.token === 'string') {
      // Validate JWT format (header.payload.signature)
      const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
      if (jwtPattern.test(result.token)) {
        localStorage.setItem('authToken', result.token);
      } else {
        throw new Error('Invalid token format');
      }
    }
    
    // Store user info for headers
    if (result.userId) {
      localStorage.setItem('userId', result.userId.toString());
    }
    if (result.role) {
      localStorage.setItem('userRole', result.role);
    }
    
    // Also store in session format for compatibility
    const sessionData = {
      id: result.userId,
      role: result.role,
      email: result.email || '',
      firstName: result.firstName || '',
      lastName: result.lastName || '',
      fullName: result.fullName || `${result.firstName || ''} ${result.lastName || ''}`.trim()
    };
    localStorage.setItem('tech_tammina_session', JSON.stringify(sessionData));
    
    return result;
  },
  
  // Send forgot password OTP
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleApiResponse(response);
  },
  
  // Verify OTP
  verifyOtp: async (email: string, otp: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    return handleApiResponse(response);
  },
  
  // Reset password
  resetPassword: async (email: string, otp: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });
    return handleApiResponse(response);
  },
  
  // Get stored JWT token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
  
  // Remove JWT token and user info (logout)
  removeToken: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tech_tammina_session');
    localStorage.removeItem('tech_tammina_authenticated');
    localStorage.removeItem('tech_tammina_welcome_shown');
  },
  
  // Get authorization headers with user info
  getAuthHeaders: (): Record<string, string> => {
    const token = authApi.getToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      
      // Add user info from localStorage if available
      let userId = localStorage.getItem('userId');
      let userRole = localStorage.getItem('userRole');
      
      // Fallback: Check session data if userId/userRole not found
      if (!userId || !userRole) {
        const session = localStorage.getItem('tech_tammina_session');
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            if (!userId && sessionData.id) userId = sessionData.id.toString();
            if (!userRole && sessionData.role) userRole = sessionData.role;
          } catch (e) {
            logger.error('Error parsing session data:', e);
          }
        }
      }
      
      if (userId) headers['X-User-Id'] = userId;
      if (userRole) headers['X-User-Role'] = userRole;
    }
    
    return headers;
  },
};

