import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, ArrowRight, Search, Filter, CheckSquare,
  MoreHorizontal, Eye, UserX, RefreshCw, Download, Upload,
  MapPin, Star, Calendar, User, ChevronDown, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import NumberedPagination from '@/components/ui/NumberedPagination';
import { leadAssignmentApi, Lead, SalesExecutive } from '@/api/leadAssignmentApi';

type LeadScore = 'hot' | 'warm' | 'cold';

const LeadAssignment: React.FC = () => {
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [salesExecutives, setSalesExecutives] = useState<SalesExecutive[]>([]);

  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedExecutive, setSelectedExecutive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Dropdown states
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [executiveSearchMode, setExecutiveSearchMode] = useState<{[key: string]: boolean}>({});
  const [executiveSearchQuery, setExecutiveSearchQuery] = useState<{[key: string]: string}>({});
  const [highlightedExecutiveIndex, setHighlightedExecutiveIndex] = useState<{[key: string]: number}>({});
  const sourceDropdownRef = React.useRef<HTMLDivElement>(null);
  const regionDropdownRef = React.useRef<HTMLDivElement>(null);
  const executiveDropdownRefs = React.useRef<{[key: string]: HTMLDivElement | null}>({});
  const executiveItemRefs = React.useRef<{[key: string]: {[key: number]: HTMLButtonElement | null}}>({});
  const [assignmentDetails, setAssignmentDetails] = useState<{
    lead: Lead | null;
    executive: SalesExecutive | null;
    type: 'single' | 'bulk';
    leadIds?: number[];
  }>({ lead: null, executive: null, type: 'single' });
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    leadName: string;
    executiveName: string;
    timestamp: Date;
  }>>([]);
  const [executiveDropdowns, setExecutiveDropdowns] = useState<{[key: number]: boolean}>({});
  const [showAllExecutives, setShowAllExecutives] = useState<{[key: string]: boolean}>({});
  // Pagination state
  const [page, setPage] = useState(0);
  const perPage = 10;
  // Get available executives for bulk assignment (excluding those who sent reassignment requests for selected leads)
  const [bulkAvailableExecutives, setBulkAvailableExecutives] = useState<SalesExecutive[]>([]);
  const [loadingBulkExecutives, setLoadingBulkExecutives] = useState(false);
  const [bulkExecutiveSearchMode, setBulkExecutiveSearchMode] = useState(false);
  const [bulkExecutiveSearchQuery, setBulkExecutiveSearchQuery] = useState('');
  const [highlightedBulkExecutiveIndex, setHighlightedBulkExecutiveIndex] = useState(-1);
  const bulkExecutiveDropdownRef = React.useRef<HTMLDivElement>(null);
  const bulkExecutiveItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const [showAllLeadsInDialog, setShowAllLeadsInDialog] = useState(false);

  const loadBulkAvailableExecutives = async () => {
    if (selectedLeads.length === 0) {
      setBulkAvailableExecutives([]);
      return;
    }

    setLoadingBulkExecutives(true);
    try {
      // Get executives for each selected lead and find common available executives
      const executivesPromises = selectedLeads.map(leadId => 
        leadAssignmentApi.getSalesExecutivesForLead(leadId)
      );
      const results = await Promise.all(executivesPromises);
      
      // Find executives that are available for ALL selected leads
      const allExecutivesLists = results.map(r => r.data || []);
      if (allExecutivesLists.length === 0) {
        setBulkAvailableExecutives([]);
        return;
      }

      // Get intersection of all executive lists
      const commonExecutives = allExecutivesLists[0].filter(exec =>
        allExecutivesLists.every(list => 
          list.some(e => e.userId === exec.userId)
        )
      );

      setBulkAvailableExecutives(commonExecutives);
    } catch (error) {
      logger.error('Error loading bulk available executives:', error);
      setBulkAvailableExecutives([]);
    } finally {
      setLoadingBulkExecutives(false);
    }
  };

  // Load bulk executives when selected leads change
  useEffect(() => {
    if (selectedLeads.length > 0) {
      loadBulkAvailableExecutives();
    } else {
      setBulkAvailableExecutives([]);
    }
  }, [selectedLeads]);

  // Body scroll lock for modal
  useEffect(() => {
    if (showConfirmDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmDialog]);

  useEffect(() => {
    loadData();
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
      if (bulkExecutiveDropdownRef.current && !bulkExecutiveDropdownRef.current.contains(event.target as Node)) {
        setExecutiveDropdowns(prev => ({ ...prev, 'bulk': false }));
        setBulkExecutiveSearchMode(false);
        setBulkExecutiveSearchQuery('');
        setHighlightedBulkExecutiveIndex(-1);
      }
      // Close all executive dropdowns when clicking outside
      const clickedElement = event.target as Element;
      const isDropdownClick = clickedElement.closest('.executive-dropdown');
      if (!isDropdownClick) {
        setExecutiveDropdowns({});
        setExecutiveSearchMode({});
        setExecutiveSearchQuery({});
        setHighlightedExecutiveIndex({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, executivesRes] = await Promise.all([
        leadAssignmentApi.getUnassignedLeads(),
        leadAssignmentApi.getSalesExecutives()
      ]);
      setUnassignedLeads(leadsRes.data || []);
      setSalesExecutives(executivesRes.data || []);
    } catch (error) {
      logger.error('Error loading data:', error);
      setUnassignedLeads([]);
      setSalesExecutives([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeads = async () => {
    try {
      setIsRefreshing(true);
      const leadsRes = await leadAssignmentApi.getUnassignedLeads();
      setUnassignedLeads(leadsRes.data || []);
    } catch (error) {
      logger.error('Error refreshing leads:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLeadScore = (lead: Lead): LeadScore => {
    const value = lead.prospectValue || 0;
    if (value > 50000) return 'hot';
    if (value > 10000) return 'warm';
    return 'cold';
  };

  const getScoreBadge = (score: LeadScore) => {
    const variants = {
      hot: { variant: 'error' as const, icon: '🔥', label: 'Hot' },
      warm: { variant: 'warning' as const, icon: '⚡', label: 'Warm' },
      cold: { variant: 'default' as const, icon: '❄️', label: 'Cold' }
    };
    const config = variants[score];
    return (
      <Badge variant={config.variant} size="sm">
        {config.icon} {config.label}
      </Badge>
    );
  };

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0 || !selectedExecutive) return;

    const executive = salesExecutives.find(e => e.userId === selectedExecutive);
    if (!executive) return;

    setAssignmentDetails({
      lead: null,
      executive,
      type: 'bulk',
      leadIds: selectedLeads
    });
    setShowConfirmDialog(true);
  };

  const handleSingleAssign = (lead: Lead, executiveId: number) => {
    const executive = salesExecutives.find(e => e.userId === executiveId);
    if (!executive) return;

    setAssignmentDetails({
      lead,
      executive,
      type: 'single'
    });
    setShowConfirmDialog(true);
  };

  // Get available executives for a lead (excluding requesting executive)
  const [executivesForLeads, setExecutivesForLeads] = useState<{[key: number]: SalesExecutive[]}>({});
  const [loadingExecutives, setLoadingExecutives] = useState<{[key: number]: boolean}>({});

  const getAvailableExecutives = (leadId: number): SalesExecutive[] => {
    return executivesForLeads[leadId] || [];
  };

  const loadExecutivesForLead = async (leadId: number) => {
    if (executivesForLeads[leadId] || loadingExecutives[leadId]) return;
    
    setLoadingExecutives(prev => ({ ...prev, [leadId]: true }));
    
    try {
      const response = await leadAssignmentApi.getSalesExecutivesForLead(leadId);
      const filteredExecutives = response.data || [];
      
      setExecutivesForLeads(prev => ({
        ...prev,
        [leadId]: filteredExecutives
      }));
    } catch (error) {
      logger.error('Error loading executives for lead:', error);
      setExecutivesForLeads(prev => ({
        ...prev,
        [leadId]: []
      }));
    } finally {
      setLoadingExecutives(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const confirmAssignment = async () => {
    try {
      setAssigning(true);

      if (assignmentDetails.type === 'bulk' && assignmentDetails.leadIds) {
        await leadAssignmentApi.bulkAssign(assignmentDetails.leadIds, assignmentDetails.executive!.userId);

        // Add to recent assignments
        const newAssignments = assignmentDetails.leadIds.map(leadId => {
          const lead = unassignedLeads.find(l => l.leadId === leadId);
          return {
            leadName: lead ? `${lead.firstName} ${lead.lastName}` : `Lead #${leadId}`,
            executiveName: `${assignmentDetails.executive!.firstName} ${assignmentDetails.executive!.lastName}`,
            timestamp: new Date()
          };
        });
        setRecentAssignments(prev => [...newAssignments, ...prev].slice(0, 10));

        setSelectedLeads([]);
        setSelectedExecutive(null);
        setShowBulkActions(false);
      } else if (assignmentDetails.lead) {
        await leadAssignmentApi.assignLead(assignmentDetails.lead.leadId, assignmentDetails.executive!.userId);

        // Add to recent assignments
        setRecentAssignments(prev => [{
          leadName: `${assignmentDetails.lead!.firstName} ${assignmentDetails.lead!.lastName}`,
          executiveName: `${assignmentDetails.executive!.firstName} ${assignmentDetails.executive!.lastName}`,
          timestamp: new Date()
        }, ...prev].slice(0, 10));
      }

      setShowConfirmDialog(false);
      setAssignmentDetails({ lead: null, executive: null, type: 'single' });
      setExecutivesForLeads({});
      setSelectedLeads([]);
      setSelectedExecutive(null);
      setShowBulkActions(false);
      await loadData();
    } catch (error) {
      logger.error('Error assigning lead(s):', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (leadId: number) => {
    try {
      await leadAssignmentApi.unassignLead(leadId);
      loadData();
    } catch (error) {
      logger.error('Error unassigning lead:', error);
    }
  };

  const handleReassign = async (leadId: number, newExecutiveId?: number) => {
    const userRole = localStorage.getItem('userRole');

    try {
      if (userRole === 'Sales_Executive') {
        // Sales executives can only request reassignment
        const reason = prompt('Please provide a reason for reassignment:');
        if (!reason) return;

        await leadAssignmentApi.requestReassignment(leadId, reason);
        alert('Reassignment request submitted successfully. Your manager will review it.');
      } else if (userRole === 'Sales_Manager' && newExecutiveId) {
        // Managers can directly reassign
        await leadAssignmentApi.reassignLead(leadId, newExecutiveId);
      }
      loadData();
    } catch (error) {
      logger.error('Error processing reassignment:', error);
      alert('Error processing reassignment request. Please try again.');
    }
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const selectAllLeads = () => {
    setSelectedLeads(filteredLeads.filter(lead => !lead.assignedTo).map(lead => lead.leadId));
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

  const filteredLeads = React.useMemo(() => {
    const normalized = searchTerm.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized && !/\S/.test(searchTerm)) return unassignedLeads;

    return unassignedLeads.filter(lead => {
      const matchesSource = !filterSource || lead.leadSource === filterSource;
      const matchesRegion = !filterRegion || lead.country === filterRegion;
      
      if (!matchesSource || !matchesRegion) return false;
      if (!normalized) return true;

      const tokens = normalized.split(' ');
      const firstNameLower = (lead.firstName || '').toLowerCase();
      const lastNameLower = (lead.lastName || '').toLowerCase();
      const companyLower = (lead.companyName || '').toLowerCase();
      const emailLower = (lead.email || '').toLowerCase();

      if (tokens.length === 1) {
        return firstNameLower.includes(tokens[0]) || lastNameLower.includes(tokens[0]) || 
               companyLower.includes(tokens[0]) || emailLower.includes(tokens[0]);
      }

      const fullNameLower = `${firstNameLower} ${lastNameLower}`.trim();
      const nameParts = fullNameLower.split(/\s+/);
      if (tokens.length > nameParts.length) return false;
      return tokens.every((token, i) => nameParts[i]?.startsWith(token));
    });
  }, [unassignedLeads, searchTerm, filterSource, filterRegion]);

  const totalPages = Math.ceil(filteredLeads.length / perPage);
  const paginatedLeads = React.useMemo(() => {
    const start = page * perPage;
    return filteredLeads.slice(start, start + perPage);
  }, [filteredLeads, page]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [searchTerm, filterSource, filterRegion]);

  const uniqueSources = [...new Set(unassignedLeads.map(lead => lead.leadSource).filter(Boolean))];
  const uniqueRegions = [...new Set(unassignedLeads.map(lead => lead.country).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Lead Assignment</h1>
              <p className="text-blue-100 mt-1">
                Assign or reassign leads to sales executives based on territory or workload
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm">
              Showing unassigned leads for your team
            </div>
            <div className="text-white/60 text-xs mt-1">
              {unassignedLeads.length} leads • {salesExecutives.length} executives
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative" ref={sourceDropdownRef}>
                <button
                  onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 w-36"
                >
                  <span className="truncate">{filterSource || 'All Sources'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isSourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isSourceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setFilterSource('');
                          setIsSourceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                          !filterSource ? 'bg-primary-50 text-primary-600' : ''
                        }`}
                      >
                        All Sources
                      </button>
                      {uniqueSources.map((source) => (
                        <button
                          key={source}
                          onClick={() => {
                            setFilterSource(source);
                            setIsSourceDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors truncate ${
                            filterSource === source ? 'bg-primary-50 text-primary-600' : ''
                          }`}
                          title={source}
                        >
                          {source.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={regionDropdownRef}>
                <button
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 w-36"
                >
                  <span className="truncate">{filterRegion || 'All Regions'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isRegionDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setFilterRegion('');
                          setIsRegionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                          !filterRegion ? 'bg-primary-50 text-primary-600' : ''
                        }`}
                      >
                        All Regions
                      </button>
                      {uniqueRegions.map((region) => (
                        <button
                          key={region}
                          onClick={() => {
                            setFilterRegion(region);
                            setIsRegionDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors truncate ${
                            filterRegion === region ? 'bg-primary-50 text-primary-600' : ''
                          }`}
                          title={region}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(searchTerm || filterSource || filterRegion) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSource('');
                    setFilterRegion('');
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions Panel - Remove this duplicate */}
        </CardContent>
      </Card>

      {/* Sticky Bulk Actions Bar */}
      {selectedLeads.length > 1 && (
        <div className="sticky top-0 z-30 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedLeads.length} {selectedLeads.length === 1 ? 'lead' : 'leads'} selected
                </span>
                <span className="text-sm text-gray-600">Assign to:</span>
                <div className="relative executive-dropdown" ref={bulkExecutiveDropdownRef}>
                  <input
                    type="text"
                    value={bulkExecutiveSearchMode ? bulkExecutiveSearchQuery : (selectedExecutive ? salesExecutives.find(e => e.userId === selectedExecutive)?.firstName + ' ' + salesExecutives.find(e => e.userId === selectedExecutive)?.lastName : 'Select Executive')}
                    onChange={(e) => {
                      setBulkExecutiveSearchQuery(e.target.value);
                      setExecutiveDropdowns(prev => ({ ...prev, 'bulk': true }));
                      setHighlightedBulkExecutiveIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const filteredExecs = salesExecutives.filter(exec => 
                        `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(bulkExecutiveSearchQuery.toLowerCase())
                      );
                      
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setExecutiveDropdowns(prev => ({ ...prev, 'bulk': false }));
                        setBulkExecutiveSearchMode(false);
                        setBulkExecutiveSearchQuery('');
                        setHighlightedBulkExecutiveIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedBulkExecutiveIndex(prev => {
                          const newIndex = prev < filteredExecs.length - 1 ? prev + 1 : prev;
                          setTimeout(() => bulkExecutiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                          return newIndex;
                        });
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedBulkExecutiveIndex(prev => {
                          const newIndex = prev > 0 ? prev - 1 : 0;
                          setTimeout(() => bulkExecutiveItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                          return newIndex;
                        });
                      } else if (e.key === 'Enter' && highlightedBulkExecutiveIndex >= 0) {
                        e.preventDefault();
                        const exec = filteredExecs[highlightedBulkExecutiveIndex];
                        if (exec) {
                          setSelectedExecutive(exec.userId);
                          setExecutiveDropdowns(prev => ({ ...prev, 'bulk': false }));
                          setBulkExecutiveSearchMode(false);
                          setBulkExecutiveSearchQuery('');
                          setHighlightedBulkExecutiveIndex(-1);
                        }
                      } else if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
                        setBulkExecutiveSearchMode(true);
                      } else if (e.key === 'Backspace' || e.key === 'Delete') {
                        setBulkExecutiveSearchMode(true);
                      }
                    }}
                    onClick={() => {
                      setExecutiveDropdowns(prev => ({ ...prev, 'bulk': !prev['bulk'] }));
                      if (!executiveDropdowns['bulk']) {
                        setBulkExecutiveSearchMode(false);
                        setBulkExecutiveSearchQuery('');
                        setHighlightedBulkExecutiveIndex(-1);
                      }
                    }}
                    readOnly={!bulkExecutiveSearchMode}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="w-[180px] px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400"
                  />
                  {(bulkExecutiveSearchQuery && bulkExecutiveSearchMode) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBulkExecutiveSearchQuery('');
                        setBulkExecutiveSearchMode(false);
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${executiveDropdowns['bulk'] ? 'rotate-180' : ''}`} />
                  {executiveDropdowns['bulk'] && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                      <div className="p-2">
                        {(() => {
                          const filteredExecs = bulkAvailableExecutives.filter(exec => 
                            `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(bulkExecutiveSearchQuery.toLowerCase())
                          );
                          
                          if (loadingBulkExecutives) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                Loading executives...
                              </div>
                            );
                          }
                          
                          if (filteredExecs.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                No executives available
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExecutive(null);
                                  setExecutiveDropdowns(prev => ({ ...prev, 'bulk': false }));
                                  setBulkExecutiveSearchMode(false);
                                  setBulkExecutiveSearchQuery('');
                                  setHighlightedBulkExecutiveIndex(-1);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  !selectedExecutive ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                Select Executive
                              </button>
                              {filteredExecs.map((executive, index) => {
                            const query = bulkExecutiveSearchQuery.toLowerCase();
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
                                key={executive.userId}
                                ref={el => bulkExecutiveItemRefs.current[index] = el}
                                type="button"
                                onClick={() => {
                                  setSelectedExecutive(executive.userId);
                                  setExecutiveDropdowns(prev => ({ ...prev, 'bulk': false }));
                                  setBulkExecutiveSearchMode(false);
                                  setBulkExecutiveSearchQuery('');
                                  setHighlightedBulkExecutiveIndex(-1);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  highlightedBulkExecutiveIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                  selectedExecutive === executive.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {displayLabel}
                              </button>
                            );
                          })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleBulkAssign}
                  disabled={!selectedExecutive || assigning}
                  loading={assigning}
                  size="sm"
                >
                  Assign
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            </div>
        </div>
      )}

      {/* Leads Table */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>
              Unassigned Leads ({filteredLeads.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="overflow-x-auto" style={{overflow: 'visible'}}>
            <div className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllLeads();
                            } else {
                              clearSelection();
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {/* <span>Select</span> */}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Lead Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Region</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Added By</th>
                    {selectedLeads.length <= 1 && (
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.leadId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {lead.assignedTo ? (
                          <span className="text-green-600 text-lg">✔️</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.leadId)}
                            onChange={() => toggleLeadSelection(lead.leadId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {lead.firstName || ''} {lead.lastName || ''}
                          </div>
                          <div className="text-gray-600">{lead.companyName || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{lead.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{(lead.leadSource || 'Unknown').replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{lead.country || lead.companyLocation || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={lead.leadStatus === 'New' ? 'info' : 'info'}
                          size="sm"
                        >
                          {lead.leadStatus || 'New'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {lead.createdBy ?
                              `${lead.createdBy.firstName || ''} ${lead.createdBy.lastName || ''}`.trim() || 'Unknown' :
                              'System'
                            }
                          </span>
                        </div>
                      </td>
                      {selectedLeads.length <= 1 && (
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {!lead.assignedTo ? (
                            <div className="relative executive-dropdown" ref={el => executiveDropdownRefs.current[`assign_${lead.leadId}`] = el}>
                              <input
                                type="text"
                                value={executiveSearchMode[`assign_${lead.leadId}`] ? (executiveSearchQuery[`assign_${lead.leadId}`] || '') : 'Select Executive'}
                                onChange={(e) => {
                                  setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: e.target.value }));
                                  setExecutiveDropdowns(prev => ({ ...prev, [lead.leadId]: true }));
                                  setHighlightedExecutiveIndex(prev => ({ ...prev, [`assign_${lead.leadId}`]: -1 }));
                                }}
                                onKeyDown={(e) => {
                                  const executives = getAvailableExecutives(lead.leadId);
                                  const query = executiveSearchQuery[`assign_${lead.leadId}`] || '';
                                  const filteredExecs = executives.filter(exec => 
                                    `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(query.toLowerCase())
                                  );
                                  
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setExecutiveDropdowns(prev => ({ ...prev, [lead.leadId]: false }));
                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: false }));
                                    setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: '' }));
                                    setHighlightedExecutiveIndex(prev => ({ ...prev, [`assign_${lead.leadId}`]: -1 }));
                                  } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setHighlightedExecutiveIndex(prev => {
                                      const currentIndex = prev[`assign_${lead.leadId}`] ?? -1;
                                      const nextIndex = currentIndex < filteredExecs.length - 1 ? currentIndex + 1 : currentIndex;
                                      setTimeout(() => executiveItemRefs.current[`assign_${lead.leadId}`]?.[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                      return { ...prev, [`assign_${lead.leadId}`]: nextIndex };
                                    });
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setHighlightedExecutiveIndex(prev => {
                                      const currentIndex = prev[`assign_${lead.leadId}`] ?? -1;
                                      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                                      setTimeout(() => executiveItemRefs.current[`assign_${lead.leadId}`]?.[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                      return { ...prev, [`assign_${lead.leadId}`]: nextIndex };
                                    });
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const currentIndex = highlightedExecutiveIndex[`assign_${lead.leadId}`] ?? -1;
                                    if (currentIndex >= 0) {
                                      const exec = filteredExecs[currentIndex];
                                      if (exec) {
                                        handleSingleAssign(lead, exec.userId);
                                        setExecutiveDropdowns(prev => ({ ...prev, [lead.leadId]: false }));
                                        setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: false }));
                                        setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: '' }));
                                        setHighlightedExecutiveIndex(prev => ({ ...prev, [`assign_${lead.leadId}`]: -1 }));
                                      }
                                    }
                                  } else if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: true }));
                                  } else if (e.key === 'Backspace' || e.key === 'Delete') {
                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: true }));
                                  }
                                }}
                                onClick={() => {
                                  loadExecutivesForLead(lead.leadId);
                                  const isCurrentlyOpen = executiveDropdowns[lead.leadId];
                                  setExecutiveDropdowns({ [lead.leadId]: !isCurrentlyOpen });
                                  if (!isCurrentlyOpen) {
                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: false }));
                                    setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: '' }));
                                    setHighlightedExecutiveIndex(prev => ({ ...prev, [`assign_${lead.leadId}`]: -1 }));
                                  }
                                }}
                                readOnly={!executiveSearchMode[`assign_${lead.leadId}`]}
                                disabled={loadingExecutives[lead.leadId]}
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`w-full min-w-[140px] px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 ${
                                  loadingExecutives[lead.leadId] ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              />
                              {(executiveSearchQuery[`assign_${lead.leadId}`] && executiveSearchMode[`assign_${lead.leadId}`]) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: '' }));
                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: false }));
                                  }}
                                  className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                  title="Clear search"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${executiveDropdowns[lead.leadId] ? 'rotate-180' : ''}`} />
                              {executiveDropdowns[lead.leadId] && !loadingExecutives[lead.leadId] && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-40 max-h-48 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                                  <div className="p-2">
                                    {(() => {
                                      const executives = getAvailableExecutives(lead.leadId);
                                      const query = executiveSearchQuery[`assign_${lead.leadId}`] || '';
                                      const filteredExecs = executives.filter(exec => 
                                        `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(query.toLowerCase())
                                      );
                                      
                                      return (
                                        <>
                                          {filteredExecs.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                              No executives found
                                            </div>
                                          ) : (
                                            filteredExecs.map((exec, index) => {
                                              const execQuery = query.toLowerCase();
                                              const label = `${exec.firstName} ${exec.lastName}`;
                                              const lowerLabel = label.toLowerCase();
                                              const matchIndex = lowerLabel.indexOf(execQuery);
                                              
                                              let displayLabel;
                                              if (execQuery && matchIndex !== -1) {
                                                const before = label.slice(0, matchIndex);
                                                const match = label.slice(matchIndex, matchIndex + execQuery.length);
                                                const after = label.slice(matchIndex + execQuery.length);
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
                                                  key={exec.userId}
                                                  ref={el => {
                                                    if (!executiveItemRefs.current[`assign_${lead.leadId}`]) executiveItemRefs.current[`assign_${lead.leadId}`] = {};
                                                    executiveItemRefs.current[`assign_${lead.leadId}`][index] = el;
                                                  }}
                                                  type="button"
                                                  onClick={() => {
                                                    handleSingleAssign(lead, exec.userId);
                                                    setExecutiveDropdowns(prev => ({ ...prev, [lead.leadId]: false }));
                                                    setExecutiveSearchMode(prev => ({ ...prev, [`assign_${lead.leadId}`]: false }));
                                                    setExecutiveSearchQuery(prev => ({ ...prev, [`assign_${lead.leadId}`]: '' }));
                                                    setHighlightedExecutiveIndex(prev => ({ ...prev, [`assign_${lead.leadId}`]: -1 }));
                                                  }}
                                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                    highlightedExecutiveIndex[`assign_${lead.leadId}`] === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                  }`}
                                                >
                                                  {displayLabel}
                                                </button>
                                              );
                                            })
                                          )}
                                        </>
                                      );
                                    })()} 
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {localStorage.getItem('userRole') === 'Sales_Manager' ? (
                                <>
                                  <div className="relative executive-dropdown" ref={el => executiveDropdownRefs.current[`reassign_${lead.leadId}`] = el}>
                                    <input
                                      type="text"
                                      value={executiveSearchMode[`reassign_${lead.leadId}`] ? (executiveSearchQuery[`reassign_${lead.leadId}`] || '') : 'Reassign'}
                                      onChange={(e) => {
                                        setExecutiveSearchQuery(prev => ({ ...prev, [`reassign_${lead.leadId}`]: e.target.value }));
                                        setExecutiveDropdowns(prev => ({ ...prev, [`reassign_${lead.leadId}`]: true }));
                                        setHighlightedExecutiveIndex(prev => ({ ...prev, [`reassign_${lead.leadId}`]: -1 }));
                                      }}
                                      onKeyDown={(e) => {
                                        const executives = getAvailableExecutives(lead.leadId);
                                        const query = executiveSearchQuery[`reassign_${lead.leadId}`] || '';
                                        const filteredExecs = executives.filter(exec => 
                                          `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(query.toLowerCase())
                                        );
                                        
                                        if (e.key === 'ArrowDown') {
                                          e.preventDefault();
                                          setHighlightedExecutiveIndex(prev => {
                                            const currentIndex = prev[`reassign_${lead.leadId}`] ?? -1;
                                            const nextIndex = currentIndex < filteredExecs.length - 1 ? currentIndex + 1 : currentIndex;
                                            setTimeout(() => executiveItemRefs.current[`reassign_${lead.leadId}`]?.[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                            return { ...prev, [`reassign_${lead.leadId}`]: nextIndex };
                                          });
                                        } else if (e.key === 'ArrowUp') {
                                          e.preventDefault();
                                          setHighlightedExecutiveIndex(prev => {
                                            const currentIndex = prev[`reassign_${lead.leadId}`] ?? -1;
                                            const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                                            setTimeout(() => executiveItemRefs.current[`reassign_${lead.leadId}`]?.[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                            return { ...prev, [`reassign_${lead.leadId}`]: nextIndex };
                                          });
                                        } else if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const currentIndex = highlightedExecutiveIndex[`reassign_${lead.leadId}`] ?? -1;
                                          if (currentIndex >= 0) {
                                            const exec = filteredExecs[currentIndex];
                                            if (exec) {
                                              handleReassign(lead.leadId, exec.userId);
                                              setExecutiveDropdowns(prev => ({ ...prev, [`reassign_${lead.leadId}`]: false }));
                                              setExecutiveSearchMode(prev => ({ ...prev, [`reassign_${lead.leadId}`]: false }));
                                              setExecutiveSearchQuery(prev => ({ ...prev, [`reassign_${lead.leadId}`]: '' }));
                                              setHighlightedExecutiveIndex(prev => ({ ...prev, [`reassign_${lead.leadId}`]: -1 }));
                                            }
                                          }
                                        } else if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
                                          setExecutiveSearchMode(prev => ({ ...prev, [`reassign_${lead.leadId}`]: true }));
                                        } else if (e.key === 'Backspace' || e.key === 'Delete') {
                                          setExecutiveSearchMode(prev => ({ ...prev, [`reassign_${lead.leadId}`]: true }));
                                        }
                                      }}
                                      onClick={() => {
                                        loadExecutivesForLead(lead.leadId);
                                        const isCurrentlyOpen = executiveDropdowns[`reassign_${lead.leadId}`];
                                        setExecutiveDropdowns({ [`reassign_${lead.leadId}`]: !isCurrentlyOpen });
                                        if (!isCurrentlyOpen) {
                                          setExecutiveSearchMode(prev => ({ ...prev, [`reassign_${lead.leadId}`]: false }));
                                          setExecutiveSearchQuery(prev => ({ ...prev, [`reassign_${lead.leadId}`]: '' }));
                                          setHighlightedExecutiveIndex(prev => ({ ...prev, [`reassign_${lead.leadId}`]: -1 }));
                                        }
                                      }}
                                      readOnly={!executiveSearchMode[`reassign_${lead.leadId}`]}
                                      disabled={loadingExecutives[lead.leadId]}
                                      className={`w-full min-w-[100px] px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                        loadingExecutives[lead.leadId] ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    />
                                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${executiveDropdowns[`reassign_${lead.leadId}`] ? 'rotate-180' : ''}`} />
                                    {executiveDropdowns[`reassign_${lead.leadId}`] && !loadingExecutives[lead.leadId] && (
                                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-40 max-h-48 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                                        <div className="p-2">
                                          {(() => {
                                            const executives = getAvailableExecutives(lead.leadId);
                                            const query = executiveSearchQuery[`reassign_${lead.leadId}`] || '';
                                            const filteredExecs = executives.filter(exec => 
                                              `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(query.toLowerCase())
                                            );
                                            
                                            return (
                                              <>
                                                {filteredExecs.length === 0 ? (
                                                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                    {executives.length === 0 ? 'No executives available' : 'No matching executives'}
                                                  </div>
                                                ) : (
                                                  filteredExecs.map((exec, index) => (
                                                    <button
                                                      key={exec.userId}
                                                      ref={el => {
                                                        if (!executiveItemRefs.current[`reassign_${lead.leadId}`]) executiveItemRefs.current[`reassign_${lead.leadId}`] = {};
                                                        executiveItemRefs.current[`reassign_${lead.leadId}`][index] = el;
                                                      }}
                                                      type="button"
                                                      onClick={() => {
                                                        handleReassign(lead.leadId, exec.userId);
                                                        setExecutiveDropdowns(prev => ({ ...prev, [`reassign_${lead.leadId}`]: false }));
                                                        setExecutiveSearchMode(prev => ({ ...prev, [`reassign_${lead.leadId}`]: false }));
                                                        setExecutiveSearchQuery(prev => ({ ...prev, [`reassign_${lead.leadId}`]: '' }));
                                                        setHighlightedExecutiveIndex(prev => ({ ...prev, [`reassign_${lead.leadId}`]: -1 }));
                                                      }}
                                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                        highlightedExecutiveIndex[`reassign_${lead.leadId}`] === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                      }`}
                                                    >
                                                      {exec.firstName} {exec.lastName}
                                                    </button>
                                                  ))
                                                )}
                                              </>
                                            );
                                          })()} 
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnassign(lead.leadId)}
                                    className="text-xs px-2 py-1"
                                  >
                                    <UserX className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Static button - no action
                                  }}
                                  className="text-xs px-2 py-1"
                                >
                                  Request Reassignment
                                </Button>
                              )}
                            </>
                          )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No unassigned leads found</p>
                  <p className="text-sm">
                    {searchTerm || filterSource || filterRegion
                      ? 'Try adjusting your filters'
                      : loading
                        ? 'Loading leads...'
                        : ''
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <NumberedPagination
                  currentPage={page + 1}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage - 1)}
                  totalItems={filteredLeads.length}
                  itemsPerPage={perPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      {recentAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5" />
              <span>Recent Assignments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-200">{assignment.leadName}</span>
                    <span className="text-green-600 dark:text-green-400 mx-2">→</span>
                    <span className="text-green-700 dark:text-green-300">{assignment.executiveName}</span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {assignment.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowConfirmDialog(false);
                setAssignmentDetails({ lead: null, executive: null, type: 'single' });
                setShowAllLeadsInDialog(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Assignment
            </h3>

            <div className="mb-6">
              {assignmentDetails.type === 'bulk' ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You are about to assign <strong className="text-gray-900 dark:text-gray-100">{assignmentDetails.leadIds?.length} leads:</strong>
                  </p>
                  
                  {/* Selected Leads */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg mb-4 overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-600 px-4 py-2.5">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected Leads</h4>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                      <ul className={`space-y-2 ${showAllLeadsInDialog ? 'max-h-60 overflow-y-auto' : ''}`} style={showAllLeadsInDialog ? {scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'} : {}}>
                        {(showAllLeadsInDialog ? assignmentDetails.leadIds : assignmentDetails.leadIds?.slice(0, 4))?.map(leadId => {
                          const lead = unassignedLeads.find(l => l.leadId === leadId);
                          return lead ? (
                            <li key={leadId} className="text-gray-700 dark:text-gray-300 flex items-center">
                              <span className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full mr-2"></span>
                              {lead.firstName} {lead.lastName}
                            </li>
                          ) : null;
                        })}
                      </ul>
                      {assignmentDetails.leadIds && assignmentDetails.leadIds.length > 4 && (
                        <button 
                          onClick={() => setShowAllLeadsInDialog(!showAllLeadsInDialog)}
                          className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 hover:underline"
                        >
                          {showAllLeadsInDialog ? 'Show less' : `+ ${assignmentDetails.leadIds.length - 4} more leads`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assign To */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-600 px-4 py-2.5">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Assign To</h4>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {assignmentDetails.executive?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {assignmentDetails.executive?.firstName} {assignmentDetails.executive?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignmentDetails.executive?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You are about to assign the following lead:
                  </p>
                  
                  {/* Lead Details */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg mb-4 overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-600 px-4 py-2.5">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Lead Details</h4>
                    </div>
                    <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {assignmentDetails.lead?.firstName} {assignmentDetails.lead?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignmentDetails.lead?.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{assignmentDetails.lead?.email}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{assignmentDetails.lead?.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assign To */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-600 px-4 py-2.5">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Assign To</h4>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {assignmentDetails.executive?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {assignmentDetails.executive?.firstName} {assignmentDetails.executive?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignmentDetails.executive?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setAssignmentDetails({ lead: null, executive: null, type: 'single' });
                  setShowAllLeadsInDialog(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAssignment}
                loading={assigning}
                className="flex-1 whitespace-nowrap"
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadAssignment;
