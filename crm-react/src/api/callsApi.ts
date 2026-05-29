import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/call`;

export interface CallRequest {
  salesExecutiveId: number;
  contactPhone: string;
  contactName: string;
  leadId?: number;
  dealId?: number;
  agentExtension?: string;
}

export interface Call {
  callId: number;
  salesExecutiveId: number;
  contactPhone: string;
  contactName: string;
  leadId?: number;
  dealId?: number;
  callDurationSeconds: number;
  callStatus: string;
  callNotes?: string;
  callStartTime: string;
  callEndTime?: string;
  createdAt: string;
}

export interface CallRecording {
  recordingId: number;
  callId: number;
  filePath: string;
  fileSizeBytes?: number;
  recordingDurationSeconds: number;
  recordingStatus: string;
  createdAt: string;
}

export const callsApi = {
  initiateCall: async (request: CallRequest) => {
    const response = await fetch(`${API_BASE_URL}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  getCallHistory: async (): Promise<Call[]> => {
    const response = await fetch(`${API_BASE_URL}/history`);
    return response.json();
  },

  getCallRecordings: async (callId: number): Promise<CallRecording[]> => {
    const response = await fetch(`${API_BASE_URL}/recordings/${callId}`);
    return response.json();
  },
};

// Legacy exports for compatibility
export const getCallsForExecutive = (executiveId: number) => {
  return { data: [] };
};

export const getCallsForManager = (managerId: number) => {
  return { data: [] };
};

export const getCallAnalytics = (executiveId: number, period: string = 'today') => {
  return { data: {} };
};

export const createCall = (data: any) => {
  return callsApi.initiateCall(data);
};

export const updateCall = (callId: number, data: any) => {
  return fetch(`${API_BASE_URL}/${callId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
};

export const startRecording = (callId: number) => {
  return fetch(`${API_BASE_URL}/${callId}/start-recording`, {
    method: 'POST'
  }).then(res => res.json());
};

export const stopRecording = (callId: number) => {
  return fetch(`${API_BASE_URL}/${callId}/stop-recording`, {
    method: 'POST'
  }).then(res => res.json());
};

export const uploadRecording = (callId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}/${callId}/upload-recording`, {
    method: 'POST',
    body: formData
  }).then(res => res.json());
};

export const getRecordings = (callId: number) => {
  return callsApi.getCallRecordings(callId);
};