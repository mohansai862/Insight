/**
 * CEO Contacts Module - Organization-wide contacts view with hierarchical filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, Download, Search, ChevronDown, Eye, Building, Phone, Mail, User, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ceoApi } from '@/api/ceoApi';
import { formatDateTime } from '@/utils';
import { clearOtherModulesPagination } from '@/utils/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import NumberedPagination from '@/components/ui/NumberedPagination';
import { format, parse } from 'date-fns';
import type { Contact, User as UserType } from '@/types';

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

const CEOContactsModule: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [salesVPs, setSalesVPs] = useState<UserType[]>([]);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [executives, setExecutives] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalesVP, setSelectedSalesVP] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoContactsSelectedSalesVP');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedManager, setSelectedManager] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoContactsSelectedManager');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedExecutive, setSelectedExecutive] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoContactsSelectedExecutive');
    return saved ? parseInt(saved, 10) : null;
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('ceoContactsSearchQuery') || '';
  });

  const normalizedSearch = React.useMemo(() => {
    const trimmed = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (trimmed && !/\S/.test(searchQuery)) return '';
    return trimmed;
  }, [searchQuery]);

  const firstToken = React.useMemo(() => {
    return normalizedSearch ? normalizedSearch.split(' ')[0] : '';
  }, [normalizedSearch]);
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem('ceoContactsStartDate') || '';
  });
  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem('ceoContactsEndDate') || '';
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown states
  const [salesVpDropdownOpen, setSalesVpDropdownOpen] = useState(false);
  const [salesVpSearchMode, setSalesVpSearchMode] = useState(false);
  const [salesVpSearchQuery, setSalesVpSearchQuery] = useState('');
  const [highlightedSalesVpIndex, setHighlightedSalesVpIndex] = useState(-1);
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [managerSearchMode, setManagerSearchMode] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [highlightedManagerIndex, setHighlightedManagerIndex] = useState(-1);
  const [executiveDropdownOpen, setExecutiveDropdownOpen] = useState(false);
  const [executiveSearchMode, setExecutiveSearchMode] = useState(false);
  const [executiveSearchQuery, setExecutiveSearchQuery] = useState('');
  const [highlightedExecutiveIndex, setHighlightedExecutiveIndex] = useState(-1);
  const salesVpItemRefs = useRef<{[key: number]: HTMLButtonElement | null}>({});
  const managerItemRefs = useRef<{[key: number]: HTMLButtonElement | null}>({});
  const executiveItemRefs = useRef<{[key: number]: HTMLButtonElement | null}>({});
  const salesVpDropdownRef = useRef<HTMLDivElement>(null);
  const managerDropdownRef = useRef<HTMLDivElement>(null);
  const executiveDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (salesVpDropdownRef.current && !salesVpDropdownRef.current.contains(event.target as Node)) {
        setSalesVpDropdownOpen(false);
        setSalesVpSearchMode(false);
        setSalesVpSearchQuery('');
        setHighlightedSalesVpIndex(-1);
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
    };

    if (salesVpDropdownOpen || managerDropdownOpen || executiveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [salesVpDropdownOpen, managerDropdownOpen, executiveDropdownOpen]);

  // Keep filters dropdown open if any filters are applied
  useEffect(() => {
    const hasActiveFilters = searchQuery || selectedSalesVP || selectedManager || selectedExecutive || startDate || endDate;
    if (hasActiveFilters) {
      setShowFilters(true);
    }
  }, []);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('ceoContactsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const perPage = 10;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return localStorage.getItem('ceoContactsViewMode') as 'table' | 'grid' || 'table';
  });

  useEffect(() => {
    clearOtherModulesPagination('ceoContactsPage');
    loadSalesVPs();
    
    sessionStorage.setItem('inCEOContactsModule', 'true');
    
    return () => {
      setTimeout(() => {
        const stillInCEOContacts = window.location.pathname.startsWith('/crm/ceo-contacts') ||
                                    (window.location.pathname.startsWith('/crm/Contacts/') && sessionStorage.getItem('inCEOContactsModule') === 'true');
        if (!stillInCEOContacts) {
          localStorage.removeItem('ceoContactsSelectedSalesVP');
          localStorage.removeItem('ceoContactsSelectedManager');
          localStorage.removeItem('ceoContactsSelectedExecutive');
          localStorage.removeItem('ceoContactsSearchQuery');
          localStorage.removeItem('ceoContactsStartDate');
          localStorage.removeItem('ceoContactsEndDate');
          localStorage.removeItem('ceoContactsViewMode');
          sessionStorage.removeItem('inCEOContactsModule');
        }
      }, 100);
    };
  }, []);

  useEffect(() => {
    if (selectedSalesVP || selectedManager || selectedExecutive || searchQuery || startDate || endDate) {
      setPage(0);
      localStorage.setItem('ceoContactsPage', '0');
    }
    
    if (selectedSalesVP !== null) {
      localStorage.setItem('ceoContactsSelectedSalesVP', selectedSalesVP.toString());
    } else {
      localStorage.removeItem('ceoContactsSelectedSalesVP');
    }
    
    if (selectedManager !== null) {
      localStorage.setItem('ceoContactsSelectedManager', selectedManager.toString());
    } else {
      localStorage.removeItem('ceoContactsSelectedManager');
    }
    
    if (selectedExecutive !== null) {
      localStorage.setItem('ceoContactsSelectedExecutive', selectedExecutive.toString());
    } else {
      localStorage.removeItem('ceoContactsSelectedExecutive');
    }
    
    localStorage.setItem('ceoContactsSearchQuery', searchQuery);
    localStorage.setItem('ceoContactsStartDate', startDate);
    localStorage.setItem('ceoContactsEndDate', endDate);
  }, [selectedSalesVP, selectedManager, selectedExecutive, searchQuery, startDate, endDate]);

  useEffect(() => {
    localStorage.setItem('ceoContactsPage', page.toString());
  }, [page]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('ceoContactsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    loadContacts();
  }, [selectedSalesVP, selectedManager, selectedExecutive, firstToken, startDate, endDate, page]);

  useEffect(() => {
    if (selectedSalesVP) {
      loadManagers(selectedSalesVP);
    } else {
      setManagers([]);
      setSelectedManager(null);
      setSelectedExecutive(null);
      setExecutives([]);
    }
  }, [selectedSalesVP]);

  useEffect(() => {
    if (selectedManager) {
      loadExecutives(selectedManager);
    } else {
      setExecutives([]);
      setSelectedExecutive(null);
    }
  }, [selectedManager]);

  const loadSalesVPs = async () => {
    try {
      const response = await ceoApi.getSalesVPs();
      setSalesVPs(response.data);
    } catch (error) {
      console.error('Failed to load Sales VPs:', error);
    }
  };

  const loadManagers = async (salesVpId: number) => {
    try {
      const response = await ceoApi.getManagersUnderSalesVP(salesVpId);
      setManagers(response.data);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadExecutives = async (managerId: number) => {
    try {
      const response = await ceoApi.getExecutivesUnderManager(managerId);
      setExecutives(response.data);
    } catch (error) {
      console.error('Failed to load executives:', error);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params = {
        q: firstToken,
        salesVpId: selectedSalesVP || undefined,
        managerId: selectedManager || undefined,
        executiveId: selectedExecutive || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: perPage,
      };
      const response = await ceoApi.getContacts(params);
      let allContacts = response.data || [];
      
      // Client-side filtering with multi-word name matching
      if (normalizedSearch) {
        const tokens = normalizedSearch.split(' ');
        allContacts = allContacts.filter(contact => {
          const firstNameLower = (contact.firstName || '').toLowerCase();
          const lastNameLower = (contact.lastName || '').toLowerCase();
          const emailLower = (contact.email || '').toLowerCase();
          const companyLower = (contact.companyName || '').toLowerCase();
          
          if (tokens.length === 1) {
            return firstNameLower.includes(tokens[0]) || lastNameLower.includes(tokens[0]) ||
                   emailLower.includes(tokens[0]) || companyLower.includes(tokens[0]);
          }
          
          // Multi-word: check company name parts
          const companyParts = companyLower.split(/\s+/).filter(Boolean);
          if (companyParts.length >= tokens.length) {
            const companyMatch = tokens.every((token, i) => companyParts[i]?.startsWith(token));
            if (companyMatch) return true;
          }
          
          // Multi-word: check firstName + lastName
          const fullNameLower = `${firstNameLower} ${lastNameLower}`.trim();
          const nameParts = fullNameLower.split(/\s+/).filter(Boolean);
          if (nameParts.length >= tokens.length) {
            return tokens.every((token, i) => nameParts[i]?.startsWith(token));
          }
          
          return false;
        });
      }
      
      setTotalElements(allContacts.length);
      setTotalPages(Math.ceil(allContacts.length / perPage));
      
      // Client-side pagination
      const startIndex = page * perPage;
      const endIndex = startIndex + perPage;
      setContacts(allContacts.slice(startIndex, endIndex));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedSalesVP(null);
    setSelectedManager(null);
    setSelectedExecutive(null);
    setManagers([]);
    setExecutives([]);
    
    localStorage.removeItem('ceoContactsSelectedSalesVP');
    localStorage.removeItem('ceoContactsSelectedManager');
    localStorage.removeItem('ceoContactsSelectedExecutive');
    localStorage.removeItem('ceoContactsSearchQuery');
    localStorage.removeItem('ceoContactsStartDate');
    localStorage.removeItem('ceoContactsEndDate');
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(() => {
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          const thisMonthContacts = contacts.filter(c => {
            const date = new Date(c.createdAt || '');
            return date >= thisMonthStart;
          });
          const lastMonthContacts = contacts.filter(c => {
            const date = new Date(c.createdAt || '');
            return date >= lastMonthStart && date <= lastMonthEnd;
          });
          
          const totalChange = lastMonthContacts.length > 0 ? ((thisMonthContacts.length - lastMonthContacts.length) / lastMonthContacts.length * 100) : 0;
          
          const thisMonthActive = contacts.filter(c => c.status === 'active' && new Date(c.createdAt || '') >= thisMonthStart).length;
          const lastMonthActive = contacts.filter(c => c.status === 'active' && new Date(c.createdAt || '') >= lastMonthStart && new Date(c.createdAt || '') <= lastMonthEnd).length;
          const activeChange = lastMonthActive > 0 ? ((thisMonthActive - lastMonthActive) / lastMonthActive * 100) : 0;
          
          const thisMonthCompanies = new Set(thisMonthContacts.map(c => c.companyName).filter(Boolean)).size;
          const lastMonthCompanies = new Set(lastMonthContacts.map(c => c.companyName).filter(Boolean)).size;
          const companiesChange = lastMonthCompanies > 0 ? ((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies * 100) : 0;
          
          return [
            { label: 'Total Contacts', value: totalElements.toLocaleString(), change: `${totalChange >= 0 ? '+' : ''}${Math.min(Math.abs(totalChange), 100).toFixed(1)}%`, icon: <Users className="w-5 h-5 text-primary-600 preserve-icon-color" />, color: '' },
            { label: 'Active Customers', value: contacts.filter(c => c.status === 'active').length.toLocaleString(), change: `${activeChange >= 0 ? '+' : ''}${Math.min(Math.abs(activeChange), 100).toFixed(1)}%`, icon: <Users className="w-5 h-5 text-green-600 preserve-icon-color" />, color: '' },
            { label: 'New This Month', value: thisMonthContacts.length.toString(), change: `${thisMonthContacts.length - lastMonthContacts.length >= 0 ? '+' : ''}${thisMonthContacts.length - lastMonthContacts.length}`, icon: <Users className="w-5 h-5 text-purple-600 preserve-icon-color" />, color: '' },
            { label: 'Companies', value: new Set(contacts.map(c => c.companyName).filter(Boolean)).size.toString(), change: `${companiesChange >= 0 ? '+' : ''}${Math.min(Math.abs(companiesChange), 100).toFixed(1)}%`, icon: <Building className="w-5 h-5 text-orange-600 preserve-icon-color" />, color: '' },
          ];
        })().map((stat, index) => (
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
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
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
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name, email, or company"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-4"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-colors ${
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
        
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div ref={salesVpDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales VP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={salesVpSearchMode ? salesVpSearchQuery : (selectedSalesVP ? salesVPs.find(vp => vp.userId === selectedSalesVP)?.firstName + ' ' + salesVPs.find(vp => vp.userId === selectedSalesVP)?.lastName || 'All Sales VPs' : 'All Sales VPs')}
                    onChange={(e) => {
                      setSalesVpSearchQuery(e.target.value);
                      setSalesVpDropdownOpen(true);
                      setHighlightedSalesVpIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const allOptions = [{ userId: null, firstName: 'All', lastName: 'Sales VPs' }, ...salesVPs];
                      const filteredOptions = allOptions.filter(vp => 
                        `${vp.firstName} ${vp.lastName}`.toLowerCase().includes(salesVpSearchQuery.toLowerCase())
                      );
                      
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setSalesVpDropdownOpen(false);
                        setSalesVpSearchMode(false);
                        setSalesVpSearchQuery('');
                        setHighlightedSalesVpIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedSalesVpIndex(prev => {
                          const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                          setTimeout(() => salesVpItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                          return newIndex;
                        });
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedSalesVpIndex(prev => {
                          const newIndex = prev > 0 ? prev - 1 : 0;
                          setTimeout(() => salesVpItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                          return newIndex;
                        });
                      } else if (e.key === 'Enter' && highlightedSalesVpIndex >= 0) {
                        e.preventDefault();
                        const option = filteredOptions[highlightedSalesVpIndex];
                        if (option) {
                          setSelectedSalesVP(option.userId);
                          if (!option.userId) {
                            setSelectedManager(null);
                            setSelectedExecutive(null);
                          }
                          setSalesVpDropdownOpen(false);
                          setHighlightedSalesVpIndex(-1);
                          setSalesVpSearchMode(false);
                          setSalesVpSearchQuery('');
                        }
                      } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                        setSalesVpSearchMode(true);
                      }
                    }}
                    onClick={() => {
                      setSalesVpDropdownOpen(!salesVpDropdownOpen);
                      if (salesVpDropdownOpen) {
                        setSalesVpSearchMode(false);
                        setSalesVpSearchQuery('');
                        setHighlightedSalesVpIndex(-1);
                      }
                    }}
                    readOnly={!salesVpSearchMode}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
                  />
                  {(salesVpSearchQuery && salesVpSearchMode) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSalesVpSearchQuery('');
                        setSalesVpSearchMode(false);
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${salesVpDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  
                  {salesVpDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                      <div className="p-2">
                        {(() => {
                          const filteredVPs = [{ userId: null, firstName: 'All', lastName: 'Sales VPs' }, ...salesVPs]
                            .filter(vp => `${vp.firstName} ${vp.lastName}`.toLowerCase().includes(salesVpSearchQuery.toLowerCase()));
                          
                          if (filteredVPs.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No sales VPs found
                              </div>
                            );
                          }
                          
                          return filteredVPs.map((vp, index) => {
                            const query = salesVpSearchQuery.toLowerCase();
                            const label = `${vp.firstName} ${vp.lastName}`;
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
                                key={vp.userId || 'all'}
                                ref={el => salesVpItemRefs.current[index] = el}
                                onClick={() => {
                                  setSelectedSalesVP(vp.userId);
                                  if (!vp.userId) {
                                    setSelectedManager(null);
                                    setSelectedExecutive(null);
                                  }
                                  setSalesVpSearchQuery('');
                                  setSalesVpDropdownOpen(false);
                                  setHighlightedSalesVpIndex(-1);
                                  setSalesVpSearchMode(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  highlightedSalesVpIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                  selectedSalesVP === vp.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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

              <div ref={managerDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales Manager</label>
                <div className="relative">
                  <input
                    type="text"
                    value={managerSearchMode ? managerSearchQuery : (selectedManager ? managers.find(m => m.userId === selectedManager)?.firstName + ' ' + managers.find(m => m.userId === selectedManager)?.lastName || 'All Managers' : 'All Managers')}
                    onChange={(e) => {
                      setManagerSearchQuery(e.target.value);
                      setManagerDropdownOpen(true);
                      setHighlightedManagerIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const allOptions = [{ userId: null, firstName: 'All', lastName: 'Managers' }, ...managers];
                      const filteredOptions = allOptions.filter(m => 
                        `${m.firstName} ${m.lastName}`.toLowerCase().includes(managerSearchQuery.toLowerCase())
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
                          const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
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
                        const option = filteredOptions[highlightedManagerIndex];
                        if (option) {
                          setSelectedManager(option.userId);
                          if (!option.userId) setSelectedExecutive(null);
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
                      if (selectedSalesVP) {
                        setManagerDropdownOpen(!managerDropdownOpen);
                        if (managerDropdownOpen) {
                          setManagerSearchMode(false);
                          setManagerSearchQuery('');
                          setHighlightedManagerIndex(-1);
                        }
                      }
                    }}
                    readOnly={!managerSearchMode}
                    disabled={!selectedSalesVP}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className={`h-10 w-full px-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-200 text-sm font-medium min-w-[140px] ${
                      !selectedSalesVP 
                        ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400'
                    }`}
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
                  
                  {managerDropdownOpen && selectedSalesVP && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                      <div className="p-2">
                        {(() => {
                          const filteredManagers = [{ userId: null, firstName: 'All', lastName: 'Managers' }, ...managers]
                            .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(managerSearchQuery.toLowerCase()));
                          
                          if (filteredManagers.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No sales managers found
                              </div>
                            );
                          }
                          
                          return filteredManagers.map((manager, index) => {
                            const query = managerSearchQuery.toLowerCase();
                            const label = `${manager.firstName} ${manager.lastName}`;
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
                                  if (!manager.userId) setSelectedExecutive(null);
                                  setManagerSearchQuery('');
                                  setManagerDropdownOpen(false);
                                  setHighlightedManagerIndex(-1);
                                  setManagerSearchMode(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  highlightedManagerIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
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

              <div ref={executiveDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales Executive</label>
                <div className="relative">
                  <input
                    type="text"
                    value={executiveSearchMode ? executiveSearchQuery : (selectedExecutive ? executives.find(e => e.userId === selectedExecutive)?.firstName + ' ' + executives.find(e => e.userId === selectedExecutive)?.lastName || 'All Executives' : 'All Executives')}
                    onChange={(e) => {
                      setExecutiveSearchQuery(e.target.value);
                      setExecutiveDropdownOpen(true);
                      setHighlightedExecutiveIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const allOptions = [{ userId: null, firstName: 'All', lastName: 'Executives' }, ...executives];
                      const filteredOptions = allOptions.filter(ex => 
                        `${ex.firstName} ${ex.lastName}`.toLowerCase().includes(executiveSearchQuery.toLowerCase())
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
                          const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
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
                        const option = filteredOptions[highlightedExecutiveIndex];
                        if (option) {
                          setSelectedExecutive(option.userId);
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
                      if (selectedManager) {
                        setExecutiveDropdownOpen(!executiveDropdownOpen);
                        if (executiveDropdownOpen) {
                          setExecutiveSearchMode(false);
                          setExecutiveSearchQuery('');
                          setHighlightedExecutiveIndex(-1);
                        }
                      }
                    }}
                    readOnly={!executiveSearchMode}
                    disabled={!selectedManager}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className={`h-10 w-full px-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-200 text-sm font-medium min-w-[140px] ${
                      !selectedManager 
                        ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400'
                    }`}
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
                  
                  {executiveDropdownOpen && selectedManager && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                      <div className="p-2">
                        {(() => {
                          const filteredExecutives = [{ userId: null, firstName: 'All', lastName: 'Executives' }, ...executives]
                            .filter(ex => `${ex.firstName} ${ex.lastName}`.toLowerCase().includes(executiveSearchQuery.toLowerCase()));
                          
                          if (filteredExecutives.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No sales executives found
                              </div>
                            );
                          }
                          
                          return filteredExecutives.map((executive, index) => {
                            const query = executiveSearchQuery.toLowerCase();
                            const label = `${executive.firstName} ${executive.lastName}`;
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
                                  setExecutiveSearchQuery('');
                                  setExecutiveDropdownOpen(false);
                                  setHighlightedExecutiveIndex(-1);
                                  setExecutiveSearchMode(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  highlightedExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <CustomDatePicker
                  label=""
                  value={startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                  onChange={(value) => {
                    if (value) {
                      try {
                        const date = parse(value, 'dd-MM-yyyy', new Date());
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const today = new Date().toISOString().split('T')[0];
                        if (formattedDate > today) return;
                        if (endDate && formattedDate > endDate) return;
                        setStartDate(formattedDate);
                      } catch (error) {
                        console.error('Invalid date format:', error);
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <CustomDatePicker
                  label=""
                  value={endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                  onChange={(value) => {
                    if (value) {
                      try {
                        const date = parse(value, 'dd-MM-yyyy', new Date());
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const today = new Date().toISOString().split('T')[0];
                        if (formattedDate > today) return;
                        if (startDate && formattedDate < startDate) return;
                        setEndDate(formattedDate);
                      } catch (error) {
                        console.error('Invalid date format:', error);
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
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
            Organization Contacts ({totalElements})
          </CardTitle>
        </CardHeader>
        <CardContent>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery || selectedSalesVP || selectedManager || selectedExecutive ? 
                'No contacts match your search criteria' : 
                'No contacts found'
              }
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Company Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Last Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, index) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar
                          name={`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email}
                          size="sm"
                        />
                        <div className="min-w-0 max-w-[150px]">
                          <div title={`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email}>
                            <button
                              onClick={() => {
                                const contactId = contact.id || contact.contactId;
                                console.log('CEO Contact click - Contact object:', contact);
                                console.log('CEO Contact ID:', contactId);
                                if (contactId && !isNaN(Number(contactId))) {
                                  navigate(`/crm/Contacts/${contactId}`);
                                } else {
                                  console.error('Invalid contact ID for CEO:', contactId);
                                  alert('Invalid contact ID. Please try refreshing the page.');
                                }
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
                              {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email}
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
                          <div title={contact.companyName || '-'}>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {contact.companyName || '-'}
                            </div>
                          </div>
                          {contact.designation && (
                            <div title={contact.designation}>
                              <div className="text-sm text-gray-500 truncate">
                                {contact.designation}
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
                        className={`inline-flex items-center ${
                          contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                          contact.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          contact.status === 'archived' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                          'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        }`}
                        size="sm"
                      >
                        <span className="capitalize">{contact.status || 'active'}</span>
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        {contact.lastActivityAt 
                          ? formatDateTime(contact.lastActivityAt)
                          : contact.updatedAt 
                          ? formatDateTime(contact.updatedAt)
                          : contact.createdAt 
                          ? formatDateTime(contact.createdAt)
                          : 'No activity'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-orange-600 font-medium">
                        {contact.createdByName || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <button
                          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
                          title="View Contact"
                          onClick={() => {
                            const contactId = contact.id || contact.contactId;
                            if (contactId && !isNaN(Number(contactId))) {
                              navigate(`/crm/Contacts/${contactId}`);
                            }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {contacts.map((contact, index) => (
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
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <span className="text-lg font-medium">
                            {getInitials(contact.firstName, contact.lastName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold text-gray-900 leading-6 truncate max-w-[180px]" title={`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email}>
                            {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              className={getTypeColor(contact.type || 'lead')}
                              size="sm"
                            >
                              <span className="capitalize">{contact.type || 'lead'}</span>
                            </Badge>
                            <Badge
                              className={`inline-flex items-center ${
                                contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                contact.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                contact.status === 'archived' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                                'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              }`}
                              size="sm"
                            >
                              <span className="capitalize">{contact.status || 'active'}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2 min-w-0 h-5">
                        <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contact.companyName || 'No company'}</span>
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
                            const contactId = contact.id || contact.contactId;
                            if (contactId && !isNaN(Number(contactId))) {
                              navigate(`/crm/Contacts/${contactId}`);
                            }
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
          {totalPages > 1 && (
            <NumberedPagination
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage - 1)}
              totalItems={totalElements}
              itemsPerPage={perPage}
              itemName="contacts"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOContactsModule;
