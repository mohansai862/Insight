import { logger } from '@/utils/logger';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const session = localStorage.getItem('tech_tammina_session');
  let userId = '';
  let userRole = '';
  
  if (session) {
    try {
      const user = JSON.parse(session);
      userId = user.id || user.userId || '';
      userRole = user.role || '';
    } catch (e) {
      logger.error('Error parsing session:', e);
    }
  }
  
  return {
    'Authorization': `Bearer ${localStorage.getItem('authToken') || 'fake-token'}`,
    'X-User-Id': userId,
    'X-User-Role': userRole
  };
};

export const taskDocumentsApi = {
  list: async (taskId: string) => {
    const id = (() => {
      const n = Number(taskId);
      if (!isNaN(n)) return n;
      const m = taskId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid task ID');
    
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/documents`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('List documents failed');
    return res.json();
  },
  
  downloadUrl: (taskId: string, fileName: string) => {
    const id = (() => {
      const n = Number(taskId);
      if (!isNaN(n)) return n;
      const m = taskId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid task ID');
    return `${API_BASE_URL}/tasks/${id}/download-documentation?fileName=${encodeURIComponent(fileName)}`;
  },
  
  viewUrl: (taskId: string, fileName: string) => {
    const id = (() => {
      const n = Number(taskId);
      if (!isNaN(n)) return n;
      const m = taskId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid task ID');
    return `${API_BASE_URL}/tasks/${id}/view-documentation?fileName=${encodeURIComponent(fileName)}`;
  }
};