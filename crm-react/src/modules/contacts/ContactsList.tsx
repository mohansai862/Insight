import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Contacts List
 * Advanced contact management with filters, search, and bulk actions
 */

import { motion } from 'framer-motion';
import {
    Building,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    Star,
    User,
    Users,
    X
} from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { tasksApi } from '@/api/tasksApi';
import { vpApi } from '@/api/vpApi';
import { salesManagerApi } from '@/api/salesManagerApi';
import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import NumberedPagination from '@/components/ui/NumberedPagination';
import { SkeletonTable } from '@/components/ui/Skeleton';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import EmailCompose from '@/components/EmailCompose';
import { format, parse } from 'date-fns';
import { useContacts, useLead, useLeads } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/utils';
import { getCurrentRole, getCurrentUserId } from '@/utils/rbac';
import { clearOtherModulesPagination } from '@/utils/pagination';
import { useAppSelector } from '@/lib/store';
import toast from 'react-hot-toast';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'archived':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    default:
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
  }
};

const ContactsList: React.FC = () => {
  const navigate = useNavigate();
  
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Initialize filters from localStorage to persist them
  const [searchQuery, setSearchQuery] = React.useState(() => {
    return localStorage.getItem('contactsSearchQuery') || '';
  });
  const [selectedType, setSelectedType] = React.useState<string>(() => {
    return localStorage.getItem('contactsSelectedType') || '';
  });
  const [selectedStatus, setSelectedStatus] = React.useState<string>(() => {
    return localStorage.getItem('contactsSelectedStatus') || '';
  });
  const [selectedOwner, setSelectedOwner] = React.useState<string>(() => {
    return localStorage.getItem('contactsSelectedOwner') || '';
  });
  const [selectedManager, setSelectedManager] = React.useState<string>(() => {
    return localStorage.getItem('contactsSelectedManager') || '';
  });
  const [startDate, setStartDate] = React.useState(() => {
    return localStorage.getItem('contactsStartDate') || '';
  });
  const [endDate, setEndDate] = React.useState(() => {
    return localStorage.getItem('contactsEndDate') || '';
  });
  const [locationFilter, setLocationFilter] = React.useState(() => {
    return localStorage.getItem('contactsLocationFilter') || '';
  });
  const [selectedMyContacts, setSelectedMyContacts] = React.useState<boolean>(() => {
    return localStorage.getItem('contactsSelectedMyContacts') === 'true';
  });
  const [selectedVPContacts, setSelectedVPContacts] = React.useState<boolean>(() => {
    return localStorage.getItem('contactsSelectedVPContacts') === 'true';
  });

  const [selectedExec, setSelectedExec] = React.useState<{ id: string; name?: string; email?: string } | null>(null);
  const [managers, setManagers] = React.useState<{ id: string; name: string; email?: string }[]>([]);
  const [executivesForManager, setExecutivesForManager] = React.useState<{ id: string; name: string; email?: string }[]>([]);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>(() => {
    return localStorage.getItem('contactsViewMode') as 'table' | 'grid' || 'table';
  });

  // Mark that we're in contacts module and handle cleanup properly
  React.useEffect(() => {
    sessionStorage.setItem('inContactsModule', 'true');
    sessionStorage.setItem('contactsListMounted', 'true');
    
    return () => {
      sessionStorage.removeItem('contactsListMounted');
      setTimeout(() => {
        const stillInContacts = window.location.pathname.startsWith('/crm/contacts') || window.location.pathname.startsWith('/crm/Contacts');
        const contactsListStillMounted = sessionStorage.getItem('contactsListMounted');
        
        // Only clear data if we're completely leaving the contacts module
        if (!stillInContacts && !contactsListStillMounted) {
          // Check if user is logging out or switching to a different main module
          const isLoggingOut = !window.location.pathname.startsWith('/crm/');
          const isDifferentModule = window.location.pathname.startsWith('/crm/') && 
                                 !window.location.pathname.includes('/contacts') && 
                                 !window.location.pathname.includes('/Contacts');
          
          if (isLoggingOut || isDifferentModule) {
            localStorage.removeItem('contactsSearchQuery');
            localStorage.removeItem('contactsSelectedType');
            localStorage.removeItem('contactsSelectedStatus');
            localStorage.removeItem('contactsSelectedOwner');
            localStorage.removeItem('contactsSelectedManager');
            localStorage.removeItem('contactsStartDate');
            localStorage.removeItem('contactsEndDate');
            localStorage.removeItem('contactsLocationFilter');
            localStorage.removeItem('contactsSelectedMyContacts');
            localStorage.removeItem('contactsSelectedVPContacts');
            localStorage.removeItem('contactsViewMode');
            localStorage.removeItem('contactsPage');
          }
          sessionStorage.removeItem('inContactsModule');
        }
      }, 300);
    };
  }, []);

  // Save filters to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('contactsSearchQuery', searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedType', selectedType);
  }, [selectedType]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedStatus', selectedStatus);
  }, [selectedStatus]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedOwner', selectedOwner);
  }, [selectedOwner]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedManager', selectedManager);
  }, [selectedManager]);

  React.useEffect(() => {
    localStorage.setItem('contactsStartDate', startDate);
  }, [startDate]);

  React.useEffect(() => {
    localStorage.setItem('contactsEndDate', endDate);
  }, [endDate]);

  React.useEffect(() => {
    localStorage.setItem('contactsLocationFilter', locationFilter);
  }, [locationFilter]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedMyContacts', String(selectedMyContacts));
  }, [selectedMyContacts]);

  React.useEffect(() => {
    localStorage.setItem('contactsSelectedVPContacts', String(selectedVPContacts));
  }, [selectedVPContacts]);

  // Save view mode to localStorage
  React.useEffect(() => {
    localStorage.setItem('contactsViewMode', viewMode);
  }, [viewMode]);
  const [page, setPage] = React.useState(() => {
    const saved = localStorage.getItem('contactsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const perPage = 10;
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  // Save page to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('contactsPage', page.toString());
  }, [page]);

  // Clear other modules' pagination when this module loads
  React.useEffect(() => {
    clearOtherModulesPagination('contactsPage');
  }, []);

  const [showFilters, setShowFilters] = React.useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [managerDropdownOpen, setManagerDropdownOpen] = React.useState(false);
  const [executiveDropdownOpen, setExecutiveDropdownOpen] = React.useState(false);
  const [executiveSearchMode, setExecutiveSearchMode] = React.useState(false);
  const [executiveSearchQuery, setExecutiveSearchQuery] = React.useState('');
  const [highlightedExecutiveIndex, setHighlightedExecutiveIndex] = React.useState(-1);
  const executiveItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const managerItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const vpExecutiveItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const [managerSearchMode, setManagerSearchMode] = React.useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = React.useState('');
  const [highlightedManagerIndex, setHighlightedManagerIndex] = React.useState(-1);
  const [vpExecutiveSearchMode, setVpExecutiveSearchMode] = React.useState(false);
  const [vpExecutiveSearchQuery, setVpExecutiveSearchQuery] = React.useState('');
  const [highlightedVpExecutiveIndex, setHighlightedVpExecutiveIndex] = React.useState(-1);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const managerDropdownRef = React.useRef<HTMLDivElement>(null);
  const executiveDropdownRef = React.useRef<HTMLDivElement>(null);

  // Keep filters dropdown open if any filters are applied
  React.useEffect(() => {
    const hasActiveFilters = searchQuery || selectedType || selectedStatus || selectedOwner || 
                           selectedManager || startDate || endDate || locationFilter || 
                           selectedMyContacts || selectedVPContacts;
    if (hasActiveFilters) {
      setShowFilters(true);
    }
  }, []);
  
  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
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
        setVpExecutiveSearchMode(false);
        setVpExecutiveSearchQuery('');
        setHighlightedVpExecutiveIndex(-1);
      }
    };

    if (typeDropdownOpen || statusDropdownOpen || managerDropdownOpen || executiveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [typeDropdownOpen, statusDropdownOpen, managerDropdownOpen, executiveDropdownOpen]);
  const [emailCompose, setEmailCompose] = React.useState<{ open: boolean; contact: any | null }>({ open: false, contact: null });

  // Managers can view team scope and filter by Sales Executive
  const role = getCurrentRole();
  const isManager = role === 'manager' || role === 'admin' || role === 'Sales_Manager' || role === 'Sales_VP';
  const isSalesVP = role === 'Sales_VP';
  const [salesExecs, setSalesExecs] = React.useState<{ id: string; name: string; email?: string }[]>([]);
  const salesExecIdSet = React.useMemo(() => new Set((salesExecs || []).map(u => (u.id?.toString?.() || u.id))), [salesExecs]);

  React.useEffect(() => {
    // Load managers for Sales VP
    if (isSalesVP) {
      (async () => {
        try {
          const res = await vpApi.getManagers();
          setManagers(res.data.map(m => ({
            id: m.userId.toString(),
            name: `${m.firstName} ${m.lastName}`.trim() || m.username,
            email: m.email
          })));
          
          // Also load all executives for VP to show owner names
          const allExecsRes = await tasksApi.getSalesExecutives();
          setSalesExecs(allExecsRes.data || []);
        } catch (e: any) {
          logger.error('Failed to load managers/executives', e);
        }
      })();
    } else if (isManager && !isSalesVP) {
      // Load sales executives list for other managers
      (async () => {
        try {
          const res = await tasksApi.getSalesExecutives();
          setSalesExecs(res.data || []);
        } catch (e: any) {
          logger.error('Failed to load sales executives', e);
        }
      })();
    }
  }, [isManager, isSalesVP]);

  // Load executives when manager is selected (for Sales VP)
  React.useEffect(() => {
    if (isSalesVP && selectedManager) {
      (async () => {
        try {
          const res = await vpApi.getExecutivesUnderManager(parseInt(selectedManager));
          setExecutivesForManager(res.data.map(e => ({
            id: e.userId.toString(),
            name: `${e.firstName} ${e.lastName}`.trim() || e.username,
            email: e.email
          })));
        } catch (e: any) {
          logger.error('Failed to load executives for manager', e);
          setExecutivesForManager([]);
        }
      })();
    } else {
      setExecutivesForManager([]);
    }
  }, [isSalesVP, selectedManager]);

  // keep selectedExec in sync when selectedOwner changes
  React.useEffect(() => {
    if (!selectedOwner) { setSelectedExec(null); return; }
    if (isSalesVP) {
      const exec = executivesForManager.find(e => (e.id?.toString?.() || e.id) === selectedOwner) || null;
      setSelectedExec(exec);
    } else {
      const exec = salesExecs.find(e => (e.id?.toString?.() || e.id) === selectedOwner) || null;
      setSelectedExec(exec);
    }
  }, [selectedOwner, salesExecs, executivesForManager, isSalesVP]);

  // Reset executive selection when manager changes
  React.useEffect(() => {
    if (isSalesVP) {
      setSelectedOwner('');
    }
  }, [selectedManager, isSalesVP]);

  // Only reset page when filters actually change (not on component mount or return from detail)
  const [previousFilters, setPreviousFilters] = React.useState<string>('');
  
  React.useEffect(() => {
    const currentFilters = `${searchQuery}|${selectedType}|${selectedStatus}|${selectedOwner}|${selectedMyContacts}|${selectedVPContacts}|${startDate}|${endDate}|${locationFilter}`;
    
    if (isInitialized && previousFilters && previousFilters !== currentFilters) {
      setPage(0);
      localStorage.setItem('contactsPage', '0');
    }
    
    setPreviousFilters(currentFilters);
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [searchQuery, selectedType, selectedStatus, selectedOwner, selectedMyContacts, selectedVPContacts, startDate, endDate, locationFilter, isInitialized, previousFilters]);

  // Handle navigation back from contact detail
  React.useEffect(() => {
    const handlePopState = () => {
      if (sessionStorage.getItem('navigatingToContactDetail') === 'true') {
        sessionStorage.setItem('returningFromContactDetail', 'true');
        sessionStorage.removeItem('navigatingToContactDetail');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Clear navigation flags when component unmounts or route changes
  React.useEffect(() => {
    return () => {
      const isStillInContactsList = window.location.pathname === '/crm/contacts' || window.location.pathname === '/crm/Contacts';
      if (!isStillInContactsList) {
        sessionStorage.removeItem('navigatingToContactDetail');
        sessionStorage.removeItem('returningFromContactDetail');
      }
    };
  }, []);



  const currentUser = useAppSelector((s) => s.auth.user);
  const isSalesExec = role === 'Sales_Executive' || currentUser?.role === 'Sales_Executive';

  // Use hierarchical contact fetching for Sales VP and Sales Manager
  const [hierarchicalContacts, setHierarchicalContacts] = React.useState<any[]>([]);
  const [hierarchicalLoading, setHierarchicalLoading] = React.useState(false);
  const [hierarchicalError, setHierarchicalError] = React.useState<Error | null>(null);
  const [allContactsForMetrics, setAllContactsForMetrics] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isSalesVP) {
      setHierarchicalLoading(true);
      (async () => {
        try {
          let contactsData;
          let allContactsData; // For metrics
          const params = {
            q: searchQuery,
            page,
            size: perPage,
          };
          const allParams = {
            q: searchQuery,
            page: 0,
            size: 1000, // Get all contacts for metrics
          };
          if (selectedMyContacts) {
            // Get VP's own contacts
            contactsData = await vpApi.getMyContacts(searchQuery, params);
            allContactsData = await vpApi.getMyContacts(searchQuery, allParams);
          } else if (selectedOwner && selectedManager) {
            // Get contacts for specific executive
            contactsData = await vpApi.getContactsForExecutive(parseInt(selectedOwner), searchQuery, params);
            allContactsData = await vpApi.getContactsForExecutive(parseInt(selectedOwner), searchQuery, allParams);
          } else if (selectedManager) {
            // Get contacts for specific manager
            contactsData = await vpApi.getContactsForManager(parseInt(selectedManager), searchQuery, params);
            allContactsData = await vpApi.getContactsForManager(parseInt(selectedManager), searchQuery, allParams);
          } else {
            // Get all contacts under VP
            contactsData = await vpApi.getVPContacts(searchQuery, params);
            allContactsData = await vpApi.getVPContacts(searchQuery, allParams);
          }
          
          // Get all contacts first for filtering
          let allContacts = allContactsData.data || [];
          
          // Apply client-side filters to all contacts
          if (selectedType && selectedType.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.type || 'lead').toLowerCase() === selectedType.toLowerCase()
            );
          }
          if (selectedStatus && selectedStatus.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
            );
          }
          if (startDate || endDate) {
            allContacts = allContacts.filter((c: any) => {
              const contactDate = new Date(c.createdAt || c.created_at || '');
              if (isNaN(contactDate.getTime())) return false;
              if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate >= start && contactDate <= end;
              } else if (startDate) {
                const start = new Date(startDate);
                return contactDate >= start;
              } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate <= end;
              }
              return true;
            });
          }
          if (locationFilter && locationFilter.trim()) {
            const locationQuery = locationFilter.toLowerCase().trim();
            allContacts = allContacts.filter((c: any) => {
              const location = (c.location || '').toLowerCase();
              const company = (c.company || '').toLowerCase();
              const city = (c.city || '').toLowerCase();
              const country = (c.country || '').toLowerCase();
              return location.includes(locationQuery) || 
                     company.includes(locationQuery) ||
                     city.includes(locationQuery) ||
                     country.includes(locationQuery);
            });
          }
          
          // Set filtered data for metrics
          setAllContactsForMetrics(allContacts);
          
          // Calculate pagination from filtered data
          const totalFiltered = allContacts.length;
          const totalPagesFiltered = Math.ceil(totalFiltered / perPage);
          const startIndex = page * perPage;
          const endIndex = startIndex + perPage;
          const paginatedContacts = allContacts.slice(startIndex, endIndex);
          
          setTotalElements(totalFiltered);
          setTotalPages(totalPagesFiltered);
          setHierarchicalContacts(paginatedContacts);
          setHierarchicalError(null);
        } catch (e: any) {
          logger.error('Failed to load hierarchical contacts', e);
          setHierarchicalError(e);
          setHierarchicalContacts([]);
          setAllContactsForMetrics([]);
        } finally {
          setHierarchicalLoading(false);
        }
      })();
    } else if (isManager && !isSalesVP && selectedOwner) {
      // Sales Manager with executive selected - use API
      setHierarchicalLoading(true);
      (async () => {
        try {
          const allParams = {
            q: searchQuery,
            page: 0,
            size: 1000,
          };
          const allContactsData = await salesManagerApi.getExecutiveContacts(parseInt(selectedOwner), searchQuery, allParams);
          
          // Get all contacts first for filtering
          let allContacts = allContactsData.data || [];
          
          // Apply client-side filters
          if (selectedType && selectedType.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.type || 'lead').toLowerCase() === selectedType.toLowerCase()
            );
          }
          if (selectedStatus && selectedStatus.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
            );
          }
          if (startDate || endDate) {
            allContacts = allContacts.filter((c: any) => {
              const contactDate = new Date(c.createdAt || c.created_at || '');
              if (isNaN(contactDate.getTime())) return false;
              if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate >= start && contactDate <= end;
              } else if (startDate) {
                const start = new Date(startDate);
                return contactDate >= start;
              } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate <= end;
              }
              return true;
            });
          }
          if (locationFilter && locationFilter.trim()) {
            const locationQuery = locationFilter.toLowerCase().trim();
            allContacts = allContacts.filter((c: any) => {
              const location = (c.location || '').toLowerCase();
              const company = (c.company || '').toLowerCase();
              const city = (c.city || '').toLowerCase();
              const country = (c.country || '').toLowerCase();
              return location.includes(locationQuery) || 
                     company.includes(locationQuery) ||
                     city.includes(locationQuery) ||
                     country.includes(locationQuery);
            });
          }
          
          setAllContactsForMetrics(allContacts);
          
          const totalFiltered = allContacts.length;
          const totalPagesFiltered = Math.ceil(totalFiltered / perPage);
          const startIndex = page * perPage;
          const endIndex = startIndex + perPage;
          const paginatedContacts = allContacts.slice(startIndex, endIndex);
          
          setTotalElements(totalFiltered);
          setTotalPages(totalPagesFiltered);
          setHierarchicalContacts(paginatedContacts);
          setHierarchicalError(null);
        } catch (e: any) {
          logger.error('Failed to load executive contacts', e);
          setHierarchicalError(e);
          setHierarchicalContacts([]);
          setAllContactsForMetrics([]);
        } finally {
          setHierarchicalLoading(false);
        }
      })();
    } else if (isManager && !isSalesVP && selectedVPContacts) {
      // Sales Manager with VP contacts selected - use API
      setHierarchicalLoading(true);
      (async () => {
        try {
          const allParams = {
            q: searchQuery,
            page: 0,
            size: 1000,
          };
          const allContactsData = await salesManagerApi.getVPContacts(searchQuery, allParams);
          
          // Get all contacts first for filtering
          let allContacts = allContactsData.data || [];
          
          // Apply client-side filters
          if (selectedType && selectedType.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.type || 'lead').toLowerCase() === selectedType.toLowerCase()
            );
          }
          if (selectedStatus && selectedStatus.trim()) {
            allContacts = allContacts.filter((c: any) => 
              (c.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
            );
          }
          if (startDate || endDate) {
            allContacts = allContacts.filter((c: any) => {
              const contactDate = new Date(c.createdAt || c.created_at || '');
              if (isNaN(contactDate.getTime())) return false;
              if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate >= start && contactDate <= end;
              } else if (startDate) {
                const start = new Date(startDate);
                return contactDate >= start;
              } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return contactDate <= end;
              }
              return true;
            });
          }
          if (locationFilter && locationFilter.trim()) {
            const locationQuery = locationFilter.toLowerCase().trim();
            allContacts = allContacts.filter((c: any) => {
              const location = (c.location || '').toLowerCase();
              const company = (c.company || '').toLowerCase();
              const city = (c.city || '').toLowerCase();
              const country = (c.country || '').toLowerCase();
              return location.includes(locationQuery) || 
                     company.includes(locationQuery) ||
                     city.includes(locationQuery) ||
                     country.includes(locationQuery);
            });
          }
          
          setAllContactsForMetrics(allContacts);
          
          const totalFiltered = allContacts.length;
          const totalPagesFiltered = Math.ceil(totalFiltered / perPage);
          const startIndex = page * perPage;
          const endIndex = startIndex + perPage;
          const paginatedContacts = allContacts.slice(startIndex, endIndex);
          
          setTotalElements(totalFiltered);
          setTotalPages(totalPagesFiltered);
          setHierarchicalContacts(paginatedContacts);
          setHierarchicalError(null);
        } catch (e: any) {
          logger.error('Failed to load VP contacts', e);
          setHierarchicalError(e);
          setHierarchicalContacts([]);
          setAllContactsForMetrics([]);
        } finally {
          setHierarchicalLoading(false);
        }
      })();
    } else {
      setHierarchicalContacts([]);
      setHierarchicalLoading(false);
      setHierarchicalError(null);
      setAllContactsForMetrics([]);
    }
  }, [isSalesVP, isManager, selectedOwner, selectedManager, searchQuery, selectedMyContacts, selectedVPContacts, selectedType, selectedStatus, startDate, endDate, locationFilter, page]);

  const { data, isLoading, error } = useContacts({
    filters: {
      ...(selectedOwner && !isSalesVP && { ownerId: [selectedOwner] }),
    },
    page,
    limit: perPage,
  });



  const contacts = (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? hierarchicalContacts : (data?.data || []);
  const pagination = data?.pagination;
  const finalLoading = (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? hierarchicalLoading : isLoading;
  const finalError = (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? hierarchicalError : error;
  
  // Simple pagination calculation
  React.useEffect(() => {
    if (!isSalesVP && !(isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) {
      if (data && data.pagination) {
        setTotalElements(data.pagination.total || 0);
        setTotalPages(data.pagination.totalPages || 0);
      } else {
        setTotalElements(contacts.length);
        setTotalPages(Math.ceil(contacts.length / perPage));
      }
    }
  }, [data, contacts.length, isSalesVP, isManager, selectedOwner, selectedVPContacts, perPage]);

  // Load leads for the selected Sales Executive: both createdBy and assignedTo from backend
  const { data: leadsData, isLoading: isLeadsLoading } = useLeads({
    limit: 200,
    assignedToId: selectedExec?.id || undefined,
    createdById: selectedExec?.id || undefined,
  });

  // Backend already filters by assignedToId and createdById, so no client-side filtering needed
  const execLeads = React.useMemo(() => {
    return leadsData?.data || [];
  }, [leadsData]);

  // Stats for selected Sales Executive's leads
  const execStats = React.useMemo(() => {
    const total = execLeads.length;
    const converted = execLeads.filter((l: any) => String(l.status).toLowerCase() === 'converted').length;
    const now = new Date();
    const thisMonth = execLeads.filter((l: any) => {
      if (!l?.createdAt) return false;
      const d = new Date(l.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalValue = execLeads.reduce((sum: number, l: any) => sum + (typeof l.value === 'number' ? l.value : 0), 0);
    return { total, converted, thisMonth, totalValue };
  }, [execLeads]);

  // Role-based contact visibility - no additional filtering needed for VP/Manager hierarchical contacts
  const filteredContacts = React.useMemo(() => {
    // For VP/Manager hierarchical contacts, filtering is already done in the API call
    if (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) {
      return hierarchicalContacts;
    }
    
    // Apply client-side filtering for non-hierarchical contacts
    let filtered = contacts;

    // Role-based filtering for non-VP roles
    if (isManager) {
      if (selectedOwner) {
        // Show contacts for selected sales executive
        filtered = filtered.filter((c: any) => 
          String(c.ownerId || c.createdBy || '') === selectedOwner
        );
      }
      // Otherwise show all contacts (manager can see all)
    } else {
      // Sales executives - let backend handle all filtering
      // Backend already returns correct contacts for executives
    }

    // Apply search filter for non-VP roles
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c: any) => 
        (c.name || '').toLowerCase().includes(searchTerm) ||
        (c.email || '').toLowerCase().includes(searchTerm) ||
        (c.company || '').toLowerCase().includes(searchTerm) ||
        (c.phoneNumber || '').includes(searchTerm)
      );
    }

    // Apply type filter
    if (selectedType && selectedType.trim()) {
      filtered = filtered.filter((c: any) => 
        (c.type || 'lead').toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Apply status filter
    if (selectedStatus && selectedStatus.trim()) {
      filtered = filtered.filter((c: any) => 
        (c.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Apply "My Contacts" filter for Sales Manager
    if (isManager && !isSalesVP && selectedMyContacts) {
      const currentUserId = getCurrentUserId();
      filtered = filtered.filter((c: any) => 
        String(c.ownerId || c.createdBy || '') === String(currentUserId)
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((c: any) => {
        const contactDate = new Date(c.createdAt || c.created_at || '');
        if (isNaN(contactDate.getTime())) return false;
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return contactDate >= start && contactDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          return contactDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return contactDate <= end;
        }
        return true;
      });
    }

    // Apply location filter
    if (locationFilter && locationFilter.trim()) {
      const locationQuery = locationFilter.toLowerCase().trim();
      filtered = filtered.filter((c: any) => {
        const location = (c.location || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        const country = (c.country || '').toLowerCase();
        return location.includes(locationQuery) || 
               company.includes(locationQuery) ||
               city.includes(locationQuery) ||
               country.includes(locationQuery);
      });
    }

    return filtered;
  }, [contacts, isSalesVP, isManager, selectedOwner, searchQuery, selectedType, selectedStatus, selectedMyContacts, selectedVPContacts, startDate, endDate, locationFilter, hierarchicalContacts]);

  // Apply client-side pagination for non-hierarchical contacts
  const displayedContacts = React.useMemo(() => {
    if (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) {
      // Server-side pagination already handled
      return filteredContacts;
    } else {
      // Client-side pagination for regular contacts
      const start = page * perPage;
      const end = start + perPage;
      return filteredContacts.slice(start, end);
    }
  }, [filteredContacts, isSalesVP, isManager, selectedOwner, selectedVPContacts, page, perPage]);

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'partner', label: 'Partner' },
    { value: 'vendor', label: 'Vendor' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <User className="w-4 h-4" />;
      case 'prospect':
        return <User className="w-4 h-4" />;
      case 'customer':
        return <Star className="w-4 h-4" />;
      case 'partner':
        return <Users className="w-4 h-4" />;
      case 'vendor':
        return <Building className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
      case 'prospect':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
      case 'customer':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'partner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'vendor':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  if (finalError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading contacts: {finalError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your contact database and relationships
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {getCurrentRole() !== 'Sales_Manager' && getCurrentRole() !== 'Sales_VP' && (
            <Button 
              as={Link} 
              to="/crm/Contacts/new" 
              variant="primary" 
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {React.useMemo(() => {
          // Use allContactsForMetrics for VP/Manager hierarchical contacts, filteredContacts for others
          const contactsForStats = (isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) 
            ? allContactsForMetrics 
            : filteredContacts;
          
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          const thisMonthContacts = contactsForStats.filter(c => {
            const date = new Date(c.createdAt || c.created_at || '');
            return date >= thisMonthStart;
          });
          const lastMonthContacts = contactsForStats.filter(c => {
            const date = new Date(c.createdAt || c.created_at || '');
            return date >= lastMonthStart && date <= lastMonthEnd;
          });
          
          const totalChange = lastMonthContacts.length > 0 ? ((thisMonthContacts.length - lastMonthContacts.length) / lastMonthContacts.length * 100) : 0;
          
          const thisMonthActive = contactsForStats.filter(c => c.status === 'active' && new Date(c.createdAt || c.created_at || '') >= thisMonthStart).length;
          const lastMonthActive = contactsForStats.filter(c => c.status === 'active' && new Date(c.createdAt || c.created_at || '') >= lastMonthStart && new Date(c.createdAt || c.created_at || '') <= lastMonthEnd).length;
          const activeChange = lastMonthActive > 0 ? ((thisMonthActive - lastMonthActive) / lastMonthActive * 100) : 0;
          
          const thisMonthCompanies = new Set(thisMonthContacts.map(c => c.company).filter(Boolean)).size;
          const lastMonthCompanies = new Set(lastMonthContacts.map(c => c.company).filter(Boolean)).size;
          const companiesChange = lastMonthCompanies > 0 ? ((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies * 100) : 0;
          
          return [
            { label: 'Total Contacts', value: contactsForStats.length.toLocaleString(), change: `${totalChange >= 0 ? '+' : ''}${Math.min(Math.abs(totalChange), 100).toFixed(1)}%`, icon: <Users className="w-5 h-5 text-blue-600 preserve-icon-color" />, color: '' },
            { label: 'Active Customers', value: contactsForStats.filter(c => c.status === 'active').length.toLocaleString(), change: `${activeChange >= 0 ? '+' : ''}${Math.min(Math.abs(activeChange), 100).toFixed(1)}%`, icon: <Star className="w-5 h-5 text-green-600 preserve-icon-color" />, color: '' },
            { label: 'New This Month', value: thisMonthContacts.length.toString(), change: `${thisMonthContacts.length - lastMonthContacts.length >= 0 ? '+' : ''}${thisMonthContacts.length - lastMonthContacts.length}`, icon: <User className="w-5 h-5 text-purple-600 preserve-icon-color" />, color: '' },
            { label: 'Companies', value: new Set(contactsForStats.map(c => c.company).filter(Boolean)).size.toString(), change: `${companiesChange >= 0 ? '+' : ''}${Math.min(Math.abs(companiesChange), 100).toFixed(1)}%`, icon: <Building className="w-5 h-5 text-orange-600 preserve-icon-color" />, color: '' },
          ];
        }, [filteredContacts, allContactsForMetrics, isSalesVP, isManager, selectedOwner, selectedVPContacts]).map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ml-4 preserve-icon-color">
                    {stat.icon}
                  </div>
                </div>
                {/* <div>
                  <span className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change !== '+0.0%' && stat.change !== '0.0%' && stat.change !== '-0.0%' ? stat.change : ''}
                  </span>
                  {stat.change !== '+0.0%' && stat.change !== '0.0%' && stat.change !== '-0.0%' && (
                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                  )}
                </div> */}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-xl relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const newShowFilters = !showFilters;
                  setShowFilters(newShowFilters);
                  // Save dropdown state when manually toggled
                  if (newShowFilters) {
                    sessionStorage.setItem('contactsFiltersOpen', 'true');
                  } else {
                    sessionStorage.removeItem('contactsFiltersOpen');
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-4"
              >
                <Filter className="w-4 h-4" />
                Filters
                <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex items-center border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
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
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* My Contacts Filter (for VP and Manager roles) */}
                {(role === 'Sales_VP' || role === 'Sales_Manager') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">My Contacts</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="myContactsFilter"
                        checked={selectedMyContacts}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedMyContacts(checked);
                          if (checked) {
                            // Reset other filters when "My Contacts" is selected
                            setSelectedManager('');
                            setSelectedOwner('');
                            setSelectedVPContacts(false);
                          }
                          setPage(0);
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="myContactsFilter" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
                        Show My Contacts Only
                      </label>
                    </div>
                  </div>
                )}

                {/* VP Contacts Filter (for Manager role only) */}
                {role === 'Sales_Manager' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">VP Contacts</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="vpContactsFilter"
                        checked={selectedVPContacts}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedVPContacts(checked);
                          if (checked) {
                            // Reset other filters when "VP Contacts" is selected
                            setSelectedOwner('');
                            setSelectedMyContacts(false);
                          }
                          setPage(0);
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="vpContactsFilter" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
                        Show VP Contacts Only
                      </label>
                    </div>
                  </div>
                )}

                {/* Manager Filter (for VP role) */}
                {isSalesVP && (
                  <div ref={managerDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={managerSearchMode ? managerSearchQuery : (selectedManager ? managers.find(m => m.id === selectedManager)?.name || 'All Managers' : 'All Managers')}
                        onChange={(e) => {
                          setManagerSearchQuery(e.target.value);
                          setManagerDropdownOpen(true);
                          setHighlightedManagerIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          const filteredManagers = [{id: '', name: 'All Managers'}, ...managers].filter(manager => 
                            manager.name.toLowerCase().includes(managerSearchQuery.toLowerCase())
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
                              setSelectedManager(manager.id);
                              setSelectedOwner('');
                              setSelectedMyContacts(false);
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
                        className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
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
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                          <div className="p-2">
                            {(() => {
                              const filteredManagers = [{id: '', name: 'All Managers'}, ...managers]
                                .filter(manager => manager.name.toLowerCase().includes(managerSearchQuery.toLowerCase()));
                              
                              if (filteredManagers.length === 0) {
                                return (
                                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    No managers found
                                  </div>
                                );
                              }
                              
                              return filteredManagers.map((manager, index) => {
                                const query = managerSearchQuery.toLowerCase();
                                const label = manager.name;
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
                                    key={manager.id || 'all'}
                                    ref={el => managerItemRefs.current[index] = el}
                                    onClick={() => {
                                      setSelectedManager(manager.id);
                                      setSelectedOwner('');
                                      setSelectedMyContacts(false);
                                      setPage(0);
                                      setManagerSearchQuery('');
                                      setManagerDropdownOpen(false);
                                      setHighlightedManagerIndex(-1);
                                      setManagerSearchMode(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      highlightedManagerIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                      selectedManager === manager.id ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                
                {/* Executive Filter (for Manager role) */}
                {isManager && !isSalesVP && (
                  <div ref={executiveDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executive</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={executiveSearchMode ? executiveSearchQuery : (selectedOwner ? salesExecs.find(e => e.id === selectedOwner)?.name || 'All Executives' : 'All Executives')}
                        onChange={(e) => {
                          setExecutiveSearchQuery(e.target.value);
                          setExecutiveDropdownOpen(true);
                          setHighlightedExecutiveIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          const filteredExecutives = [{id: '', name: 'All Executives'}, ...salesExecs].filter(exec => 
                            exec.name.toLowerCase().includes(executiveSearchQuery.toLowerCase())
                          );
                          
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setExecutiveDropdownOpen(false);
                            setExecutiveSearchMode(false);
                            setExecutiveSearchQuery('');
                            setHighlightedExecutiveIndex(-1);
                          } else if (e.key === 'ArrowDown') {
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
                              setSelectedOwner(exec.id);
                              setSelectedMyContacts(false);
                              setSelectedVPContacts(false);
                              setPage(0);
                              setExecutiveDropdownOpen(false);
                              setHighlightedExecutiveIndex(-1);
                              setExecutiveSearchMode(false);
                              setExecutiveSearchQuery('');
                            }
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
                        style={{ outline: 'none', boxShadow: 'none' }}
                        className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
                      />
                      {(executiveSearchQuery && executiveSearchMode) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExecutiveSearchQuery('');
                            setExecutiveSearchMode(false);
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
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                          <div className="p-2">
                            {(() => {
                              const filteredExecs = [{id: '', name: 'All Executives'}, ...salesExecs]
                                .filter(exec => exec.name.toLowerCase().includes(executiveSearchQuery.toLowerCase()));
                              
                              if (filteredExecs.length === 0) {
                                return (
                                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                    No executives found
                                  </div>
                                );
                              }
                              
                              return filteredExecs.map((exec, index) => {
                                const query = executiveSearchQuery.toLowerCase();
                                const label = exec.name || exec.email || `User ${exec.id}`;
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
                                    key={exec.id || 'all'}
                                    ref={el => executiveItemRefs.current[index] = el}
                                    onClick={() => {
                                      setSelectedOwner(exec.id);
                                      setSelectedMyContacts(false);
                                      setSelectedVPContacts(false);
                                      setPage(0);
                                      setExecutiveSearchQuery('');
                                      setExecutiveDropdownOpen(false);
                                      setHighlightedExecutiveIndex(-1);
                                      setExecutiveSearchMode(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      highlightedExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                      selectedOwner === exec.id ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                
                {/* Executive Filter for VP - only show after manager selection */}
                {isSalesVP && selectedManager && (
                  <div ref={executiveDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executive</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vpExecutiveSearchMode ? vpExecutiveSearchQuery : (selectedOwner ? executivesForManager.find(e => e.id === selectedOwner)?.name || 'All Executives under Manager' : 'All Executives under Manager')}
                        onChange={(e) => {
                          setVpExecutiveSearchQuery(e.target.value);
                          setExecutiveDropdownOpen(true);
                          setHighlightedVpExecutiveIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          const filteredExecutives = [{id: '', name: 'All Executives under Manager'}, ...executivesForManager].filter(exec => 
                            exec.name.toLowerCase().includes(vpExecutiveSearchQuery.toLowerCase())
                          );
                          
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setExecutiveDropdownOpen(false);
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
                              setSelectedOwner(exec.id);
                              setSelectedMyContacts(false);
                              setPage(0);
                              setExecutiveDropdownOpen(false);
                              setHighlightedVpExecutiveIndex(-1);
                              setVpExecutiveSearchMode(false);
                              setVpExecutiveSearchQuery('');
                            }
                          } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                            setVpExecutiveSearchMode(true);
                          }
                        }}
                        onClick={() => {
                          setExecutiveDropdownOpen(!executiveDropdownOpen);
                          if (!executiveDropdownOpen) {
                            setVpExecutiveSearchMode(false);
                            setVpExecutiveSearchQuery('');
                            setHighlightedVpExecutiveIndex(-1);
                          }
                        }}
                        readOnly={!vpExecutiveSearchMode}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
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
                      <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${executiveDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      
                      {executiveDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                          <div className="p-2">
                            {(() => {
                              const filteredExecs = [{id: '', name: 'All Executives under Manager'}, ...executivesForManager]
                                .filter(exec => exec.name.toLowerCase().includes(vpExecutiveSearchQuery.toLowerCase()));
                              
                              if (filteredExecs.length === 0) {
                                return (
                                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                    No executives found
                                  </div>
                                );
                              }
                              
                              return filteredExecs.map((exec, index) => {
                                const query = vpExecutiveSearchQuery.toLowerCase();
                                const label = exec.name;
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
                                    key={exec.id || 'all'}
                                    ref={el => vpExecutiveItemRefs.current[index] = el}
                                    onClick={() => {
                                      setSelectedOwner(exec.id);
                                      setSelectedMyContacts(false);
                                      setPage(0);
                                      setVpExecutiveSearchQuery('');
                                      setExecutiveDropdownOpen(false);
                                      setHighlightedVpExecutiveIndex(-1);
                                      setVpExecutiveSearchMode(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      highlightedVpExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                      selectedOwner === exec.id ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                
                {/* Type Filter */}
                <div ref={typeDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <div className="relative">
                    <button
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span className="truncate">{typeOptions.find(opt => opt.value === selectedType)?.label || 'All Types'}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {typeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {typeOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedType(option.value);
                                setTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                selectedType === option.value ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Filter */}
                <div ref={statusDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span className="truncate">{statusOptions.find(opt => opt.value === selectedStatus)?.label || 'All Status'}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedStatus(option.value);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                selectedStatus === option.value ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Date Range */}
                <div>
                  <CustomDatePicker
                    label="Start Date"
                    value={startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                    onChange={(dateString) => {
                      if (dateString) {
                        try {
                          const date = parse(dateString, 'dd-MM-yyyy', new Date());
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          if (endDate && formattedDate > endDate) {
                            toast.error('Start date cannot be after end date');
                            return;
                          }
                          setStartDate(formattedDate);
                        } catch (e) {
                          console.error('Invalid date format:', e);
                        }
                      } else {
                        setStartDate('');
                      }
                    }}
                    placeholder="dd-mm-yyyy"
                    maxDate={new Date()}
                  />
                </div>
                
                <div>
                  <CustomDatePicker
                    label="End Date"
                    value={endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                    onChange={(dateString) => {
                      if (dateString) {
                        try {
                          const date = parse(dateString, 'dd-MM-yyyy', new Date());
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          if (startDate && formattedDate < startDate) {
                            toast.error('End date cannot be before start date');
                            return;
                          }
                          setEndDate(formattedDate);
                        } catch (e) {
                          console.error('Invalid date format:', e);
                        }
                      } else {
                        setEndDate('');
                      }
                    }}
                    placeholder="dd-mm-yyyy"
                    minDate={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                    maxDate={new Date()}
                  />
                </div>
                
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filter by location"
                  />
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('');
                    setSelectedStatus('');
                    setSelectedOwner('');
                    setSelectedManager('');
                    setSelectedMyContacts(false);
                    setSelectedVPContacts(false);
                    setStartDate('');
                    setEndDate('');
                    setLocationFilter('');
                    setPage(0);
                    setShowFilters(false);
                    sessionStorage.removeItem('contactsFiltersOpen');
                    // Clear from localStorage
                    localStorage.removeItem('contactsSearchQuery');
                    localStorage.removeItem('contactsSelectedType');
                    localStorage.removeItem('contactsSelectedStatus');
                    localStorage.removeItem('contactsSelectedOwner');
                    localStorage.removeItem('contactsSelectedManager');
                    localStorage.removeItem('contactsStartDate');
                    localStorage.removeItem('contactsEndDate');
                    localStorage.removeItem('contactsLocationFilter');
                    localStorage.removeItem('contactsSelectedMyContacts');
                    localStorage.removeItem('contactsSelectedVPContacts');
                    toast.success('All filters cleared');
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

      {/* Contacts Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {role === 'Sales_Manager' ? (
              selectedMyContacts ? (
                `My Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : selectedVPContacts ? (
                `VP Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : selectedOwner ? (
                `Contacts for ${salesExecs.find(e => e.id === selectedOwner)?.name || 'Executive'} (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : (
                `All Team Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              )
            ) : role === 'Sales_VP' ? (
              selectedMyContacts ? (
                `My Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : selectedOwner ? (
                `Contacts for ${executivesForManager.find(e => e.id === selectedOwner)?.name || 'Executive'} (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : selectedManager ? (
                `Contacts for ${managers.find(m => m.id === selectedManager)?.name || 'Manager'} (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              ) : (
                `All VP Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
              )
            ) : (
              `All Contacts (${(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? totalElements : filteredContacts.length})`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {finalLoading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery || selectedType || selectedStatus ? 
                  'No contacts match your search criteria' : 
                  'No contacts found'
                }
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Company Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Last Activity</th>
                    {getCurrentRole() !== 'Sales_Executive' && (
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-600 sticky right-0 bg-white z-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedContacts.map((contact, index) => (
                    <motion.tr
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"

                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3 min-w-0">
                          <Avatar
                            name={contact.name}
                            size="sm"
                          />
                          <div className="min-w-0 max-w-[150px]">
                            <div title={contact.name}>
                              <button
                                onClick={() => {
                                  navigate(`/crm/Contacts/${contact.id}`);
                                }}
                                className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left truncate block max-w-full"
                                style={{ 
                                  position: 'relative',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer'
                                }}
                              >
                                {contact.name}
                              </button>
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {contact.email ?? 'No email'}
                            </div>
                            {contact.phoneNumber && (
                              <div className="text-sm text-gray-500 truncate">
                                {(contact as any).countryCode ? `${(contact as any).countryCode} ${contact.phoneNumber}` : contact.phoneNumber as string}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Building className="w-4 h-4 text-gray-400 preserve-icon-color flex-shrink-0" />
                          <div className="min-w-0 max-w-[150px]">
                            <div title={contact.company || '-'}>
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {contact.company || '-'}
                              </div>
                            </div>
                            {contact.title && (
                              <div title={contact.title}>
                                <div className="text-sm text-gray-500 truncate">
                                  {contact.title}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={getTypeColor(contact.type || 'lead')}
                          size="sm"
                        >
                          <span className="capitalize">{contact.type || 'lead'}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={getStatusColor(contact.status)}
                          size="sm"
                        >
                          {contact.status?.charAt(0).toUpperCase() + contact.status?.slice(1) || 'Active'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {contact.lastActivityAt 
                            ? formatDateTime(contact.lastActivityAt)
                            : 'No activity'
                          }
                        </div>
                      </td>
                      {getCurrentRole() !== 'Sales_Executive' && (
                        <td className="py-4 px-4">
                          <span className="text-orange-600 font-medium">
                            {contact.ownerName || 'Unassigned'}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 sticky right-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 z-10">
                        <div className="flex items-center">
                          <button
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="View Contact"
                            onClick={() => {
                              navigate(`/crm/Contacts/${contact.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {displayedContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <Card className="h-full border border-gray-200/70 hover:border-gray-300 shadow-sm hover:shadow-md transition-all rounded-xl">
                    <CardContent className="p-5 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={contact.avatar}
                            name={contact.name}
                            size="md"
                          />
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-gray-900 leading-6 truncate">
                              {contact.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                className={getTypeColor(contact.type || 'lead')}
                                size="sm"
                              >
                                <span className="capitalize">{contact.type || 'lead'}</span>
                              </Badge>
                              <Badge
                                className={getStatusColor(contact.status)}
                                size="sm"
                              >
                                {contact.status?.charAt(0).toUpperCase() + contact.status?.slice(1) || 'Active'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2 min-w-0 h-5">
                          <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{contact.company || 'No company'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 h-5">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{contact.phoneNumber ? ((contact as any).countryCode ? `${(contact as any).countryCode} ${contact.phoneNumber}` : contact.phoneNumber) : 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 h-5">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate flex-1">{contact.email || 'No email'}</span>
                          <button
                            className="p-1 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 flex-shrink-0"
                            title="View Contact"
                            onClick={() => {
                              navigate(`/crm/Contacts/${contact.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {(isSalesVP || (isManager && !isSalesVP && (selectedOwner || selectedVPContacts))) ? (
            // Server-side pagination for VP/Manager hierarchical contacts
            totalPages > 1 && (
              <div className="mt-4">
                <NumberedPagination
                  currentPage={page + 1}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage - 1)}
                  totalItems={totalElements}
                  itemsPerPage={perPage}
                />
              </div>
            )
          ) : (
            // Client-side pagination for regular contacts
            Math.ceil(filteredContacts.length / perPage) > 1 && (
              <div className="mt-4">
                <NumberedPagination
                  currentPage={page + 1}
                  totalPages={Math.ceil(filteredContacts.length / perPage)}
                  onPageChange={(newPage) => setPage(newPage - 1)}
                  totalItems={filteredContacts.length}
                  itemsPerPage={perPage}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      
      {/* Email Compose Modal */}
      <EmailCompose
        isOpen={emailCompose.open}
        onClose={() => setEmailCompose({ open: false, contact: null })}
        recipientEmail={emailCompose.contact?.email}
        recipientName={emailCompose.contact?.name}
        entityType="contact"
        entityId={emailCompose.contact?.id}
      />
    </div>
  );
};

export default ContactsList;
