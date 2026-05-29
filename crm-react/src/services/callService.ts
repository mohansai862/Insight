import { logger } from '@/utils/logger';
import axios from 'axios';

const API_BASE_URL = 'http://30.0.1.159:8081/api/calls';

export interface CallRequest {
  agentExtension: string;
  customerNumber: string;
  contactId?: number;
  contactName?: string;
}

export interface CallResponse {
  callId: string;
  status: string;
  agentExtension: string;
  customerNumber: string;
  callStartTime?: string;
  callEndTime?: string;
  durationSeconds?: number;
  contactId?: number;
  contactName?: string;
  failureReason?: string;
  createdAt: string;
}

export interface CallStats {
  successfulCalls: number;
  totalCalls: number;
}

class CallService {
  private getAuthHeaders() {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const parsed = JSON.parse(session);
      return {
        'Authorization': `Bearer ${parsed.token || 'dummy-token'}`,
        'X-User-Id': parsed.id?.toString() || '',
        'X-User-Role': parsed.role || '',
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initiate a new call
   */
  async initiateCall(request: CallRequest): Promise<CallResponse> {
    try {
      logger.info('🔄 Initiating call:', request);
      
      const response = await axios.post(`${API_BASE_URL}/initiate`, request, {
        headers: this.getAuthHeaders()
      });
      
      logger.info('✅ Call initiated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('❌ Call initiation failed:', error);
      
      if (error.response?.data) {
        throw new Error(error.response.data);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to initiate call');
      }
    }
  }

  /**
   * Get call status by call ID
   */
  async getCallStatus(callId: string): Promise<CallResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/${callId}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get call status:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Call not found');
      } else if (error.response?.data) {
        throw new Error(error.response.data);
      } else {
        throw new Error('Failed to get call status');
      }
    }
  }

  /**
   * Get call history
   */
  async getCallHistory(contactId?: number): Promise<CallResponse[]> {
    try {
      const params = contactId ? { contactId } : {};
      
      const response = await axios.get(`${API_BASE_URL}/history`, {
        headers: this.getAuthHeaders(),
        params
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get call history:', error);
      
      if (error.response?.data) {
        throw new Error(error.response.data);
      } else {
        throw new Error('Failed to get call history');
      }
    }
  }

  /**
   * Update call status (for admin/system use)
   */
  async updateCallStatus(callId: string, status: string, failureReason?: string): Promise<CallResponse> {
    try {
      const params: any = { status };
      if (failureReason) {
        params.failureReason = failureReason;
      }
      
      const response = await axios.put(`${API_BASE_URL}/status/${callId}`, null, {
        headers: this.getAuthHeaders(),
        params
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to update call status:', error);
      
      if (error.response?.data) {
        throw new Error(error.response.data);
      } else {
        throw new Error('Failed to update call status');
      }
    }
  }

  /**
   * Get call statistics for current user
   */
  async getCallStats(): Promise<CallStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get call stats:', error);
      
      if (error.response?.data) {
        throw new Error(error.response.data);
      } else {
        throw new Error('Failed to get call statistics');
      }
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber.replace(/\s+/g, ''));
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Basic US number formatting
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber; // Return original if no formatting applied
  }
}

export const callService = new CallService();
