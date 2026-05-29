import { logger } from '@/utils/logger';
// API for deal documents (upload/list/download)

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

export const dealDocumentsApi = {
  uploadBatch: async (dealId: string, files: File[]) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    const headers = getAuthHeaders();
    delete headers['Content-Type'];
    const res = await fetch(`${API_BASE_URL}/deals/${id}/documents/batch`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      if (res.status === 409) {
        const errorData = await res.json();
        if (errorData.error === 'DUPLICATE_DOCUMENTS') {
          throw new Error(errorData.message || 'Some documents already exist');
        }
      }
      throw new Error('Batch upload failed');
    }
    return res.json();
  },
  upload: async (dealId: string, file: File) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const form = new FormData();
    form.append('file', file);
    const headers = getAuthHeaders();
    delete headers['Content-Type'];
    const res = await fetch(`${API_BASE_URL}/deals/${id}/documents`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      if (res.status === 409) {
        const errorData = await res.json();
        if (errorData.error === 'DUPLICATE_DOCUMENT') {
          throw new Error(errorData.message || 'Document already exists');
        }
      }
      throw new Error('Upload failed');
    }
    return res.json();
  },
  list: async (dealId: string) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const res = await fetch(`${API_BASE_URL}/deals/${id}/documents`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('List documents failed');
    return res.json();
  },
  downloadUrl: (dealId: string, documentId: number, fileIndex?: number) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const indexParam = fileIndex !== undefined ? `?fileIndex=${fileIndex}` : '';
    return `${API_BASE_URL}/deals/${id}/documents/${documentId}${indexParam}`;
  },
  viewUrl: (dealId: string, documentId: number, fileIndex?: number) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const indexParam = fileIndex !== undefined ? `?fileIndex=${fileIndex}` : '';
    return `${API_BASE_URL}/deals/${id}/documents/view/${documentId}${indexParam}`;
  },
  delete: async (dealId: string, documentId: number, fileIndex?: number) => {
    const id = (() => {
      const n = Number(dealId);
      if (!isNaN(n)) return n;
      const m = dealId.match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })();
    if (!id) throw new Error('Invalid deal ID');
    const url = fileIndex !== undefined 
      ? `${API_BASE_URL}/deals/${id}/documents/${documentId}?fileIndex=${fileIndex}`
      : `${API_BASE_URL}/deals/${id}/documents/${documentId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Delete failed');
    return res.ok;
  },
};
