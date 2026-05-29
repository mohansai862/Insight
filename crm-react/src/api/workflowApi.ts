import axios from 'axios';

const API_BASE_URL = 'http://30.0.1.159:8081/api';

export interface WorkflowRule {
  ruleId?: number;
  ruleName: string;
  description?: string;
  entityType: 'Lead' | 'Contact' | 'Account' | 'Deal' | 'Case' | 'Task' | 'Activity' | 'Quote';
  isActive?: boolean;
  triggerType: 'OnCreate' | 'OnUpdate' | 'OnDelete' | 'OnFieldChange' | 'Scheduled' | 'Manual';
  triggerConditions?: string;
  executionOrder?: number;
  createdBy?: number;
  createdDate?: string;
  lastExecuted?: string;
  executionCount?: number;
  actions?: WorkflowAction[];
}

export interface WorkflowAction {
  actionId?: number;
  ruleId?: number;
  actionType: 'SendEmail' | 'CreateTask' | 'UpdateField' | 'SendNotification' | 'CallWebhook' | 'AssignRecord' | 'CreateRecord';
  actionSequence: number;
  actionConfig: string;
  delayMinutes?: number;
}

export interface WorkflowExecutionLog {
  logId?: number;
  ruleId?: number;
  entityId: number;
  entityType: string;
  executedDate?: string;
  status: 'Success' | 'Failed' | 'Pending';
  errorMessage?: string;
  executedBy?: string;
}

export interface EmailTemplate {
  templateId?: number;
  templateName: string;
  subject: string;
  body: string;
  placeholders?: string;
  templateType?: string;
  createdBy?: number;
  createdDate?: string;
  isActive?: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not equals' | 'contains' | 'starts with' | 'is empty' | 'is not empty' | 'greater than' | 'less than';
  value: string;
}

export interface WorkflowConditionGroup {
  logic: 'AND' | 'OR';
  conditions: WorkflowCondition[];
}

class WorkflowApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': userId || '1',
      'X-User-Role': userRole || 'Sales_Manager'
    };
  }

  // Workflow Management APIs
  async createWorkflow(workflow: WorkflowRule): Promise<WorkflowRule> {
    const response = await axios.post(`${API_BASE_URL}/workflows`, workflow, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getWorkflows(page = 0, size = 10, entityType?: string): Promise<{
    content: WorkflowRule[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params: any = { page, size };
    if (entityType) params.entityType = entityType;

    const response = await axios.get(`${API_BASE_URL}/workflows`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getWorkflowById(id: number): Promise<WorkflowRule> {
    const response = await axios.get(`${API_BASE_URL}/workflows/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateWorkflow(id: number, workflow: WorkflowRule): Promise<WorkflowRule> {
    const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, workflow, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workflows/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async activateWorkflow(id: number): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/activate`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deactivateWorkflow(id: number): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/deactivate`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async testWorkflow(id: number, testData: Record<string, any>): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/test`, testData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getExecutionLogs(page = 0, size = 20): Promise<{
    content: WorkflowExecutionLog[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await axios.get(`${API_BASE_URL}/workflows/logs`, {
      params: { page, size },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getWorkflowsByEntity(entityType: string): Promise<WorkflowRule[]> {
    const response = await axios.get(`${API_BASE_URL}/workflows/entity/${entityType}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getWorkflowTemplates(): Promise<Array<{
    name: string;
    description: string;
    entityType: string;
    triggerType: string;
  }>> {
    const response = await axios.get(`${API_BASE_URL}/workflows/templates`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async createFromTemplate(templateName: string): Promise<WorkflowRule> {
    const response = await axios.post(`${API_BASE_URL}/workflows/templates/${templateName}`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Email Template APIs
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const response = await axios.get(`${API_BASE_URL}/email-templates`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate> {
    const response = await axios.get(`${API_BASE_URL}/email-templates/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async createEmailTemplate(template: EmailTemplate): Promise<EmailTemplate> {
    const response = await axios.post(`${API_BASE_URL}/email-templates`, template, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateEmailTemplate(id: number, template: EmailTemplate): Promise<EmailTemplate> {
    const response = await axios.put(`${API_BASE_URL}/email-templates/${id}`, template, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/email-templates/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async previewEmailTemplate(id: number, mergeFields: Record<string, any>): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/email-templates/${id}/preview`, mergeFields, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getPlaceholders(entityType: string): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/email-templates/placeholders/${entityType}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getTemplatesByType(templateType: string): Promise<EmailTemplate[]> {
    const response = await axios.get(`${API_BASE_URL}/email-templates/types/${templateType}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Utility methods
  getEntityTypes(): string[] {
    return ['Lead', 'Contact', 'Account', 'Deal', 'Case', 'Task', 'Activity', 'Quote'];
  }

  getTriggerTypes(): string[] {
    return ['OnCreate', 'OnUpdate', 'OnDelete', 'OnFieldChange', 'Scheduled', 'Manual'];
  }

  getActionTypes(): string[] {
    return ['SendEmail', 'CreateTask', 'UpdateField', 'SendNotification', 'CallWebhook', 'AssignRecord', 'CreateRecord'];
  }

  getOperators(): Array<{ value: string; label: string }> {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'starts with', label: 'Starts With' },
      { value: 'is empty', label: 'Is Empty' },
      { value: 'is not empty', label: 'Is Not Empty' },
      { value: 'greater than', label: 'Greater Than' },
      { value: 'less than', label: 'Less Than' }
    ];
  }

  validateConditionGroup(conditionGroup: WorkflowConditionGroup): string[] {
    const errors: string[] = [];
    
    if (!conditionGroup.conditions || conditionGroup.conditions.length === 0) {
      errors.push('At least one condition is required');
    }
    
    conditionGroup.conditions.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (!condition.value && !['is empty', 'is not empty'].includes(condition.operator)) {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });
    
    return errors;
  }
}

export const workflowApi = new WorkflowApi();