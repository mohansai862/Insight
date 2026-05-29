import axios from 'axios';

const API_BASE_URL = '/api';

export interface Email {
  emailId?: number;
  subject: string;
  body: string;
  fromAddress: string;
  toAddresses: string;
  ccAddresses?: string;
  bccAddresses?: string;
  sentDate?: string;
  receivedDate?: string;
  direction: 'Inbound' | 'Outbound';
  status?: 'Draft' | 'Sent' | 'Delivered' | 'Opened' | 'Bounced' | 'Failed';
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdBy?: number;
  hasAttachments?: boolean;
  emailThreadId?: string;
  openCount?: number;
  clickCount?: number;
  lastOpenedDate?: string;
}

export interface EmailTemplate {
  templateId?: number;
  templateName: string;
  templateCategory: string;
  subject: string;
  body: string;
  placeholders?: string;
  createdBy?: number;
  usageCount?: number;
  isActive?: boolean;
}

export interface EmailPage {
  content: Email[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const emailApi = {
  sendEmail: async (email: Email): Promise<Email> => {
    const response = await axios.post(`${API_BASE_URL}/emails/send`, email, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  saveDraft: async (email: Email): Promise<Email> => {
    const response = await axios.post(`${API_BASE_URL}/emails/draft`, email, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  getEmails: async (page = 0, size = 20): Promise<EmailPage> => {
    const response = await axios.get(`${API_BASE_URL}/emails?page=${page}&size=${size}`);
    return response.data;
  },

  getEmailById: async (id: number): Promise<Email> => {
    const response = await axios.get(`${API_BASE_URL}/emails/${id}`);
    return response.data;
  },

  getEmailsForEntity: async (entityType: string, entityId: number): Promise<Email[]> => {
    const response = await axios.get(`${API_BASE_URL}/emails/entity/${entityType}/${entityId}`);
    return response.data;
  },

  getInboxEmails: async (userEmail: string, page = 0, size = 20): Promise<EmailPage> => {
    const response = await axios.get(`${API_BASE_URL}/emails/inbox?userEmail=${userEmail}&page=${page}&size=${size}`);
    return response.data;
  },

  getSentEmails: async (page = 0, size = 20): Promise<EmailPage> => {
    const response = await axios.get(`${API_BASE_URL}/emails/sent?page=${page}&size=${size}`, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  getDraftEmails: async (): Promise<Email[]> => {
    const response = await axios.get(`${API_BASE_URL}/emails/drafts`, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  replyToEmail: async (id: number, replyEmail: Email): Promise<Email> => {
    const response = await axios.post(`${API_BASE_URL}/emails/${id}/reply`, replyEmail, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  deleteEmail: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/emails/${id}`);
  }
};

export const emailTemplateApi = {
  createTemplate: async (template: EmailTemplate): Promise<EmailTemplate> => {
    const response = await axios.post(`${API_BASE_URL}/email-templates`, template, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  getAllTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await axios.get(`${API_BASE_URL}/email-templates`);
    return response.data;
  },

  getTemplatesByCategory: async (category: string): Promise<EmailTemplate[]> => {
    const response = await axios.get(`${API_BASE_URL}/email-templates/category/${category}`);
    return response.data;
  },

  getTemplateCategories: async (): Promise<string[]> => {
    const response = await axios.get(`${API_BASE_URL}/email-templates/categories`);
    return response.data;
  },

  useTemplate: async (id: number, mergeFields: Record<string, any>): Promise<EmailTemplate> => {
    const response = await axios.post(`${API_BASE_URL}/email-templates/${id}/use`, mergeFields);
    return response.data;
  },

  getMergeFields: async (entityType: string, entityId: number): Promise<Record<string, any>> => {
    const response = await axios.get(`${API_BASE_URL}/email-templates/merge-fields/${entityType}/${entityId}`);
    return response.data;
  }
};

export const formatEmailDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  
  return date.toLocaleDateString();
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Draft': 'text-gray-600 bg-gray-100',
    'Sent': 'text-blue-600 bg-blue-100',
    'Delivered': 'text-green-600 bg-green-100',
    'Opened': 'text-purple-600 bg-purple-100',
    'Bounced': 'text-red-600 bg-red-100',
    'Failed': 'text-red-600 bg-red-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};