/**
 * Tech Tammina CRM - Reports API Service
 * Handles revenue analytics with candlestick chart data
 */

const API_BASE_URL = '/api/reports';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId') || '1';
  const userRole = localStorage.getItem('userRole') || 'Sales_Manager';
  
  // Also check session storage
  const session = localStorage.getItem('tech_tammina_session');
  let sessionUserId = userId;
  let sessionUserRole = userRole;
  if (session) {
    try {
      const u = JSON.parse(session);
      sessionUserId = u.id || userId;
      sessionUserRole = u.role || userRole;
    } catch {}
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : 'Bearer dummy-token',
    'X-User-Id': sessionUserId,
    'X-User-Role': sessionUserRole,
  };
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch {}
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  if (response.status === 204) return null as any;
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return null as any;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    try { return JSON.parse(text); } catch { return text as any; }
  }
  return response.json();
};

export const reportsApi = {
  sales: async (params?: { startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const url = `${API_BASE_URL}/sales${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  revenue: async (params?: { startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    qs.set('_t', Date.now().toString());
    const url = `${API_BASE_URL}/revenue?${qs.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  activities: async (params?: { startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const url = `${API_BASE_URL}/activities${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  salesExecutives: async (startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const url = `${API_BASE_URL}/sales-executives${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  managerRevenueBreakdown: async (startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const url = `${API_BASE_URL}/manager-revenue-breakdown${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  managerRevenue: async (managerId: number, startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams();
    qs.set('managerId', managerId.toString());
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    qs.set('_t', Date.now().toString());
    const url = `${API_BASE_URL}/manager-revenue?${qs.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
  executiveRevenue: async (executiveId: number, startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams();
    qs.set('executiveId', executiveId.toString());
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    qs.set('_t', Date.now().toString());
    const url = `${API_BASE_URL}/executive-revenue?${qs.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return { data, success: true };
  },
};