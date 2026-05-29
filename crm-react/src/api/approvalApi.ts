/**
 * User Approval API functions
 */

import { authApi } from './authApi';
import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/signup`;

export interface PendingApproval {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  reportingTo: number;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const approvalApi = {
  // Get all pending approvals (for VPs/Admins)
  getAllPendingApprovals: async (): Promise<PendingApproval[]> => {
    const response = await fetch(`${API_BASE_URL}/pending-approvals`, {
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch pending approvals');
    return response.json();
  },

  // Get pending approvals for a specific manager
  getPendingApprovalsForManager: async (managerId: number): Promise<PendingApproval[]> => {
    const response = await fetch(`${API_BASE_URL}/pending-approvals/manager/${managerId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch pending approvals for manager');
    return response.json();
  },

  // Approve or reject a signup
  updateApprovalStatus: async (signupId: number, status: 'Approved' | 'Rejected'): Promise<PendingApproval> => {
    const response = await fetch(`${API_BASE_URL}/${signupId}/status?status=${status}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
    });
    if (!response.ok) throw new Error('Failed to update approval status');
    return response.json();
  },
};