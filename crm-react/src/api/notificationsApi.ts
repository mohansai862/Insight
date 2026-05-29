import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/notifications`;

const getAuthHeaders = () => {
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
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(userRole ? { 'X-User-Role': userRole } : {}),
  };
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export interface Notification {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getUserNotifications: async (): Promise<{ data: Notification[] }> => {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse(response);
    return { data };
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await fetch(`${API_BASE_URL}/count`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  markAsRead: async (notificationId: number) => {
    const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  clearAllNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/clear-all`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};