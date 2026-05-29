import axios from 'axios';

const API_BASE_URL = 'http://30.0.1.159:8081/api';

export interface Case {
  caseId?: number;
  caseNumber?: string;
  accountId: number;
  accountName?: string;
  contactId?: number;
  contactName?: string;
  subject: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: 'New' | 'InProgress' | 'PendingCustomer' | 'Resolved' | 'Closed' | 'Reopened';
  type: 'Question' | 'Problem' | 'Request' | 'Incident';
  category?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdById?: number;
  createdByName?: string;
  createdDate?: string;
  modifiedDate?: string;
  resolvedDate?: string;
  closedDate?: string;
  resolutionDetails?: string;
  resolutionType?: 'ProblemSolved' | 'InformationProvided' | 'WorkaroundProvided';
  relatedDealId?: number;
  relatedDealName?: string;
  escalationLevel?: number;
  comments?: CaseComment[];
}

export interface CaseComment {
  commentId?: number;
  caseId?: number;
  userId?: number;
  userName?: string;
  comment: string;
  isInternal?: boolean;
  createdDate?: string;
}

export interface KnowledgeBaseArticle {
  articleId?: number;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdById?: number;
  createdByName?: string;
  createdDate?: string;
  modifiedDate?: string;
  viewCount?: number;
  helpfulCount?: number;
  notHelpfulCount?: number;
}

export interface ServiceQueue {
  queueId?: number;
  queueName: string;
  description?: string;
  queueType?: string;
  isActive?: boolean;
}

class ServiceApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'X-User-Id': userId || '1',
      'X-User-Role': userRole || 'Sales_Manager'
    };
  }

  // Case Management APIs
  async createCase(caseData: Case): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCases(page = 0, size = 10, sortBy = 'createdDate', sortDir = 'desc', 
                status?: string, priority?: string, assignedTo?: number): Promise<{
    content: Case[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params: any = { page, size, sortBy, sortDir };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (assignedTo) params.assignedTo = assignedTo;

    const response = await axios.get(`${API_BASE_URL}/cases`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCaseById(id: number): Promise<Case> {
    const response = await axios.get(`${API_BASE_URL}/cases/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateCase(id: number, caseData: Case): Promise<Case> {
    const response = await axios.put(`${API_BASE_URL}/cases/${id}`, caseData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async assignCase(id: number, assigneeId: number): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/assign`, null, {
      params: { assigneeId },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async resolveCase(id: number, resolutionDetails: string, resolutionType?: string): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/resolve`, resolutionDetails, {
      params: resolutionType ? { resolutionType } : {},
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'text/plain' }
    });
    return response.data;
  }

  async closeCase(id: number): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/close`, null, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async reopenCase(id: number): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/reopen`, null, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async escalateCase(id: number): Promise<Case> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/escalate`, null, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async addComment(id: number, comment: CaseComment): Promise<CaseComment> {
    const response = await axios.post(`${API_BASE_URL}/cases/${id}/comments`, comment, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCasesByAccount(accountId: number): Promise<Case[]> {
    const response = await axios.get(`${API_BASE_URL}/cases/account/${accountId}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getMyCases(): Promise<Case[]> {
    const response = await axios.get(`${API_BASE_URL}/cases/my-cases`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Knowledge Base APIs
  async createArticle(article: KnowledgeBaseArticle): Promise<KnowledgeBaseArticle> {
    const response = await axios.post(`${API_BASE_URL}/kb`, article, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getArticles(page = 0, size = 10, status?: string): Promise<{
    content: KnowledgeBaseArticle[];
    totalElements: number;
    totalPages: number;
  }> {
    const params: any = { page, size };
    if (status) params.status = status;

    const response = await axios.get(`${API_BASE_URL}/kb`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getArticleById(id: number): Promise<KnowledgeBaseArticle> {
    const response = await axios.get(`${API_BASE_URL}/kb/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateArticle(id: number, article: KnowledgeBaseArticle): Promise<KnowledgeBaseArticle> {
    const response = await axios.put(`${API_BASE_URL}/kb/${id}`, article, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteArticle(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/kb/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async searchArticles(keyword: string): Promise<KnowledgeBaseArticle[]> {
    const response = await axios.get(`${API_BASE_URL}/kb/search`, {
      params: { keyword },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getArticlesByCategory(category: string): Promise<KnowledgeBaseArticle[]> {
    const response = await axios.get(`${API_BASE_URL}/kb/category/${category}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async markArticleHelpful(id: number): Promise<void> {
    await axios.post(`${API_BASE_URL}/kb/${id}/helpful`, null, {
      headers: this.getAuthHeaders()
    });
  }

  async markArticleNotHelpful(id: number): Promise<void> {
    await axios.post(`${API_BASE_URL}/kb/${id}/not-helpful`, null, {
      headers: this.getAuthHeaders()
    });
  }

  async getRelatedArticles(caseId: number): Promise<KnowledgeBaseArticle[]> {
    const response = await axios.get(`${API_BASE_URL}/kb/related/${caseId}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getKBCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/kb/categories`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}

export const serviceApi = new ServiceApi();