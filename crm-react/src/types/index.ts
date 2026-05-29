/**
 * Tech Tammina CRM - Type Definitions
 * Comprehensive type system for the CRM application
 */

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User & Authentication
export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export type UserRole = 'admin' | 'sales' | 'marketing' | 'support' | 'manager';

// Lead Management
export interface Lead extends BaseEntity {
  leadId?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  companyName?: string;
  title?: string;
  designation?: string;
  ownerId?: string;
  owner?: User | string;
  source?: LeadSource | string;
  leadSource?: string;
  status?: LeadStatus | string;
  leadStatus?: string;
  tags?: string[];
  score?: number;
  value?: number;
  prospectValue?: number;
  lastActivityAt?: string;
  notes?: Note[];
  customFields?: Record<string, any>;
  // Additional fields from backend
  countryCode?: string;
  linkedin?: string;
  industry?: string;
  country?: string;
  companyLocation?: string;
  customerLocation?: string;
  technologies?: string;
  numberOfEmployees?: number;
  decisionAuthority?: string;
  createdById?: number;
  assignedToId?: number;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmpid?: string;
  reassignmentPending?: boolean;
  convertedAccountId?: number;
  convertedContactId?: number;
  convertedDealId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type LeadSource =
  | 'website'
  | 'social_media'
  | 'referral'
  | 'cold_call'
  | 'email_campaign'
  | 'trade_show'
  | 'partner'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted'
  | 'lost';

// Contact Management
export interface Contact extends BaseEntity {
  contactId?: number;
  name?: string; // Computed from firstName + lastName
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  designation?: string; // Job title
  linkedin?: string;
  accountId?: number;
  companyName?: string; // Company name from account
  location?: string;
  reassignTo?: number;
  createdBy?: number;
  remarks?: string;
  type?: 'lead' | 'prospect' | 'customer' | 'partner' | 'vendor';
  status?: 'active' | 'inactive' | 'archived';
  createdByName?: string; // Owner name
  // Legacy fields for backward compatibility
  companyId?: string;
  company?: string;
  title?: string;
  ownerId?: string;
  owner?: User;
  tags?: string[];
  notes?: Note[];
  lastActivityAt?: string;
  avatar?: string;
  socialProfiles?: SocialProfile[];
  customFields?: Record<string, any>;
}

// Contact Row for UI display
export interface ContactRow {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  title?: string;
  type?: 'lead' | 'prospect' | 'customer' | 'partner' | 'vendor';
  status?: 'active' | 'inactive' | 'archived';
  createdAt: string;
  ownerId?: string;
  lastActivityAt?: string;
}

// Account is represented as Contact in this CRM system
export type Account = Contact;

export interface Company extends BaseEntity {
  name: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  revenue?: number;
  address?: Address;
  contacts?: Contact[];
  deals?: Deal[];
}

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1000+';

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  url: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

// Deal Management
export interface Deal extends BaseEntity {
  dealId?: number;
  accountId?: number;
  contactId?: number;
  dealName?: string;
  dealValue?: number;
  stage?: string;
  probability?: number;
  expectedCloseDate?: string;
  closedDate?: string;
  createdBy?: number;
  createdByName?: string;
  remarks?: string;
  accountName?: string;
  accountCompanyLocation?: string;
  accountCountry?: string;
  leadName?: string;
  // Legacy fields for backward compatibility
  id?: string;
  name?: string;
  value?: number;
  owner?: User;
  company?: string;
  contact?: Contact;
  closeDate?: string;
  description?: string;
  tags?: string[];
}

export type DealStage =
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Task & Activity Management
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  ownerId: string;
  owner?: User;
  // Creator (e.g., Sales Manager who assigned the task)
  createdById?: string;
  createdBy?: User;
  relatedEntity?: {
    id: string;
    type: 'lead' | 'contact' | 'deal' | 'company';
  };
  completedAt?: string;
  tags: string[];
}

export type TaskType = 'call' | 'email' | 'meeting' | 'todo' | 'follow_up';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Activity extends BaseEntity {
  type: ActivityType;
  title: string;
  description?: string;
  userId: string;
  user?: User;
  relatedEntity?: {
    id: string;
    type: 'lead' | 'contact' | 'deal' | 'company' | 'task';
  };
  metadata?: Record<string, any>;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task_created'
  | 'task_completed'
  | 'deal_created'
  | 'deal_updated'
  | 'lead_converted';

// Communication
export interface EmailThread extends BaseEntity {
  subject: string;
  participants: string[];
  messages: EmailMessage[];
  relatedEntity?: {
    id: string;
    type: 'lead' | 'contact' | 'deal' | 'company';
  };
  tags: string[];
}

export interface EmailMessage extends BaseEntity {
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  attachments: Attachment[];
  sentAt: string;
}

export interface CallLog extends BaseEntity {
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'busy' | 'no_answer';
  recordingUrl?: string;
  notes?: string;
  ownerId: string;
  owner?: User;
  relatedEntity?: {
    id: string;
    type: 'lead' | 'contact' | 'deal' | 'company';
  };
}

// Marketing
export interface Campaign extends BaseEntity {
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  audienceId?: string;
  audience?: Audience;
  content: CampaignContent;
  scheduleAt?: string;
  sentAt?: string;
  metrics: CampaignMetrics;
  ownerId: string;
  owner?: User;
}

export type CampaignType = 'email' | 'sms' | 'social' | 'webinar' | 'event';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'sms' | 'linkedin' | 'facebook' | 'twitter' | 'instagram';

export interface CampaignContent {
  subject?: string;
  body: string;
  templateId?: string;
  attachments?: Attachment[];
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

export interface Audience extends BaseEntity {
  name: string;
  description?: string;
  rules: AudienceRule[];
  contactCount: number;
  lastUpdatedAt: string;
}

export interface AudienceRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

// Support
export interface Ticket extends BaseEntity {
  subject: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  category?: string;
  requesterId: string;
  requester?: Contact;
  assigneeId?: string;
  assignee?: User;
  slaDue?: string;
  resolvedAt?: string;
  tags: string[];
  messages: TicketMessage[];
  attachments: Attachment[];
}

export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';

export interface TicketMessage extends BaseEntity {
  ticketId: string;
  authorId: string;
  author?: User | Contact;
  content: string;
  isInternal: boolean;
  attachments: Attachment[];
}

// Common
export interface Note extends BaseEntity {
  content: string;
  authorId: string;
  author?: User;
  relatedEntity?: {
    id: string;
    type: 'lead' | 'contact' | 'deal' | 'company' | 'task' | 'ticket';
  };
  isPinned: boolean;
}

export interface Attachment extends BaseEntity {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploader?: User;
}

// Integrations
export interface Integration extends BaseEntity {
  name: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  settings: Record<string, any>;
  lastSyncAt?: string;
  isEnabled: boolean;
}

export type IntegrationProvider =
  | 'google'
  | 'outlook'
  | 'twilio'
  | 'whatsapp'
  | 'slack'
  | 'stripe'
  | 'zapier'
  | 'hubspot'
  | 'salesforce';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

// Analytics & Reports
export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  period: string;
  format: 'number' | 'currency' | 'percentage';
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter & Search
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SearchFilters {
  query?: string;
  status?: string[];
  owner?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  customFields?: Record<string, any>;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// UI State
export interface TableState {
  page: number;
  limit: number;
  sortBy?: SortOption;
  filters: SearchFilters;
  selectedRows: string[];
  view: 'table' | 'grid' | 'kanban';
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}

// Theme & Settings
export interface ThemeSettings {
  mode: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface UserPreferences {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  types: {
    tasks: boolean;
    deals: boolean;
    leads: boolean;
    campaigns: boolean;
    tickets: boolean;
  };
}

export interface DashboardSettings {
  widgets: string[];
  layout: 'grid' | 'list';
  refreshInterval: number;
}
