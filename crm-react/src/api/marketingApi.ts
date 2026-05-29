/**
 * Tech Tammina CRM - Marketing API Service
 * API service for marketing analytics and campaign data
 */

import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/marketing`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export interface CampaignLead {
  id: number;
  name: string;
  email: string;
  message: string;
  subject?: string;
  source: 'HOMEPAGE_CONTACT' | 'CONTACT_PAGE';
  createdAt: string;
}

export interface CampaignAnalytics {
  totalLeads: number;
  recentLeads: CampaignLead[];
  sourceBreakdown: Record<string, number>;
  period: string;
}

export const marketingApi = {
  getRecentCampaigns: async (): Promise<CampaignAnalytics> => {
    const response = await fetch(`${API_BASE_URL}/recent-campaigns`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign analytics');
    }

    return response.json();
  },
};