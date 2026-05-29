/**
 * Authentication utilities
 */

import { clearAllPagination } from './pagination';

const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'authToken';
const SESSION_KEY = import.meta.env.VITE_SESSION_KEY || 'tech_tammina_session';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token');
  }
  // Sanitize token to prevent XSS
  const sanitizedToken = token.replace(/[<>"'&]/g, '');
  localStorage.setItem(AUTH_TOKEN_KEY, sanitizedToken);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const logout = (): void => {
  // Get user ID and role before clearing session
  const session = localStorage.getItem(SESSION_KEY);
  let userId = '';
  let userRole = '';
  
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = u.id || '';
      userRole = u.role || '';
    } catch {
      // Invalid session data
    }
  }
  
  // Clear form drafts immediately
  if (userId) {
    localStorage.removeItem(`contactFormDraft_${userId}`);
    localStorage.removeItem(`dealFormDraft_${userId}`);
    localStorage.removeItem(`taskForm_${userRole}_${userId}`);
    sessionStorage.removeItem(`taskForm_${userRole}_${userId}`);
    delete (window as any)[`taskFormBackup_taskForm_${userRole}_${userId}`];
  }
  
  // Clear pagination data
  clearAllPagination();
  
  // Clear authentication data
  removeAuthToken();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('tech_tammina_authenticated');
  
  // Redirect to login
  window.location.href = '/login';
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const session = localStorage.getItem(SESSION_KEY);
  let userId = '';
  let userRole = '';
  
  if (session) {
    try {
      const u = JSON.parse(session);
      userId = String(u.id || '').replace(/[^a-zA-Z0-9]/g, '');
      userRole = String(u.role || '').replace(/[^a-zA-Z_]/g, '');
    } catch {
      // Invalid session data
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(userRole ? { 'X-User-Role': userRole } : {}),
  };
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const session = localStorage.getItem(SESSION_KEY);
  return !!(token && session);
};

export const getCurrentUserId = (): string | null => {
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
    try {
      const u = JSON.parse(session);
      return u.id || null;
    } catch {
      return null;
    }
  }
  return null;
};