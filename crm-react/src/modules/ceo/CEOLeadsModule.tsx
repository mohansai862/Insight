/**
 * CEO Leads Module - Organization-wide leads view with Sales VP filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, Download, Search, Eye, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ceoApi } from '@/api/ceoApi';
import { clearOtherModulesPagination } from '@/utils/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import NumberedPagination from '@/components/ui/NumberedPagination';
import { format, parse } from 'date-fns';
import type { Lead, User } from '@/types';

const CEOLeadsModule: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesVPs, setSalesVPs] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalesVP, setSelectedSalesVP] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoLeadsSelectedSalesVP');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedManager, setSelectedManager] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoLeadsSelectedManager');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedExecutive, setSelectedExecutive] = useState<number | null>(() => {
    const saved = localStorage.getItem('ceoLeadsSelectedExecutive');
    return saved ? parseInt(saved, 10) : null;
  });
  const [filters, setFilters] = useState({
    q: localStorage.getItem('ceoLeadsSearchQuery') || '',
    status: localStorage.getItem('ceoLeadsStatus') || '',
    source: localStorage.getItem('ceoLeadsSource') || '',
    startDate: localStorage.getItem('ceoLeadsStartDate') || '',
    endDate: localStorage.getItem('ceoLeadsEndDate') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const normalizeSearchQuery = React.useCallback((value: string) => {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
  }, []);
  const normalizedSearchQuery = React.useMemo(
    () => normalizeSearchQuery(filters.q || ''),
    [filters.q, normalizeSearchQuery]
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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const salesVpDropdownRef = useRef<HTMLDivElement>(null);
  const managerDropdownRef = useRef<HTMLDivElement>(null);
  const executiveDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

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
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };

    if (salesVpDropdownOpen || managerDropdownOpen || executiveDropdownOpen || statusDropdownOpen || sourceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [salesVpDropdownOpen, managerDropdownOpen, executiveDropdownOpen, statusDropdownOpen, sourceDropdownOpen]);

  // Keep filters dropdown open if any filters are applied
  useEffect(() => {
    const hasActiveFilters = filters.q || filters.status || filters.source || filters.startDate || filters.endDate || selectedSalesVP || selectedManager || selectedExecutive;
    if (hasActiveFilters) {
      setShowFilters(true);
    }
  }, []);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('ceoLeadsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const perPage = 10;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    clearOtherModulesPagination('ceoLeadsPage');
    loadSalesVPs();
    
    // Mark that we're in CEO leads module
    sessionStorage.setItem('inCEOLeadsModule', 'true');
    
    return () => {
      setTimeout(() => {
        const stillInCEOLeads = window.location.pathname.startsWith('/crm/Leads');
        if (!stillInCEOLeads) {
          localStorage.removeItem('ceoLeadsSelectedSalesVP');
          localStorage.removeItem('ceoLeadsSelectedManager');
          localStorage.removeItem('ceoLeadsSelectedExecutive');
          localStorage.removeItem('ceoLeadsSearchQuery');
          localStorage.removeItem('ceoLeadsStatus');
          localStorage.removeItem('ceoLeadsSource');
          localStorage.removeItem('ceoLeadsStartDate');
          localStorage.removeItem('ceoLeadsEndDate');
          sessionStorage.removeItem('inCEOLeadsModule');
        }
      }, 100);
    };
  }, []);

  useEffect(() => {
    if (selectedSalesVP || selectedManager || selectedExecutive || filters.q || filters.status || filters.source || filters.startDate || filters.endDate) {
      setPage(0);
      localStorage.setItem('ceoLeadsPage', '0');
    }
    
    // Save filters to localStorage
    if (selectedSalesVP !== null) {
      localStorage.setItem('ceoLeadsSelectedSalesVP', selectedSalesVP.toString());
    } else {
      localStorage.removeItem('ceoLeadsSelectedSalesVP');
    }
    
    if (selectedManager !== null) {
      localStorage.setItem('ceoLeadsSelectedManager', selectedManager.toString());
    } else {
      localStorage.removeItem('ceoLeadsSelectedManager');
    }
    
    if (selectedExecutive !== null) {
      localStorage.setItem('ceoLeadsSelectedExecutive', selectedExecutive.toString());
    } else {
      localStorage.removeItem('ceoLeadsSelectedExecutive');
    }
    
    localStorage.setItem('ceoLeadsSearchQuery', filters.q);
    localStorage.setItem('ceoLeadsStatus', filters.status);
    localStorage.setItem('ceoLeadsSource', filters.source);
    localStorage.setItem('ceoLeadsStartDate', filters.startDate);
    localStorage.setItem('ceoLeadsEndDate', filters.endDate);
  }, [selectedSalesVP, selectedManager, selectedExecutive, filters]);

  useEffect(() => {
    localStorage.setItem('ceoLeadsPage', page.toString());
  }, [page]);

  useEffect(() => {
    loadLeads();
  }, [selectedSalesVP, selectedManager, selectedExecutive, filters, page]);

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

  const formatProspectValue = (value: number) => {
    if (!value || value === 0) return '-';
    
    if (value >= 1000000000) {
      const formatted = (value / 1000000000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
    } else if (value >= 1000000) {
      const formatted = (value / 1000000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
    } else if (value >= 1000) {
      const formatted = (value / 1000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

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

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        q: apiSearchQuery,
        salesVpId: selectedSalesVP || undefined,
        managerId: selectedManager || undefined,
        executiveId: selectedExecutive || undefined,
        page,
        size: perPage,
      };
      const response = await ceoApi.getLeads(params);
      const allLeads = response.data || [];
      setTotalElements(response.totalElements || allLeads.length);
      setTotalPages(response.totalPages || Math.ceil((response.totalElements || allLeads.length) / perPage));
      
      // If API doesn't paginate, do it client-side
      if (!response.totalPages && allLeads.length > perPage) {
        const startIndex = page * perPage;
        const endIndex = startIndex + perPage;
        setLeads(allLeads.slice(startIndex, endIndex));
      } else {
        setLeads(allLeads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = React.useMemo(() => {
    if (!normalizedSearchQuery) return leads;
    const tokens = searchTokens;
    return leads.filter((lead) => {
      const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim().toLowerCase();
      const nameParts = fullName.split(' ').filter(Boolean);
      const email = (lead.email || '').toLowerCase();
      const company = (lead.companyName || lead.company || '').toLowerCase();

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
  }, [leads, normalizedSearchQuery, searchTokens]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Prevent future dates
    if (value > today) {
      return;
    }
    
    // Validate date range
    if (key === 'startDate' && filters.endDate && value > filters.endDate) {
      return;
    }
    
    if (key === 'endDate' && filters.startDate && value < filters.startDate) {
      return;
    }
    
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      status: '',
      source: '',
      startDate: '',
      endDate: '',
    });
    setSelectedSalesVP(null);
    setSelectedManager(null);
    setSelectedExecutive(null);
    setManagers([]);
    setExecutives([]);
    
    // Clear from localStorage
    localStorage.removeItem('ceoLeadsSelectedSalesVP');
    localStorage.removeItem('ceoLeadsSelectedManager');
    localStorage.removeItem('ceoLeadsSelectedExecutive');
    localStorage.removeItem('ceoLeadsSearchQuery');
    localStorage.removeItem('ceoLeadsStatus');
    localStorage.removeItem('ceoLeadsSource');
    localStorage.removeItem('ceoLeadsStartDate');
    localStorage.removeItem('ceoLeadsEndDate');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organization-wide leads view with hierarchical filtering</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  placeholder="Search leads by name, email, or company"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                {filters.q && (
                  <button
                    onClick={() => handleFilterChange('q', '')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-4"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div ref={salesVpDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales VP
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Manager
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Executive
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={executiveSearchMode ? executiveSearchQuery : (selectedExecutive ? executives.find(e => e.userId === selectedExecutive)?.firstName + ' ' + executives.find(e => e.userId === selectedExecutive)?.lastName || 'All Executives under Manager' : 'All Executives under Manager')}
                      onChange={(e) => {
                        setExecutiveSearchQuery(e.target.value);
                        setExecutiveDropdownOpen(true);
                        setHighlightedExecutiveIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        const allOptions = [{ userId: null, firstName: 'All Executives under', lastName: 'Manager' }, ...executives];
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
                            const filteredExecutives = [{ userId: null, firstName: 'All Executives under', lastName: 'Manager' }, ...executives]
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

                <div ref={statusDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span className="truncate">{filters.status || 'All Status'}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {['', 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                handleFilterChange('status', status);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                filters.status === status ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                              }`}
                            >
                              {status || 'All Status'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div ref={sourceDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span className="truncate">{filters.source ? filters.source.replace('_', ' ') : 'All Sources'}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {sourceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {['', 'Website', 'Email', 'Campaign', 'Cold_Call', 'Referral', 'Event', 'Other'].map((source) => (
                            <button
                              key={source}
                              onClick={() => {
                                handleFilterChange('source', source);
                                setSourceDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                filters.source === source ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                              }`}
                            >
                              {source ? source.replace('_', ' ') : 'All Sources'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <CustomDatePicker
                    label=""
                    value={filters.startDate ? format(parse(filters.startDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                    onChange={(value) => {
                      if (value) {
                        try {
                          const date = parse(value, 'dd-MM-yyyy', new Date());
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          if (filters.endDate && formattedDate > filters.endDate) {
                            return;
                          }
                          handleFilterChange('startDate', formattedDate);
                        } catch (error) {
                          console.error('Invalid date format:', error);
                        }
                      } else {
                        handleFilterChange('startDate', '');
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
                    value={filters.endDate ? format(parse(filters.endDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                    onChange={(value) => {
                      if (value) {
                        try {
                          const date = parse(value, 'dd-MM-yyyy', new Date());
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          if (filters.startDate && formattedDate < filters.startDate) {
                            return;
                          }
                          handleFilterChange('endDate', formattedDate);
                        } catch (error) {
                          console.error('Invalid date format:', error);
                        }
                      } else {
                        handleFilterChange('endDate', '');
                      }
                    }}
                    placeholder="dd-mm-yyyy"
                    minDate={filters.startDate ? parse(filters.startDate, 'yyyy-MM-dd', new Date()) : undefined}
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

      {/* Leads Table */}
      <Card className="bg-white/70 backdrop-blur-glass shadow-glass">
        <CardHeader>
          <CardTitle>
            All Leads ({normalizedSearchQuery ? filteredLeads.length : totalElements})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No leads found</p>
            </div>
          ) : (
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.leadId}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <td className="py-3 px-4">
                        <span 
                          className="text-primary-600 hover:text-primary-800 cursor-pointer hover:underline truncate max-w-[150px] inline-block"
                          title={[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}
                          onClick={() => {
                            const leadId = lead.leadId || lead.id;
                            console.log('CEO Lead name click - Lead object:', lead);
                            console.log('CEO Lead ID:', leadId);
                            if (leadId && !isNaN(Number(leadId))) {
                              navigate(`/crm/Leads/${leadId}`);
                            } else {
                              console.error('Invalid lead ID for CEO:', leadId);
                              alert('Invalid lead ID. Please try refreshing the page.');
                            }
                          }}
                        >
                          {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-primary-100 text-primary-700">
                          {lead.leadStatus || lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(lead.leadSource || lead.source) ? (lead.leadSource || lead.source).split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '—'}
                      </td>
                      <td className="py-3 px-4 truncate max-w-[120px]" title={lead.companyName || lead.company || '-'}>{lead.companyName || lead.company || '-'}</td>
                      <td className="py-3 px-4 truncate max-w-[120px]" title={lead.customerLocation || '-'}>{lead.customerLocation || '-'}</td>
                      <td className="py-3 px-4">{formatProspectValue(lead.prospectValue)}</td>
                      <td className="py-3 px-4">
                        <span className="text-orange-600 font-medium">
                          {lead.owner || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => {
                              const leadId = lead.leadId || lead.id;
                              console.log('CEO Lead click - Lead object:', lead);
                              console.log('CEO Lead ID:', leadId);
                              if (leadId && !isNaN(Number(leadId))) {
                                navigate(`/crm/Leads/${leadId}`);
                              } else {
                                console.error('Invalid lead ID for CEO:', leadId);
                                alert('Invalid lead ID. Please try refreshing the page.');
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-primary-600 rounded-xl transition-colors"
                            title="View Lead"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              itemName="leads"
            />
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default CEOLeadsModule;
