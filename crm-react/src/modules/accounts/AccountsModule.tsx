import { logger } from '@/utils/logger';
/**
 * Accounts (Companies) Module
 * List and manage companies with aligned, themed UI
 */

import { formatDateTime } from '@/utils';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Briefcase, Building2, ChevronDown, ChevronLeft, ChevronRight, DollarSign, Download, Eye, Factory, Filter, Globe, MapPin, Pencil, Plus, Search, Target, Trash2, Users, X } from 'lucide-react';
import React from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { companiesApi } from '@/api/companiesApi';
import { contactsApi } from '@/api/contactsApi';
import { leadsApi } from '@/api/leadsApi';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import NumberedPagination from '@/components/ui/NumberedPagination';
import toast from 'react-hot-toast';
import { useCompanies, useCompany, useContacts, useCreateCompany, useDeals, useDeleteCompany, useLeads, useUpdateCompany } from '@/hooks/useApi';
import { formatNumber } from '@/utils';
import { can, getCurrentRole } from '@/utils/rbac';
import { useAppSelector } from '@/lib/store';
import { useFilterManager } from '@/utils/filterManager';
import { clearOtherModulesPagination } from '@/utils/pagination';
import CEOAccountsModule from '../ceo/CEOAccountsModule';

const AccountsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { shouldPreserveFilters } = useFilterManager();
  const dateFilterRef = React.useRef<HTMLDivElement>(null);
  const industryDropdownRef = React.useRef<HTMLDivElement>(null);
  const [industryDropdownOpen, setIndustryDropdownOpen] = React.useState(false);
  const [industrySearchMode, setIndustrySearchMode] = React.useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = React.useState('');
  const [highlightedIndustryIndex, setHighlightedIndustryIndex] = React.useState(-1);
  const industryItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const industryInputRef = React.useRef<HTMLInputElement>(null);

  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Initialize filters from localStorage to persist them
  const [searchQuery, setSearchQuery] = React.useState(() => {
    // Clear search if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('accountsSearchQuery');
      return '';
    }
    return localStorage.getItem('accountsSearchQuery') || '';
  });
  const [selectedIndustry, setSelectedIndustry] = React.useState(() => {
    // Clear industry filter if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('accountsSelectedIndustry');
      return '';
    }
    return localStorage.getItem('accountsSelectedIndustry') || '';
  });
  const [appliedFromDate, setAppliedFromDate] = React.useState(() => {
    return localStorage.getItem('accountsAppliedFromDate') || '';
  });
  const [appliedToDate, setAppliedToDate] = React.useState(() => {
    return localStorage.getItem('accountsAppliedToDate') || '';
  });
  const [fromDate, setFromDate] = React.useState(() => {
    return localStorage.getItem('accountsFromDate') || '';
  });
  const [toDate, setToDate] = React.useState(() => {
    return localStorage.getItem('accountsToDate') || '';
  });
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>(() => {
    return localStorage.getItem('accountsViewMode') as 'table' | 'grid' || 'table';
  });
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = React.useState(false);
  const [dateError, setDateError] = React.useState('');
  
  // Pagination state with localStorage persistence
  const [page, setPage] = React.useState(() => {
    const saved = localStorage.getItem('accountsPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const perPage = 10;

  // Save page to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('accountsPage', page.toString());
  }, [page]);

  // Clear other modules' pagination when this module loads
  React.useEffect(() => {
    clearOtherModulesPagination('accountsPage');
  }, []);

  // Use actual hooks connected to backend
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  // Use actual companies data from backend - replicate leads pattern
  const role = getCurrentRole();
  const currentUser = useAppSelector((s) => s.auth.user);

  

  
  const { data: companiesData, isLoading, error, refetch } = useCompanies({
    search: searchQuery || undefined,
  });
  
  const { data: dealsData } = useDeals({});
  
  // Fetch all contacts to count accounts with contacts
  const { data: allContactsData } = useContacts({});
  const allContacts = (allContactsData as any)?.data || [];
  
  // Clear justLoggedIn flag after component mounts
  React.useEffect(() => {
    sessionStorage.removeItem('justLoggedIn');
  }, []);
  
  logger.info('🔍 All contacts data:', allContacts);
  logger.info('🔍 Sample contact:', allContacts[0]);
  
  logger.info('🏢 AccountsList Debug:', {
    isLoading,
    error: error?.message,
    companiesData,
    role,
    currentUser
  });
  
  const data = companiesData;
  const companiesRaw = (data as any)?.data || [];
  const allDeals = (dealsData as any)?.data || [];
  
  logger.info('📊 Companies raw data:', companiesRaw);
  
  // Fetch leads to check for converted leads with pending reassignment
  const { data: allLeadsResp } = useLeads({ limit: 1000 });
  const allLeads = (allLeadsResp as any)?.data || [];
  
  // Group companies by name to merge duplicates and calculate revenue
  const groupedCompaniesMap = new Map<string, any>();
  companiesRaw.forEach((company: any) => {
    const nameKey = company.name?.toLowerCase().trim() || '';
    if (!groupedCompaniesMap.has(nameKey)) {
      // Calculate revenue from won deals for this company
      const companyDeals = allDeals.filter((deal: any) => 
        deal.company?.toLowerCase() === nameKey && deal.stage === 'won'
      );
      const revenue = companyDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
      
      groupedCompaniesMap.set(nameKey, { ...company, id: company.id, leads: [], companyIds: [company.id], revenue });
      // Check if this company has converted leads with pending reassignment
      const hasConvertedLeadWithPendingReassignment = allLeads.some((lead: any) => 
        lead.companyName?.toLowerCase() === nameKey && 
        lead.status === 'converted' && 
        lead.reassignmentPending === true
      );
      
      groupedCompaniesMap.set(nameKey, { 
        ...company, 
        leads: [], 
        companyIds: [company.id], 
        revenue,
        hasConvertedLeadWithPendingReassignment
      });
    } else {
      const existing = groupedCompaniesMap.get(nameKey);
      existing.companyIds.push(company.id);
      // Keep the first company's ID as the main ID
      
      // Update reassignment status if any company in the group has it
      if (!existing.hasConvertedLeadWithPendingReassignment) {
        existing.hasConvertedLeadWithPendingReassignment = allLeads.some((lead: any) => 
          lead.companyName?.toLowerCase() === nameKey && 
          lead.status === 'converted' && 
          lead.reassignmentPending === true
        );
      }
      
      groupedCompaniesMap.set(nameKey, existing);
    }
  });
  let allCompanies = Array.from(groupedCompaniesMap.values());
  
  // Reset page when filters change (but not when returning from detail view or on initial load)
  React.useEffect(() => {
    // Only reset page if:
    // 1. We have active filters AND
    // 2. This isn't the initial component mount AND
    // 3. We're not returning from a detail view
    const hasActiveFilters = searchQuery || selectedIndustry || appliedFromDate || appliedToDate;
    const isReturningFromDetail = sessionStorage.getItem('returningFromAccountDetail') === 'true';
    
    if (hasActiveFilters && isInitialized && !isReturningFromDetail) {
      setPage(1);
      localStorage.setItem('accountsPage', '1');
    }
    
    // Clear the returning flag after checking
    if (isReturningFromDetail) {
      sessionStorage.removeItem('returningFromAccountDetail');
    }
    
    // Mark as initialized after first render
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [searchQuery, selectedIndustry, appliedFromDate, appliedToDate, isInitialized]);

  // Mark that we're in accounts module and handle cleanup properly
  React.useEffect(() => {
    // Mark that we're in accounts module
    sessionStorage.setItem('inAccountsModule', 'true');
    sessionStorage.setItem('accountsListMounted', 'true');
    
    return () => {
      // Remove the mounted flag when component unmounts
      sessionStorage.removeItem('accountsListMounted');
      
      // Only clear filters if we're actually leaving the accounts module entirely
      // Use a longer delay to account for navigation transitions
      setTimeout(() => {
        const stillInAccounts = window.location.pathname.startsWith('/crm/accounts') || window.location.pathname.startsWith('/crm/Accounts');
        const accountsListStillMounted = sessionStorage.getItem('accountsListMounted');
        
        // Only clear if we're not in accounts module AND the list component isn't mounted elsewhere
        if (!stillInAccounts && !accountsListStillMounted) {
          localStorage.removeItem('accountsSearchQuery');
          localStorage.removeItem('accountsSelectedIndustry');
          localStorage.removeItem('accountsAppliedFromDate');
          localStorage.removeItem('accountsAppliedToDate');
          localStorage.removeItem('accountsFromDate');
          localStorage.removeItem('accountsToDate');
          localStorage.removeItem('accountsViewMode');
          localStorage.removeItem('accountsPage');
          sessionStorage.removeItem('inAccountsModule');
        }
      }, 300);
    };
  }, []);

  // Save filters to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('accountsSearchQuery', searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    localStorage.setItem('accountsSelectedIndustry', selectedIndustry);
  }, [selectedIndustry]);

  React.useEffect(() => {
    localStorage.setItem('accountsAppliedFromDate', appliedFromDate);
  }, [appliedFromDate]);

  React.useEffect(() => {
    localStorage.setItem('accountsAppliedToDate', appliedToDate);
  }, [appliedToDate]);

  React.useEffect(() => {
    localStorage.setItem('accountsFromDate', fromDate);
  }, [fromDate]);

  React.useEffect(() => {
    localStorage.setItem('accountsToDate', toDate);
  }, [toDate]);

  // Save view mode to localStorage
  React.useEffect(() => {
    localStorage.setItem('accountsViewMode', viewMode);
  }, [viewMode]);

  // Close date filter popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setIndustryDropdownOpen(false);
        setIndustrySearchMode(false);
        setIndustrySearchQuery('');
        setHighlightedIndustryIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && industryDropdownOpen) {
        setIndustryDropdownOpen(false);
        setIndustrySearchMode(false);
        setIndustrySearchQuery('');
        setHighlightedIndustryIndex(-1);
      }
    };

    if (isDateFilterOpen || industryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDateFilterOpen, industryDropdownOpen]);

  // Filters are now persisted in localStorage, no need to reset on mount



  // Client-side filtering for search
  const filteredCompanies = React.useMemo(() => {
    let filtered = allCompanies;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(company => 
        company.name?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query) ||
        company.website?.toLowerCase().includes(query) ||
        company.address?.city?.toLowerCase().includes(query) ||
        company.address?.country?.toLowerCase().includes(query)
      );
    }
    
    // Apply industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(company => 
        company.industry?.toLowerCase() === selectedIndustry.toLowerCase()
      );
    }

    // Apply date range filter
    if (appliedFromDate || appliedToDate) {
      filtered = filtered.filter(company => {
        if (!company.createdAt) return false;
        const createdDate = new Date(company.createdAt);
        
        if (appliedFromDate && appliedToDate) {
          try {
            const [day1, month1, year1] = appliedFromDate.split('-');
            const [day2, month2, year2] = appliedToDate.split('-');
            const startDate = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1));
            const endDate = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2));
            endDate.setHours(23, 59, 59, 999); // Include entire end date
            return createdDate >= startDate && createdDate <= endDate;
          } catch {
            return true;
          }
        } else if (appliedFromDate) {
          try {
            const [day, month, year] = appliedFromDate.split('-');
            const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return createdDate >= startDate;
          } catch {
            return true;
          }
        } else if (appliedToDate) {
          try {
            const [day, month, year] = appliedToDate.split('-');
            const endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            endDate.setHours(23, 59, 59, 999);
            return createdDate <= endDate;
          } catch {
            return true;
          }
        }
        return true;
      });
    }
    
    // Sort by creation date - most recent first
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return filtered;
  }, [allCompanies, searchQuery, selectedIndustry, appliedFromDate, appliedToDate]);
  
  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const companies = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCompanies.slice(start, start + perPage);
  }, [filteredCompanies, currentPage]);
  
  const total = filteredCompanies.length;
  
  logger.info('📈 Final companies count:', total, 'filtered by industry:', selectedIndustry, 'date filter:', appliedFromDate, appliedToDate);



  // Generate industry options from actual data - use allCompanies instead of filtered companies
  const industryOptions = React.useMemo(() => {
    const industries = new Set(['']);
    allCompanies.forEach(company => {
      if (company.industry) {
        industries.add(company.industry);
      }
    });
    return [
      { value: '', label: 'All Industries' },
      ...Array.from(industries).filter(Boolean).sort().map(industry => ({
        value: industry,
        label: industry
      }))
    ];
  }, [allCompanies]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading accounts</h3>
          <p className="text-red-600 mb-4">{(error as any).message}</p>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Companies and organizations you work with</p>
        </div>
        <div className="flex items-center space-x-3">
          {can(getCurrentRole(), 'Accounts', 'Create') && getCurrentRole() !== 'Sales_Manager' && (
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>Add Account</Button>
          )}
        </div>
      </div>



      {/* Stats */}
      <div className="flex flex-wrap gap-6 items-stretch">
        {(() => {
          const industryCount = filteredCompanies.reduce((acc, company) => {
            const industry = company.industry || 'Unknown';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const uniqueIndustries = Object.keys(industryCount).filter(ind => ind !== 'Unknown').length;
          
          const totalRevenue = filteredCompanies.reduce((sum, c) => sum + (c.revenue || 0), 0);
          
          // Count accounts with MORE THAN ONE contact
          const accountsWithContacts = filteredCompanies.filter(c => {
            const contactsForAccount = allContacts.filter((contact: any) => {
              const accountIdMatch = contact.accountId === c.id || c.companyIds?.includes(contact.accountId);
              const companyNameMatch = contact.companyName?.toLowerCase() === c.name?.toLowerCase();
              return accountIdMatch || companyNameMatch;
            });
            logger.info(`🏛️ Account ${c.name} (ID: ${c.id}) has ${contactsForAccount.length} contacts`);
            return contactsForAccount.length > 1;
          }).length;
          
          logger.info('📊 Accounts with more than 1 contact:', accountsWithContacts);
          
          return [{
            label: 'Total Accounts', 
            value: formatNumber(total), 
            icon: <Users className="w-5 h-5 text-blue-600" />, 
            color: ''
          }, {
            label: selectedIndustry || 'All Industries', 
            value: selectedIndustry ? filteredCompanies.length.toString() : uniqueIndustries.toString(), 
            icon: <Briefcase className="w-5 h-5 text-purple-600" />, 
            color: ''
          }, {
            label: 'With Contacts', 
            value: accountsWithContacts.toString(), 
            icon: <Users className="w-5 h-5 text-orange-600" />, 
            color: ''
          }, {
            label: 'Total Prospect Value', 
            value: `$${formatNumber(totalRevenue)}`, 
            icon: <DollarSign className="w-5 h-5 text-green-600" />, 
            color: ''
          }];
        })().map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} className="flex-1 min-w-[200px]">
            <Card className="h-full">
              <CardContent className="px-3 py-2 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center preserve-icon-color`}>{s.icon}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md relative">
              <Input placeholder="Search accounts" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={industryDropdownRef}>
                <input
                  ref={industryInputRef}
                  type="text"
                  value={industrySearchMode ? industrySearchQuery : (selectedIndustry || 'All Industries')}
                  onChange={(e) => {
                    setIndustrySearchQuery(e.target.value);
                    setIndustryDropdownOpen(true);
                    setHighlightedIndustryIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const filteredOptions = industryOptions.filter(option => 
                      option.label.toLowerCase().includes(industrySearchQuery.toLowerCase())
                    );
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndustryIndex(prev => {
                        const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                        setTimeout(() => industryItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndustryIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : 0;
                        setTimeout(() => industryItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'Enter' && highlightedIndustryIndex >= 0) {
                      e.preventDefault();
                      const option = filteredOptions[highlightedIndustryIndex];
                      if (option) {
                        setSelectedIndustry(option.value);
                        setIndustryDropdownOpen(false);
                        setHighlightedIndustryIndex(-1);
                        setIndustrySearchMode(false);
                        setIndustrySearchQuery('');
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIndustryDropdownOpen(false);
                      setIndustrySearchMode(false);
                      setIndustrySearchQuery('');
                      setHighlightedIndustryIndex(-1);
                    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                      setIndustrySearchMode(true);
                    }
                  }}
                  onClick={() => {
                    setIndustryDropdownOpen(!industryDropdownOpen);
                    if (!industryDropdownOpen) {
                      setIndustrySearchMode(false);
                      setIndustrySearchQuery('');
                      setHighlightedIndustryIndex(-1);
                    }
                  }}
                  readOnly={!industrySearchMode}
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="h-10 w-full px-4 pr-20 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
                />
                {industrySearchQuery && industrySearchMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndustrySearchQuery('');
                      setIndustrySearchMode(false);
                      industryInputRef.current?.focus();
                    }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${industryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                
                {industryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                    <div className="p-2">
                      {(() => {
                        const filteredOptions = industryOptions.filter(option => 
                          option.label.toLowerCase().includes(industrySearchQuery.toLowerCase())
                        );
                        
                        if (filteredOptions.length === 0) {
                          return (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              No accounts found
                            </div>
                          );
                        }
                        
                        return filteredOptions.map((option, index) => {
                          const query = industrySearchQuery.toLowerCase();
                          const label = option.label;
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
                              key={option.value}
                              ref={el => industryItemRefs.current[index] = el}
                              onClick={() => {
                                setSelectedIndustry(option.value);
                                setIndustrySearchQuery('');
                                setIndustryDropdownOpen(false);
                                setHighlightedIndustryIndex(-1);
                                setIndustrySearchMode(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                highlightedIndustryIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                selectedIndustry === option.value ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
              <div className="relative" ref={dateFilterRef}>
                <Button 
                  variant="ghost"
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                  className="text-black border border-gray-200 hover:bg-gray-50"
                >
                  Date Filter {(appliedFromDate || appliedToDate) && '✓'}
                </Button>
                {isDateFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-40"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter by Date Range</h3>
                    <div className="space-y-3">
                      <CustomDatePicker
                        label="From Date"
                        value={fromDate}
                        onChange={(value) => {
                          setFromDate(value);
                          if (toDate && value) {
                            try {
                              const [day1, month1, year1] = value.split('-');
                              const [day2, month2, year2] = toDate.split('-');
                              const fromDateObj = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1));
                              const toDateObj = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2));
                              if (fromDateObj > toDateObj) {
                                setDateError('From Date cannot be later than To Date');
                              } else {
                                setDateError('');
                              }
                            } catch {
                              setDateError('');
                            }
                          } else {
                            setDateError('');
                          }
                        }}
                        placeholder="dd-mm-yyyy"
                        maxDate={new Date()}
                      />
                      <CustomDatePicker
                        label="To Date"
                        value={toDate}
                        onChange={(value) => {
                          setToDate(value);
                          if (fromDate && value) {
                            try {
                              const [day1, month1, year1] = fromDate.split('-');
                              const [day2, month2, year2] = value.split('-');
                              const fromDateObj = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1));
                              const toDateObj = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2));
                              if (toDateObj < fromDateObj) {
                                setDateError('To Date cannot be earlier than From Date');
                              } else {
                                setDateError('');
                              }
                            } catch {
                              setDateError('');
                            }
                          } else {
                            setDateError('');
                          }
                        }}
                        placeholder="dd-mm-yyyy"
                        maxDate={new Date()}
                        minDate={fromDate ? (() => {
                          try {
                            const [day, month, year] = fromDate.split('-');
                            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          } catch {
                            return undefined;
                          }
                        })() : undefined}
                      />
                      {dateError && (
                        <div className="text-red-500 text-xs mt-1">{dateError}</div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFromDate('');
                            setToDate('');
                            setAppliedFromDate('');
                            setAppliedToDate('');
                            setSearchQuery('');
                            setSelectedIndustry('');
                            setDateError('');
                            setIsDateFilterOpen(false);
                            // Clear from localStorage
                            localStorage.removeItem('accountsFromDate');
                            localStorage.removeItem('accountsToDate');
                            localStorage.removeItem('accountsAppliedFromDate');
                            localStorage.removeItem('accountsAppliedToDate');
                            localStorage.removeItem('accountsSearchQuery');
                            localStorage.removeItem('accountsSelectedIndustry');
                          }}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (dateError) {
                              return;
                            }
                            setAppliedFromDate(fromDate);
                            setAppliedToDate(toDate);
                            setIsDateFilterOpen(false);
                          }}
                          className="flex-1"
                          disabled={!!dateError}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Table view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts (switchable view) */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Accounts ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Industry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Website</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-4 w-full max-w-[220px] bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              {/* <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" /> */}
              {/* <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3> */}
              <p className="text-gray-500 mb-4">
                {(appliedFromDate || appliedToDate) ? 'No accounts found in the selected date range.' :
                 searchQuery ? 'Try adjusting your search criteria' : 'No accounts available to display'}
              </p>
              

            </div>
          ) : viewMode === 'table' ? (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Industry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                    <th className="text-left py-3 px-1 font-medium text-gray-600">Number of Employees</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c: any, idx: number) => (
                    <motion.tr
                      key={c.id || `company_${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 preserve-icon-color" />
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <div title={c.name}>
                              <button onClick={() => {
                                console.log('Company name click - Account object:', c);
                                console.log('Account ID:', c.id, 'companyIds:', c.companyIds);
                                console.log('All company IDs available:', c.companyIds);
                                // Use the first company ID from the grouped companies array
                                const accountId = (c.companyIds && c.companyIds.length > 0) ? c.companyIds[0] : c.id;
                                console.log('Using account ID for name click:', accountId);
                                if (accountId) {
                                  // Set flag to indicate we're navigating to detail view
                                  sessionStorage.setItem('navigatingToAccountDetail', 'true');
                                  navigate(`/crm/Accounts/${accountId}`);
                                } else {
                                  console.error('No valid account ID found');
                                }
                              }} className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate block max-w-full">
                                {c.name}
                              </button>
                            </div>
                            {c.address?.city && (
                              <div className="text-sm text-gray-500 truncate">{c.address.city}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {c.industry ? (
                          <Badge size="sm" variant="info" className="capitalize">{c.industry}</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {c.address ? (
                          <span className="text-sm text-gray-700 inline-flex items-center gap-2 max-w-[220px]">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate inline-block">
                              {c.address.city}{c.address.city && (c.address.state || c.address.country) ? ', ' : ''}
                              {c.address.state}{c.address.state && c.address.country ? ', ' : ''}
                              {c.address.country}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {c.numberOfEmployees ? (
                          <Badge size="sm" variant="default">
                            {c.numberOfEmployees.toLocaleString('en-US')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" aria-label="View account" className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100" onClick={() => {
                            console.log('View button click - Account object:', c);
                            console.log('Account ID:', c.id, 'companyIds:', c.companyIds);
                            console.log('All company IDs available:', c.companyIds);
                            // Use the first company ID from the grouped companies array
                            const accountId = (c.companyIds && c.companyIds.length > 0) ? c.companyIds[0] : c.id;
                            console.log('Using account ID for view:', accountId);
                            if (accountId) {
                              // Set flag to indicate we're navigating to detail view
                              sessionStorage.setItem('navigatingToAccountDetail', 'true');
                              navigate(`/crm/Accounts/${accountId}`);
                            } else {
                              console.error('No valid account ID found');
                            }
                          }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {can(getCurrentRole(), 'Accounts', 'Edit') && getCurrentRole() !== 'Sales_Manager' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              aria-label="Edit account" 
                              className={`p-2 rounded-full ${
                                c.hasConvertedLeadWithPendingReassignment 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'
                              }`}
                              disabled={c.hasConvertedLeadWithPendingReassignment}
                              onClick={c.hasConvertedLeadWithPendingReassignment ? undefined : () => { setEditing(c); setIsEditOpen(true); }}
                              title={c.hasConvertedLeadWithPendingReassignment ? 'Cannot edit - Account linked to converted lead with pending reassignment' : 'Edit account'}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {can(getCurrentRole(), 'Accounts', 'Delete') && getCurrentRole() !== 'Sales_Manager' && (
                            <Button size="sm" variant="ghost" aria-label="Delete account" className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100" onClick={() => setDeleting(c)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {companies.map((c: any, idx: number) => (
                <motion.div key={c.id || `company_${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="h-full">
                  <Card className="h-full border border-gray-200/70 hover:border-gray-300 shadow-sm hover:shadow-md transition-all rounded-xl">
                    <CardContent className="p-5 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Building2 className="w-5 h-5 preserve-icon-color" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-gray-900 leading-6 truncate">{c.name}</h3>
                            <div className="mt-1 flex items-center gap-2">
                              {c.industry && <Badge size="sm" variant="info" className="capitalize">{c.industry}</Badge>}
                              {c.numberOfEmployees && (
                                <Badge size="sm" variant="default">
                                  {c.numberOfEmployees.toLocaleString('en-US')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-700">
                        {c.website && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a href={c.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate">
                              {c.website}
                            </a>
                          </div>
                        )}
                        {c.address && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500 min-w-0">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {c.address.city}{c.address.city && (c.address.state || c.address.country) ? ', ' : ''}
                                {c.address.state}{c.address.state && c.address.country ? ', ' : ''}
                                {c.address.country}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 -mr-2">
                              <Button size="sm" variant="ghost" aria-label="View account" className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100" onClick={() => {
                                console.log('Grid view button click - Account object:', c);
                                console.log('Account ID:', c.id, 'companyIds:', c.companyIds);
                                // Use the first company ID from the grouped companies array
                                const accountId = (c.companyIds && c.companyIds.length > 0) ? c.companyIds[0] : c.id;
                                console.log('Using account ID for grid view:', accountId);
                                if (accountId) {
                                  // Set flag to indicate we're navigating to detail view
                                  sessionStorage.setItem('navigatingToAccountDetail', 'true');
                                  navigate(`/crm/Accounts/${accountId}`);
                                }
                              }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {can(getCurrentRole(), 'Accounts', 'Edit') && getCurrentRole() !== 'Sales_Manager' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  aria-label="Edit account" 
                                  className={`p-2 rounded-full ${
                                    c.hasConvertedLeadWithPendingReassignment 
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'
                                  }`}
                                  disabled={c.hasConvertedLeadWithPendingReassignment}
                                  onClick={c.hasConvertedLeadWithPendingReassignment ? undefined : () => { setEditing(c); setIsEditOpen(true); }}
                                  title={c.hasConvertedLeadWithPendingReassignment ? 'Cannot edit - Account linked to converted lead with pending reassignment' : 'Edit account'}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              {can(getCurrentRole(), 'Accounts', 'Delete') && getCurrentRole() !== 'Sales_Manager' && (
                                <Button size="sm" variant="ghost" aria-label="Delete account" className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100" onClick={() => setDeleting(c)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {filteredCompanies.length > 0 && totalPages > 1 && (
            <div className="mt-4">
              <NumberedPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
                totalItems={filteredCompanies.length}
                itemsPerPage={perPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Account Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Account" size="lg" closeOnOverlayClick={false}>
        <ModalContent>
          <AccountForm
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={async (values) => {
              try {
                logger.info('🚀 Submitting account form with values:', values);
                const result = await createCompany.mutateAsync(values);
                logger.info('✅ Account created successfully:', result);
                
                // Create contact if contact information is provided
                if (values.contactName && values.email && result?.data?.id) {
                  try {
                    const contactData = {
                      name: values.contactName,
                      email: values.email,
                      phoneNumber: values.phoneNumber || '',
                      accountId: result.data.id,
                      type: 'prospect',
                      status: 'active',
                      designation: values.jobTitle || ''
                    };
                    
                    await contactsApi.create(contactData);
                    logger.info('✅ Contact created successfully for account');
                  } catch (contactError: any) {
                    logger.error('❌ Contact creation failed:', contactError);
                    // Don't fail the entire process if contact creation fails
                  }
                }
                
                setIsCreateOpen(false);
                
                // Show success message
                toast.success(`Account "${values.accountName}" created successfully!`);
                
                // Refresh the accounts list
                await refetch();
                
                // Navigate to the new account detail page
                if (result?.data?.id) {
                  navigate(`/crm/Accounts/${result.data.id}`);
                }
              } catch (error: any) {
                logger.error('❌ Account creation failed:', error);
                // Extract and clean the meaningful part of the error message
                let cleanMessage = error.message || 'Failed to create account. Please try again.';
                
                // Extract the actual error message after the last colon
                const parts = cleanMessage.split(':');
                if (parts.length > 1) {
                  cleanMessage = parts[parts.length - 1].trim();
                }
                
                // Decode HTML entities
                cleanMessage = cleanMessage
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>');
                  
                toast.error(cleanMessage);
              }
            }}
          />
        </ModalContent>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditing(null); }} title={editing ? `Edit Account — ${editing.name}` : 'Edit Account'} size="lg" closeOnOverlayClick={false}>
        <ModalContent>
          {editing && (
            <AccountForm
              initialValues={(() => {
                logger.info('🔍 RAW editing account data:', JSON.stringify(editing, null, 2));
                logger.info('🏭 Industry from editing.industry:', editing.industry);
                logger.info('🏭 All industry-related fields:', {
                  industry: editing.industry,
                  'editing.industry': editing.industry,
                  keys: Object.keys(editing)
                });
                const values = {
                  accountName: editing.name || '',
                  website: editing.website || '',
                  industry: editing.industry || '',
                  numberOfEmployees: editing.numberOfEmployees?.toString() || '',
                  country: editing.address?.country || editing.country || '',
                  city: editing.companyLocation || editing.address?.city || editing.city || '',
                  contactName: editing.contactName || '',
                  email: editing.email || '',
                  phoneNumber: editing.phoneNumber || '',
                  jobTitle: editing.jobTitle || '',
                };
                logger.info('📝 Form initial values with industry:', values.industry);
                return values;
              })()}
              onCancel={() => { setIsEditOpen(false); setEditing(null); }}
              onSubmit={async (values) => {
                try {
                  await updateCompany.mutateAsync({ id: editing.id, data: values });
                  
                  // Trigger backend sync for related leads
                  try {
                    // Find and update related leads with the same company name
                    const leadsResp = await leadsApi.list({ q: editing.name });
                    const relatedLeads = leadsResp.data.filter((lead: any) => 
                      lead.companyName?.toLowerCase() === editing.name?.toLowerCase()
                    );
                    
                    // Update each related lead with new account info
                    for (const lead of relatedLeads) {
                      await leadsApi.update(lead.leadId || lead.id, {
                        ...lead,
                        companyName: values.accountName,
                        industry: values.industry,
                        companyLocation: values.city,
                        country: values.country,
                        website: values.website,
                        numberOfEmployees: values.numberOfEmployees
                      });
                    }
                  } catch (syncError) {
                    console.warn('Lead sync warning:', syncError);
                  }
                  
                  toast.success(`Account "${values.accountName}" updated successfully!`);
                  setIsEditOpen(false);
                  setEditing(null);
                  // Refresh all related data
                  await refetch();
                  // Invalidate all related query caches to sync data across modules
                  queryClient.invalidateQueries({ queryKey: ['companies'] });
                  queryClient.invalidateQueries({ queryKey: ['leads'] });
                  queryClient.invalidateQueries({ queryKey: ['contacts'] });
                  queryClient.invalidateQueries({ queryKey: ['deals'] });
                  // Also invalidate any other possible lead query keys
                  queryClient.invalidateQueries({ predicate: (query) => 
                    query.queryKey[0] === 'leads' || 
                    query.queryKey[0] === 'lead' ||
                    (Array.isArray(query.queryKey) && query.queryKey.some(key => 
                      typeof key === 'string' && key.toLowerCase().includes('lead')
                    ))
                  });
                } catch (error: any) {
                  console.error('Update error:', error);
                  // Only show error if it's actually an error (not a successful update)
                  if (error?.response?.status && error.response.status >= 400) {
                    let cleanMessage = error.message || 'Failed to update account. Please try again.';
                    
                    // Extract the actual error message after the last colon
                    const parts = cleanMessage.split(':');
                    if (parts.length > 1) {
                      cleanMessage = parts[parts.length - 1].trim();
                    }
                    
                    // Decode HTML entities
                    cleanMessage = cleanMessage
                      .replace(/&#39;/g, "'")
                      .replace(/&quot;/g, '"')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>');
                      
                    toast.error(cleanMessage);
                  } else {
                    // If no clear error status, assume success
                    toast.success(`Account "${values.accountName}" updated successfully!`);
                    setIsEditOpen(false);
                    setEditing(null);
                    // Refresh all related data
                    await refetch();
                    // Invalidate all related query caches to sync data across modules
                    queryClient.invalidateQueries({ queryKey: ['companies'] });
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                    queryClient.invalidateQueries({ queryKey: ['contacts'] });
                    queryClient.invalidateQueries({ queryKey: ['deals'] });
                    // Also invalidate any other possible lead query keys
                    queryClient.invalidateQueries({ predicate: (query) => 
                      query.queryKey[0] === 'leads' || 
                      query.queryKey[0] === 'lead' ||
                      (Array.isArray(query.queryKey) && query.queryKey.some(key => 
                        typeof key === 'string' && key.toLowerCase().includes('lead')
                      ))
                    });
                  }
                }
              }}
            />
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={Boolean(deleting) && !deleting?.showAdvanced} onClose={() => setDeleting(null)} title="Delete Account" size="md">
        <ModalContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{deleting?.name}</span>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning: Associated Records</p>
                  <p>This account may have associated deals and contacts. Deleting it will affect related data.</p>
                </div>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={async () => {
                // Try normal delete first
                try {
                  // Collect related contact emails before deleting account (best-effort)
                  let relatedEmails: string[] = [];
                  try {
                    const idMatch = String(deleting.id ?? '').match(/(\d+)$/);
                    const accountIdNum = idMatch ? parseInt(idMatch[1], 10) : NaN;
                    let contactsResp: any = null;
                    if (!Number.isNaN(accountIdNum)) {
                      contactsResp = await contactsApi.list({ filters: { accountId: accountIdNum } as any });
                    } else {
                      // Fallback: try by account name search
                      const name = companiesRaw.find((cc:any)=>cc.id===deleting.id)?.name;
                      contactsResp = await contactsApi.list({ q: name });
                    }
                    relatedEmails = (contactsResp?.data || [])
                      .map((c: any) => (c.email || '').toLowerCase())
                      .filter(Boolean);
                  } catch {}

                  await deleteCompany.mutateAsync(deleting.id);
                  // Attempt to rollback related converted leads to 'unqualified'
                  try {
                    const name = companiesRaw.find((cc:any)=>cc.id===deleting.id)?.name;
                    const leadsResp = await leadsApi.list({ q: name });
                    const lowerName = (name || '').toLowerCase();
                    const matching = leadsResp.data.filter((l:any)=>
                      (l.companyName || '').toLowerCase() === lowerName ||
                      (l.email && relatedEmails.includes((l.email || '').toLowerCase()))
                    );
                    for (const lead of matching) {
                      if (lead.status === 'converted') {
                        await leadsApi.update(lead.leadId || lead.id, { ...lead, status: 'unqualified' });
                      }
                    }
                  } catch (e) {
                    logger.warn('Lead rollback warning:', e);
                  }
                  // Refresh leads data in UI
                  queryClient.invalidateQueries({ queryKey: ['leads'] });
                  setDeleting(null);
                } catch (err: any) {
                  const msg = err?.message || '';
                  // More robust error detection
                  if (msg.includes('409') || msg.includes('Conflict') || msg.includes('associated') || msg.includes('Cannot delete')) {
                    // Show advanced options
                    setDeleting({ ...deleting, showAdvanced: true, error: msg });
                  } else {
                    alert(`Failed to delete: ${msg}`);
                  }
                }
              }}>Delete</Button>
              <Button variant="danger" onClick={async () => {
                // Direct force delete option
                if (confirm('This will permanently delete the account and all associated deals and contacts. This action cannot be undone. Continue?')) {
                  try {
                    await companiesApi.forceDelete(deleting.id);
                    alert('Account and all associated records deleted successfully');
                    setDeleting(null);
                    // Refresh the page to update the list
                    window.location.reload();
                  } catch (err: any) {
                    alert(`Force delete failed: ${err?.message || 'Unknown error'}`);
                  }
                }
              }}>Force Delete All</Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Advanced Delete Options Modal */}
      <Modal isOpen={Boolean(deleting?.showAdvanced)} onClose={() => setDeleting(null)} title="Delete Account - Advanced Options" size="lg">
        <ModalContent>
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-red-800">
                  <p className="font-medium">Cannot Delete Account</p>
                  <p>{deleting?.error}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Choose how to proceed:</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="deleteOption"
                      value="reassign"
                      className="mt-1"
                      onChange={() => setDeleting({ ...deleting, selectedOption: 'reassign' })}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Reassign to Another Account</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Move all associated deals and contacts to another existing account, then delete this one.
                      </p>
                      {deleting?.selectedOption === 'reassign' && (
                        <div className="mt-3">
                          <select
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            onChange={(e) => setDeleting({ ...deleting, targetAccountId: e.target.value })}
                          >
                            <option value="">Select target account...</option>
                            {companies.filter(c => c.id !== deleting.id).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="deleteOption"
                      value="force"
                      className="mt-1"
                      onChange={() => setDeleting({ ...deleting, selectedOption: 'force' })}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Force Delete (Remove All)</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Permanently delete this account and all its associated deals and contacts. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!deleting?.selectedOption || (deleting?.selectedOption === 'reassign' && !deleting?.targetAccountId)}
              onClick={async () => {
                try {
                  const deletedName = companiesRaw.find((cc:any)=>cc.id===deleting.id)?.name;
                  if (deleting?.selectedOption === 'reassign') {
                    // First reassign data, then delete
                    await companiesApi.reassign(deleting.id, deleting.targetAccountId, {
                      moveContacts: true,
                      deleteSource: true
                    });
                    // After successful reassign+delete, rollback any converted leads (by company name)
                    try {
                      // Best-effort: use company name and any emails from source account contacts
                      let relatedEmails: string[] = [];
                      try {
                        const idMatch = String(deleting.id ?? '').match(/(\d+)$/);
                        const accountIdNum = idMatch ? parseInt(idMatch[1], 10) : NaN;
                        let contactsResp: any = null;
                        if (!Number.isNaN(accountIdNum)) {
                          contactsResp = await contactsApi.list({ filters: { accountId: accountIdNum } as any });
                        } else if (deletedName) {
                          // Fallback: try by account name search
                          contactsResp = await contactsApi.list({ q: deletedName });
                        }
                        relatedEmails = (contactsResp?.data || [])
                          .map((c: any) => (c.email || '').toLowerCase())
                          .filter(Boolean);
                      } catch {}
                      if (deletedName) {
                        const leadsResp = await leadsApi.list({ q: deletedName });
                        const lower = deletedName.toLowerCase();
                        const matching = leadsResp.data.filter((l:any)=>
                          (l.companyName || '').toLowerCase() === lower ||
                          (l.email && relatedEmails.includes((l.email || '').toLowerCase()))
                        );
                        for (const lead of matching) {
                          if (lead.status === 'converted') {
                            await leadsApi.update(lead.leadId || lead.id, { ...lead, status: 'unqualified' });
                          }
                        }
                      }
                    } catch (e) {
                      logger.warn('Lead rollback warning (reassign):', e);
                    }
                    alert('Account data reassigned and source account deleted successfully');
                  } else if (deleting?.selectedOption === 'force') {
                    // Force delete with all associated records
                    await companiesApi.forceDelete(deleting.id);
                    // After successful force delete, rollback any converted leads (by company name or matching contact emails)
                    try {
                      let relatedEmails: string[] = [];
                      try {
                        const idMatch = String(deleting.id ?? '').match(/(\d+)$/);
                        const accountIdNum = idMatch ? parseInt(idMatch[1], 10) : NaN;
                        let contactsResp: any = null;
                        if (!Number.isNaN(accountIdNum)) {
                          contactsResp = await contactsApi.list({ filters: { accountId: accountIdNum } as any });
                        } else if (deletedName) {
                          // Fallback: try by account name search
                          contactsResp = await contactsApi.list({ q: deletedName });
                        }
                        relatedEmails = (contactsResp?.data || [])
                          .map((c: any) => (c.email || '').toLowerCase())
                          .filter(Boolean);
                      } catch {}
                      if (deletedName) {
                        const leadsResp = await leadsApi.list({ q: deletedName });
                        const lower = deletedName.toLowerCase();
                        const matching = leadsResp.data.filter((l:any)=>
                          (l.companyName || '').toLowerCase() === lower ||
                          (l.email && relatedEmails.includes((l.email || '').toLowerCase()))
                        );
                        for (const lead of matching) {
                          if (lead.status === 'converted') {
                            await leadsApi.update(lead.leadId || lead.id, { ...lead, status: 'unqualified' });
                          }
                        }
                      }
                    } catch (e) {
                      logger.warn('Lead rollback warning (force):', e);
                    }
                    alert('Account and all associated records deleted successfully');
                  }
                  // Refresh leads data in UI
                  queryClient.invalidateQueries({ queryKey: ['leads'] });
                  setDeleting(null);
                  // Refresh the companies list
                  window.location.reload();
                } catch (err: any) {
                  const errorMessage = err?.message || 'Unknown error';
                  if (errorMessage.includes('associated deal') || errorMessage.includes('associated contact')) {
                    alert('Cannot delete account due to associated deals or contacts. Please reassign or remove them first.');
                  } else {
                    alert(`Operation failed: ${errorMessage}`);
                  }
                }
              }}
            >
              {deleting?.selectedOption === 'reassign' ? 'Reassign & Delete' : 'Force Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      

    </div>
  );
};

const PeopleTable: React.FC<{
  leads: any[];
  contacts: any[];
  companyName: string;
}> = ({ leads, contacts }) => {
  // Filter out converted leads to avoid duplicates
  const unconvertedLeads = leads.filter((l: any) => l.status !== 'converted' && l.status !== 'Converted');
  
  // Normalize to a unified shape: id, name, email, phone, mobile, designation, type, createdAt
  const normalizedLeads = unconvertedLeads.map((l: any) => ({
    id: l.id || l.leadId,
    name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || l.email,
    email: l.email || '',
    phoneNumber: l.phoneNumber || '',
    countryCode: l.countryCode || '',
    designation: l.designation || '',
    type: l.type || 'lead',
    createdAt: l.createdAt,
  }));
  const normalizedContacts = contacts.map((c: any) => ({
    id: c.id,
    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    email: c.email || '',
    phoneNumber: c.phoneNumber || '',
    countryCode: c.countryCode || '',
    designation: c.title || c.designation || '',
    type: c.type || 'customer',
    createdAt: c.createdAt,
  }));
  
  // Further deduplicate by email to handle any remaining duplicates
  const emailMap = new Map<string, any>();
  const allPeopleRaw = [...normalizedLeads, ...normalizedContacts];
  
  allPeopleRaw.forEach(person => {
    const email = person.email?.toLowerCase().trim();
    if (email && emailMap.has(email)) {
      // Keep the contact over the lead if both exist
      const existing = emailMap.get(email);
      const isExistingContact = contacts.some(c => c.id === existing.id);
      const isCurrentContact = contacts.some(c => c.id === person.id);
      
      if (isCurrentContact && !isExistingContact) {
        emailMap.set(email, person);
      }
    } else if (email) {
      emailMap.set(email, person);
    } else {
      // For people without email, add them with a unique key
      const uniqueKey = `no-email-${person.id}-${person.name}`;
      emailMap.set(uniqueKey, person);
    }
  });
  
  const allPeople = Array.from(emailMap.values());

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Created At</th>
          </tr>
        </thead>
        <tbody>
          {allPeople.map((person, idx) => (
            <motion.tr
              key={person.id || `person_${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate max-w-[300px]">{person.name}</div>
                    {person.designation && (
                      <div className="text-sm text-gray-500 truncate max-w-[300px]">{person.designation}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                {person.email ? (
                  <a href={`mailto:${person.email}`} className="text-primary-600 hover:underline truncate inline-block max-w-[200px]">
                    {person.email}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {person.type ? (
                  <Badge size="sm" variant="info" className="capitalize">
                    {person.type}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {person.phoneNumber ? (
                  <div className="text-sm text-gray-700">
                    {person.phoneNumber && <div>{person.countryCode ? `${person.countryCode} ${person.phoneNumber}` : person.phoneNumber}</div>}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-700">
                  {person.createdAt ? formatDateTime(person.createdAt) : '-'}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AccountDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [revenue, setRevenue] = React.useState<number>(0);
  const [totalDealValue, setTotalDealValue] = React.useState<number>(0);
  const [dealsCount, setDealsCount] = React.useState<number>(0);

  const role = getCurrentRole();
  
  // Validate ID parameter
  if (!id || isNaN(Number(id))) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Account ID</h3>
          <p className="text-gray-500 mb-4">The account ID provided is not valid.</p>
          <Button onClick={() => navigate('/crm/Accounts')}>Back to Accounts</Button>
        </div>
      </div>
    );
  }
  
  const accountId = parseInt(id);
  
  // Use regular accounts API for all roles to ensure data consistency
  const { data: companyResp, isLoading: companyLoading, error: companyError, refetch: refetchCompany } = useCompany(id!);
  const { data: contactsResp, isLoading: contactsLoading } = useContacts({
    filters: { accountId: accountId },
  });
  const { data: dealsResp, isLoading: dealsLoading } = useDeals({
    filters: { accountId: accountId },
  });
  
  const [tab, setTab] = React.useState<'combined' | 'overview' | 'people' | 'deals'>('combined');

  // Use regular company data for all roles to ensure consistency
  const company = (companyResp as any)?.data;
  
  const companyName = company?.name || company?.companyName || '';

  // Get all company IDs grouped under this company name from the accounts list grouping
  // This requires a way to get companyIds for the grouped company; since we don't have global state here,
  // we will fetch leads by company name as before but also fetch leads by company IDs if possible.

  // For now, fetch all merged companies by IDs to get their names
  const companyIdsList = company?.companyIds || [accountId];
  const { data: mergedCompaniesResp, isLoading: mergedCompaniesLoading } = useCompanies({
    filters: { ids: companyIdsList },
  });
  const mergedCompanies = (mergedCompaniesResp as any)?.data || [];
  const mergedCompanyNames = mergedCompanies.map((c: any) => c.name.toLowerCase());

  // Fetch leads by main company name using search
  const { data: leadsResp, isLoading: leadsLoading } = useLeads({
    search: companyName,
    limit: 100,
  });

  const leads = (leadsResp as any)?.data || [];
  const contacts = (contactsResp as any)?.data || [];
  const deals = (dealsResp as any)?.data || [];

  // Debug: Log contacts data to console
  logger.info('DEBUG: Contacts data for account', accountId, contacts);
  logger.info('DEBUG: Contacts length:', contacts.length);
  logger.info('DEBUG: Full contacts response:', contactsResp);
  logger.info('DEBUG: Deals data for account', accountId, deals);
  
  React.useEffect(() => {
    // Clear navigation flag when detail component mounts
    sessionStorage.removeItem('navigatingToAccountDetail');
  }, []);

  // Auto-refresh company data every 5 seconds to show updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetchCompany();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetchCompany]);
  
  React.useEffect(() => {
    setDealsCount(deals.length);
  }, [deals.length]);
  
  React.useEffect(() => {
    if (accountId) {
      fetch(`/api/accounts/${accountId}/revenue`)
        .then(res => res.json())
        .then(data => setRevenue(data.revenue || 0))
        .catch(err => logger.error('Failed to fetch revenue:', err));
      
      fetch(`/api/accounts/${accountId}/total-deal-value`)
        .then(res => res.json())
        .then(data => setTotalDealValue(data.totalDealValue || 0))
        .catch(err => logger.error('Failed to fetch total deal value:', err));
    }
  }, [accountId, dealsResp, companyResp]);

  // Filter leads to include only those whose company name matches any of the merged company names
  const leadsFiltered = leads.filter((l: any) => mergedCompanyNames.includes((l.companyName || '').toLowerCase()));
  // Contacts are already filtered by accountId when fetched from backend, no need to filter again
  const contactsFiltered = contacts;
  const dealsFiltered = deals;
  
  // Calculate deduplicated people count for stats
  const unconvertedLeads = leadsFiltered.filter((l: any) => l.status !== 'converted' && l.status !== 'Converted');
  const emailSet = new Set<string>();
  let uniquePeopleCount = 0;
  
  // Count unique contacts
  contactsFiltered.forEach((c: any) => {
    const email = c.email?.toLowerCase().trim();
    if (email && !emailSet.has(email)) {
      emailSet.add(email);
      uniquePeopleCount++;
    } else if (!email) {
      uniquePeopleCount++; // Count people without email as unique
    }
  });
  
  // Count unique unconverted leads (only if email not already in contacts)
  unconvertedLeads.forEach((l: any) => {
    const email = l.email?.toLowerCase().trim();
    if (email && !emailSet.has(email)) {
      emailSet.add(email);
      uniquePeopleCount++;
    } else if (!email) {
      uniquePeopleCount++; // Count people without email as unique
    }
  });

  const loading = companyLoading || contactsLoading || leadsLoading || mergedCompaniesLoading || dealsLoading;

  // Error handling - use regular error handling for all roles
  if (companyError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading account</h3>
          <p className="text-gray-500">{(companyError as any)?.message || 'Failed to load account details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Set flag to indicate we're returning from detail view
              sessionStorage.setItem('returningFromAccountDetail', 'true');
              navigate('/crm/Accounts');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{company?.name || 'Account'}</h1>
            {/* <div className="mt-1 flex items-center gap-2">
              {company?.industry && <Badge size="sm" variant="info" className="capitalize">{company.industry}</Badge>}
            </div> */}
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {company?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{company.website}</a>
                </div>
              )}
              {company?.address && (
                <div className="truncate">
                  {company.address.city}{company.address.city && (company.address.state || company.address.country) ? ', ' : ''}
                  {company.address.state}{company.address.state && company.address.country ? ', ' : ''}
                  {company.address.country}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(['combined','overview','people','deals'] as const).map(k => (
          <button
            key={k}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTab(k);
            }}
            className={`px-4 py-2 -mb-px border-b-2 ${tab === k ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {(tab === 'overview' || tab === 'combined') && (
        <>
          {/* Quick stats */}
          <div className="flex flex-wrap gap-6">
            {[{
              label: 'People', 
              value: String(uniquePeopleCount), 
              icon: <Users className="w-5 h-5 text-blue-600" />
            }, {
              label: 'Deals', 
              value: String(dealsCount), 
              icon: <Target className="w-5 h-5 text-purple-600" />
            }, {
              label: 'Revenue', 
              value: revenue > 0 ? `$${formatNumber(revenue)}` : '$0', 
              icon: <DollarSign className="w-5 h-5 text-green-600" />
            }, {
              label: 'Industry', 
              value: company?.industry || '—', 
              icon: <Factory className="w-5 h-5 text-orange-600" />
            }].map((s, i) => (
              <Card key={i} className="flex-1 min-w-[200px]">
                <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{s.label}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{s.value}</p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 preserve-icon-color">
                      {s.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.name || 'Not Available'}</p>
                </div>
                {/* <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industry</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.industry || 'Not Available'}</p>
                </div> */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Location</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.address?.city || company?.companyLocation || 'Not Available'}</p>
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Country</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.address?.country || company?.country || 'Not Available'}</p>
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</p>
                  {company?.website ? (
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all">{company.website}</a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">-</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Number of Employees</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.numberOfEmployees ? company.numberOfEmployees.toLocaleString('en-US') : 'Not Available'}</p>
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.createdAt ? formatDateTime(company.createdAt) : 'Not Available'}</p>
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-transparent dark:bg-transparent">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{company?.updatedAt ? formatDateTime(company.updatedAt) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <style jsx>{`
            .responsive-company-grid {
              display: grid;
              gap: 1.5rem;
              width: 100%;
            }
            
            .company-field {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              padding: 0.75rem;
              border-radius: 0.5rem;
              background-color: #f9fafb;
            }
            
            .field-label {
              font-size: 0.875rem;
              font-weight: 500;
              color: #6b7280;
              margin: 0;
            }
            
            .field-value {
              font-size: 0.875rem;
              font-weight: 600;
              color: #111827;
              margin: 0;
              word-break: break-words;
              overflow-wrap: anywhere;
            }
            
            .field-link {
              font-size: 0.875rem;
              font-weight: 600;
              color: #2563eb;
              text-decoration: none;
              word-break: break-all;
              overflow-wrap: anywhere;
            }
            
            .field-link:hover {
              text-decoration: underline;
            }
            
            /* Mobile: 1 column (<576px) */
            @media (max-width: 575px) {
              .responsive-company-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
              }
            }
            
            /* Small tablets: 2 columns (576px - 767px) */
            @media (min-width: 576px) and (max-width: 767px) {
              .responsive-company-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.25rem;
              }
            }
            
            /* Tablets: 3 columns (768px - 1199px) */
            @media (min-width: 768px) and (max-width: 1199px) {
              .responsive-company-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5rem;
              }
            }
            
            /* Desktop: 5 columns (≥1200px) */
            @media (min-width: 1200px) {
              .responsive-company-grid {
                grid-template-columns: repeat(5, 1fr);
                gap: 1.5rem;
              }
            }
          `}</style>
        </>
      )}

      {/* Deals */}
      {(tab === 'deals' || tab === 'combined') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Deals ({dealsCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : dealsCount === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first deal</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deal Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Stage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal: any, idx: number) => (
                      <motion.tr
                        key={deal.dealId || `deal_${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                              <Target className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{deal.name || 'Untitled Deal'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            size="sm" 
                            variant={
                              deal.stage === 'won' ? 'success' :
                              deal.stage === 'lost' ? 'danger' :
                              deal.stage === 'negotiation' ? 'warning' :
                              deal.stage === 'proposal' ? 'warning' :
                              deal.stage === 'qualified' ? 'info' :
                              'default'
                            }
                            className={
                              deal.stage === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                              deal.stage === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                              deal.stage === 'negotiation' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                              deal.stage === 'proposal' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                              deal.stage === 'qualified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                              ''
                            }
                          >
                            {deal.stage === 'won' ? 'Won' :
                             deal.stage === 'lost' ? 'Lost' :
                             deal.stage === 'qualified' ? 'Qualified' :
                             deal.stage === 'proposal' ? 'Proposal' :
                             deal.stage === 'negotiation' ? 'Negotiation' : 
                             deal.stage?.charAt(0).toUpperCase() + deal.stage?.slice(1) || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {deal.value ? `$${formatNumber(deal.value)}` : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {deal.createdAt ? formatDateTime(deal.createdAt) : '-'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* People */}
      {(tab === 'people' || tab === 'combined') && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>People ({uniquePeopleCount})</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    // Use the same deduplication logic as PeopleTable for consistent CSV export
                    const unconvertedLeads = leadsFiltered.filter((l: any) => l.status !== 'converted' && l.status !== 'Converted');
                    
                    const nLeads = unconvertedLeads.map((l: any) => ({
                      name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || l.email,
                      email: l.email || '',
                      phoneNumber: l.phoneNumber || '',
                      designation: l.designation || '',
                      createdAt: l.createdAt,
                      kind: 'Lead' as const,
                    }));
                    const nContacts = contactsFiltered.map((c: any) => ({
                      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                      email: c.email || '',
                      phoneNumber: c.phoneNumber || '',
                      designation: c.title || c.designation || '',
                      createdAt: c.createdAt,
                      kind: 'Contact' as const,
                    }));
                    
                    // Deduplicate by email, preferring contacts over leads
                    const emailMap = new Map<string, any>();
                    const allPeopleRaw = [...nLeads, ...nContacts];
                    
                    allPeopleRaw.forEach(person => {
                      const email = person.email?.toLowerCase().trim();
                      if (email && emailMap.has(email)) {
                        const existing = emailMap.get(email);
                        if (person.kind === 'Contact' && existing.kind === 'Lead') {
                          emailMap.set(email, person);
                        }
                      } else if (email) {
                        emailMap.set(email, person);
                      } else {
                        const uniqueKey = `no-email-${Math.random()}-${person.name}`;
                        emailMap.set(uniqueKey, person);
                      }
                    });
                    
                    const deduplicatedPeople = Array.from(emailMap.values());
                    const csvData = deduplicatedPeople.map(person => ({
                      Name: person.name,
                      Email: person.email,
                      PhoneNumber: person.phoneNumber,
                      Designation: person.designation,
                      Type: person.kind,
                      Created: person.createdAt ? new Date(person.createdAt).toLocaleDateString() : ''
                    }));
                    const csvContent = 'data:text/csv;charset=utf-8,' +
                      'Name,Email,Phone,Designation,Type,Created\n' +
                      csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${company?.name || 'account'}_people.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              </div>
          ) : uniquePeopleCount === 0 ? (
            null
          ) : (
        <PeopleTable
          leads={leadsFiltered}
          contacts={contactsFiltered}
          companyName={company?.name || ''}
        />
      )}
          </CardContent>
        </Card>
      )}

    
    </div>
  );
};

// Reusable Account Form with comprehensive validation
const AccountForm: React.FC<{
  initialValues?: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void> | void;
}> = ({ initialValues, onCancel, onSubmit }) => {
  const isEditing = Boolean(initialValues);
  const [values, setValues] = React.useState(() => ({
    accountName: initialValues?.accountName || '',
    industry: initialValues?.industry || '',
    country: initialValues?.country || '',
    city: initialValues?.city || '',
    contactName: initialValues?.contactName || '',
    email: initialValues?.email || '',
    phoneNumber: initialValues?.phoneNumber || '',
    website: initialValues?.website || '',
    numberOfEmployees: initialValues?.numberOfEmployees || '',
    jobTitle: initialValues?.jobTitle || '',
  }));

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = React.useState(false);
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [countryDropdownOpen]);
  const [initialFormValues, setInitialFormValues] = React.useState(() => ({
    accountName: initialValues?.accountName || '',
    industry: initialValues?.industry || '',
    country: initialValues?.country || '',
    city: initialValues?.city || '',
    contactName: initialValues?.contactName || '',
    email: initialValues?.email || '',
    phoneNumber: initialValues?.phoneNumber || '',
    website: initialValues?.website || '',
    numberOfEmployees: initialValues?.numberOfEmployees || '',
    jobTitle: initialValues?.jobTitle || '',
  }));

  // Update form values when initialValues change (only on initial load)
  React.useEffect(() => {
    if (initialValues && !hasUnsavedChanges) {
      const newValues = {
        accountName: initialValues.accountName || '',
        industry: initialValues.industry || '',
        country: initialValues.country || '',
        city: initialValues.city || '',
        contactName: initialValues.contactName || '',
        email: initialValues.email || '',
        phoneNumber: initialValues.phoneNumber || '',
        website: initialValues.website || '',
        numberOfEmployees: initialValues.numberOfEmployees || '',
        jobTitle: initialValues.jobTitle || '',
      };
      setValues(newValues);
      setInitialFormValues(newValues);
    }
  }, [initialValues, hasUnsavedChanges]);

  // Track form changes for unsaved changes detection
  React.useEffect(() => {
    if (isEditing) {
      const hasChanges = Object.keys(values).some(key => 
        values[key as keyof typeof values] !== initialFormValues[key as keyof typeof initialFormValues]
      );
      setHasUnsavedChanges(hasChanges);
    }
  }, [values, isEditing, initialFormValues]);


  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'accountName':
        if (!value.trim()) {
          newErrors.accountName = 'Company Name is required';
        } else if (/^\d+$/.test(value.trim())) {
          newErrors.accountName = 'Only numbers are not allowed.';
        } else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
          newErrors.accountName = 'Only special characters are not allowed.';
        } else if (/^\s+$/.test(value)) {
          newErrors.accountName = 'Only spaces are not allowed.';
        } else {
          delete newErrors.accountName;
        }
        break;
      case 'contactName':
        if (!value.trim()) {
          newErrors.contactName = 'Contact name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.contactName = 'Only alphabets and spaces are allowed.';
        } else if (/^\s+$/.test(value)) {
          newErrors.contactName = 'Only spaces are not allowed.';
        } else {
          delete newErrors.contactName;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
          newErrors.email = 'Please enter valid details — Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;
      case 'country':
        if (!value.trim()) {
          newErrors.country = 'Country is required';
        } else {
          delete newErrors.country;
        }
        break;
      case 'industry':
        if (!value.trim()) {
          newErrors.industry = 'Industry is required.';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.industry = 'Industry cannot contain numbers or special characters.';
        } else if (/^\s+$/.test(value)) {
          newErrors.industry = 'Only spaces are not allowed.';
        } else {
          delete newErrors.industry;
        }
        break;
      case 'city':
        if (!value.trim()) {
          newErrors.city = 'Company location is required.';
        } else if (/^\d+$/.test(value.trim())) {
          newErrors.city = 'Only numbers are not allowed.';
        } else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
          newErrors.city = 'Only special characters are not allowed.';
        } else if (/^\s+$/.test(value)) {
          newErrors.city = 'Only spaces are not allowed.';
        } else {
          delete newErrors.city;
        }
        break;
      case 'phoneNumber':
      case 'mobile':
        if (!value.trim()) {
          newErrors.phoneNumber = 'Phone number is required.';
        } else {
          const countryCode = getCountryCode(values.country);
          if (countryCode) {
            // Validate with country code
            if (!value.startsWith(countryCode)) {
              newErrors.phoneNumber = `Phone number must start with ${countryCode}`;
            } else {
              const digitsOnly = value.replace(/\D/g, '');
              const countryCodeDigits = countryCode.replace('+', '');
              const phoneDigits = digitsOnly.slice(countryCodeDigits.length);
              const requiredDigits = getRequiredDigits(values.country);
              if (phoneDigits.length !== requiredDigits) {
                newErrors.phoneNumber = `Phone number must be exactly ${requiredDigits} digits for ${values.country}.`;
              } else {
                delete newErrors.phoneNumber;
              }
            }
          } else {
            // No country selected, validate normally
            if (!/^\d+$/.test(value.trim())) {
              if (/[a-zA-Z]/.test(value.trim())) {
                newErrors.phoneNumber = 'Alphabets are not allowed.';
              } else {
                newErrors.phoneNumber = 'Only digits are allowed.';
              }
            } else if (value.trim().length < 10 || value.trim().length > 15) {
              newErrors.phoneNumber = 'Phone number must be between 10-15 digits.';
            } else {
              delete newErrors.phoneNumber;
            }
          }
        }
        break;
      case 'numberOfEmployees':
        if (!value.trim()) {
          newErrors.numberOfEmployees = 'Number of employees is required.';
        } else if (!/^\d+$/.test(value.trim()) || parseInt(value.trim(), 10) < 1) {
          newErrors.numberOfEmployees = 'Only numbers are allowed.';
        } else {
          delete newErrors.numberOfEmployees;
        }
        break;
      case 'jobTitle':
        if (!value.trim()) {
          newErrors.jobTitle = 'Job title is required.';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.jobTitle = 'Job title cannot contain numbers or special characters.';
        } else if (/^\s+$/.test(value)) {
          newErrors.jobTitle = 'Only spaces are not allowed.';
        } else {
          delete newErrors.jobTitle;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;
    
    // Filter input based on field type
    if (name === 'accountName' || name === 'city') {
      // Allow letters, numbers, spaces, and some special characters but prevent only special chars
      if (/^[^a-zA-Z0-9\s]+$/.test(value) && value.length > 0) {
        return; // Don't update if only special characters
      }
    } else if (name === 'industry' || name === 'jobTitle') {
      // Only allow letters and spaces
      filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    setValues((prev: any) => ({ ...prev, [name]: filteredValue }));
    validateField(name, filteredValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields and collect errors
    const fieldsToValidate = isEditing 
      ? ['accountName', 'industry', 'country', 'city', 'numberOfEmployees']
      : ['accountName', 'industry', 'contactName', 'email', 'country', 'city', 'phoneNumber', 'numberOfEmployees', 'jobTitle'];
    const newErrors: Record<string, string> = {};
    
    fieldsToValidate.forEach(field => {
      const value = (values as any)[field] || '';
      
      switch (field) {
        case 'accountName':
          if (!value.trim()) {
            newErrors.accountName = 'This field is required';
          } else if (/^\d+$/.test(value.trim())) {
            newErrors.accountName = 'Only numbers are not allowed.';
          } else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
            newErrors.accountName = 'Only special characters are not allowed.';
          } else if (/^\s+$/.test(value)) {
            newErrors.accountName = 'Only spaces are not allowed.';
          }
          break;
        case 'contactName':
          if (!value.trim()) {
            newErrors.contactName = 'This field is required';
          } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            newErrors.contactName = 'Only alphabets and spaces are allowed.';
          } else if (/^\s+$/.test(value)) {
            newErrors.contactName = 'Only spaces are not allowed.';
          }
          break;
        case 'email':
          if (!value.trim()) {
            newErrors.email = 'This field is required';
          } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
            newErrors.email = 'Please enter valid details — Invalid email format';
          }
          break;
        case 'country':
          if (!value.trim()) {
            newErrors.country = 'This field is required';
          }
          break;
        case 'industry':
          if (!value.trim()) {
            newErrors.industry = 'This field is required';
          } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            newErrors.industry = 'Industry cannot contain numbers or special characters.';
          } else if (/^\s+$/.test(value)) {
            newErrors.industry = 'Only spaces are not allowed.';
          }
          break;
        case 'city':
          if (!value.trim()) {
            newErrors.city = 'This field is required';
          } else if (/^\d+$/.test(value.trim())) {
            newErrors.city = 'Only numbers are not allowed.';
          } else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
            newErrors.city = 'Only special characters are not allowed.';
          } else if (/^\s+$/.test(value)) {
            newErrors.city = 'Only spaces are not allowed.';
          }
          break;
        case 'phoneNumber':
          if (!value.trim()) {
            newErrors.phoneNumber = 'This field is required';
          } else {
            const countryCode = getCountryCode(values.country);
            if (countryCode) {
              // Validate with country code
              if (!value.startsWith(countryCode)) {
                newErrors.phoneNumber = `Phone number must start with ${countryCode}`;
              } else {
                const digitsOnly = value.replace(/\D/g, '');
                const countryCodeDigits = countryCode.replace('+', '');
                const phoneDigits = digitsOnly.slice(countryCodeDigits.length);
                const requiredDigits = getRequiredDigits(values.country);
                if (phoneDigits.length !== requiredDigits) {
                  newErrors.phoneNumber = `Phone number must be exactly ${requiredDigits} digits for ${values.country}.`;
                }
              }
            } else {
              // No country selected, validate normally
              if (!/^\d+$/.test(value.trim())) {
                if (/[a-zA-Z]/.test(value.trim())) {
                  newErrors.phoneNumber = 'Alphabets are not allowed.';
                } else {
                  newErrors.phoneNumber = 'Only digits are allowed.';
                }
              } else if (value.trim().length < 10 || value.trim().length > 15) {
                newErrors.phoneNumber = 'Phone number must be between 10-15 digits.';
              }
            }
          }
          break;
        case 'numberOfEmployees':
          if (!value.trim()) {
            newErrors.numberOfEmployees = 'This field is required';
          } else if (!/^\d+$/.test(value.trim()) || parseInt(value.trim(), 10) < 1) {
            newErrors.numberOfEmployees = 'Only numbers are allowed.';
          }
          break;
        case 'jobTitle':
          if (!value.trim()) {
            newErrors.jobTitle = 'This field is required';
          } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            newErrors.jobTitle = 'Job title cannot contain numbers or special characters.';
          } else if (/^\s+$/.test(value)) {
            newErrors.jobTitle = 'Only spaces are not allowed.';
          }
          break;
      }
    });
    
    setErrors(newErrors);
    
    // Check if there are any errors
    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors) {
      logger.info('❌ Form has validation errors:', newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert numberOfEmployees to integer before submission
      const submissionValues = {
        ...values,
        numberOfEmployees: values.numberOfEmployees ? parseInt(values.numberOfEmployees, 10) : null
      };
      logger.info('🚀 Submitting form with values:', submissionValues);
      await onSubmit(submissionValues);
      logger.info('✅ Form submitted successfully');
    } catch (error) {
      logger.error('❌ Form submission error:', error);
      throw error; // Re-throw to let parent handle
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal cancel with unsaved changes check
  const handleModalCancel = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  const continuEditing = () => {
    setShowCancelConfirm(false);
    // Don't reset values - just close the modal and keep editing
  };



  const countryOptions = [
    'India',
    'United States',
    'United Kingdom',
    'Germany',
  ];

  // Country code mapping with digit requirements
  const countryCodeMap: Record<string, { code: string; digits: number }> = {
    'India': { code: '+91', digits: 10 },
    'United States': { code: '+1', digits: 10 },
    'United Kingdom': { code: '+44', digits: 10 },
    'Germany': { code: '+49', digits: 11 },
  };

  // Get country code for selected country
  const getCountryCode = (country: string) => {
    return countryCodeMap[country]?.code || '';
  };

  // Get required digits for selected country
  const getRequiredDigits = (country: string) => {
    return countryCodeMap[country]?.digits || 10;
  };

  // Handle phone number change to preserve country code
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const countryCode = getCountryCode(values.country);
    const requiredDigits = getRequiredDigits(values.country);
    
    if (countryCode) {
      // Extract only digits from input
      const digitsOnly = value.replace(/\D/g, '');
      const countryCodeDigits = countryCode.replace('+', '');
      
      // Get phone digits (excluding country code digits)
      let phoneDigits = digitsOnly;
      if (digitsOnly.startsWith(countryCodeDigits)) {
        phoneDigits = digitsOnly.slice(countryCodeDigits.length);
      }
      
      // Limit to required digits for the country
      phoneDigits = phoneDigits.slice(0, requiredDigits);
      
      const newValue = countryCode + (phoneDigits ? ' ' + phoneDigits : '');
      setValues(prev => ({ ...prev, phoneNumber: newValue }));
      validateField('phoneNumber', newValue);
    } else {
      // No country selected, allow normal input
      const digitsOnly = value.replace(/\D/g, '');
      setValues(prev => ({ ...prev, phoneNumber: digitsOnly }));
      validateField('phoneNumber', digitsOnly);
    }
  };

  // Update phone number when country changes (only for create mode)
  React.useEffect(() => {
    if (!isEditing) {
      const countryCode = getCountryCode(values.country);
      if (countryCode) {
        // Reset phone number to just country code when country changes
        setValues(prev => ({ ...prev, phoneNumber: countryCode + ' ' }));
      } else {
        // Clear phone number if no country selected
        setValues(prev => ({ ...prev, phoneNumber: '' }));
      }
    }
  }, [values.country, isEditing]);

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input 
              label="Company Name *" 
              name="accountName" 
              value={values.accountName} 
              onChange={handleChange}
              onKeyDown={(e) => {
                // Prevent only special characters from being typed
                if (/^[^a-zA-Z0-9\s]$/.test(e.key) && !/[a-zA-Z0-9]/.test(values.accountName)) {
                  e.preventDefault();
                }
              }}
              placeholder="Enter Company name"
              error={errors.accountName}
            />
          </div>
          
          <div>
            <Input 
              label="Industry *" 
              name="industry" 
              value={values.industry} 
              onChange={handleChange}
              onKeyDown={(e) => {
                if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="Enter industry"
              error={errors.industry}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country *</label>
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className={`flex items-center justify-between w-full px-3 py-2 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-120 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.country ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : ''
                }`}
              >
                <span className={values.country ? '' : 'text-gray-400'}>{values.country || 'Select country'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${countryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {countryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-40">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setValues(prev => ({ ...prev, country: '' }));
                        validateField('country', '');
                        setCountryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        !values.country ? 'bg-primary-50 text-primary-600' : ''
                      }`}
                    >
                      Select country
                    </button>
                    {countryOptions.map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          setValues(prev => ({ ...prev, country }));
                          validateField('country', country);
                          setCountryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          values.country === country ? 'bg-primary-50 text-primary-600' : ''
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.country && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{errors.country}</span>
              </div>
            )}
          </div>
          
          <div>
            <Input 
              label="City */ Company Location *" 
              name="city" 
              value={values.city} 
              onChange={handleChange}
              onKeyDown={(e) => {
                // Prevent only special characters from being typed
                if (/^[^a-zA-Z0-9\s]$/.test(e.key) && !/[a-zA-Z0-9]/.test(values.city)) {
                  e.preventDefault();
                }
              }}
              placeholder="e.g., Mumbai"
              error={errors.city}
            />
          </div>
          

          
          {!isEditing && (
            <>
              <div>
                <Input 
                  label="Contact Name *" 
                  name="contactName" 
                  value={values.contactName} 
                  onChange={handleChange} 
                  placeholder="Primary contact person"
                  error={errors.contactName}
                />
              </div>
              
              <div>
                <Input 
                  label="Job Title *" 
                  name="jobTitle" 
                  value={values.jobTitle} 
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter job title"
                  error={errors.jobTitle}
                />
              </div>
              
              <div>
                <Input 
                  label="Email *" 
                  type="email" 
                  name="email" 
                  value={values.email} 
                  onChange={handleChange} 
                  placeholder="contact@company.com"
                  error={errors.email}
                />
              </div>
              
              <div>
                <Input 
                  label="Phone Number *" 
                  name="phoneNumber" 
                  value={values.phoneNumber} 
                  onChange={handlePhoneChange}
                  placeholder={values.country ? `${getCountryCode(values.country)} 1234567890` : "e.g., 9876543210"}
                  error={errors.phoneNumber}
                />
              </div>
            </>
          )}
          
          <div>
            <Input 
              label="Number of Employees *" 
              name="numberOfEmployees" 
              value={values.numberOfEmployees} 
              onChange={handleChange} 
              placeholder="e.g., 50"
              error={errors.numberOfEmployees}
            />
          </div>
          
          <div>
            <Input 
              label="Website" 
              name="website" 
              value={values.website} 
              onChange={handleChange} 
              placeholder="e.g., https://company.com"
            />
          </div>
          
        </div>
        
        <ModalFooter>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleModalCancel} 
            disabled={isSubmitting}
            className="h-10 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white border border-gray-600 dark:border-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
            className="h-10"
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Account' : 'Save Account')}
          </Button>
        </ModalFooter>
      </form>
      
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
            onClick={continuEditing}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Continue
          </Button>
          <Button variant="danger" onClick={confirmCancel}>Discard</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

const AccountsModule: React.FC = () => {
  const role = getCurrentRole();
  if (!can(role, 'Accounts', 'View')) {
    return <Navigate to="/crm/dashboard" replace />;
  }

  // CEO gets organization-wide accounts view with hierarchical filtering
  if (role === 'CEO') {
    return (
      <Routes>
        <Route path="/" element={<CEOAccountsModule />} />
        <Route path=":id" element={<AccountDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AccountsList />} />
      <Route path=":id" element={<AccountDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AccountsModule;
