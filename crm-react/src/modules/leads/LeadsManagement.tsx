import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Leads Management (Sales Department)
 * Futuristic, clean UI with glassmorphism and smooth animations
 * Requirements covered: table with search/sort/pagination, modal form with validation
 * Extended: Lead Details Drawer + Activities tracking with in-drawer Add Activity
*/

import { formatDateTime, formatCompactCurrency } from '@/utils';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  ChevronDown,
  Search,
  Loader2,
  Link as LinkIcon,
  MoreVertical,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { z } from 'zod';

import { leadsApi } from '@/api/leadsApi';
import { authApi } from '@/api/authApi';
import { getExecutives } from '@/api/salesManagerApi';
import { vpApi } from '@/api/vpApi';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomTimePicker from '@/components/ui/CustomTimePicker';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import Drawer from '@/components/ui/Drawer';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import NumberedPagination from '@/components/ui/NumberedPagination';
import ValidationErrorModal from '@/components/ui/ValidationErrorModal';
// import { users as mockUsers } from '@/data/mockData';
import { useActivities, useCreateActivity, useCreateLead, useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useApi';
import { useAppSelector } from '@/lib/store';
import { getCurrentRole, getCurrentUserId, can } from '@/utils/rbac';
import { clearOtherModulesPagination } from '@/utils/pagination';
import { phoneRules, getPhoneRule, getPhonePlaceholder } from '@/utils/phoneValidation';
// import type { User } from '@/types';
// Template is now served from public folder

// Lead type for this page
// Matches backend Lead entity
export type LeadRow = {
  id: string;  // primary key for frontend
  leadId: string;  // primary key from backend
  source: 'website' | 'email' | 'campaign' | 'cold_call' | 'referral' | 'event' | 'other';
  firstName: string;
  lastName: string;
  companyName: string;
  designation: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  linkedIn?: string;
  industry?: string;
  country: string;
  companyLocation?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';

  createdAt: string;
  createdBy?: string;  // user who created the lead (username/email)
  createdById?: string;
  ownerId?: string;
  assignedToId?: string;
  assignedToName?: string;  // name of assigned user
  updatedAt?: string;
  convertedAccountId?: number;
  convertedContactId?: number;
  convertedDealId?: number;
  customerLocation?: string;
  technologies?: string;
  prospectValue?: number;
  numberOfEmployees?: number;
  decisionAuthority?: string;
  reassignmentPending?: boolean;
};

const LeadsManagement: React.FC = () => {
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  // Activity types
  type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'task';

  interface LeadActivity {
    id: string;
    leadId: string;
    type: ActivityType;
    subject: string;
    description?: string;
    activityDate: string; // ISO
    status: 'pending' | 'completed';
  }

  const countries = ['India', 'United States', 'UK', 'Germany']; // static for now

  // Country code to country mapping
  const countryCodeMap: Record<string, string> = {
    '+91': 'India',
    '+1': 'United States',
    '+44': 'UK',
    '+49': 'Germany'
  };

  // Country to country code mapping
  const countryToCodeMap: Record<string, string> = {
    'India': '+91',
    'United States': '+1',
    'UK': '+44',
    'Germany': '+49'
  };

  const citiesByCountry: Record<string, string[]> = {
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Visakhapatnam'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dusseldorf', 'Dortmund'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle']
  };

  const leadFormSchema = z.object({
    source: z.enum(['website', 'email', 'campaign', 'cold_call', 'referral', 'event', 'other']),
    firstName: z.string().min(1, 'This field is required').refine((val) => /^[a-zA-Z\s]+$/.test(val), { message: 'First name cannot contain numbers or special characters' }),
    lastName: z.string().min(1, 'This field  is required').refine((val) => /^[a-zA-Z\s]+$/.test(val), { message: 'Last name cannot contain numbers or special characters' }),
    companyName: z.string().min(1, 'This field  is required').refine((val) => val.trim().length > 0, { message: 'Company name cannot be empty or contain only spaces.' }).refine((val) => /[a-zA-Z0-9]/.test(val), { message: 'Company name must contain at least one letter or number' }).refine((val) => !/^[0-9\s]*$/.test(val), { message: 'Company name cannot contain only numbers' }),
    designation: z.string().min(1, 'This field  is required').refine((val) => /^[a-zA-Z0-9\s]+$/.test(val), { message: 'Designation cannot contain special characters' }),
    email: z.string().email('This field is required'),
    countryCode: z.string().optional(),
    phoneNumber: z.string().min(1, 'This field is required'),
    linkedIn: z
      .string()
      .optional()
      .refine((val) => !val || /^https?:\/\//i.test(val), { message: 'Enter a valid URL' }),
    industry: z.string().min(1, 'This field  is required').refine((val) => /^[a-zA-Z0-9\s&\-.,'\'()\[\]]+$/.test(val), { message: 'Industry can only contain letters, numbers, spaces, and special characters: & - . , \' ( ) [ ]' }),
    country: z.string().min(1, 'This field  is required'),
    companyLocation: z.string().min(1, 'This field  is required'),
    status: z.enum(['new', 'contacted', 'qualified', 'unqualified']),

    customerLocation: z.string().min(1, 'This field  is required').refine((val) => val.trim().length > 0, { message: 'This field cannot contain only spaces.' }),
    technologies: z.string().min(1, 'This field is required').refine((val) => val.trim().length > 0, { message: 'Technologies cannot be empty — comma and numbers allowed.' }).refine((val) => /[a-zA-Z]/.test(val), { message: 'Technologies must contain at least one letter.' }),
    prospectValue: z.coerce.number({ invalid_type_error: 'This field is required' }).positive('This field is required'),
    numberOfEmployees: z.coerce.number({ invalid_type_error: 'This field is required' }).positive('This field is required'),
    decisionAuthority: z.string().optional().refine((val) => !val || val.length <= 100, { message: 'Decision authority must be at most 100 characters' }),
  }).superRefine((obj, ctx) => {
    const cc = obj.countryCode || '+91';
    const rule = getPhoneRule(cc);
    const phone = (obj.phoneNumber || '').replace(/\D/g, '');
    if (phone && !rule.regex.test(phone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message, path: ['phoneNumber'] });
    }
  });

  type LeadFormValues = z.infer<typeof leadFormSchema>;

  type SortKey = 'createdAt' | 'status' | 'prospectValue' | 'name';

  type SortState = {
    key: SortKey;
    direction: 'asc' | 'desc';
  };

  // Activity form schema
  const activityFormSchema = z.object({
    type: z.enum(['call', 'meeting', 'email'], { required_error: 'Activity type is required' }),
    subject: z.string().min(1, 'This field is required'),
    description: z.string().optional(),
    activityDate: z.string().min(1, 'Date & time is required'),
  }).superRefine((data, ctx) => {
    if (data.activityDate) {
      const activityDateTime = new Date(data.activityDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activityDateOnly = new Date(activityDateTime.getFullYear(), activityDateTime.getMonth(), activityDateTime.getDate());

      // Check if date is in future
      if (activityDateOnly > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Activity date cannot be in the future',
          path: ['activityDate']
        });
      }

      // Check if time is in future for today's date
      if (activityDateOnly.getTime() === today.getTime() && activityDateTime > now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Activity time cannot be in the future',
          path: ['activityTime']
        });
      }
    }
  });

  type ActivityFormValues = z.infer<typeof activityFormSchema>;

  // Dynamic Lead Source Select with static options
  const DynamicLeadSourceSelect: React.FC<{ register: any; value?: string; onChange?: (value: string) => void }> = ({ register, value, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const sourceOptions = [
      { value: 'website', label: 'Website' },
      { value: 'email', label: 'Email' },
      { value: 'campaign', label: 'Campaign' },
      { value: 'cold_call', label: 'Cold Call' },
      { value: 'referral', label: 'Referral' },
      { value: 'event', label: 'Event' },
      { value: 'other', label: 'Other' },
    ];

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
        >
          <span>
            {sourceOptions.find(s => s.value === value)?.label || 'Select source'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
            <div className="p-2">
              {sourceOptions.map((source) => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => {
                    onChange?.(source.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${value === source.value ? 'bg-primary-50 text-primary-600' : ''
                    }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <input type="hidden" {...register('source')} value={value} />
      </div>
    );
  };
  // Local UI state
  const [isLeadModalOpen, setIsLeadModalOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<LeadRow | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(() => {
    const saved = localStorage.getItem('leadsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const perPage = 10;
  const [sort, setSort] = React.useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [sourceDropdownOpen, setSourceDropdownOpen] = React.useState(false);
  const [countryCodeDropdownOpen, setCountryCodeDropdownOpen] = React.useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = React.useState(false);
  const sourceDropdownModalRef = React.useRef<HTMLDivElement>(null);
  const countryCodeDropdownModalRef = React.useRef<HTMLDivElement>(null);
  const countryDropdownModalRef = React.useRef<HTMLDivElement>(null);

  // Save page to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('leadsPage', page.toString());
  }, [page]);

  // New filter states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [sourceFilter, setSourceFilter] = React.useState('All');
  const [managerFilter, setManagerFilter] = React.useState('All');
  const [executiveFilter, setExecutiveFilter] = React.useState('All');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [availableManagers, setAvailableManagers] = React.useState<{ userId: number, name: string }[]>([]);
  const [availableExecutives, setAvailableExecutives] = React.useState<{ userId: number, name: string }[]>([]);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();
  const normalizeSearchQuery = React.useCallback((value: string) => {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
  }, []);
  const normalizedSearchQuery = React.useMemo(
    () => normalizeSearchQuery(searchQuery),
    [searchQuery, normalizeSearchQuery]
  );
  const searchTokens = React.useMemo(
    () => (normalizedSearchQuery ? normalizedSearchQuery.split(' ') : []),
    [normalizedSearchQuery]
  );
  const apiSearchQuery = React.useMemo(
    () => searchTokens[0] || '',
    [searchTokens]
  );

  // Dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [vpDropdownOpen, setVpDropdownOpen] = React.useState(false);
  const [managerDropdownOpen, setManagerDropdownOpen] = React.useState(false);
  const [executiveDropdownOpen, setExecutiveDropdownOpen] = React.useState(false);
  const [executiveSearchMode, setExecutiveSearchMode] = React.useState(false);
  const [executiveSearchQuery, setExecutiveSearchQuery] = React.useState('');
  const [highlightedExecutiveIndex, setHighlightedExecutiveIndex] = React.useState(-1);
  const executiveItemRefs = React.useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const executiveInputRef = React.useRef<HTMLInputElement>(null);
  const managerItemRefs = React.useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const vpExecutiveItemRefs = React.useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [managerSearchMode, setManagerSearchMode] = React.useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = React.useState('');
  const [highlightedManagerIndex, setHighlightedManagerIndex] = React.useState(-1);
  const [vpExecutiveSearchMode, setVpExecutiveSearchMode] = React.useState(false);
  const [vpExecutiveSearchQuery, setVpExecutiveSearchQuery] = React.useState('');
  const [highlightedVpExecutiveIndex, setHighlightedVpExecutiveIndex] = React.useState(-1);
  const [ceoVpDropdownOpen, setCeoVpDropdownOpen] = React.useState(false);
  const [ceoVpSearchMode, setCeoVpSearchMode] = React.useState(false);
  const [ceoVpSearchQuery, setCeoVpSearchQuery] = React.useState('');
  const [highlightedCeoVpIndex, setHighlightedCeoVpIndex] = React.useState(-1);
  const [ceoManagerDropdownOpen, setCeoManagerDropdownOpen] = React.useState(false);
  const [ceoManagerSearchMode, setCeoManagerSearchMode] = React.useState(false);
  const [ceoManagerSearchQuery, setCeoManagerSearchQuery] = React.useState('');
  const [highlightedCeoManagerIndex, setHighlightedCeoManagerIndex] = React.useState(-1);
  const [ceoExecutiveDropdownOpen, setCeoExecutiveDropdownOpen] = React.useState(false);
  const [ceoExecutiveSearchMode, setCeoExecutiveSearchMode] = React.useState(false);
  const [ceoExecutiveSearchQuery, setCeoExecutiveSearchQuery] = React.useState('');
  const [highlightedCeoExecutiveIndex, setHighlightedCeoExecutiveIndex] = React.useState(-1);
  const [activityTypeDropdownOpen, setActivityTypeDropdownOpen] = React.useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const sourceDropdownRef = React.useRef<HTMLDivElement>(null);
  const vpDropdownRef = React.useRef<HTMLDivElement>(null);
  const managerDropdownRef = React.useRef<HTMLDivElement>(null);
  const executiveDropdownRef = React.useRef<HTMLDivElement>(null);
  const activityTypeDropdownRef = React.useRef<HTMLDivElement>(null);
  const ceoVpDropdownRef = React.useRef<HTMLDivElement>(null);
  const ceoManagerDropdownRef = React.useRef<HTMLDivElement>(null);
  const ceoExecutiveDropdownRef = React.useRef<HTMLDivElement>(null);

  // Legacy filter states for backward compatibility
  const [isDateFilterOpen, setIsDateFilterOpen] = React.useState(false);
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [appliedFromDate, setAppliedFromDate] = React.useState('');
  const [appliedToDate, setAppliedToDate] = React.useState('');
  const dateFilterRef = React.useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [selectedSource, setSelectedSource] = React.useState<string>('');

  // Sales Manager/VP filter state
  const currentRole = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const [selectedManager, setSelectedManager] = React.useState<number | null>(null);
  const [selectedExecutive, setSelectedExecutive] = React.useState<number | null>(null);
  const [selectedMyLeads, setSelectedMyLeads] = React.useState<boolean>(false);
  const [selectedVPLeads, setSelectedVPLeads] = React.useState<boolean>(false);
  const [managers, setManagers] = React.useState<{ userId: number; firstName: string; lastName: string; username: string }[]>([]);
  const [executives, setExecutives] = React.useState<{ userId: number; firstName: string; lastName: string; username: string }[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = React.useState(false);
  const [isLoadingExecutives, setIsLoadingExecutives] = React.useState(false);

  // Clear other modules' pagination when this module loads
  React.useEffect(() => {
    clearOtherModulesPagination('leadsPage');
  }, []);

  // Reset page when filters change (but not when returning from detail view)
  React.useEffect(() => {
    // Only reset if we're actually changing filters, not on component mount
    if (search || selectedExecutive || selectedManager || selectedMyLeads || selectedVPLeads || appliedFromDate || appliedToDate || selectedStatus || selectedSource || normalizedSearchQuery || statusFilter !== 'All' || sourceFilter !== 'All' || managerFilter !== 'All' || executiveFilter !== 'All' || startDate || endDate) {
      setPage(0);
      localStorage.setItem('leadsPage', '0');
    }
  }, [search, selectedExecutive, selectedManager, selectedMyLeads, selectedVPLeads, appliedFromDate, appliedToDate, selectedStatus, selectedSource, normalizedSearchQuery, statusFilter, sourceFilter, managerFilter, executiveFilter, startDate, endDate]);

  // Close date filter popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
      if (vpDropdownRef.current && !vpDropdownRef.current.contains(event.target as Node)) {
        setVpDropdownOpen(false);
        setVpExecutiveSearchMode(false);
        setVpExecutiveSearchQuery('');
        setHighlightedVpExecutiveIndex(-1);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target as Node)) {
        setManagerDropdownOpen(false);
        setManagerSearchMode(false);
        setManagerSearchQuery('');
        setHighlightedManagerIndex(-1);
      }
      if (executiveDropdownRef.current && !executiveDropdownRef.current.contains(event.target as Node)) {
        setExecutiveDropdownOpen(false);
        setExecutiveSearchMode(false);
        setExecutiveSearchQuery('');
        setHighlightedExecutiveIndex(-1);
      }
      if (activityTypeDropdownRef.current && !activityTypeDropdownRef.current.contains(event.target as Node)) {
        setActivityTypeDropdownOpen(false);
      }
      if (ceoVpDropdownRef.current && !ceoVpDropdownRef.current.contains(event.target as Node)) {
        setCeoVpDropdownOpen(false);
        setCeoVpSearchMode(false);
        setCeoVpSearchQuery('');
        setHighlightedCeoVpIndex(-1);
      }
      if (ceoManagerDropdownRef.current && !ceoManagerDropdownRef.current.contains(event.target as Node)) {
        setCeoManagerDropdownOpen(false);
        setCeoManagerSearchMode(false);
        setCeoManagerSearchQuery('');
        setHighlightedCeoManagerIndex(-1);
      }
      if (ceoExecutiveDropdownRef.current && !ceoExecutiveDropdownRef.current.contains(event.target as Node)) {
        setCeoExecutiveDropdownOpen(false);
        setCeoExecutiveSearchMode(false);
        setCeoExecutiveSearchQuery('');
        setHighlightedCeoExecutiveIndex(-1);
      }
      if (sourceDropdownModalRef.current && !sourceDropdownModalRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
      if (countryCodeDropdownModalRef.current && !countryCodeDropdownModalRef.current.contains(event.target as Node)) {
        setCountryCodeDropdownOpen(false);
      }
      if (countryDropdownModalRef.current && !countryDropdownModalRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (executiveDropdownOpen) {
          setExecutiveDropdownOpen(false);
          setExecutiveSearchMode(false);
          setExecutiveSearchQuery('');
          setHighlightedExecutiveIndex(-1);
        }
      }
    };

    if (isDateFilterOpen || statusDropdownOpen || sourceDropdownOpen || vpDropdownOpen || managerDropdownOpen || executiveDropdownOpen || activityTypeDropdownOpen || countryCodeDropdownOpen || countryDropdownOpen || ceoVpDropdownOpen || ceoManagerDropdownOpen || ceoExecutiveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDateFilterOpen, statusDropdownOpen, sourceDropdownOpen, vpDropdownOpen, managerDropdownOpen, executiveDropdownOpen, activityTypeDropdownOpen, countryCodeDropdownOpen, countryDropdownOpen, ceoVpDropdownOpen, ceoManagerDropdownOpen, ceoExecutiveDropdownOpen]);

  const [isFilteringLeads, setIsFilteringLeads] = React.useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<LeadRow | null>(null);

  // Activities state sourced from backend per selected lead
  const createActivity = useCreateActivity();
  const { data: activitiesData, refetch: refetchActivities } = useActivities({
    leadId: selectedLead?.id || selectedLead?.leadId
  });
  const activities: LeadActivity[] = React.useMemo(() => {
    const list = (activitiesData?.data || []).map((a: any) => ({
      id: a.activityId || a.id,
      leadId: a.leadId,
      type: (a.activityType || a.type || 'CALL').toLowerCase(), // Convert to lowercase for UI
      subject: a.subject,
      description: a.description,
      activityDate: a.activityDate,
      status: 'completed', // Default status since backend doesn't have status field
    }));
    return list as LeadActivity[];
  }, [activitiesData]);
  const [activityFilterType, setActivityFilterType] = React.useState<'all' | ActivityType>('all');
  const [activityFilterStatus, setActivityFilterStatus] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [activityPage, setActivityPage] = React.useState(1);
  const activitiesPerPage = 10;
  const [expandedActivityId, setExpandedActivityId] = React.useState<string | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);

  const [isRowActionsModalOpen, setIsRowActionsModalOpen] = React.useState(false);
  const [rowActionsLead, setRowActionsLead] = React.useState<LeadRow | null>(null);

  // Reassignment modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = React.useState(false);
  const [reassignReason, setReassignReason] = React.useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = React.useState(false);
  const [pendingReassignments, setPendingReassignments] = React.useState<Set<string>>(() => {
    const saved = localStorage.getItem('pendingReassignments');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Persist pending reassignments to localStorage
  React.useEffect(() => {
    localStorage.setItem('pendingReassignments', JSON.stringify(Array.from(pendingReassignments)));
  }, [pendingReassignments]);

  // Import preview state
  const [uploadPreview, setUploadPreview] = React.useState<any[] | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Validation error modal state
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isValidationErrorModalOpen, setIsValidationErrorModalOpen] = React.useState(false);

  const navigate = useNavigate();

  // Load initial leads with new filtering API
  const [isLoadingLeads, setIsLoadingLeads] = React.useState(true);
  const [apiLeads, setApiLeads] = React.useState<any[]>([]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Trigger reload through useEffect
    }, 300);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setPage(0);
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'source':
        setSourceFilter(value);
        break;
      case 'manager':
        setManagerFilter(value);
        setExecutiveFilter('All'); // Reset executive when manager changes
        setSelectedManager(value === 'All' ? '' : value); // Update selectedManager state
        break;
      case 'executive':
        setExecutiveFilter(value);
        setSelectedExecutive(value === 'All' ? null : parseInt(value)); // Update selectedExecutive state
        break;
    }
  };

  const handleDateRangeChange = (start: string, end: string) => {
    // Convert dd-mm-yyyy to yyyy-mm-dd for validation
    const convertToISO = (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    const startISO = convertToISO(start);
    const endISO = convertToISO(end);
    const today = new Date().toISOString().split('T')[0];

    if (startISO && startISO > today) {
      toast.error('Start date cannot be in the future');
      return;
    }

    if (endISO && endISO > today) {
      toast.error('End date cannot be in the future');
      return;
    }

    if (startISO && endISO && startISO > endISO) {
      toast.error('Start date cannot be greater than end date');
      return;
    }

    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };



  // Load filtered leads
  const loadFilteredLeads = React.useCallback(async () => {
    // Skip general filtering for Sales Manager and Sales VP roles
    if (currentRole === 'Sales_Manager' || currentRole === 'Sales_VP') {
      return;
    }

    setIsLoadingLeads(true);
    try {
      const { authApi } = await import('@/api/authApi');
      const params = new URLSearchParams();

      // Convert dd-mm-yyyy to yyyy-mm-dd for API
      const convertDateForAPI = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const [day, month, year] = dateStr.split('-');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch {
          return '';
        }
      };

      if (apiSearchQuery) params.append('search', apiSearchQuery);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      if (sourceFilter && sourceFilter !== 'All') params.append('source', sourceFilter);
      if (managerFilter && managerFilter !== 'All') params.append('manager', managerFilter);
      if (executiveFilter && executiveFilter !== 'All') params.append('executive', executiveFilter);
      if (startDate) params.append('startDate', convertDateForAPI(startDate));
      if (endDate) params.append('endDate', convertDateForAPI(endDate));
      params.append('page', page.toString());
      params.append('size', perPage.toString());

      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': getCurrentUserId()?.toString() || '1',
          'X-User-Role': getCurrentRole() || 'Sales_Executive',
          ...authApi.getAuthHeaders()
        }
      });

      if (response.ok) {
        const result = await response.json();
        const newLeads = result.data || [];

        setApiLeads(newLeads);
        console.log('🔍 DEBUG: First lead data:', newLeads[0]);
        console.log('🔍 DEBUG: Lead with no assignment:', newLeads.find(l => !l.assignedTo));

        // Get current pending reassignments from localStorage for persistence
        const savedPending = localStorage.getItem('pendingReassignments');
        const currentPendingIds = savedPending ? new Set(JSON.parse(savedPending)) : new Set();

        setRows(newLeads.length > 0 ? newLeads.map((l: any, idx: number) => {
          const nameParts = typeof l.name === 'string' ? l.name.trim().split(/\s+/) : [];
          const firstName = (l.firstName && String(l.firstName).trim()) || nameParts[0] || '';
          const lastName = (l.lastName && String(l.lastName).trim()) || nameParts.slice(1).join(' ') || '';
          const src: LeadRow['source'] = l.source || 'other';
          const leadId = (l.leadId || l.id || `seed_${idx}`) as string;
          const assignedToId = (l.assignedToId ?? l.assignedTo?.userId ?? l.assignedTo?.id ?? '')?.toString?.() || '';
          const currentUserIdStr = currentUserId?.toString() || '';
          const isCurrentOwner = Boolean(assignedToId && currentUserIdStr && assignedToId === currentUserIdStr);
          const backendPending = l.reassignmentPending === true || l.reassignmentPending === 'true' || l.reassignmentPending === 1;

          // Check if this lead has pending reassignment from multiple sources
          const hasPendingReassignment = Boolean(
            backendPending ||
            (!isCurrentOwner && (currentPendingIds.has(leadId) || pendingReassignments.has(leadId)))
          );

          return {
            id: leadId,
            leadId: leadId,
            source: src,
            firstName: firstName,
            lastName: lastName,
            companyName: l.companyName || l.company || '',
            designation: l.designation || l.title || '',
            email: l.email || '',
            countryCode: l.countryCode || '',
            phoneNumber: l.phoneNumber || '',
            linkedIn: l.linkedin || l.linkedIn || '',
            industry: l.industry || '',
            country: l.country || '',
            companyLocation: l.companyLocation || '',
            status: (String((l as any).status ?? (l as any).leadStatus ?? 'new').toLowerCase() as LeadRow['status']),
            createdAt: l.createdAt || new Date().toISOString(),
            createdBy: l.createdByName || l.createdBy?.username || l.createdBy?.email || '',
            createdById: l.createdById || '',
            ownerId: l.ownerId || '',
            assignedToId,
            assignedToName: l.createdByRole === 'Sales_Executive' ? (l.assignedTo || l.owner || '') : (l.owner || l.createdByName || ''),
            updatedAt: l.updatedAt || new Date().toISOString(),
            convertedAccountId: l.convertedAccountId,
            convertedContactId: l.convertedContactId,
            convertedDealId: l.convertedDealId,
            customerLocation: l.customerLocation,
            technologies: l.technologies,
            prospectValue: l.prospectValue,
            numberOfEmployees: l.numberOfEmployees,
            decisionAuthority: l.decisionAuthority,
            reassignmentPending: hasPendingReassignment,
          } as LeadRow;
        }) : []);

        setTotalElements(result.totalElements || 0);
        setTotalPages(result.totalPages || 0);
        setAvailableManagers(result.availableManagers || []);
        setAvailableExecutives(result.availableExecutives || []);

        logger.info('Leads loaded successfully:', newLeads.length);
      } else {
        const errorText = await response.text();
        logger.error('API response error:', response.status, errorText);
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to load filtered leads:', error);
      toast.error('Failed to load leads');
      setApiLeads([]);
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [apiSearchQuery, statusFilter, sourceFilter, managerFilter, executiveFilter, startDate, endDate, page, perPage, currentRole]);

  // Load leads when filters change - only for non-manager/VP roles
  React.useEffect(() => {
    if (currentRole !== 'Sales_Manager' && currentRole !== 'Sales_VP') {
      loadFilteredLeads();
    }
  }, [loadFilteredLeads, currentRole]);

  // Load pending reassignments on mount and periodically
  React.useEffect(() => {
    if (currentRole === 'Sales_Executive') {
      const checkPending = async () => {
        try {
          const response = await fetch('/api/leads/reassignment-requests/my-pending', {
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': getCurrentUserId()?.toString() || '1',
              'X-User-Role': getCurrentRole() || 'Sales_Executive',
              ...authApi.getAuthHeaders()
            }
          });

          if (response.ok) {
            const requests = await response.json();
            const pendingIds = new Set(requests.map((req: any) => req.leadId?.toString()));

            // Update both state and localStorage for persistence
            setPendingReassignments(pendingIds);
            localStorage.setItem('pendingReassignments', JSON.stringify(Array.from(pendingIds)));

            // Update rows to reflect pending status from backend
            setRows(prev => prev.map(row => ({
              ...row,
              reassignmentPending: pendingIds.has(row.id) || pendingIds.has(row.leadId)
            })));

            // Also update apiLeads to ensure consistency
            setApiLeads(prev => prev.map(lead => ({
              ...lead,
              reassignmentPending: pendingIds.has((lead.leadId || lead.id)?.toString())
            })));

            logger.info('Loaded pending reassignments:', Array.from(pendingIds));
          } else {
            logger.error('Failed to fetch pending reassignments:', response.status);
          }
        } catch (error) {
          logger.error('Failed to check pending reassignments:', error);
        }
      };

      checkPending();
      // Remove periodic checking to prevent overriding backend status
      // const interval = setInterval(checkPending, 15000);
      // return () => clearInterval(interval);
    }
  }, [currentRole, refreshKey]); // Add refreshKey as dependency

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Legacy API for backward compatibility
  const { data, isLoading, refetch } = useLeads({ limit: 100 });
  const legacyApiLeads = React.useMemo(() => data?.data || [], [data]);

  // Load executives for Sales_Manager
  React.useEffect(() => {
    if (currentRole === 'Sales_Manager' && currentUserId) {
      const loadExecutives = async () => {
        setIsLoadingExecutives(true);
        try {
          const response = await getExecutives();
          setExecutives(response.data.map((exec: any) => ({
            userId: exec.userId,
            firstName: exec.firstName || '',
            lastName: exec.lastName || '',
            username: exec.username || `${exec.firstName || ''} ${exec.lastName || ''}`.trim() || 'Unknown',
          })));
        } catch (error: any) {
          logger.error('Failed to load executives:', error);
          toast.error('Failed to load executives');
        } finally {
          setIsLoadingExecutives(false);
        }
      };
      loadExecutives();
    }
  }, [currentRole, currentUserId]);

  // Load managers for VP
  React.useEffect(() => {
    if (currentRole === 'Sales_VP') {
      const loadManagers = async () => {
        setIsLoadingManagers(true);
        try {
          const response = await vpApi.getManagers();
          setManagers(response.data.map((manager: any) => ({
            userId: manager.userId,
            firstName: manager.firstName || '',
            lastName: manager.lastName || '',
            username: manager.username || `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || 'Unknown',
          })));
        } catch (error) {
          logger.error('Failed to load managers:', error);
          toast.error('Failed to load managers');
        } finally {
          setIsLoadingManagers(false);
        }
      };
      loadManagers();
    }
  }, [currentRole]);

  // Load executives when manager is selected
  React.useEffect(() => {
    if (selectedManager && currentRole === 'Sales_VP') {
      const loadExecutives = async () => {
        setIsLoadingExecutives(true);
        try {
          const response = await vpApi.getExecutivesUnderManager(selectedManager);
          setExecutives(response.data.map((exec: any) => ({
            userId: exec.userId,
            firstName: exec.firstName || '',
            lastName: exec.lastName || '',
            username: exec.username || `${exec.firstName || ''} ${exec.lastName || ''}`.trim() || 'Unknown',
          })));
          setSelectedExecutive(null); // Reset executive selection
        } catch (error) {
          logger.error('Failed to load executives:', error);
          toast.error('Failed to load executives');
        } finally {
          setIsLoadingExecutives(false);
        }
      };
      loadExecutives();
    } else {
      setExecutives([]);
      setSelectedExecutive(null);
    }
  }, [selectedManager, currentRole]);

  // Reset executive selection when manager changes (like contacts module)
  React.useEffect(() => {
    if (currentRole === 'Sales_VP') {
      setSelectedExecutive(null);
      setExecutiveFilter('All');
    }
  }, [selectedManager, currentRole]);



  // Effect to load filtered leads when executive or search changes
  React.useEffect(() => {
    // Convert dd-mm-yyyy to yyyy-mm-dd for API
    const convertDateForAPI = (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    if (currentRole === 'Sales_Manager') {
      const loadFiltered = async () => {
        setIsFilteringLeads(true);
        try {
          // Use Sales Manager specific API endpoints
          let apiUrl = '/api/sales-manager/leads';
          if (selectedMyLeads) {
            apiUrl = '/api/sales-manager/my-leads';
            console.log('Using My Leads API for Manager:', apiUrl, 'selectedMyLeads:', selectedMyLeads);
          } else if (selectedVPLeads) {
            apiUrl = '/api/sales-manager/vp-leads';
            console.log('Using VP Leads API for Manager:', apiUrl, 'selectedVPLeads:', selectedVPLeads);
          } else if (selectedExecutive) {
            apiUrl = `/api/sales-manager/manager/executives/${selectedExecutive}/leads`;
          }

          const searchParams = new URLSearchParams({
            page: page.toString(),
            size: perPage.toString(),
            ...(apiSearchQuery && { q: apiSearchQuery }),
            ...(statusFilter && statusFilter !== 'All' && { status: statusFilter }),
            ...(sourceFilter && sourceFilter !== 'All' && { source: sourceFilter }),
            ...(startDate && { startDate: convertDateForAPI(startDate) }),
            ...(endDate && { endDate: convertDateForAPI(endDate) })
          });

          const token = localStorage.getItem('authToken');
          const session = localStorage.getItem('tech_tammina_session');
          const sessionData = session ? JSON.parse(session) : {};

          const response = await fetch(`${apiUrl}?${searchParams}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': sessionData.id || currentUserId,
              'X-User-Role': currentRole,
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          console.log('🔍 DEBUG Sales Manager: First lead data:', data.data?.[0]);
          console.log('🔍 DEBUG Sales Manager: Lead with no assignment:', data.data?.find((l: any) => !l.assignedTo));
          const mappedRows = (data.data || []).map((l: any, idx: number) => {
            const nameParts = typeof l.name === 'string' ? l.name.trim().split(/\s+/) : [];
            const firstName = (l.firstName && String(l.firstName).trim()) || nameParts[0] || '';
            const lastName = (l.lastName && String(l.lastName).trim()) || nameParts.slice(1).join(' ') || '';
            const src: LeadRow['source'] = l.source || l.leadSource || 'other';
            const assignedToId = (l.assignedToId ?? l.assignedTo?.userId ?? l.assignedTo?.id ?? '')?.toString?.() || '';

            return {
              id: (l.leadId || l.id || `seed_${idx}`) as string,
              leadId: (l.leadId || l.id || `seed_${idx}`) as string,
              source: src,
              firstName: firstName,
              lastName: lastName,
              companyName: l.companyName || l.company || '',
              designation: l.designation || l.title || '',
              email: l.email || '',
              phoneNumber: l.phoneNumber || '',
              linkedIn: l.linkedin || l.linkedIn || '',
              industry: l.industry || '',
              country: l.country || '',
              companyLocation: l.companyLocation || '',
              status: (String((l as any).status ?? (l as any).leadStatus ?? 'new').toLowerCase() as LeadRow['status']),
              createdAt: l.createdAt || new Date().toISOString(),
              createdBy: l.createdByName || l.createdBy?.username || l.createdBy?.email || '',
              createdById: l.createdById || '',
              ownerId: l.ownerId || '',
              assignedToId,
              assignedToName: l.createdByRole === 'Sales_Executive' ? (l.assignedTo || l.owner || '') : (l.owner || l.createdByName || ''),
              updatedAt: l.updatedAt || new Date().toISOString(),
              convertedAccountId: l.convertedAccountId,
              convertedContactId: l.convertedContactId,
              convertedDealId: l.convertedDealId,
              customerLocation: l.customerLocation,
              technologies: l.technologies,
              prospectValue: l.prospectValue,
              numberOfEmployees: l.numberOfEmployees,
              decisionAuthority: l.decisionAuthority,
              reassignmentPending: Boolean(l.reassignmentPending),
            } as LeadRow;
          });

          setRows(mappedRows);
          setTotalElements(data.totalElements || 0);
          setTotalPages(data.totalPages || 0);
        } catch (error) {
          logger.error('Failed to filter leads:', error);
          const errorMessage = (error as any).message || 'Failed to load leads';
          toast.error(errorMessage);
          setRows([]);
          setTotalElements(0);
          setTotalPages(0);
        } finally {
          setIsFilteringLeads(false);
        }
      };
      loadFiltered();
    } else if (currentRole === 'Sales_VP') {
      const loadFiltered = async () => {
        setIsFilteringLeads(true);
        try {
          const params = {
            page: page,
            limit: perPage,
            ...(apiSearchQuery && { q: apiSearchQuery }),
            ...(statusFilter && statusFilter !== 'All' && { status: statusFilter }),
            ...(sourceFilter && sourceFilter !== 'All' && { source: sourceFilter }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
          };

          let apiUrl = '/api/sales-vp/leads';
          if (selectedMyLeads) {
            apiUrl = '/api/sales-vp/my-leads';
            console.log('Using My Leads API:', apiUrl, 'selectedMyLeads:', selectedMyLeads);
          } else if (selectedExecutive) {
            apiUrl = `/api/sales-vp/executives/${selectedExecutive}/leads`;
          } else if (selectedManager) {
            apiUrl = `/api/sales-vp/managers/${selectedManager}/leads`;
          }
          console.log('Final API URL:', apiUrl, 'selectedMyLeads:', selectedMyLeads);

          const searchParams = new URLSearchParams({
            page: page.toString(),
            size: perPage.toString(),
            ...(apiSearchQuery && { q: apiSearchQuery }),
            ...(statusFilter && statusFilter !== 'All' && { status: statusFilter }),
            ...(sourceFilter && sourceFilter !== 'All' && { source: sourceFilter }),
            ...(startDate && { startDate: convertDateForAPI(startDate) }),
            ...(endDate && { endDate: convertDateForAPI(endDate) })
          });

          const token = localStorage.getItem('authToken');
          const session = localStorage.getItem('tech_tammina_session');
          const sessionData = session ? JSON.parse(session) : {};

          const response = await fetch(`${apiUrl}?${searchParams}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': sessionData.id || currentUserId,
              'X-User-Role': currentRole,
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          const mappedRows = (data.data || []).map((l: any, idx: number) => {
            const nameParts = typeof l.name === 'string' ? l.name.trim().split(/\s+/) : [];
            const firstName = (l.firstName && String(l.firstName).trim()) || nameParts[0] || '';
            const lastName = (l.lastName && String(l.lastName).trim()) || nameParts.slice(1).join(' ') || '';
            const src: LeadRow['source'] = l.source || l.leadSource || 'other';
            const assignedToId = (l.assignedToId ?? l.assignedTo?.userId ?? l.assignedTo?.id ?? '')?.toString?.() || '';

            return {
              id: (l.leadId || l.id || `seed_${idx}`) as string,
              leadId: (l.leadId || l.id || `seed_${idx}`) as string,
              source: src,
              firstName: firstName,
              lastName: lastName,
              companyName: l.companyName || l.company || '',
              designation: l.designation || l.title || '',
              email: l.email || '',
              phoneNumber: l.phoneNumber || '',
              linkedIn: l.linkedin || l.linkedIn || '',
              industry: l.industry || '',
              country: l.country || '',
              companyLocation: l.companyLocation || '',
              status: (String((l as any).status ?? (l as any).leadStatus ?? 'new').toLowerCase() as LeadRow['status']),
              createdAt: l.createdAt || new Date().toISOString(),
              createdBy: l.createdByName || l.createdBy?.username || l.createdBy?.email || '',
              createdById: l.createdById || '',
              ownerId: l.ownerId || '',
              assignedToId,
              assignedToName: l.createdByRole === 'Sales_Executive' ? (l.assignedTo || l.owner || '') : (l.owner || l.createdByName || ''),
              updatedAt: l.updatedAt || new Date().toISOString(),
              convertedAccountId: l.convertedAccountId,
              convertedContactId: l.convertedContactId,
              convertedDealId: l.convertedDealId,
              customerLocation: l.customerLocation,
              technologies: l.technologies,
              prospectValue: l.prospectValue,
              numberOfEmployees: l.numberOfEmployees,
              decisionAuthority: l.decisionAuthority,
              reassignmentPending: Boolean(l.reassignmentPending),
            } as LeadRow;
          });

          setRows(mappedRows);
          setTotalElements(data.totalElements || 0);
          setTotalPages(data.totalPages || 0);
        } catch (error) {
          logger.error('Failed to filter leads:', error);
          const errorMessage = (error as any).message || 'Failed to load leads';
          toast.error(errorMessage);
          setRows([]);
          setTotalElements(0);
          setTotalPages(0);
        } finally {
          setIsFilteringLeads(false);
        }
      };
      loadFiltered();
    } else {
      // For other roles, use the general filtered leads API
      loadFilteredLeads();
    }
  }, [selectedExecutive, selectedManager, selectedMyLeads, selectedVPLeads, normalizedSearchQuery, statusFilter, sourceFilter, startDate, endDate, currentRole, currentUserId, page]);

  const [rows, setRows] = React.useState<LeadRow[]>([]);

  // Initialize rows from new API or legacy data - only when no filters are applied
  const initialMapped = React.useMemo<LeadRow[]>(() => {
    // Don't use legacy data if any filters are applied
    const hasFilters = normalizedSearchQuery || statusFilter !== 'All' || sourceFilter !== 'All' || startDate || endDate;
    if (hasFilters && apiLeads.length === 0) {
      return [];
    }

    const sourceData = apiLeads.length > 0 ? apiLeads : legacyApiLeads;
    return sourceData.map((l: any, idx: number) => {
      const nameParts = typeof l.name === 'string' ? l.name.trim().split(/\s+/) : [];
      const firstName = (l.firstName && String(l.firstName).trim()) || nameParts[0] || '';
      const lastName = (l.lastName && String(l.lastName).trim()) || nameParts.slice(1).join(' ') || '';
      const src: LeadRow['source'] = l.source || 'other';
      const assignedToId = (l.assignedToId ?? l.assignedTo?.userId ?? l.assignedTo?.id ?? '')?.toString?.() || '';

      return {
        id: (l.leadId || l.id || `seed_${idx}`) as string,
        leadId: (l.leadId || l.id || `seed_${idx}`) as string,
        source: src,
        firstName: firstName,
        lastName: lastName,
        companyName: l.companyName || l.company || '',
        designation: l.designation || l.title || '',
        email: l.email || '',
        countryCode: l.countryCode || '',
        phoneNumber: l.phoneNumber || '',
        linkedIn: l.linkedin || l.linkedIn || '',
        industry: l.industry || '',
        country: l.country || '',
        companyLocation: l.companyLocation || '',
        status: (String((l as any).status ?? (l as any).leadStatus ?? 'new').toLowerCase() as LeadRow['status']),
        createdAt: l.createdAt || new Date().toISOString(),
        createdBy: l.createdByName || l.createdBy?.username || l.createdBy?.email || '',
        createdById: l.createdById || '',
        ownerId: l.ownerId || '',
        assignedToId,
        assignedToName: l.createdByRole === 'Sales_Executive' ? (l.assignedTo || l.owner || '') : (l.owner || l.createdByName || ''),
        updatedAt: l.updatedAt || new Date().toISOString(),
        convertedAccountId: l.convertedAccountId,
        convertedContactId: l.convertedContactId,
        convertedDealId: l.convertedDealId,
        customerLocation: l.customerLocation,
        technologies: l.technologies,
        prospectValue: l.prospectValue,
        numberOfEmployees: l.numberOfEmployees,
        decisionAuthority: l.decisionAuthority,
        reassignmentPending: Boolean(l.reassignmentPending),
      } as LeadRow;
    });
  }, [apiLeads, legacyApiLeads, normalizedSearchQuery, statusFilter, sourceFilter, startDate, endDate]);

  // Initialize rows once data loads - but only if not using role-specific filtering
  React.useEffect(() => {
    if (currentRole !== 'Sales_Manager' && currentRole !== 'Sales_VP') {
      setRows(initialMapped);
    }
  }, [initialMapped, currentRole]);



  // Lead form setup
  const {
    register,
    handleSubmit,
    reset,
    formState,
    setError,
    watch,
    setValue
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onChange',
    shouldFocusError: false,
    defaultValues: {
      source: 'website',
      status: 'new',
      country: 'India',
      countryCode: '+91',
    },
  });

  const { errors, isSubmitting, isDirty } = formState;
  const leadSubmitButtonRef = React.useRef<HTMLButtonElement>(null);
  const handleLeadFormError = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    requestAnimationFrame(() => {
      leadSubmitButtonRef.current?.focus();
    });
  };

  // Track form changes for unsaved changes detection
  React.useEffect(() => {
    if (isEditMode) {
      setHasUnsavedChanges(isDirty);
    }
  }, [isDirty, isEditMode]);

  // Watch country and countryCode to update city options and phone placeholder
  const watchedCountry = watch('country');
  const watchedCountryCode = watch('countryCode');
  const [availableCities, setAvailableCities] = React.useState<string[]>(citiesByCountry['India'] || []);

  React.useEffect(() => {
    if (watchedCountry && citiesByCountry[watchedCountry]) {
      setAvailableCities(citiesByCountry[watchedCountry]);
    } else {
      setAvailableCities([]);
    }
  }, [watchedCountry]);

  // Get phone rule for dynamic maxLength
  const phoneRule = getPhoneRule(watchedCountryCode || '+91');

  // Activity form setup
  const {
    register: registerActivity,
    handleSubmit: handleActivitySubmit,
    reset: resetActivity,
    watch: watchActivity,
    setValue: setActivityValue,
    formState: { errors: activityErrors, isSubmitting: isActivitySubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: 'call',
      activityDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    },
  });

  // Derived: filtered, sorted, paginated for leads
  const filtered = React.useMemo(() => {
    let result = rows;

    if (normalizedSearchQuery) {
      const tokens = searchTokens;
      result = result.filter((r) => {
        const fullName = `${r.firstName} ${r.lastName}`.trim().toLowerCase();
        const email = (r.email || '').toLowerCase();
        const company = (r.companyName || '').toLowerCase();

        const nameParts = fullName.split(' ').filter(Boolean);
        const nameMatch = tokens.length <= 1
          ? nameParts.some((p) => p.includes(normalizedSearchQuery))
          : (
            tokens.length <= nameParts.length &&
            tokens.every((t, i) => nameParts[i]?.startsWith(t))
          );

        const emailMatch = email.includes(normalizedSearchQuery);
        const companyMatch = company.includes(normalizedSearchQuery);

        return nameMatch || emailMatch || companyMatch;
      });
    }

    // For Sales Managers and Sales VP, filtering is done on the backend, so don't filter again
    if (currentRole !== 'Sales_Manager' && currentRole !== 'Sales_VP') {
      // Apply status filter first
      if (selectedStatus) {
        result = result.filter((r) => r.status.toLowerCase() === selectedStatus.toLowerCase());
      }

      // Apply source filter
      if (selectedSource) {
        result = result.filter((r) => r.source === selectedSource);
      }

      // Apply date filter second
      if (appliedFromDate || appliedToDate) {
        result = result.filter((r) => {
          const createdDate = new Date(r.createdAt);
          const createdYear = createdDate.getFullYear();
          const createdMonth = createdDate.getMonth();
          const createdDay = createdDate.getDate();

          if (appliedFromDate && appliedToDate) {
            const fromDate = new Date(appliedFromDate);
            const toDate = new Date(appliedToDate);
            const fromYear = fromDate.getFullYear();
            const fromMonth = fromDate.getMonth();
            const fromDay = fromDate.getDate();
            const toYear = toDate.getFullYear();
            const toMonth = toDate.getMonth();
            const toDay = toDate.getDate();

            const afterFrom = createdYear > fromYear ||
              (createdYear === fromYear && createdMonth > fromMonth) ||
              (createdYear === fromYear && createdMonth === fromMonth && createdDay >= fromDay);

            const beforeTo = createdYear < toYear ||
              (createdYear === toYear && createdMonth < toMonth) ||
              (createdYear === toYear && createdMonth === toMonth && createdDay <= toDay);

            return afterFrom && beforeTo;
          } else if (appliedFromDate) {
            const fromDate = new Date(appliedFromDate);
            const fromYear = fromDate.getFullYear();
            const fromMonth = fromDate.getMonth();
            const fromDay = fromDate.getDate();

            return createdYear > fromYear ||
              (createdYear === fromYear && createdMonth > fromMonth) ||
              (createdYear === fromYear && createdMonth === fromMonth && createdDay >= fromDay);
          } else if (appliedToDate) {
            const toDate = new Date(appliedToDate);
            const toYear = toDate.getFullYear();
            const toMonth = toDate.getMonth();
            const toDay = toDate.getDate();

            return createdYear < toYear ||
              (createdYear === toYear && createdMonth < toMonth) ||
              (createdYear === toYear && createdMonth === toMonth && createdDay <= toDay);
          }
          return true;
        });
      }
    }

    return result;
  }, [rows, normalizedSearchQuery, searchTokens, currentRole, appliedFromDate, appliedToDate, selectedStatus, selectedSource]);

  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      if (sort.key === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      if (sort.key === 'prospectValue') {
        const aValue = a.prospectValue || 0;
        const bValue = b.prospectValue || 0;
        return (aValue - bValue) * dir;
      }
      if (sort.key === 'name') {
        const aName = `${a.firstName} ${a.lastName}`.trim();
        const bName = `${b.firstName} ${b.lastName}`.trim();
        return aName.localeCompare(bName) * dir;
      }

      // status alphabetical
      return a.status.localeCompare(b.status) * dir;
    });
    return copy;
  }, [filtered, sort]);

  const legacyTotalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, legacyTotalPages);
  const paged = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, currentPage]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const onOpenModal = () => {
    reset({
      source: 'website',
      status: 'new',
      country: 'India',
      countryCode: '+91',
      firstName: '',
      lastName: '',
      companyName: '',
      designation: '',
      email: '',
      phoneNumber: '',
      linkedIn: '',
      industry: '',
      companyLocation: ''
    } as any);
    setIsEditMode(false);
    setEditingLead(null);
    setHasUnsavedChanges(false);
    setIsLeadModalOpen(true);
  };

  const onEditLead = (lead: LeadRow) => {
    setIsEditMode(true);
    setEditingLead(lead);
    setHasUnsavedChanges(false);
    // Ensure source is properly mapped for editing
    const mappedSource = lead.source || 'website';
    const editValues = {
      source: mappedSource,
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      companyName: lead.companyName || '',
      designation: lead.designation || '',
      email: lead.email || '',
      phoneNumber: lead.phoneNumber || '',
      linkedIn: lead.linkedIn || '',
      industry: lead.industry || '',
      country: lead.country || 'India',
      countryCode: (lead as any).countryCode || countryToCodeMap[lead.country] || '+91',
      status: lead.status || 'new', // Use the lead's actual current status when editing
      companyLocation: lead.companyLocation || '',
      customerLocation: lead.customerLocation || '',
      technologies: lead.technologies || '',
      prospectValue: lead.prospectValue || 0,
      numberOfEmployees: lead.numberOfEmployees || 0,
      decisionAuthority: lead.decisionAuthority || '',
    };

    // Reset form with edit values
    reset(editValues);
    setIsLeadModalOpen(true);
  };

  const onSubmitLead = async (values: LeadFormValues) => {
    // Debug: Log form values
    logger.info('🔍 FRONTEND DEBUG - Form values:', values);
    logger.info('🔍 FRONTEND DEBUG - Special fields:', {
      customerLocation: values.customerLocation,
      prospectValue: values.prospectValue,
      decisionAuthority: values.decisionAuthority
    });
    logger.info('🔍 FRONTEND DEBUG - Lead source:', values.source);

    // Ensure source is always set
    if (!values.source) {
      values.source = 'website';
      logger.info('🔍 FRONTEND DEBUG - Source was empty, set to website');
    }

    // Check email uniqueness across leads, accounts, and contacts
    try {
      // Check leads
      const leadsResponse = await fetch('/api/leads', {
        headers: authApi.getAuthHeaders()
      });
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        const leads = leadsData.data || leadsData || [];
        if (leads.some((lead: any) => lead.email?.toLowerCase() === values.email.toLowerCase())) {
          setError('email', { type: 'validate', message: 'Email already exists in leads' });
          return;
        }
      }

      // Check accounts
      const accountsResponse = await fetch('/api/accounts', {
        headers: authApi.getAuthHeaders()
      });
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const accounts = accountsData.data || accountsData || [];
        if (accounts.some((account: any) => account.email?.toLowerCase() === values.email.toLowerCase())) {
          setError('email', { type: 'validate', message: 'Email already exists in accounts' });
          return;
        }
      }

      // Check contacts
      const contactsResponse = await fetch('/api/contacts', {
        headers: authApi.getAuthHeaders()
      });
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        const contacts = contactsData.data || contactsData || [];
        if (contacts.some((contact: any) => contact.email?.toLowerCase() === values.email.toLowerCase())) {
          setError('email', { type: 'validate', message: 'Email already exists in contacts' });
          return;
        }
      }
    } catch (emailCheckError) {
      logger.warn('Email validation check failed:', emailCheckError);
    }

    try {
      // Map frontend data to backend enum format - NO automatic company creation
      const mappedLeadData = leadsApi.mapLeadToBackend ? leadsApi.mapLeadToBackend(values) : values;

      // Debug: Form values and mapped data
      logger.info('🔍 Form values:', values);
      logger.info('🔍 Mapped data:', mappedLeadData);

      // Create lead only - companies/accounts will be created during conversion
      await createLeadMutation.mutateAsync(mappedLeadData);

      // Refetch to get updated list with full data from backend
      await loadFilteredLeads();

      setIsLeadModalOpen(false);
      setHasUnsavedChanges(false);
      toast.success('Lead saved successfully');
    } catch (error: any) {
      logger.error('Lead creation error:', error);

      // Handle backend validation errors
      let errorMessage = error?.response?.data?.message || error?.message || 'Failed to save lead';

      // Parse JSON error messages if they exist
      if (typeof errorMessage === 'string' && errorMessage.includes('{"errors":{')) {
        try {
          const parsed = JSON.parse(errorMessage.replace(/&quot;/g, '"'));
          if (parsed.errors) {
            // Extract individual field errors and show them as separate toast messages
            const fieldErrors = Object.entries(parsed.errors);
            fieldErrors.forEach(([field, message]) => {
              toast.error(`${field}: ${message}`);
            });
            return; // Keep modal open
          }
        } catch (parseError) {
          // If parsing fails, fall back to original message
          logger.warn('Failed to parse error message:', parseError);
        }
      }

      // Check if it's a duplicate email error
      if (errorMessage.includes('email') && (errorMessage.includes('exists') || errorMessage.includes('already'))) {
        // Parse the error message to determine which table has the duplicate
        let specificMessage = 'Email already exists';
        if (errorMessage.toLowerCase().includes('lead')) {
          specificMessage = 'Email already exists in leads';
        } else if (errorMessage.toLowerCase().includes('contact')) {
          specificMessage = 'Email already exists in contacts';
        } else if (errorMessage.toLowerCase().includes('account')) {
          specificMessage = 'Email already exists in accounts';
        } else {
          specificMessage = 'Email already exists in leads, contacts, or accounts';
        }
        setError('email', { type: 'validate', message: specificMessage });
        return; // Keep modal open
      }

      // Handle other backend errors
      if (error?.response?.status === 400) {
        // Show the backend error message
        toast.error(errorMessage);
        return; // Keep modal open for validation errors
      }

      // Handle other errors
      toast.error(errorMessage);
    }
  };

  const onSubmitEditLead = async (values: LeadFormValues) => {
    if (!editingLead) return;

    // Unique email validation against existing rows (excluding current lead)
    const exists = rows.some((r) => r.id !== editingLead.id && r.email.toLowerCase() === values.email.toLowerCase());
    if (exists) {
      setError('email', { type: 'validate', message: 'Email must be unique' });
      return;
    }

    try {
      const leadDataWithId = {
        ...values,
        leadId: editingLead.leadId,
      };

      const mappedLeadData = leadsApi.mapLeadToBackend
        ? leadsApi.mapLeadToBackend(leadDataWithId)
        : leadDataWithId;

      logger.info("🚀 Updating Lead with Data:", mappedLeadData);

      await updateLeadMutation.mutateAsync({
        id: editingLead.leadId,
        data: mappedLeadData,
      });

      // Update local state immediately with the new values
      const updatedLead = { ...editingLead, ...values };
      setRows((prev) =>
        prev.map((l) =>
          l.leadId === editingLead.leadId ? updatedLead : l
        )
      );

      // Update apiLeads state as well to prevent empty list
      setApiLeads((prev) =>
        prev.map((l) =>
          (l.leadId || l.id) === editingLead.leadId ? mappedLeadData : l
        )
      );

      // Refetch data to ensure consistency
      try {
        await loadFilteredLeads();
      } catch (refetchError) {
        logger.warn('Failed to refetch leads after update, but local state updated:', refetchError);
        // Don't fail the operation if refetch fails - local state is already updated
      }

      setIsLeadModalOpen(false);
      setIsEditMode(false);
      setEditingLead(null);
      setHasUnsavedChanges(false);
      toast.success("Lead updated successfully");
    } catch (error: any) {
      logger.error("❌ Update lead failed:", error);

      let errorMessage = error?.response?.data?.message || error?.message || 'Failed to update lead';

      // Parse JSON error messages if they exist
      if (typeof errorMessage === 'string' && errorMessage.includes('{"errors":{')) {
        try {
          const parsed = JSON.parse(errorMessage.replace(/&quot;/g, '"'));
          if (parsed.errors) {
            // Extract individual field errors and show them as separate toast messages
            const fieldErrors = Object.entries(parsed.errors);
            fieldErrors.forEach(([field, message]) => {
              toast.error(`${field}: ${message}`);
            });
            return; // Keep modal open
          }
        } catch (parseError) {
          // If parsing fails, fall back to original message
          logger.warn('Failed to parse error message:', parseError);
        }
      }

      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        setError('email', { type: 'validate', message: 'A lead with this email already exists' });
        return;
      }

      if (error?.response?.status === 400) {
        toast.error(errorMessage);
        return;
      }

      toast.error(errorMessage);
    }
  };


  // Drawer handlers
  const openDetails = (lead: LeadRow) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    // reset activity paging/filters on open
    setActivityFilterType('all');
    setActivityFilterStatus('all');
    setActivityPage(1);
  };

  const closeDetails = () => {
    setDrawerOpen(false);
    setSelectedLead(null);
    // Reset activity filters when closing drawer
    setActivityFilterType('all');
    setActivityFilterStatus('all');
    setActivityPage(1);
  };

  // Activity handlers
  const filteredActivities = React.useMemo(() => {
    if (!selectedLead) return [] as LeadActivity[];

    logger.info('🔍 Filtering activities:', {
      selectedLead: selectedLead,
      activities: activities,
      selectedLeadId: selectedLead.id,
      selectedLeadLeadId: selectedLead.leadId
    });

    // Match activities by leadId (numeric comparison)
    let list = activities.filter((a) => {
      const activityLeadId = String(a.leadId);
      const selectedLeadId = String(selectedLead.leadId || selectedLead.id);
      const matches = activityLeadId === selectedLeadId;
      logger.info('🔍 Activity match check:', { activityLeadId, selectedLeadId, matches });
      return matches;
    });

    if (activityFilterType !== 'all') list = list.filter((a) => a.type === activityFilterType);
    if (activityFilterStatus !== 'all') list = list.filter((a) => a.status === activityFilterStatus);

    logger.info('🔍 Final filtered activities:', list);

    // Sort by date desc
    return list.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
  }, [activities, selectedLead, activityFilterType, activityFilterStatus]);

  const activitiesTotalPages = Math.max(1, Math.ceil(filteredActivities.length / activitiesPerPage));
  const activitiesCurrentPage = Math.min(activityPage, activitiesTotalPages);
  const pagedActivities = React.useMemo(() => {
    const start = (activitiesCurrentPage - 1) * activitiesPerPage;
    return filteredActivities.slice(start, start + activitiesPerPage);
  }, [filteredActivities, activitiesCurrentPage]);

  // Row menu (direct actions)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [leadToDelete, setLeadToDelete] = React.useState<LeadRow | null>(null);

  const ActionsButton: React.FC<{ r: LeadRow }> = ({ r }) => {
    const onActions = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedLead(r);
      setDrawerOpen(true);
      setTimeout(() => { refetchActivities(); }, 0);
    };

    // Check if reassignment is in progress - should stay disabled until rejected or fully reassigned
    const isPending = React.useMemo(() => {
      const backendPending = r.reassignmentPending === true || r.reassignmentPending === 'true' || r.reassignmentPending === 1;
      if (backendPending) {
        return true; // Disable - request is pending or approved but not fully assigned
      }

      const currentUserIdStr = currentUserId?.toString() || '';
      const assignedToId = r.assignedToId?.toString?.() || '';
      const isCurrentOwner = Boolean(assignedToId && currentUserIdStr && assignedToId === currentUserIdStr);
      if (isCurrentOwner) {
        return false; // Ownership restored and no backend pending
      }

      // Check if reassignment is pending in local state
      if (pendingReassignments.has(r.id) || pendingReassignments.has(r.leadId)) {
        return true; // Disable - request is pending
      }

      // Check localStorage for persistence
      const savedPending = localStorage.getItem('pendingReassignments');
      if (savedPending) {
        try {
          const pendingArray = JSON.parse(savedPending);
          if (pendingArray.includes(r.id) || pendingArray.includes(r.leadId)) {
            return true; // Disable - request is pending
          }
        } catch {
          // Ignore parsing errors
        }
      }

      return false; // Enable only when no reassignment is in progress
    }, [r.reassignmentPending, r.assignedToId, r.id, r.leadId, pendingReassignments, currentUserId]);

    if (currentRole === 'Sales_Manager' || currentRole === 'Sales_VP') {
      return (
        <button
          onClick={onActions}
          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
          title="View Lead Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      );
    }

    return (
      <button
        onClick={isPending ? undefined : onActions}
        disabled={isPending}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${isPending
            ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed opacity-50'
            : 'text-blue-600 dark:text-blue-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-blue-200 dark:border-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer'
          }`}
        title={isPending ? 'Reassignment request pending - Action disabled' : 'View Lead Details & Actions'}
      >
        Action
      </button>
    );
  };

  // Confirm Delete Modal
  const deleteLead = useDeleteLead();
  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead.mutateAsync(leadToDelete.leadId || leadToDelete.id);
      toast.success('Lead deleted');
      setConfirmDeleteOpen(false);
      setLeadToDelete(null);
      loadFilteredLeads();
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  const onSubmitActivity = async (values: ActivityFormValues) => {
    if (!selectedLead) return;

    logger.info('🔍 Creating activity for lead:', selectedLead);
    logger.info('🔍 Activity form values:', values);

    const newActivity: any = {
      leadId: parseInt(selectedLead.leadId || selectedLead.id), // Ensure numeric leadId
      activityType: values.type, // Use activityType for backend
      subject: values.subject,
      description: values.description || '',
      activityDate: values.activityDate,
    };

    logger.info('🔍 Mapped activity data:', newActivity);

    try {
      const result = await createActivity.mutateAsync(newActivity);
      logger.info('🔍 Activity creation result:', result);
      await refetchActivities(); // ensure latest list including the newly created
      setIsActivityModalOpen(false);
    } catch (err) {
      logger.error('🔍 Activity creation error:', err);
      toast.error('Failed to add activity');
    }
  };

  // const assignedUser = (id: string): User | undefined => mockUsers.find((u) => u.id === id);

  // Handle reassignment request
  const handleReassignRequest = async () => {
    if (!selectedLead || !reassignReason.trim()) return;

    setIsSubmittingReassign(true);
    const leadId = selectedLead.id;

    try {
      await leadsApi.requestReassignment(leadId, reassignReason);

      // Update pending reassignments state immediately
      const newPendingSet = new Set(pendingReassignments);
      newPendingSet.add(leadId);
      newPendingSet.add(selectedLead.leadId); // Also add leadId for consistency
      setPendingReassignments(newPendingSet);

      // Update localStorage immediately for persistence
      localStorage.setItem('pendingReassignments', JSON.stringify(Array.from(newPendingSet)));

      // Update the lead in rows to show pending status immediately
      setRows(prev => prev.map(row =>
        (row.id === leadId || row.leadId === leadId) ? { ...row, reassignmentPending: true } : row
      ));

      // Also update apiLeads to ensure consistency
      setApiLeads(prev => prev.map(lead =>
        ((lead.leadId || lead.id)?.toString() === leadId || (lead.leadId || lead.id)?.toString() === selectedLead.leadId)
          ? { ...lead, reassignmentPending: true }
          : lead
      ));

      // Force refresh of the Action button by updating refresh key
      setRefreshKey(prev => prev + 1);

      // Trigger notification refresh
      window.dispatchEvent(new Event('refreshNotifications'));

      toast.success('Reassignment request submitted successfully');

      setIsReassignModalOpen(false);
      setReassignReason('');
      setDrawerOpen(false);
      setSelectedLead(null);

      // Reload data to ensure backend state is reflected
      if (currentRole === 'Sales_Manager' || currentRole === 'Sales_VP') {
        // Trigger the role-specific data reload
        setPage(0);
      } else {
        loadFilteredLeads();
      }

      // Navigate to All Leads page
      navigate('/crm/Leads');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit reassignment request');
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Handle modal cancel with unsaved changes check
  const handleModalCancel = () => {
    if (isEditMode && hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      setIsLeadModalOpen(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmCancel = () => {
    setIsLeadModalOpen(false);
    setHasUnsavedChanges(false);
    setShowCancelConfirm(false);
  };

  return (
    <>
      <style>{`
        .import-preview-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .import-preview-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .import-preview-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .import-preview-scroll::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Delivering Excellence — Sales CRM for Tech Tammina</p>
          </div>
          <div className="flex items-center gap-2">
            {currentRole !== 'Sales_Manager' && can(currentRole, 'Leads', 'Create') && (
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={onOpenModal}>
                Add Lead
              </Button>
            )}
            {can(currentRole, 'Leads', 'Import') && currentRole !== 'Sales_Manager' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    try {
                      setIsImporting(true);
                      const xlsxModule = await import('xlsx');
                      const XLSX = (xlsxModule as any).default ?? xlsxModule; // handle CJS/ESM interop
                      const arrayBuffer = await file.arrayBuffer();
                      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                      if (!workbook.SheetNames.length) {
                        toast.error('No sheets found in the Excel file');
                        return;
                      }
                      const firstSheetName = workbook.SheetNames[0];
                      const worksheet = workbook.Sheets[firstSheetName];
                      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                      if (!Array.isArray(rows) || rows.length === 0) {
                        toast.error('No data found in the Excel file');
                        return;
                      }
                      logger.info('🔍 Raw Excel data:', rows);
                      logger.info('🔍 First row keys:', Object.keys(rows[0] || {}));
                      setUploadPreview(rows as any[]);
                      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
                    } catch (err: any) {
                      toast.error('Failed to parse Excel file: ' + (err.message || 'Unknown error'));
                    } finally {
                      setIsImporting(false);
                      // reset value so selecting the same file again triggers onChange
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button variant="ghost" leftIcon={<Upload className="w-4 h-4" />} onClick={() => {
                  fileInputRef.current?.click();
                }} disabled={isImporting} title="Upload Excel file with columns: firstName, lastName, companyName, designation, email, phone, linkedin, industry, country, city, source, customerLocation, technologies, prospectValue, numberOfEmployees, decisionAuthority">
                  {isImporting ? 'Loading...' : 'Upload Excel'}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={async () => {
                try {
                  const response = await fetch('/Data Leads.xlsx');
                  if (!response.ok) throw new Error('File not found');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'Data Leads.xlsx';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast.success('Leads file downloaded successfully');
                } catch (error) {
                  toast.error('Failed to download file');
                }
              }}
            >
              Download Excel
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-xl relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by name, email, or company"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleSearchChange('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-4"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* My Leads Filter (for VP and Manager roles) */}
                  {(currentRole === 'Sales_VP' || currentRole === 'Sales_Manager') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">My Leads</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="myLeadsFilter"
                          checked={selectedMyLeads}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            console.log('My Leads checkbox changed:', checked);
                            setSelectedMyLeads(checked);
                            if (checked) {
                              // Reset other filters when "My Leads" is selected
                              setSelectedManager(null);
                              setSelectedExecutive(null);
                              setManagerFilter('All');
                              setExecutiveFilter('All');
                              setSelectedVPLeads(false); // Reset VP Leads when My Leads is selected
                              console.log('Reset manager and executive filters');
                            }
                            setPage(0);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="myLeadsFilter" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
                          Show My Leads Only
                        </label>
                        <span className="ml-1 text-xs text-gray-500" title="Shows leads created by you or assigned to you">
                          (?)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* VP Leads Filter (for Manager role only) */}
                  {currentRole === 'Sales_Manager' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">VP Leads</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vpLeadsFilter"
                          checked={selectedVPLeads}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            console.log('VP Leads checkbox changed:', checked);
                            setSelectedVPLeads(checked);
                            if (checked) {
                              // Reset other filters when "VP Leads" is selected
                              setSelectedExecutive(null);
                              setSelectedMyLeads(false); // Reset My Leads when VP Leads is selected
                              setExecutiveFilter('All');
                              console.log('Reset executive and my leads filters');
                            }
                            setPage(0);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="vpLeadsFilter" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
                          Show VP Leads Only
                        </label>
                        <span className="ml-1 text-xs text-gray-500" title="Shows leads created by your VP">
                          (?)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Manager Filter (for VP role) */}
                  {currentRole === 'Sales_VP' && (
                    <div ref={managerDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={managerSearchMode ? managerSearchQuery : (selectedManager ? managers.find(m => m.userId === selectedManager)?.username || 'All Managers' : 'All Managers')}
                          onChange={(e) => {
                            setManagerSearchQuery(e.target.value);
                            setManagerDropdownOpen(true);
                            setHighlightedManagerIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            const filteredManagers = [{ userId: null, username: 'All Managers' }, ...managers].filter(manager =>
                              manager.username.toLowerCase().includes(managerSearchQuery.toLowerCase())
                            );

                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setManagerDropdownOpen(false);
                              setManagerSearchMode(false);
                              setManagerSearchQuery('');
                              setHighlightedManagerIndex(-1);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedManagerIndex(prev => {
                                const newIndex = prev < filteredManagers.length - 1 ? prev + 1 : prev;
                                setTimeout(() => managerItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedManagerIndex(prev => {
                                const newIndex = prev > 0 ? prev - 1 : 0;
                                setTimeout(() => managerItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'Enter' && highlightedManagerIndex >= 0) {
                              e.preventDefault();
                              const manager = filteredManagers[highlightedManagerIndex];
                              if (manager) {
                                setSelectedManager(manager.userId);
                                setManagerFilter(manager.userId ? manager.userId.toString() : 'All');
                                setExecutiveFilter('All');
                                setSelectedExecutive(null);
                                setSelectedMyLeads(false);
                                setPage(0);
                                setManagerDropdownOpen(false);
                                setHighlightedManagerIndex(-1);
                                setManagerSearchMode(false);
                                setManagerSearchQuery('');
                              }
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setManagerSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setManagerDropdownOpen(!managerDropdownOpen);
                            if (!managerDropdownOpen) {
                              setManagerSearchMode(false);
                              setManagerSearchQuery('');
                              setHighlightedManagerIndex(-1);
                            }
                          }}
                          readOnly={!managerSearchMode}
                          style={{ outline: 'none', boxShadow: 'none' }}
                          className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400"
                        />
                        {(managerSearchQuery && managerSearchMode) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManagerSearchQuery('');
                              setManagerSearchMode(false);
                            }}
                            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${managerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {managerDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              {(() => {
                                const filteredManagers = [{ userId: null, username: 'All Managers' }, ...managers]
                                  .filter(manager => manager.username.toLowerCase().includes(managerSearchQuery.toLowerCase()));
                                
                                if (filteredManagers.length === 0) {
                                  return (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                      No managers found
                                    </div>
                                  );
                                }
                                
                                return filteredManagers.map((manager, index) => {
                                  const query = managerSearchQuery.toLowerCase();
                                  const label = manager.username;
                                  const lowerLabel = label.toLowerCase();
                                  const matchIndex = lowerLabel.indexOf(query);

                                  let displayLabel;
                                  if (query && matchIndex !== -1) {
                                    const before = label.slice(0, matchIndex);
                                    const match = label.slice(matchIndex, matchIndex + query.length);
                                    const after = label.slice(matchIndex + query.length);
                                    displayLabel = (
                                      <>
                                        {before}<strong>{match}</strong>{after}
                                      </>
                                    );
                                  } else {
                                    displayLabel = label;
                                  }

                                  return (
                                    <button
                                      key={manager.userId || 'all'}
                                      ref={el => managerItemRefs.current[index] = el}
                                      onClick={() => {
                                        setSelectedManager(manager.userId);
                                        setManagerFilter(manager.userId ? manager.userId.toString() : 'All');
                                        setExecutiveFilter('All');
                                        setSelectedExecutive(null);
                                        setSelectedMyLeads(false);
                                        setPage(0);
                                        setManagerSearchQuery('');
                                        setManagerDropdownOpen(false);
                                        setHighlightedManagerIndex(-1);
                                        setManagerSearchMode(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${highlightedManagerIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                          selectedManager === manager.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                      {displayLabel}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Executive Filter (for Manager and VP roles) */}
                  {currentRole === 'Sales_Manager' && (
                    <div ref={executiveDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executive</label>
                      <div className="relative">
                        <input
                          ref={executiveInputRef}
                          type="text"
                          value={executiveSearchMode ? executiveSearchQuery : (selectedExecutive ? executives.find(e => e.userId === selectedExecutive)?.username || 'All Executives' : 'All Executives')}
                          onChange={(e) => {
                            setExecutiveSearchQuery(e.target.value);
                            setExecutiveDropdownOpen(true);
                            setHighlightedExecutiveIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            const filteredExecutives = [{ userId: null, username: 'All Executives' }, ...executives].filter(exec =>
                              exec.username.toLowerCase().includes(executiveSearchQuery.toLowerCase())
                            );

                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedExecutiveIndex(prev => {
                                const newIndex = prev < filteredExecutives.length - 1 ? prev + 1 : prev;
                                setTimeout(() => executiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedExecutiveIndex(prev => {
                                const newIndex = prev > 0 ? prev - 1 : 0;
                                setTimeout(() => executiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'Enter' && highlightedExecutiveIndex >= 0) {
                              e.preventDefault();
                              const exec = filteredExecutives[highlightedExecutiveIndex];
                              if (exec) {
                                setSelectedExecutive(exec.userId);
                                setExecutiveFilter(exec.userId ? exec.userId.toString() : 'All');
                                setSelectedMyLeads(false);
                                setSelectedVPLeads(false);
                                setPage(0);
                                setExecutiveDropdownOpen(false);
                                setHighlightedExecutiveIndex(-1);
                                setExecutiveSearchMode(false);
                                setExecutiveSearchQuery('');
                              }
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setExecutiveDropdownOpen(false);
                              setExecutiveSearchMode(false);
                              setExecutiveSearchQuery('');
                              setHighlightedExecutiveIndex(-1);
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setExecutiveSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setExecutiveDropdownOpen(!executiveDropdownOpen);
                            if (!executiveDropdownOpen) {
                              setExecutiveSearchMode(false);
                              setExecutiveSearchQuery('');
                              setHighlightedExecutiveIndex(-1);
                            }
                          }}
                          readOnly={!executiveSearchMode}
                          className="h-10 w-full px-4 pr-20 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                          style={{ outline: 'none', boxShadow: 'none' }}
                        />
                        {executiveSearchQuery && executiveSearchMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExecutiveSearchQuery('');
                              setExecutiveSearchMode(false);
                              executiveInputRef.current?.focus();
                            }}
                            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${executiveDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {executiveDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              {(() => {
                                const filteredExecutives = [{ userId: null, username: 'All Executives' }, ...executives].filter(exec =>
                                  exec.username.toLowerCase().includes(executiveSearchQuery.toLowerCase())
                                );

                                if (filteredExecutives.length === 0) {
                                  return (
                                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                                      No Executives found
                                    </div>
                                  );
                                }

                                return filteredExecutives.map((executive, index) => {
                                  const query = executiveSearchQuery.toLowerCase();
                                  const label = executive.username;
                                  const lowerLabel = label.toLowerCase();
                                  const matchIndex = lowerLabel.indexOf(query);

                                  let displayLabel;
                                  if (query && matchIndex !== -1) {
                                    const before = label.slice(0, matchIndex);
                                    const match = label.slice(matchIndex, matchIndex + query.length);
                                    const after = label.slice(matchIndex + query.length);
                                    displayLabel = (
                                      <>
                                        {before}<strong>{match}</strong>{after}
                                      </>
                                    );
                                  } else {
                                    displayLabel = label;
                                  }

                                  return (
                                    <button
                                      key={executive.userId || 'all'}
                                      ref={el => executiveItemRefs.current[index] = el}
                                      onClick={() => {
                                        setSelectedExecutive(executive.userId);
                                        setExecutiveFilter(executive.userId ? executive.userId.toString() : 'All');
                                        setSelectedMyLeads(false);
                                        setSelectedVPLeads(false);
                                        setPage(0);
                                        setExecutiveSearchQuery('');
                                        setExecutiveDropdownOpen(false);
                                        setHighlightedExecutiveIndex(-1);
                                        setExecutiveSearchMode(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${highlightedExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                          selectedExecutive === executive.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                      {displayLabel}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CEO Role Filters */}
                  {currentRole === 'CEO' && (
                    <div ref={ceoVpDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales VP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ceoVpSearchMode ? ceoVpSearchQuery : 'All Sales VPs'}
                          onChange={(e) => {
                            setCeoVpSearchQuery(e.target.value);
                            setCeoVpDropdownOpen(true);
                            setHighlightedCeoVpIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedCeoVpIndex(prev => prev < 0 ? prev + 1 : prev);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedCeoVpIndex(prev => prev > 0 ? prev - 1 : 0);
                            } else if (e.key === 'Enter' && highlightedCeoVpIndex >= 0) {
                              e.preventDefault();
                              setCeoVpDropdownOpen(false);
                              setHighlightedCeoVpIndex(-1);
                              setCeoVpSearchMode(false);
                              setCeoVpSearchQuery('');
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setCeoVpSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setCeoVpDropdownOpen(!ceoVpDropdownOpen);
                            if (!ceoVpDropdownOpen) {
                              setCeoVpSearchMode(false);
                              setCeoVpSearchQuery('');
                              setHighlightedCeoVpIndex(-1);
                            }
                          }}
                          readOnly={!ceoVpSearchMode}
                          className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${ceoVpDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {ceoVpDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  setCeoVpSearchQuery('');
                                  setCeoVpDropdownOpen(false);
                                  setHighlightedCeoVpIndex(-1);
                                  setCeoVpSearchMode(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                All Sales VPs
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentRole === 'CEO' && (
                    <div ref={ceoManagerDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales Manager</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ceoManagerSearchMode ? ceoManagerSearchQuery : 'All Managers'}
                          onChange={(e) => {
                            setCeoManagerSearchQuery(e.target.value);
                            setCeoManagerDropdownOpen(true);
                            setHighlightedCeoManagerIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedCeoManagerIndex(prev => prev < 0 ? prev + 1 : prev);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedCeoManagerIndex(prev => prev > 0 ? prev - 1 : 0);
                            } else if (e.key === 'Enter' && highlightedCeoManagerIndex >= 0) {
                              e.preventDefault();
                              setCeoManagerDropdownOpen(false);
                              setHighlightedCeoManagerIndex(-1);
                              setCeoManagerSearchMode(false);
                              setCeoManagerSearchQuery('');
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setCeoManagerSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setCeoManagerDropdownOpen(!ceoManagerDropdownOpen);
                            if (!ceoManagerDropdownOpen) {
                              setCeoManagerSearchMode(false);
                              setCeoManagerSearchQuery('');
                              setHighlightedCeoManagerIndex(-1);
                            }
                          }}
                          readOnly={!ceoManagerSearchMode}
                          className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${ceoManagerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {ceoManagerDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  setCeoManagerSearchQuery('');
                                  setCeoManagerDropdownOpen(false);
                                  setHighlightedCeoManagerIndex(-1);
                                  setCeoManagerSearchMode(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                All Managers
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentRole === 'CEO' && (
                    <div ref={ceoExecutiveDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales Executive</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ceoExecutiveSearchMode ? ceoExecutiveSearchQuery : 'All Executives'}
                          onChange={(e) => {
                            setCeoExecutiveSearchQuery(e.target.value);
                            setCeoExecutiveDropdownOpen(true);
                            setHighlightedCeoExecutiveIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedCeoExecutiveIndex(prev => prev < 0 ? prev + 1 : prev);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedCeoExecutiveIndex(prev => prev > 0 ? prev - 1 : 0);
                            } else if (e.key === 'Enter' && highlightedCeoExecutiveIndex >= 0) {
                              e.preventDefault();
                              setCeoExecutiveDropdownOpen(false);
                              setHighlightedCeoExecutiveIndex(-1);
                              setCeoExecutiveSearchMode(false);
                              setCeoExecutiveSearchQuery('');
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setCeoExecutiveSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setCeoExecutiveDropdownOpen(!ceoExecutiveDropdownOpen);
                            if (!ceoExecutiveDropdownOpen) {
                              setCeoExecutiveSearchMode(false);
                              setCeoExecutiveSearchQuery('');
                              setHighlightedCeoExecutiveIndex(-1);
                            }
                          }}
                          readOnly={!ceoExecutiveSearchMode}
                          className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${ceoExecutiveDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {ceoExecutiveDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  setCeoExecutiveSearchQuery('');
                                  setCeoExecutiveDropdownOpen(false);
                                  setHighlightedCeoExecutiveIndex(-1);
                                  setCeoExecutiveSearchMode(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                All Executives
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Executive Filter for VP - only show after manager selection */}
                  {currentRole === 'Sales_VP' && selectedManager && (
                    <div ref={vpDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executive</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={vpExecutiveSearchMode ? vpExecutiveSearchQuery : (selectedExecutive ? executives.find(e => e.userId === selectedExecutive)?.username || 'All Executives under Manager' : 'All Executives under Manager')}
                          onChange={(e) => {
                            setVpExecutiveSearchQuery(e.target.value);
                            setVpDropdownOpen(true);
                            setHighlightedVpExecutiveIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            const filteredExecutives = [{ userId: null, username: 'All Executives under Manager' }, ...executives].filter(exec =>
                              exec.username.toLowerCase().includes(vpExecutiveSearchQuery.toLowerCase())
                            );

                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setVpDropdownOpen(false);
                              setVpExecutiveSearchMode(false);
                              setVpExecutiveSearchQuery('');
                              setHighlightedVpExecutiveIndex(-1);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedVpExecutiveIndex(prev => {
                                const newIndex = prev < filteredExecutives.length - 1 ? prev + 1 : prev;
                                setTimeout(() => vpExecutiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedVpExecutiveIndex(prev => {
                                const newIndex = prev > 0 ? prev - 1 : 0;
                                setTimeout(() => vpExecutiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                return newIndex;
                              });
                            } else if (e.key === 'Enter' && highlightedVpExecutiveIndex >= 0) {
                              e.preventDefault();
                              const exec = filteredExecutives[highlightedVpExecutiveIndex];
                              if (exec) {
                                setSelectedExecutive(exec.userId);
                                setExecutiveFilter(exec.userId ? exec.userId.toString() : 'All');
                                setSelectedMyLeads(false);
                                setPage(0);
                                setVpDropdownOpen(false);
                                setHighlightedVpExecutiveIndex(-1);
                                setVpExecutiveSearchMode(false);
                                setVpExecutiveSearchQuery('');
                              }
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setVpExecutiveSearchMode(true);
                            }
                          }}
                          onClick={() => {
                            setVpDropdownOpen(!vpDropdownOpen);
                            if (!vpDropdownOpen) {
                              setVpExecutiveSearchMode(false);
                              setVpExecutiveSearchQuery('');
                              setHighlightedVpExecutiveIndex(-1);
                            }
                          }}
                          readOnly={!vpExecutiveSearchMode}
                          style={{ outline: 'none', boxShadow: 'none' }}
                          className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400"
                        />
                        {(vpExecutiveSearchQuery && vpExecutiveSearchMode) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVpExecutiveSearchQuery('');
                              setVpExecutiveSearchMode(false);
                            }}
                            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${vpDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>

                        {vpDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                            <div className="p-2">
                              {(() => {
                                const filteredExecutives = [{ userId: null, username: 'All Executives under Manager' }, ...executives]
                                  .filter(exec => exec.username.toLowerCase().includes(vpExecutiveSearchQuery.toLowerCase()));
                                
                                if (filteredExecutives.length === 0) {
                                  return (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                      No executives found
                                    </div>
                                  );
                                }
                                
                                return filteredExecutives.map((executive, index) => {
                                  const query = vpExecutiveSearchQuery.toLowerCase();
                                  const label = executive.username;
                                  const lowerLabel = label.toLowerCase();
                                  const matchIndex = lowerLabel.indexOf(query);

                                  let displayLabel;
                                  if (query && matchIndex !== -1) {
                                    const before = label.slice(0, matchIndex);
                                    const match = label.slice(matchIndex, matchIndex + query.length);
                                    const after = label.slice(matchIndex + query.length);
                                    displayLabel = (
                                      <>
                                        {before}<strong>{match}</strong>{after}
                                      </>
                                    );
                                  } else {
                                    displayLabel = label;
                                  }

                                  return (
                                    <button
                                      key={executive.userId || 'all'}
                                      ref={el => vpExecutiveItemRefs.current[index] = el}
                                      onClick={() => {
                                        setSelectedExecutive(executive.userId);
                                        setExecutiveFilter(executive.userId ? executive.userId.toString() : 'All');
                                        setSelectedMyLeads(false);
                                        setPage(0);
                                        setVpExecutiveSearchQuery('');
                                        setVpDropdownOpen(false);
                                        setHighlightedVpExecutiveIndex(-1);
                                        setVpExecutiveSearchMode(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${highlightedVpExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                          selectedExecutive === executive.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                      {displayLabel}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Filter */}
                  <div ref={statusDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 min-w-[140px] h-10"
                      >
                        <span className="truncate">{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {statusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            {['All', 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  handleFilterChange('status', status);
                                  setStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${statusFilter === status ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                                  }`}
                              >
                                {status === 'All' ? 'All Status' : status}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Source Filter */}
                  <div ref={sourceDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                    <div className="relative">
                      <button
                        onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 min-w-[140px] h-10"
                      >
                        <span className="truncate">{sourceFilter === 'All' ? 'All Sources' : sourceFilter.replace('_', ' ')}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${sourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {sourceDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                          <div className="p-2">
                            {['All', 'Website', 'Email', 'Campaign', 'Cold_Call', 'Referral', 'Event', 'Other'].map((source) => (
                              <button
                                key={source}
                                onClick={() => {
                                  handleFilterChange('source', source);
                                  setSourceDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sourceFilter === source ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                                  }`}
                              >
                                {source === 'All' ? 'All Sources' : source.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Range */}
                  <CustomDatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(value) => handleDateRangeChange(value, endDate)}
                    placeholder="dd-mm-yyyy"
                    maxDate={new Date()}
                  />

                  <CustomDatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(value) => handleDateRangeChange(startDate, value)}
                    placeholder="dd-mm-yyyy"
                    maxDate={new Date()}
                    minDate={startDate ? (() => {
                      try {
                        const [day, month, year] = startDate.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      } catch {
                        return undefined;
                      }
                    })() : undefined}
                  />
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setSourceFilter('All');
                      setManagerFilter('All');
                      setExecutiveFilter('All');
                      setStartDate('');
                      setEndDate('');
                      setSelectedManager(null);
                      setSelectedExecutive(null);
                      setSelectedMyLeads(false);
                      setSelectedVPLeads(false);
                      setPage(0);
                      console.log('All filters cleared, including My Leads and VP Leads checkboxes');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Preview Section */}
        {uploadPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Import Preview ({uploadPreview.length} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 border border-gray-200 rounded-lg import-preview-scroll" style={{ overflowX: 'auto', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 transparent' }}>
                <table className="text-sm" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      {Object.keys(uploadPreview[0] || {}).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium text-gray-600 capitalize whitespace-nowrap" style={{ minWidth: '120px' }}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="py-2 px-3 text-gray-800 whitespace-nowrap" style={{ minWidth: '120px' }}>{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!fileInputRef.current?.files?.[0]) {
                      toast.error('Please select a file first');
                      return;
                    }

                    const file = fileInputRef.current.files[0];

                    try {
                      setIsImporting(true);
                      const result = await leadsApi.uploadExcel(file);

                      if (result.success) {
                        toast.success(result.message);
                        setUploadPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        loadFilteredLeads(); // Refresh the leads list
                      } else {
                        // Show validation errors in modal only if there are actual errors
                        if (result.errors && result.errors.length > 0) {
                          console.log('Setting validation errors:', result.errors);
                          setValidationErrors(result.errors);
                          setIsValidationErrorModalOpen(true);
                        } else {
                          toast.error(result.message || 'Upload failed');
                        }
                        setUploadPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    } catch (error: any) {
                      logger.error('Excel upload error:', error);
                      toast.error('Failed to upload Excel file: ' + (error.message || 'Unknown error'));
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                >
                  Import Leads
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUploadPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card className="bg-white/70 backdrop-blur-glass shadow-glass">
          <CardHeader>
            <CardTitle>
              {currentRole === 'Sales_Manager' ? (
                selectedMyLeads ? (
                  `My Leads (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : selectedVPLeads ? (
                  `VP Leads (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : selectedExecutive ? (
                  `Leads for ${executives.find(e => e.userId === selectedExecutive)?.username || 'Executive'} (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : (
                  `All Team Leads (${normalizedSearchQuery ? filtered.length : totalElements})`
                )
              ) : currentRole === 'Sales_VP' ? (
                selectedMyLeads ? (
                  `My Leads (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : selectedExecutive ? (
                  `Leads for ${executives.find(e => e.userId === selectedExecutive)?.username || 'Executive'} (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : selectedManager ? (
                  `Leads for ${managers.find(m => m.userId === selectedManager)?.username || 'Manager'} (${normalizedSearchQuery ? filtered.length : totalElements})`
                ) : (
                  `All VP Leads (${normalizedSearchQuery ? filtered.length : totalElements})`
                )
              ) : (
                `All Leads (${totalElements || filtered.length})`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Company Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Customer Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Prospect Value</th>
                    {currentRole !== 'Sales_Executive' && (
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Owner</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentRole === 'Sales_Manager' || currentRole === 'Sales_VP' ? isFilteringLeads : isLoadingLeads) ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">Loading leads...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        {/* <div className="text-gray-500 dark:text-gray-400 mb-2">No data found</div> */}
                        <div className="text-sm text-gray-400 dark:text-gray-500">
                          {searchQuery || statusFilter !== 'All' || sourceFilter !== 'All' || managerFilter !== 'All' || executiveFilter !== 'All' || startDate || endDate || selectedExecutive
                            ? 'No leads match the selected filters'
                            : 'No leads available'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <td className="py-3 px-4">
                          <div className="max-w-[150px] truncate" title={[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}>
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[150px] truncate" title={r.source ? r.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '—'}>
                            {r.source ? r.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[200px] truncate" title={r.companyName}>
                            {r.companyName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[150px] truncate" title={r.customerLocation || '-'}>
                            {r.customerLocation || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">{r.prospectValue ? formatCompactCurrency(r.prospectValue) : '-'}</td>
                        {currentRole !== 'Sales_Executive' && (
                          <td className="py-3 px-4">
                            <span className="text-orange-600 font-medium">
                              {r.assignedToName || 'Unassigned'}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="relative inline-block text-left">
                            <ActionsButton r={r} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <NumberedPagination
                  currentPage={page + 1}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage - 1)}
                  totalItems={totalElements}
                  itemsPerPage={perPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm Delete Modal */}
        <Modal isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Delete Lead" size="sm">
          <ModalContent>
            <div className="space-y-3">
              <p className="text-gray-700">Are you sure you want to delete this lead?</p>
              {leadToDelete && (
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Lead ID:</span> {leadToDelete.leadId}</div>
                  <div><span className="font-medium">Name:</span> {[leadToDelete.firstName, leadToDelete.lastName].filter(Boolean).join(' ') || '—'}</div>
                  <div><span className="font-medium">Email:</span> {leadToDelete.email || '—'}</div>
                </div>
              )}
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </ModalFooter>
        </Modal>

        {/* Add/Edit Lead Modal */}
        <Modal isOpen={isLeadModalOpen} onClose={handleModalCancel} title={isEditMode ? "Edit Lead" : "Add Lead"} size="xl" closeOnOverlayClick={false}>
          <ModalContent>
            <form onSubmit={handleSubmit(isEditMode ? onSubmitEditLead : onSubmitLead, handleLeadFormError)} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
                  <DynamicLeadSourceSelect
                    register={register}
                    value={watch('source')}
                    onChange={(value) => setValue('source', value as any)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  {isEditMode && editingLead?.status === 'converted' ? (
                    <>
                      <input type="hidden" value="converted" {...register('status')} />
                      <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 h-10 flex items-center">
                        Converted
                      </div>
                    </>
                  ) : isEditMode ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium h-10"
                      >
                        <span>{watch('status')?.charAt(0).toUpperCase() + watch('status')?.slice(1) || 'Select status'}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {statusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                          <div className="p-2">
                            {(() => {
                              const statusOrder = ['new', 'contacted', 'qualified', 'unqualified'];
                              const currentIndex = statusOrder.indexOf(editingLead?.status || 'new');
                              const availableStatuses = statusOrder.slice(currentIndex >= 0 ? currentIndex : 0);

                              return availableStatuses.map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setValue('status', status as any);
                                    setStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${watch('status') === status ? 'bg-primary-50 text-primary-600' : ''
                                    }`}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                      <input type="hidden" {...register('status')} />
                    </div>
                  ) : (
                    <>
                      <input type="hidden" value="new" {...register('status')} />
                      <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 h-10 flex items-center">
                        New
                      </div>
                    </>
                  )}
                </div>

                <Input label="First Name *" {...register('firstName')} error={errors.firstName?.message} placeholder="Enter first name" />
                <Input label="Last Name *" {...register('lastName')} error={errors.lastName?.message} placeholder="Enter last name" />

                <Input label="Company Name *" {...register('companyName')} error={errors.companyName?.message} placeholder="Enter company name" />
                <Input label="Designation *" {...register('designation')} error={errors.designation?.message} placeholder="Enter designation" />

                <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} placeholder="Enter email" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                  <div className="relative" ref={countryCodeDropdownModalRef}>
                    <button
                      type="button"
                      onClick={() => setCountryCodeDropdownOpen(!countryCodeDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium h-10"
                    >
                      <span>
                        {watch('countryCode') === '+91' ? '+91 (India)' :
                          watch('countryCode') === '+1' ? '+1 (US)' :
                            watch('countryCode') === '+44' ? '+44 (UK)' :
                              watch('countryCode') === '+49' ? '+49 (Germany)' :
                                'Select country code'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${countryCodeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {countryCodeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                        <div className="p-2">
                          {[{ value: '+91', label: '+91 (India)' }, { value: '+1', label: '+1 (US)' }, { value: '+44', label: '+44 (UK)' }, { value: '+49', label: '+49 (Germany)' }].map((code) => (
                            <button
                              key={code.value}
                              type="button"
                              onClick={() => {
                                const correspondingCountry = countryCodeMap[code.value];
                                setValue('countryCode', code.value);
                                if (correspondingCountry) {
                                  setValue('country', correspondingCountry);
                                }
                                setCountryCodeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${watch('countryCode') === code.value ? 'bg-primary-50 text-primary-600' : ''
                                }`}
                            >
                              {code.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...register('countryCode')} />
                </div>
                <Input
                  label="Phone Number *"
                  {...register('phoneNumber')}
                  error={errors.phoneNumber?.message}
                  placeholder={getPhonePlaceholder(watchedCountryCode || '+91')}
                  maxLength={phoneRule.maxLength}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                  }}
                />

                <Input label="LinkedIn (URL)" {...register('linkedIn')} error={errors.linkedIn?.message} placeholder="https://linkedin.com/in/..." />
                <Input label="Industry *" {...register('industry')} error={errors.industry?.message} placeholder="e.g., SaaS" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <div className="relative" ref={countryDropdownModalRef}>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium h-10"
                    >
                      <span>{watch('country') || 'Select country'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {countryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                        <div className="p-2">
                          {countries.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={() => {
                                const correspondingCode = countryToCodeMap[country];
                                setValue('country', country);
                                if (correspondingCode) {
                                  setValue('countryCode', correspondingCode);
                                }
                                setCountryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${watch('country') === country ? 'bg-primary-50 text-primary-600' : ''
                                }`}
                            >
                              {country}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...register('country')} />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>

                <Input label="Company Location *" {...register('companyLocation')} error={errors.companyLocation?.message} placeholder="e.g., Mumbai, India" />

                <Input label="Customer Location *" {...register('customerLocation')} error={errors.customerLocation?.message} placeholder="e.g., Mumbai, India" />

                <Input label="Technologies *" {...register('technologies')} error={errors.technologies?.message} placeholder="e.g., Java, React" />

                <Input label="Prospect Value ($) *" type="number" step="0.01" {...register('prospectValue')} error={errors.prospectValue?.message} placeholder="e.g., 50000" />

                <Input label="Number of Employees *" type="number" {...register('numberOfEmployees')} error={errors.numberOfEmployees?.message} placeholder="e.g., 50" />

                <Input label="Decision Authority" {...register('decisionAuthority')} error={errors.decisionAuthority?.message} placeholder="e.g., CTO" />




              </div>

              <ModalFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleModalCancel}
                  className="h-10 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white border border-gray-600 dark:border-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </Button>
                <Button ref={leadSubmitButtonRef} type="submit" variant="primary" loading={isSubmitting} className="h-10">{isEditMode ? 'Update Lead' : 'Save Lead'}</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Row Actions Modal */}
        <Modal isOpen={isRowActionsModalOpen} onClose={() => { setIsRowActionsModalOpen(false); setRowActionsLead(null); }} title={rowActionsLead ? `Lead Actions — ${[rowActionsLead.firstName, rowActionsLead.lastName].filter(Boolean).join(' ') || 'Lead'}` : 'Lead Actions'} size="xl">
          <ModalContent>
            {rowActionsLead && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">LinkedIn</div>
                    <div>
                      {rowActionsLead.linkedIn ? (
                        <a href={rowActionsLead.linkedIn} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary-600 hover:text-primary-700">
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Profile
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Industry</div>
                    <div>{rowActionsLead.industry || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Country</div>
                    <div>{rowActionsLead.country || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Company Location</div>
                    <div>{rowActionsLead.companyLocation || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Created By</div>
                    <div>{rowActionsLead.createdBy || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Created At</div>
                    <div>{rowActionsLead.createdAt ? formatDateTime(rowActionsLead.createdAt) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Updated At</div>
                    <div>{rowActionsLead.updatedAt ? formatDateTime(rowActionsLead.updatedAt) : '—'}</div>
                  </div>
                </div>

                <ModalFooter>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsRowActionsModalOpen(false);
                      openDetails(rowActionsLead);
                      setRowActionsLead(null);
                    }}
                  >
                    View
                  </Button>
                  {can(currentRole, 'Leads', 'Edit') && rowActionsLead.status !== 'converted' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRowActionsModalOpen(false);
                        onEditLead(rowActionsLead);
                        setRowActionsLead(null);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {can(currentRole, 'Leads', 'Convert_Lead') && (
                    <Button
                      variant="primary"
                      disabled={rowActionsLead.status === 'converted'}
                      onClick={() => {
                        const idToGo = rowActionsLead.id;
                        setIsRowActionsModalOpen(false);
                        setRowActionsLead(null);
                        if (rowActionsLead.status !== 'converted') {
                          navigate(`/crm/Leads/${idToGo}/convert`);
                        }
                      }}
                    >
                      Convert
                    </Button>
                  )}
                </ModalFooter>
              </div>
            )}
          </ModalContent>
        </Modal>

        {/* Lead Details Drawer */}
        <Drawer
          isOpen={drawerOpen}
          onClose={closeDetails}
          title={selectedLead ? `${[selectedLead.firstName, selectedLead.lastName].filter(Boolean).join(' ') || 'Lead'} — Details` : 'Lead Details'}
          size="xl"
          className="lead-details-drawer"
          headerRight={selectedLead ? (
            <div className="flex items-center gap-2">
              {currentRole === 'Sales_Executive' && !selectedLead.reassignmentPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReassignModalOpen(true);
                  }}
                >
                  Reassign
                </Button>
              )}
              {currentRole === 'Sales_Executive' && selectedLead.reassignmentPending && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
                  Reassignment Pending
                </span>
              )}
              {can(currentRole, 'Leads', 'Edit') && selectedLead.status !== 'converted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDrawerOpen(false);
                    onEditLead(selectedLead);
                  }}
                >
                  Edit
                </Button>
              )}
              {can(currentRole, 'Leads', 'Convert_Lead') && selectedLead.status !== 'converted' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    // Remove update mutation call here to avoid premature status update
                    // Just navigate to convert page; conversion will update status
                    setDrawerOpen(false);
                    setSelectedLead(null);
                    navigate(`/crm/Leads/${selectedLead.id}/convert`);
                  }}
                >
                  Convert
                </Button>
              )}
            </div>
          ) : undefined}
        >
          {selectedLead && (
            <div className="p-6 space-y-6">
              {/* Lead info */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Source</p>
                      <p className="font-medium capitalize">
                        {selectedLead.source ? (
                          selectedLead.source === 'cold_call' ? 'Cold Call' :
                            selectedLead.source.charAt(0).toUpperCase() + selectedLead.source.slice(1)
                        ) : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Designation</p>
                      <p className="font-medium">{selectedLead.designation || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="font-medium">{[selectedLead.firstName, selectedLead.lastName].filter(Boolean).join(' ') || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Name</p>
                      <p className="font-medium">{selectedLead.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-medium break-all break-words whitespace-normal overflow-hidden">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-medium break-words whitespace-normal">
                        {selectedLead.phoneNumber ? `${selectedLead.countryCode || ''} ${selectedLead.phoneNumber}`.trim() : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">LinkedIn</p>
                      <p className="font-medium">
                        {selectedLead.linkedIn?.trim() ? (
                          <a className="text-primary-600 hover:text-primary-700" href={selectedLead.linkedIn} target="_blank" rel="noreferrer">Open profile</a>
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Industry</p>
                      <p className="font-medium">{selectedLead.industry || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium">{selectedLead.country}{selectedLead.companyLocation ? `, ${selectedLead.companyLocation}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className="font-medium capitalize">{selectedLead.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Customer Location</p>
                      <p className="font-medium">{selectedLead.customerLocation || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technologies</p>
                      <p className="font-medium break-words whitespace-normal overflow-wrap-anywhere max-w-full">{selectedLead.technologies || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Prospect Value</p>
                      <p className="font-medium">{selectedLead.prospectValue ? formatCompactCurrency(selectedLead.prospectValue) : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Number of Employees</p>
                      <p className="font-medium">{selectedLead.numberOfEmployees ? selectedLead.numberOfEmployees.toLocaleString('en-US') : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Decision Authority</p>
                      <p className="font-medium">{selectedLead.decisionAuthority?.trim() || '-'}</p>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Activities */}
              <Card className="bg-white/70 backdrop-blur-glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Lead Activities</CardTitle>
                    {can(currentRole, 'Communication', 'Create') && (
                      <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => {
                        resetActivity({ type: 'call', subject: '', description: '', activityDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) });
                        setIsActivityModalOpen(true);
                      }}>
                        Add Activity
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="relative" ref={activityTypeDropdownRef}>
                          <button
                            onClick={() => setActivityTypeDropdownOpen(!activityTypeDropdownOpen)}
                            className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 min-w-[120px]"
                          >
                            <span>{activityFilterType === 'all' ? 'All Types' : activityFilterType.charAt(0).toUpperCase() + activityFilterType.slice(1)}</span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activityTypeDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {activityTypeDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                              <div className="p-2">
                                {[{ value: 'all', label: 'All Types' }, { value: 'call', label: 'Call' }, { value: 'meeting', label: 'Meeting' }, { value: 'email', label: 'Email' }].map((type) => (
                                  <button
                                    key={type.value}
                                    onClick={() => {
                                      setActivityFilterType(type.value as any);
                                      setActivityPage(1);
                                      setActivityTypeDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${activityFilterType === type.value ? 'bg-primary-50 text-primary-600' : ''
                                      }`}
                                  >
                                    {type.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">{filteredActivities.length} activities</div>
                    </div>

                    {/* Activities Table */}
                    {filteredActivities.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No activities yet</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-white">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Subject</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedActivities.map((a) => (
                              <React.Fragment key={a.id}>
                                <tr
                                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => setExpandedActivityId((prev) => prev === a.id ? null : a.id)}
                                >
                                  <td className="py-2 px-3 capitalize">{a.type}</td>
                                  <td className="py-2 px-3">{a.subject}</td>
                                  <td className="py-2 px-3">{formatDateTime(a.activityDate)}</td>
                                </tr>
                                {expandedActivityId === a.id && (
                                  <tr className="bg-gray-50">
                                    <td colSpan={3} className="py-3 px-3 text-gray-700">
                                      <div className="max-h-[100px] overflow-y-auto break-words whitespace-normal" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                                        {a.description ? a.description : <span className="text-gray-400">No description</span>}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Activity Pagination */}
                    {filteredActivities.length > activitiesPerPage && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">Page {activitiesCurrentPage} of {activitiesTotalPages}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" disabled={activitiesCurrentPage <= 1} onClick={() => setActivityPage((p) => Math.max(1, p - 1))} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
                          <Button variant="ghost" size="sm" disabled={activitiesCurrentPage >= activitiesTotalPages} onClick={() => setActivityPage((p) => Math.min(activitiesTotalPages, p + 1))} rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
                        </div>
                      </div>
                    )}
                  </>
                </CardContent>
              </Card>
            </div>
          )}
        </Drawer>

        {/* Add Activity Modal inside Drawer */}
        <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Add Activity" size="lg" closeOnOverlayClick={false}>
          <ModalContent>
            <form onSubmit={handleActivitySubmit(onSubmitActivity)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type *</label>
                  <div className="relative" ref={activityTypeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setActivityTypeDropdownOpen(!activityTypeDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium h-10"
                    >
                      <span>
                        {watchActivity('type') === 'call' ? 'Call' :
                          watchActivity('type') === 'meeting' ? 'Meeting' :
                            watchActivity('type') === 'email' ? 'Email' :
                              'Select activity type'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activityTypeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {activityTypeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                        <div className="p-2">
                          {[
                            { value: 'call', label: 'Call' },
                            { value: 'meeting', label: 'Meeting' },
                            { value: 'email', label: 'Email' }
                          ].map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActivityValue('type', type.value as any);
                                setActivityTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${watchActivity('type') === type.value ? 'bg-primary-50 text-primary-600' : ''
                                }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...registerActivity('type')} />
                  {activityErrors.type && <p className="mt-1 text-sm text-red-600">{activityErrors.type.message}</p>}
                </div>

                <div className="h-[70px] flex flex-col">
                  <Input label="Subject *" {...registerActivity('subject')} error={activityErrors.subject?.message} placeholder="Enter subject" className="h-10" />
                </div>

                <div className="h-[70px] flex flex-col pt-4">
                  <CustomDatePicker
                    label="Activity Date *"
                    value={(() => {
                      const dateValue = watchActivity('activityDate');
                      if (!dateValue) return '';
                      try {
                        const date = new Date(dateValue);
                        return format(date, 'dd-MM-yyyy');
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(value) => {
                      if (!value) {
                        setActivityValue('activityDate', '');
                        return;
                      }
                      try {
                        const [day, month, year] = value.split('-');
                        const currentDateTime = watchActivity('activityDate');
                        let timeString = '';

                        // Preserve existing time if available
                        if (currentDateTime) {
                          try {
                            const existingDate = new Date(currentDateTime);
                            const hours = existingDate.getHours().toString().padStart(2, '0');
                            const minutes = existingDate.getMinutes().toString().padStart(2, '0');
                            timeString = `T${hours}:${minutes}`;
                          } catch {
                            timeString = 'T00:00';
                          }
                        } else {
                          timeString = 'T00:00';
                        }

                        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timeString}`;
                        setActivityValue('activityDate', isoString);
                      } catch {
                        setActivityValue('activityDate', '');
                      }
                    }}
                    placeholder="dd-mm-yyyy"
                    maxDate={new Date()}
                  />
                  {activityErrors.activityDate && <p className="mt-1 text-sm text-red-600">{activityErrors.activityDate.message}</p>}
                </div>

                <div className="h-[70px] flex flex-col pt-4">
                  <CustomTimePicker
                    label="Activity Time *"
                    value={(() => {
                      const dateValue = watchActivity('activityDate');
                      if (!dateValue) return '';
                      try {
                        const date = new Date(dateValue);
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(timeValue) => {
                      const currentDateTime = watchActivity('activityDate');

                      if (!timeValue) return;

                      try {
                        let dateString = '';

                        if (currentDateTime) {
                          // Use existing date
                          const existingDate = new Date(currentDateTime);
                          const year = existingDate.getFullYear();
                          const month = (existingDate.getMonth() + 1).toString().padStart(2, '0');
                          const day = existingDate.getDate().toString().padStart(2, '0');
                          dateString = `${year}-${month}-${day}`;
                        } else {
                          // Use today's date
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = (today.getMonth() + 1).toString().padStart(2, '0');
                          const day = today.getDate().toString().padStart(2, '0');
                          dateString = `${year}-${month}-${day}`;
                        }

                        const isoString = `${dateString}T${timeValue}`;
                        setActivityValue('activityDate', isoString);
                      } catch {
                        // Handle error silently
                      }
                    }}
                    placeholder="HH:MM"
                    error={activityErrors.activityTime?.message}
                  />
                </div>

                <div className="md:col-span-2 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    {...registerActivity('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add details"
                  />
                </div>

                {/* Assign to User field removed as per request */}
              </div>

              <ModalFooter>
                <Button type="button" className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => setIsActivityModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={isActivitySubmitting}>Save Activity</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Reassignment Request Modal */}
        <Modal isOpen={isReassignModalOpen} onClose={() => setIsReassignModalOpen(false)} title="Request Lead Reassignment" size="md" closeOnEscape={false} closeOnOverlayClick={false} showCloseButton={true}>
          <ModalContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Request reassignment of lead: <strong>{selectedLead ? `${selectedLead.firstName} ${selectedLead.lastName}` : ''}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reassignment *
                </label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setReassignReason(e.target.value);
                    }
                  }}
                  placeholder="Please provide a reason for the reassignment request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  maxLength={200}
                  required
                />
                <div className="flex justify-end items-center mt-1">
                  <span className={`text-sm ${reassignReason.length >= 200 ? 'text-red-600' :
                      reassignReason.length >= 180 ? 'text-orange-600' :
                        'text-gray-500'
                    }`}>
                    {reassignReason.length >= 200 ? 'Character limit reached' :
                      reassignReason.length >= 180 ? 'Approaching 200 character limit' : ''}
                    {reassignReason.length >= 180 && ' - '}{reassignReason.length}/200
                  </span>
                </div>
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button
              className="bg-gray-500 hover:bg-gray-600 text-white"
              onClick={() => {
                setIsReassignModalOpen(false);
                setReassignReason('');
              }}
              disabled={isSubmittingReassign}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReassignRequest}
              disabled={!reassignReason.trim() || isSubmittingReassign}
              loading={isSubmittingReassign}
            >
              Submit Request
            </Button>
          </ModalFooter>
        </Modal>

        {/* Validation Error Modal */}
        <ValidationErrorModal
          isOpen={isValidationErrorModalOpen}
          onClose={() => {
            setIsValidationErrorModalOpen(false);
            setValidationErrors([]); // Clear errors when modal is closed
          }}
          errors={validationErrors}
        />

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          title="Unsaved Changes"
          size="xs"
          closeOnOverlayClick={false}
        >
          <ModalContent>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              You have unsaved changes. Are you sure you want to cancel?
            </p>
          </ModalContent>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCancelConfirm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Continue
            </Button>
            <Button variant="danger" onClick={confirmCancel}>Discard</Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
};

export default LeadsManagement;
