/**
 * CEO Accounts Module - Organization-wide accounts view similar to Sales VP
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Filter, Download, Search, Eye, ChevronDown, Users, Briefcase, DollarSign, X, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ceoApi } from '@/api/ceoApi';
import type { Contact } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import NumberedPagination from '@/components/ui/NumberedPagination';
import { format, parse } from 'date-fns';
import { formatNumber } from '@/utils';
import { clearOtherModulesPagination } from '@/utils/pagination';

// Account is represented as Contact in this system
type Account = Contact;

const CEOAccountsModule: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('ceoAccountsSearchQuery') || '';
  });
  const [selectedIndustry, setSelectedIndustry] = useState(() => {
    return localStorage.getItem('ceoAccountsSelectedIndustry') || '';
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return localStorage.getItem('ceoAccountsViewMode') as 'table' | 'grid' || 'table';
  });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    return localStorage.getItem('ceoAccountsFromDate') || '';
  });
  const [toDate, setToDate] = useState(() => {
    return localStorage.getItem('ceoAccountsToDate') || '';
  });
  const [appliedFromDate, setAppliedFromDate] = useState(() => {
    return localStorage.getItem('ceoAccountsAppliedFromDate') || '';
  });
  const [appliedToDate, setAppliedToDate] = useState(() => {
    return localStorage.getItem('ceoAccountsAppliedToDate') || '';
  });
  const [dateError, setDateError] = useState('');
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('ceoAccountsPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const perPage = 10;
  const dateFilterRef = React.useRef<HTMLDivElement>(null);

  // Dropdown states
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchMode, setIndustrySearchMode] = useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [highlightedIndustryIndex, setHighlightedIndustryIndex] = useState(-1);
  const industryDropdownRef = React.useRef<HTMLDivElement>(null);
  const industryOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    clearOtherModulesPagination('ceoAccountsPage');
    loadAccounts();
    
    sessionStorage.setItem('inCEOAccountsModule', 'true');
    
    return () => {
      setTimeout(() => {
        const stillInCEOAccounts = window.location.pathname.startsWith('/crm/ceo-accounts') || 
                                    (window.location.pathname.startsWith('/crm/Accounts/') && sessionStorage.getItem('inCEOAccountsModule') === 'true');
        if (!stillInCEOAccounts) {
          localStorage.removeItem('ceoAccountsSearchQuery');
          localStorage.removeItem('ceoAccountsSelectedIndustry');
          localStorage.removeItem('ceoAccountsFromDate');
          localStorage.removeItem('ceoAccountsToDate');
          localStorage.removeItem('ceoAccountsAppliedFromDate');
          localStorage.removeItem('ceoAccountsAppliedToDate');
          localStorage.removeItem('ceoAccountsViewMode');
          sessionStorage.removeItem('inCEOAccountsModule');
        }
      }, 100);
    };
  }, []);

  useEffect(() => {
    if (searchQuery || selectedIndustry || appliedFromDate || appliedToDate) {
      setPage(1);
      localStorage.setItem('ceoAccountsPage', '1');
    }
    
    localStorage.setItem('ceoAccountsSearchQuery', searchQuery);
    localStorage.setItem('ceoAccountsSelectedIndustry', selectedIndustry);
    localStorage.setItem('ceoAccountsAppliedFromDate', appliedFromDate);
    localStorage.setItem('ceoAccountsAppliedToDate', appliedToDate);
  }, [searchQuery, selectedIndustry, appliedFromDate, appliedToDate]);

  useEffect(() => {
    localStorage.setItem('ceoAccountsFromDate', fromDate);
  }, [fromDate]);

  useEffect(() => {
    localStorage.setItem('ceoAccountsToDate', toDate);
  }, [toDate]);

  useEffect(() => {
    localStorage.setItem('ceoAccountsPage', page.toString());
  }, [page]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('ceoAccountsViewMode', viewMode);
  }, [viewMode]);

  // Close date filter popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setIsIndustryDropdownOpen(false);
        setIndustrySearchMode(false);
        setIndustrySearchQuery('');
        setHighlightedIndustryIndex(-1);
      }
    };

    if (isDateFilterOpen || isIndustryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateFilterOpen, isIndustryDropdownOpen]);

  const normalizedSearch = React.useMemo(() => {
    const trimmed = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (trimmed && !/\S/.test(searchQuery)) return '';
    return trimmed;
  }, [searchQuery]);

  const firstToken = React.useMemo(() => {
    return normalizedSearch ? normalizedSearch.split(' ')[0] : '';
  }, [normalizedSearch]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const params = {
        q: firstToken,
        startDate: appliedFromDate || undefined,
        endDate: appliedToDate || undefined,
        page: page - 1,
        size: perPage,
      };
      const response = await ceoApi.getAccounts(params);
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [firstToken, appliedFromDate, appliedToDate, page]);

  // Client-side filtering
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    
    // Apply search filter with normalization
    if (normalizedSearch) {
      const tokens = normalizedSearch.split(' ');
      
      filtered = filtered.filter(account => {
        const companyLower = (account.companyName || '').toLowerCase();
        const firstNameLower = (account.firstName || '').toLowerCase();
        const lastNameLower = (account.lastName || '').toLowerCase();
        const emailLower = (account.email || '').toLowerCase();
        const industryLower = (account.industry || '').toLowerCase();
        const cityLower = (account.city || '').toLowerCase();
        const countryLower = (account.country || '').toLowerCase();
        
        if (tokens.length === 1) {
          return companyLower.includes(tokens[0]) || firstNameLower.includes(tokens[0]) ||
                 lastNameLower.includes(tokens[0]) || emailLower.includes(tokens[0]) ||
                 industryLower.includes(tokens[0]) || cityLower.includes(tokens[0]) ||
                 countryLower.includes(tokens[0]);
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
    
    // Apply industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(account => 
        account.industry?.toLowerCase() === selectedIndustry.toLowerCase()
      );
    }

    // Apply date range filter
    if (appliedFromDate || appliedToDate) {
      filtered = filtered.filter(account => {
        if (!account.createdAt) return false;
        const createdDate = new Date(account.createdAt);
        
        if (appliedFromDate && appliedToDate) {
          const startDate = new Date(appliedFromDate);
          const endDate = new Date(appliedToDate);
          endDate.setHours(23, 59, 59, 999);
          return createdDate >= startDate && createdDate <= endDate;
        } else if (appliedFromDate) {
          const startDate = new Date(appliedFromDate);
          return createdDate >= startDate;
        } else if (appliedToDate) {
          const endDate = new Date(appliedToDate);
          endDate.setHours(23, 59, 59, 999);
          return createdDate <= endDate;
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
  }, [accounts, normalizedSearch, selectedIndustry, appliedFromDate, appliedToDate]);
  
  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAccounts.slice(start, start + perPage);
  }, [filteredAccounts, currentPage]);
  
  const total = filteredAccounts.length;

  // Generate industry options from actual data
  const industryOptions = useMemo(() => {
    const industries = new Set(['']);
    accounts.forEach(account => {
      if (account.industry) {
        industries.add(account.industry);
      }
    });
    return [
      { value: '', label: 'All Industries' },
      ...Array.from(industries).filter(Boolean).sort().map(industry => ({
        value: industry,
        label: industry
      }))
    ];
  }, [accounts]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setDateError('');
    setIsDateFilterOpen(false);
    
    localStorage.removeItem('ceoAccountsSearchQuery');
    localStorage.removeItem('ceoAccountsSelectedIndustry');
    localStorage.removeItem('ceoAccountsFromDate');
    localStorage.removeItem('ceoAccountsToDate');
    localStorage.removeItem('ceoAccountsAppliedFromDate');
    localStorage.removeItem('ceoAccountsAppliedToDate');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organization Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Companies and organizations across the organization</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 items-stretch">
        {(() => {
          const industryCount = filteredAccounts.reduce((acc, account) => {
            const industry = account.industry || 'Unknown';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const uniqueIndustries = Object.keys(industryCount).filter(ind => ind !== 'Unknown').length;
          
          return [{
            label: 'Total Accounts', 
            value: formatNumber(total), 
            icon: <Users className="w-5 h-5 text-primary-600" />, 
            color: ''
          }, {
            label: selectedIndustry || 'All Industries', 
            value: selectedIndustry ? filteredAccounts.length.toString() : uniqueIndustries.toString(), 
            icon: <Briefcase className="w-5 h-5 text-purple-600" />, 
            color: ''
          }, {
            label: 'With Contacts', 
            value: filteredAccounts.filter(c => c.email || c.phoneNumber).length.toString(), 
            icon: <Users className="w-5 h-5 text-orange-600" />, 
            color: ''
          }, {
            label: 'Active Accounts', 
            value: filteredAccounts.filter(c => c.status === 'active').length.toString(), 
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
                  <div className="w-5 h-5 rounded flex items-center justify-center preserve-icon-color">{s.icon}</div>
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
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={industryDropdownRef}>
                <input
                  type="text"
                  value={industrySearchMode ? industrySearchQuery : (selectedIndustry || 'All Industries')}
                  onChange={(e) => {
                    setIndustrySearchQuery(e.target.value);
                    setIsIndustryDropdownOpen(true);
                    setHighlightedIndustryIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const filteredOptions = industryOptions.filter(option => 
                      option.label.toLowerCase().includes(industrySearchQuery.toLowerCase())
                    );
                    
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsIndustryDropdownOpen(false);
                      setIndustrySearchMode(false);
                      setIndustrySearchQuery('');
                      setHighlightedIndustryIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndustryIndex(prev => {
                        const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                        setTimeout(() => industryOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndustryIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : 0;
                        setTimeout(() => industryOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'Enter' && highlightedIndustryIndex >= 0) {
                      e.preventDefault();
                      const option = filteredOptions[highlightedIndustryIndex];
                      if (option) {
                        setSelectedIndustry(option.value);
                        setIsIndustryDropdownOpen(false);
                        setHighlightedIndustryIndex(-1);
                        setIndustrySearchMode(false);
                        setIndustrySearchQuery('');
                      }
                    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                      setIndustrySearchMode(true);
                    }
                  }}
                  onClick={() => {
                    setIsIndustryDropdownOpen(!isIndustryDropdownOpen);
                    if (!isIndustryDropdownOpen) {
                      setIndustrySearchMode(false);
                      setIndustrySearchQuery('');
                      setHighlightedIndustryIndex(-1);
                    }
                  }}
                  readOnly={!industrySearchMode}
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
                />
                {(industrySearchQuery && industrySearchMode) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndustrySearchQuery('');
                      setIndustrySearchMode(false);
                    }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                
                {isIndustryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                    <div className="p-2">
                      {(() => {
                        const filteredOptions = industryOptions.filter(option => 
                          option.label.toLowerCase().includes(industrySearchQuery.toLowerCase())
                        );
                        
                        if (filteredOptions.length === 0) {
                          return (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
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
                              ref={el => industryOptionsRef.current[index] = el}
                              onClick={() => {
                                setSelectedIndustry(option.value);
                                setIndustrySearchQuery('');
                                setIsIndustryDropdownOpen(false);
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
                  leftIcon={<Filter className="w-4 h-4 text-black" />}
                  onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                  className="text-black bg-white-600 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl"
                >
                  Date Filter {(appliedFromDate || appliedToDate) && '✓'}
                </Button>
                {isDateFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 p-4 z-40"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Filter by Date Range</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From Date (dd-mm-yyyy)</label>
                        <CustomDatePicker
                          label=""
                          value={fromDate ? format(parse(fromDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                          onChange={(value) => {
                            if (value) {
                              try {
                                const date = parse(value, 'dd-MM-yyyy', new Date());
                                const formattedDate = format(date, 'yyyy-MM-dd');
                                setFromDate(formattedDate);
                                if (toDate && formattedDate && new Date(formattedDate) > new Date(toDate)) {
                                  setDateError('From Date cannot be later than To Date');
                                } else {
                                  setDateError('');
                                }
                              } catch (error) {
                                console.error('Invalid date format:', error);
                              }
                            } else {
                              setFromDate('');
                              setDateError('');
                            }
                          }}
                          placeholder="dd-mm-yyyy"
                          maxDate={new Date()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To Date (dd-mm-yyyy)</label>
                        <CustomDatePicker
                          label=""
                          value={toDate ? format(parse(toDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                          onChange={(value) => {
                            if (value) {
                              try {
                                const date = parse(value, 'dd-MM-yyyy', new Date());
                                const formattedDate = format(date, 'yyyy-MM-dd');
                                setToDate(formattedDate);
                                if (fromDate && formattedDate && new Date(formattedDate) < new Date(fromDate)) {
                                  setDateError('To Date cannot be earlier than From Date');
                                } else {
                                  setDateError('');
                                }
                              } catch (error) {
                                console.error('Invalid date format:', error);
                              }
                            } else {
                              setToDate('');
                              setDateError('');
                            }
                          }}
                          placeholder="dd-mm-yyyy"
                          minDate={fromDate ? parse(fromDate, 'yyyy-MM-dd', new Date()) : undefined}
                          maxDate={new Date()}
                        />
                      </div>
                      {dateError && (
                        <div className="text-red-500 text-xs mt-1">{dateError}</div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (dateError) return;
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
                  className={`p-2 rounded-xl transition-colors ${
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
                  className={`p-2 rounded-xl transition-colors ${
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
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Industry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Number of Employees</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-4 w-full max-w-[220px] bg-gray-100 rounded-xl animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : paginatedAccounts.length === 0 ? (
            <div className="text-center py-12">
              {/* <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" /> */}
              {/* <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3> */}
              <p className="text-gray-500 mb-4">
                {(appliedFromDate || appliedToDate) ? 'No accounts found in the selected date range.' :
                 searchQuery ? 'Try adjusting your search criteria' : 'No accounts available to display'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Industry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Number of Employees</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccounts.map((account, idx) => (
                    <motion.tr
                      key={account.id || `account_${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 preserve-icon-color" />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                const accountId = account.accountId || account.id;
                                if (accountId && !isNaN(Number(accountId))) {
                                  navigate(`/crm/Accounts/${accountId}`);
                                }
                              }}
                              className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate max-w-[200px] text-left"
                              title={account.companyName || 'No Company Name'}
                            >
                              {account.companyName || 'No Company Name'}
                            </button>
                            {(account.city || account.state || account.country) && (
                              <div className="text-sm text-gray-500 truncate">
                                {[account.city, account.state, account.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {account.industry ? (
                          <Badge size="sm" variant="info" className="capitalize">{account.industry}</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {(account.city || account.state || account.country) ? (
                          <span className="text-sm text-gray-700 inline-flex items-center gap-2 max-w-[220px]">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate inline-block">
                              {[account.city, account.state, account.country].filter(Boolean).join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {account.numberOfEmployees ? (
                          <Badge size="sm" variant="default">
                            {account.numberOfEmployees.toLocaleString('en-US')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">Not Available</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const accountId = account.accountId || account.id;
                              if (accountId && !isNaN(Number(accountId))) {
                                navigate(`/crm/Accounts/${accountId}`);
                              }
                            }}
                            className="p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                            aria-label="View account"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {paginatedAccounts.map((account, idx) => (
                <motion.div key={account.id || `account_${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="h-full">
                  <Card className="h-full border border-gray-200/70 hover:border-gray-300 shadow-sm hover:shadow-md transition-all rounded-xl">
                    <CardContent className="p-5 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Building2 className="w-5 h-5 preserve-icon-color" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-gray-900 leading-6 truncate max-w-[180px]" title={account.companyName || 'No Company Name'}>
                              {account.companyName || 'No Company Name'}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              {account.industry && <Badge size="sm" variant="info" className="capitalize">{account.industry}</Badge>}
                              {account.numberOfEmployees && (
                                <Badge size="sm" variant="default">
                                  {account.numberOfEmployees.toLocaleString('en-US')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-700">
                        {(account.city || account.state || account.country) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500 min-w-0">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {[account.city, account.state, account.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 -mr-2">
                              <button
                                onClick={() => {
                                  const accountId = account.accountId || account.id;
                                  if (accountId && !isNaN(Number(accountId))) {
                                    navigate(`/crm/Accounts/${accountId}`);
                                  }
                                }}
                                className="p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                                aria-label="View account"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
          {filteredAccounts.length > 0 && totalPages > 1 && (
            <NumberedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredAccounts.length}
              itemsPerPage={perPage}
              itemName="accounts"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOAccountsModule;
