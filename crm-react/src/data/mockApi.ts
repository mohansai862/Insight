/**
 * Tech Tammina CRM - Mock API Layer
 * Simulates real API with realistic latency and data
 */

import { mockData } from './mockData';
import type { 
  Lead, 
  Contact, 
  Deal, 
  Task, 
  DashboardMetric, 
  ChartData,
  ApiResponse,
  PaginatedResponse,
  CreateLeadData,
  UpdateLeadData,
  QueryFilters,
  Company
} from '@/types';

// Simulate network latency
const delay = (ms: number = 300 + Math.random() * 700) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper to simulate API errors occasionally
const shouldSimulateError = () => Math.random() < 0.05; // 5% chance

// Helper to filter and paginate data
const filterAndPaginate = <T>(
  data: T[],
  options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
    searchFields?: (keyof T)[];
  }
) => {
  let filtered = [...data];
  const { search, filters, page = 1, limit = 20, searchFields = [] } = options || {};

  // Apply search
  if (search && searchFields.length > 0) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(searchLower);
      })
    );
  }

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter(item => {
          const itemValue = (item as any)[key];
          return values.includes(itemValue);
        });
      }
    });
  }

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const mockApi = {
  // Dashboard endpoints
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetric[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch dashboard metrics');
    }

    return {
      data: mockData.dashboardMetrics,
      success: true,
      message: 'Dashboard metrics retrieved successfully',
    };
  },

  async getDashboardCharts(): Promise<ApiResponse<Record<string, ChartData>>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch dashboard charts');
    }

    return {
      data: mockData.chartData,
      success: true,
      message: 'Dashboard charts retrieved successfully',
    };
  },

  // Leads endpoints
  async getLeads(options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Lead[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch leads');
    }

    const result = filterAndPaginate(mockData.leads, {
      ...options,
      searchFields: ['name', 'email', 'company'],
    });

    return {
      ...result,
      success: true,
      message: 'Leads retrieved successfully',
    };
  },

  async getLead(id: string): Promise<ApiResponse<Lead>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch lead');
    }

    const lead = mockData.leads.find(l => l.id === id);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    return {
      data: lead,
      success: true,
      message: 'Lead retrieved successfully',
    };
  },

  async createLead(data: CreateLeadData): Promise<ApiResponse<Lead>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to create lead');
    }

    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: null,
      owner: mockData.users[0], // Assign to first user
    };

    // Add to mock data (in real app, this would be handled by backend)
    mockData.leads.unshift(newLead);

    return {
      data: newLead,
      success: true,
      message: 'Lead created successfully',
    };
  },

  async updateLead(id: string, data: UpdateLeadData): Promise<ApiResponse<Lead>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to update lead');
    }

    const leadIndex = mockData.leads.findIndex(l => l.id === id);
    
    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }

    const updatedLead: Lead = {
      ...mockData.leads[leadIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    mockData.leads[leadIndex] = updatedLead;

    return {
      data: updatedLead,
      success: true,
      message: 'Lead updated successfully',
    };
  },

  async deleteLead(id: string): Promise<ApiResponse<void>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to delete lead');
    }

    const leadIndex = mockData.leads.findIndex(l => l.id === id);
    
    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }

    mockData.leads.splice(leadIndex, 1);

    return {
      data: undefined,
      success: true,
      message: 'Lead deleted successfully',
    };
  },

  // Contacts endpoints
  async getContacts(options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Contact[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch contacts');
    }

    const result = filterAndPaginate(mockData.contacts, {
      ...options,
      searchFields: ['name', 'email', 'company'],
    });

    return {
      ...result,
      success: true,
      message: 'Contacts retrieved successfully',
    };
  },

  async getContact(id: string): Promise<ApiResponse<Contact>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch contact');
    }

    const contact = mockData.contacts.find(c => c.id === id);
    
    if (!contact) {
      throw new Error('Contact not found');
    }

    return {
      data: contact,
      success: true,
      message: 'Contact retrieved successfully',
    };
  },

  // Deals endpoints
  async getDeals(options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Deal[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch deals');
    }

    const result = filterAndPaginate(mockData.deals, {
      ...options,
      searchFields: ['name', 'company'],
    });

    return {
      ...result,
      success: true,
      message: 'Deals retrieved successfully',
    };
  },

  async getDeal(id: string): Promise<ApiResponse<Deal>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch deal');
    }

    const deal = mockData.deals.find(d => d.id === id);
    
    if (!deal) {
      throw new Error('Deal not found');
    }

    return {
      data: deal,
      success: true,
      message: 'Deal retrieved successfully',
    };
  },

  // Tasks endpoints
  async getTasks(options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Task[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch tasks');
    }

    // Extend filter to support createdById
    const result = filterAndPaginate(mockData.tasks, {
      ...options,
      searchFields: ['title', 'description'],
    });

    // Apply createdById filter manually if present
    const createdByIds = options?.filters?.createdById as string[] | undefined;
    let data = result.data;
    if (createdByIds && createdByIds.length > 0) {
      data = data.filter(t => createdByIds.includes((t as any).createdById || ''));
    }

    return {
      data,
      pagination: {
        ...result.pagination,
        total: data.length,
        totalPages: Math.ceil(data.length / (options?.limit || result.pagination.limit)),
      },
      success: true,
      message: 'Tasks retrieved successfully',
    } as any;
  },

  async getTask(id: string): Promise<ApiResponse<Task>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch task');
    }

    const task = mockData.tasks.find(t => t.id === id);
    
    if (!task) {
      throw new Error('Task not found');
    }

    return {
      data: task,
      success: true,
      message: 'Task retrieved successfully',
    };
  },

  async createTask(data: Partial<Task> & { title: string; type: Task['type']; priority: Task['priority']; status: Task['status']; ownerId: string; dueDate?: string; tags?: string[]; description?: string; relatedEntity?: Task['relatedEntity']; }): Promise<ApiResponse<Task>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to create task');
    }

    const owner = mockData.users.find(u => u.id === data.ownerId) || mockData.users[0];
    const createdBy = data.createdById ? (mockData.users.find(u => u.id === data.createdById) || mockData.users[0]) : undefined;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate || new Date().toISOString(),
      ownerId: data.ownerId,
      owner,
      createdById: data.createdById,
      createdBy,
      relatedEntity: data.relatedEntity,
      completedAt: undefined,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Task;

    mockData.tasks.unshift(newTask);

    return {
      data: newTask,
      success: true,
      message: 'Task created successfully',
    };
  },

  async updateTask(id: string, data: Partial<Task>): Promise<ApiResponse<Task>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to update task');
    }

    const index = mockData.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const owner = data.ownerId ? (mockData.users.find(u => u.id === data.ownerId) || mockData.users[0]) : mockData.tasks[index].owner;

    const updated: Task = {
      ...mockData.tasks[index],
      ...data,
      owner,
      updatedAt: new Date().toISOString(),
    } as Task;

    mockData.tasks[index] = updated;

    return {
      data: updated,
      success: true,
      message: 'Task updated successfully',
    };
  },

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to delete task');
    }

    const index = mockData.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    mockData.tasks.splice(index, 1);

    return {
      data: undefined as any,
      success: true,
      message: 'Task deleted successfully',
    };
  },

  // Companies (Accounts) endpoints
  async getCompanies(options?: {
    search?: string;
    filters?: QueryFilters;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Company[]>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to fetch companies');
    }

    const result = filterAndPaginate(mockData.companies, {
      ...options,
      searchFields: ['name', 'industry', 'website'],
    });

    return {
      ...result,
      success: true,
      message: 'Companies retrieved successfully',
    } as any;
  },

  async getCompany(id: string): Promise<ApiResponse<Company>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to fetch company');
    }

    const company = mockData.companies.find(c => c.id === id);

    if (!company) {
      throw new Error('Company not found');
    }

    return {
      data: company,
      success: true,
      message: 'Company retrieved successfully',
    };
  },

  async createCompany(data: Partial<Company> & { name: string }): Promise<ApiResponse<Company>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to create company');
    }

    const newCompany: Company = {
      id: `company_${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      revenue: data.revenue,
      address: data.address,
      contacts: [],
      deals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Company;

    mockData.companies.unshift(newCompany);

    return {
      data: newCompany,
      success: true,
      message: 'Company created successfully',
    };
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<ApiResponse<Company>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to update company');
    }

    const idx = mockData.companies.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error('Company not found');
    }

    const updated: Company = {
      ...mockData.companies[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    } as Company;

    mockData.companies[idx] = updated;

    return {
      data: updated,
      success: true,
      message: 'Company updated successfully',
    };
  },

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    await delay();

    if (shouldSimulateError()) {
      throw new Error('Failed to delete company');
    }

    const idx = mockData.companies.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error('Company not found');
    }

    mockData.companies.splice(idx, 1);

    return {
      data: undefined,
      success: true,
      message: 'Company deleted successfully',
    };
  },

  // Global search
  async globalSearch(query: string): Promise<ApiResponse<{
    leads: Lead[];
    contacts: Contact[];
    deals: Deal[];
    tasks: Task[];
  }>> {
    await delay(200); // Faster for search
    
    if (shouldSimulateError()) {
      throw new Error('Search failed');
    }

    const searchLower = query.toLowerCase();

    const leads = mockData.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.company && lead.company.toLowerCase().includes(searchLower))
    ).slice(0, 5);

    const contacts = mockData.contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower))
    ).slice(0, 5);

    const deals = mockData.deals.filter(deal =>
      deal.name.toLowerCase().includes(searchLower) ||
      (deal.company && deal.company.toLowerCase().includes(searchLower))
    ).slice(0, 5);

    const tasks = mockData.tasks.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower))
    ).slice(0, 5);

    return {
      data: { leads, contacts, deals, tasks },
      success: true,
      message: 'Search completed successfully',
    };
  },

  // Activities
  async getActivities(entityType?: string, entityId?: string): Promise<ApiResponse<any[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch activities');
    }

    // Mock activities - in real app, filter by entityType and entityId
    const activities = [
      {
        id: '1',
        type: 'email',
        title: 'Email sent',
        description: 'Follow-up email sent to prospect',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: mockData.users[0],
      },
      {
        id: '2',
        type: 'call',
        title: 'Phone call',
        description: 'Discovery call completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: mockData.users[1],
      },
    ];

    return {
      data: activities,
      success: true,
      message: 'Activities retrieved successfully',
    };
  },
};