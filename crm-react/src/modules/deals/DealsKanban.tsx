import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Deals Kanban Board
 * Drag-and-drop sales pipeline with deal cards
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  Banknote,
  Building,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Filter,
  GitBranch,
  MoreHorizontal,
  Percent,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  X
} from 'lucide-react';
import React from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useDeals, useUpdateDeal, useCompanies, useLeads } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/utils';
import { getCurrentRole, getCurrentUserId, hasTeamVisibility, can } from '@/utils/rbac';
import { useQueryClient } from '@tanstack/react-query';

const DealsKanban: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  const [searchQuery, setSearchQuery] = React.useState(() => {
    // Clear search if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('dealsSearchQuery');
      return '';
    }
    return localStorage.getItem('dealsSearchQuery') || searchParams.get('search') || '';
  });
  const [selectedCompany, setSelectedCompany] = React.useState<string>(() => {
    // Clear company filter if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('dealsSelectedCompany');
      return '';
    }
    return localStorage.getItem('dealsSelectedCompany') || searchParams.get('company') || '';
  });
  const [companyDropdownOpen, setCompanyDropdownOpen] = React.useState(false);
  const [companySearchMode, setCompanySearchMode] = React.useState(false);
  const [companySearchQuery, setCompanySearchQuery] = React.useState('');
  const [highlightedCompanyIndex, setHighlightedCompanyIndex] = React.useState(-1);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const companyItemRefs = React.useRef<{[key: number]: HTMLButtonElement | null}>({});
  const companyInputRef = React.useRef<HTMLInputElement>(null);

  const [scrollDirection, setScrollDirection] = React.useState<'left' | 'right' | null>(null);
  const kanbanRef = React.useRef<HTMLDivElement>(null);

  // Mark that we're in deals module and handle cleanup properly
  React.useEffect(() => {
    sessionStorage.setItem('inDealsModule', 'true');
    sessionStorage.setItem('dealsListMounted', 'true');
    
    return () => {
      sessionStorage.removeItem('dealsListMounted');
      setTimeout(() => {
        const stillInDeals = window.location.pathname.startsWith('/crm/deals') || window.location.pathname.startsWith('/crm/Deals');
        const dealsListStillMounted = sessionStorage.getItem('dealsListMounted');
        
        if (!stillInDeals && !dealsListStillMounted) {
          localStorage.removeItem('dealsSearchQuery');
          localStorage.removeItem('dealsSelectedCompany');
          sessionStorage.removeItem('inDealsModule');
        }
      }, 300);
    };
  }, []);

  // Save filters to localStorage
  React.useEffect(() => {
    localStorage.setItem('dealsSearchQuery', searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    localStorage.setItem('dealsSelectedCompany', selectedCompany);
  }, [selectedCompany]);

  const [scope, setScope] = React.useState<'my' | 'team'>(() => (hasTeamVisibility(getCurrentRole()) ? 'team' : 'my'));
  const ownerId = getCurrentUserId();
  const filtersByScope = scope === 'my' && ownerId ? { ownerId: [ownerId] } : {};

  const { data, isLoading, error } = useDeals({
    search: searchQuery,
    filters: {
      ...filtersByScope,
      ...(selectedCompany ? { company: selectedCompany } : {}),
    },
  });

  const { data: companiesData } = useCompanies();
  const { data: allLeadsResp } = useLeads({ limit: 1000 });
  const allLeads = (allLeadsResp as any)?.data || [];
  
  // Check if a deal is linked to a converted lead with pending reassignment
  const isDealLinkedToPendingReassignment = React.useCallback((deal: any) => {
    if (!deal?.id) return false;
    
    const result = allLeads.some((lead: any) => {
      return String(lead.convertedDealId) === String(deal.id) && 
        lead.status === 'converted' && 
        lead.reassignmentPending === true;
    });
    
    if (result) {
      console.log('🔍 Kanban - Deal linked to pending reassignment:', deal.id);
    }
    
    return result;
  }, [allLeads]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
        setCompanySearchMode(false);
        setCompanySearchQuery('');
        setHighlightedCompanyIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && companyDropdownOpen) {
        setCompanyDropdownOpen(false);
        setCompanySearchMode(false);
        setCompanySearchQuery('');
        setHighlightedCompanyIndex(-1);
      }
    };

    if (companyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [companyDropdownOpen]);

  const updateDealMutation = useUpdateDeal();

  const allDeals = React.useMemo(() => {
    return data?.data || [];
  }, [data?.data]);
  
  // Client-side filtering for search and company
  const deals = React.useMemo(() => {
    let filtered = allDeals;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deal => 
        deal.name?.toLowerCase().includes(query) ||
        deal.company?.toLowerCase().includes(query) ||
        deal.owner?.name?.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected company
    if (selectedCompany) {
      filtered = filtered.filter(deal => 
        deal.company?.toLowerCase() === selectedCompany.toLowerCase()
      );
    }
    
    return filtered;
  }, [allDeals, searchQuery, selectedCompany]);

  // Group deals by stage and calculate counts
  const { dealsByStage, stagesWithCounts } = React.useMemo(() => {
    const baseStages = [
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' },
      { id: 'proposal', name: 'Proposal', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' },
      { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' },
      { id: 'won', name: 'Won', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' },
      { id: 'lost', name: 'Lost', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' },
    ];

    const grouped = baseStages.reduce((acc, stage) => {
      acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
      return acc;
    }, {} as Record<string, any[]>);

    const stagesWithCounts = baseStages.map(stage => ({
      ...stage,
      count: grouped[stage.id]?.length || 0
    }));

    return { dealsByStage: grouped, stagesWithCounts };
  }, [deals]);

  // Calculate pipeline metrics
  const metrics = React.useMemo(() => {
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonDeals = deals.filter(deal => deal.stage === 'won');
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const activeDeals = deals.filter(deal => !['won', 'lost'].includes(deal.stage));
    const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    return {
      totalValue,
      wonValue,
      activeDeals: activeDeals.length,
      avgDealSize,
      winRate,
      forecast: activeDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0),
    };
  }, [deals]);

  // Handle mouse movement for scroll direction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!kanbanRef.current) return;
    
    const rect = kanbanRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const scrollZone = 100;
    
    if (x < scrollZone) {
      setScrollDirection('left');
    } else if (x > width - scrollZone) {
      setScrollDirection('right');
    } else {
      setScrollDirection(null);
    }
  };

  const handleMouseLeave = () => {
    setScrollDirection(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!kanbanRef.current || !scrollDirection) return;
    
    const scrollAmount = 320;
    
    if (scrollDirection === 'left') {
      kanbanRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (scrollDirection === 'right') {
      kanbanRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatLargeNumber = (value: number): string => {
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
      return `$${value.toFixed(0)}`;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleEditDeal = (deal: any) => {
    navigate(`/crm/Deals/${deal.id}/edit`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Reset scroll position of all kanban columns to top
    setTimeout(() => {
      const scrollableElements = document.querySelectorAll('[data-rbd-droppable-id]');
      scrollableElements.forEach(element => {
        if (element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
    }, 100);
    
    // Smart page reset logic
    const hasActiveFilters = value || selectedCompany;
    const isReturningFromDetail = sessionStorage.getItem('returningFromDealDetail') === 'true';
    
    if (hasActiveFilters && isInitialized && !isReturningFromDetail) {
      // Reset any pagination if needed
    }
    
    if (isReturningFromDetail) {
      sessionStorage.removeItem('returningFromDealDetail');
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  };

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    
    // Reset scroll position of all kanban columns to top
    setTimeout(() => {
      const scrollableElements = document.querySelectorAll('[data-rbd-droppable-id]');
      scrollableElements.forEach(element => {
        if (element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
    }, 100);
    
    // Smart page reset logic
    const hasActiveFilters = searchQuery || company;
    const isReturningFromDetail = sessionStorage.getItem('returningFromDealDetail') === 'true';
    
    if (hasActiveFilters && isInitialized && !isReturningFromDetail) {
      // Reset any pagination if needed
    }
    
    if (isReturningFromDetail) {
      sessionStorage.removeItem('returningFromDealDetail');
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  };

  const [dragConfirmation, setDragConfirmation] = React.useState<{
    show: boolean;
    deal: any;
    targetStage: string;
    targetProbability: number;
    isSkippingStages: boolean;
    remarks: string;
  }>({ show: false, deal: null, targetStage: '', targetProbability: 0, isSkippingStages: false, remarks: '' });

  // Handle drag and drop
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Find the deal being moved
    const deal = deals.find(d => d.id.toString() === draggableId);
    if (!deal) return;

    // Define stage progression order
    const stageOrder = ['qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const currentStageIndex = stageOrder.indexOf(source.droppableId);
    const targetStageIndex = stageOrder.indexOf(destination.droppableId);

    // Prevent backward movement (can only move forward)
    if (targetStageIndex < currentStageIndex) {
      toast.error('Deals can only move forward in the pipeline');
      return;
    }

    // Prevent moving between won and lost stages
    if (source.droppableId === 'won' && destination.droppableId === 'lost') {
      toast.error('Cannot move Won to Lost');
      return;
    }

    // Map droppable IDs to stage names and probabilities
    const stageMap: Record<string, { stage: string; probability: number }> = {
      'qualified': { stage: 'Qualification', probability: 25 },
      'proposal': { stage: 'Proposal', probability: 50 }, 
      'negotiation': { stage: 'Negotiation', probability: 75 },
      'won': { stage: 'Closed_Won', probability: 100 },
      'lost': { stage: 'Closed_Lost', probability: 0 }
    };

    const stageData = stageMap[destination.droppableId];
    if (!stageData) return;

    // Only require remarks when moving to lost stage
    const isMovingToLost = destination.droppableId === 'lost';

    // Show confirmation popup
    setDragConfirmation({
      show: true,
      deal,
      targetStage: stageData.stage,
      targetProbability: stageData.probability,
      isSkippingStages: isMovingToLost,
      remarks: ''
    });
  };

  // Confirm stage change
  const confirmStageChange = async () => {
    const { deal, targetStage, targetProbability, isSkippingStages, remarks } = dragConfirmation;
    
    // Validate remarks if moving to lost stage
    if (isSkippingStages && !remarks.trim()) {
      toast.error('Please provide remarks when marking deal as lost');
      return;
    }
    
    try {
      // Update stage and probability, preserving all other data
      await updateDealMutation.mutateAsync({
        id: deal.id,
        data: {
          ...deal,
          stage: targetStage,
          probability: targetProbability,
          ...(isSkippingStages && remarks.trim() ? { remarks: remarks.trim() } : {})
        }
      });

      toast.success(`Deal moved to ${targetStage === 'Closed_Won' ? 'Won' : targetStage === 'Closed_Lost' ? 'Lost' : targetStage} (${targetProbability}% probability)`);
      
      // Refresh deals data
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    } catch (error) {
      toast.error('Failed to update deal stage');
      logger.error('Failed to update deal stage:', error);
    } finally {
      setDragConfirmation({ show: false, deal: null, targetStage: '', targetProbability: 0, isSkippingStages: false, remarks: '' });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading deals: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Manage your deals and track sales progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {getCurrentRole() !== 'Sales_VP' && getCurrentRole() !== 'Sales_Manager' && (
            <Button 
              as={Link} 
              to="/crm/Deals/new" 
              variant="primary" 
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Deal
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="flex flex-wrap gap-6">
        {[
          { 
            label: 'Pipeline Value', 
            value: formatLargeNumber(metrics.totalValue), 
            icon: <GitBranch className="w-5 h-5 text-blue-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Won This Month', 
            value: formatLargeNumber(metrics.wonValue), 
            icon: <Award className="w-5 h-5 text-green-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Active Deals', 
            value: metrics.activeDeals.toString(), 
            icon: <Target className="w-5 h-5 text-purple-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Avg Deal Size', 
            value: formatLargeNumber(metrics.avgDealSize), 
            icon: <BarChart3 className="w-5 h-5 text-orange-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Win Rate', 
            value: `${metrics.winRate.toFixed(1)}%`, 
            icon: <Percent className="w-5 h-5 text-green-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Forecast', 
            value: formatCurrency(metrics.forecast), 
            icon: <TrendingUp className="w-5 h-5 text-blue-600 preserve-icon-color" />, 
            color: '' 
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-1 basis-[calc(33.333%-1rem)] min-w-[200px]"
          >
            <Card>
              <CardContent className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {metric.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 truncate" title={metric.value}>
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ml-3 preserve-icon-color">
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="max-w-md relative">
          <Input
            placeholder="Search deals"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Company Filter */}
        <div className="relative" ref={companyDropdownRef}>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            <input
              ref={companyInputRef}
              type="text"
              value={companySearchMode ? companySearchQuery : (selectedCompany || 'All Companies')}
              onChange={(e) => {
                setCompanySearchQuery(e.target.value);
                setCompanyDropdownOpen(true);
                setHighlightedCompanyIndex(-1);
              }}
              onKeyDown={(e) => {
                const filteredCompanies = companySearchQuery
                  ? (companiesData?.data || []).filter(c => c.name.toLowerCase().includes(companySearchQuery.toLowerCase()))
                  : (companiesData?.data || []);
                
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedCompanyIndex(prev => {
                    const newIndex = prev < filteredCompanies.length ? prev + 1 : prev;
                    setTimeout(() => companyItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                    return newIndex;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedCompanyIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : 0;
                    setTimeout(() => companyItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                    return newIndex;
                  });
                } else if (e.key === 'Enter' && highlightedCompanyIndex >= 0) {
                  e.preventDefault();
                  if (highlightedCompanyIndex === 0) {
                    handleCompanyChange('');
                  } else {
                    const company = filteredCompanies[highlightedCompanyIndex - 1];
                    if (company) handleCompanyChange(company.name);
                  }
                  setCompanyDropdownOpen(false);
                  setHighlightedCompanyIndex(-1);
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setCompanyDropdownOpen(false);
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                  setHighlightedCompanyIndex(-1);
                } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                  setCompanySearchMode(true);
                }
              }}
              onClick={() => {
                setCompanyDropdownOpen(!companyDropdownOpen);
                if (!companyDropdownOpen) {
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                  setHighlightedCompanyIndex(-1);
                }
              }}
              readOnly={!companySearchMode}
              className="h-10 w-full pl-10 pr-20 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            {companySearchQuery && companySearchMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCompanySearchQuery('');
                  setCompanySearchMode(false);
                  companyInputRef.current?.focus();
                }}
                className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${companyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {companyDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
              <div className="p-2">
                {(() => {
                  const filteredCompanies = companySearchQuery
                    ? (companiesData?.data || []).filter(c => c.name.toLowerCase().includes(companySearchQuery.toLowerCase()))
                    : (companiesData?.data || []);
                  
                  if (filteredCompanies.length === 0) {
                    return (
                      <div className="px-3 py-2 text-left text-sm text-gray-500">
                        No deals found
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <button
                        ref={el => companyItemRefs.current[0] = el}
                        onClick={() => {
                          handleCompanyChange('');
                          setCompanyDropdownOpen(false);
                          setHighlightedCompanyIndex(-1);
                          setCompanySearchMode(false);
                          setCompanySearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          highlightedCompanyIndex === 0 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                          !selectedCompany ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        All Companies
                      </button>
                      {filteredCompanies.map((company, index) => (
                        <button
                          key={company.id}
                          ref={el => companyItemRefs.current[index + 1] = el}
                          onClick={() => {
                            handleCompanyChange(company.name);
                            setCompanyDropdownOpen(false);
                            setHighlightedCompanyIndex(-1);
                            setCompanySearchMode(false);
                            setCompanySearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                            highlightedCompanyIndex === index + 1 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                            selectedCompany === company.name ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={company.name}
                        >
                          {(() => {
                            const label = company.name;
                            if (!companySearchQuery) return label;
                            const index = label.toLowerCase().indexOf(companySearchQuery.toLowerCase());
                            if (index === -1) return label;
                            return (
                              <>
                                {label.slice(0, index)}
                                <strong>{label.slice(index, index + companySearchQuery.length)}</strong>
                                {label.slice(index + companySearchQuery.length)}
                              </>
                            );
                          })()}
                        </button>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        
        {/* Clear Filters */}
        {(searchQuery || selectedCompany) && (
          <Button
            variant="ghost"
            onClick={() => {
              handleSearchChange('');
              handleCompanyChange('');
              localStorage.removeItem('dealsSearchQuery');
              localStorage.removeItem('dealsSelectedCompany');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={kanbanRef}
          className={`flex space-x-6 overflow-x-auto pb-6 ${scrollDirection ? `cursor-${scrollDirection === 'left' ? 'w' : 'e'}-resize` : 'cursor-default'}`} 
          style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent'}}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {stagesWithCounts.map((stage, stageIndex) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: stageIndex * 0.1 }}
              className="flex-shrink-0 w-80"
            >
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <Badge className={stage.color} size="sm">
                      {stage.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 max-h-96 overflow-y-auto pr-2 min-h-[100px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent', paddingBottom: '20px'}}
                      >
                        <AnimatePresence>
                          {isLoading ? (
                            // Loading skeletons
                            Array.from({ length: 3 }).map((_, index) => (
                              <div key={index} className="animate-pulse">
                                <div className="bg-gray-200 rounded-xl h-32"></div>
                              </div>
                            ))
                          ) : (
                            dealsByStage[stage.id]?.map((deal, dealIndex) => {
                              const isDragEnabled = getCurrentRole() === 'Sales_Executive';
                              
                              return isDragEnabled ? (
                                <Draggable key={deal.id} draggableId={deal.id.toString()} index={dealIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`transition-transform ${
                                        snapshot.isDragging ? 'rotate-2 scale-105' : ''
                                      }`}
                                    >
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: dealIndex * 0.05 }}
                                      >
                                        <Card className={`hover-lift border transition-all overflow-hidden ${
                                          snapshot.isDragging 
                                            ? 'border-primary-300 shadow-lg' 
                                            : 'border-gray-200 hover:border-primary-300'
                                        }`}>
                                          <CardContent className="p-4">
                                            <div className="mb-3">
                                              <div title={deal.name} className="max-w-full">
                                                <Link
                                                  to={`/crm/Deals/${deal.id}`}
                                                  state={{ from: location.pathname + location.search }}
                                                  className="font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate max-w-full"
                                                  onClick={() => {
                                                    sessionStorage.setItem('navigatingToDealDetail', 'true');
                                                  }}
                                                >
                                                  {deal.name}
                                                </Link>
                                              </div>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                              <div className="flex items-center justify-between min-w-0">
                                                <span className="text-lg font-bold text-gray-900 truncate min-w-0 flex-1">
                                                  {formatLargeNumber(deal.value)}
                                                </span>
                                                <span className={`text-sm font-medium ${getProbabilityColor(deal.probability)} flex-shrink-0 ml-2`}>
                                                  {deal.probability}%
                                                </span>
                                              </div>

                                              <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                                                <Building className="w-4 h-4 flex-shrink-0 preserve-icon-color" />
                                                <span className="truncate flex-1 min-w-0" title={deal.company || 'No company'}>
                                                  {deal.company || '--'}
                                                </span>
                                              </div>

                                              {deal.expectedCloseDate && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                                                  <Calendar className="w-4 h-4 flex-shrink-0 preserve-icon-color" />
                                                  <span className="truncate flex-1 min-w-0">
                                                    {formatDate(deal.expectedCloseDate)}
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex items-center justify-between min-w-0">
                                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <Avatar
                                                  name={deal.leadName || 'No Lead'}
                                                  size="xs"
                                                  className="flex-shrink-0"
                                                />
                                                <span className="text-xs text-gray-600 truncate min-w-0" title={deal.leadName || 'No Lead'}>
                                                  {deal.leadName || 'No Lead'}
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                                <button
                                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                  onClick={() => {
                                                    sessionStorage.setItem('navigatingToDealDetail', 'true');
                                                    navigate(`/crm/Deals/${deal.id}`, { state: { from: location.pathname + location.search } });
                                                  }}
                                                  title="View Deal"
                                                >
                                                  <Eye className="w-3 h-3" />
                                                </button>
                                                {can(getCurrentRole(), 'Deals', 'Edit') && (
                                                  <button
                                                    className={`p-1 rounded ${
                                                      isDealLinkedToPendingReassignment(deal)
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                                    onClick={isDealLinkedToPendingReassignment(deal) ? undefined : () => handleEditDeal(deal)}
                                                    disabled={isDealLinkedToPendingReassignment(deal)}
                                                    title={isDealLinkedToPendingReassignment(deal) ? 'Cannot edit - Deal linked to converted lead with pending reassignment' : 'Edit Deal'}
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            {deal.tags && deal.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-3 overflow-hidden">
                                                {deal.tags.slice(0, 2).map((tag: string, index: number) => (
                                                  <Badge key={index} variant="default" size="sm" className="truncate max-w-full">
                                                    {tag}
                                                  </Badge>
                                                ))}
                                                {deal.tags.length > 2 && (
                                                  <Badge variant="default" size="sm" className="flex-shrink-0">
                                                    +{deal.tags.length - 2}
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    </div>
                                  )}
                                </Draggable>
                              ) : (
                                <div key={deal.id}>
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: dealIndex * 0.05 }}
                                  >
                                    <Card className="hover-lift border transition-all overflow-hidden border-gray-200 hover:border-primary-300">
                                      <CardContent className="p-4">
                                        <div className="mb-3">
                                          <div title={deal.name} className="max-w-full">
                                            <Link
                                              to={`/crm/Deals/${deal.id}`}
                                              state={{ from: location.pathname + location.search }}
                                              className="font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate max-w-full"
                                              onClick={() => {
                                                sessionStorage.setItem('navigatingToDealDetail', 'true');
                                              }}
                                            >
                                              {deal.name}
                                            </Link>
                                          </div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                          <div className="flex items-center justify-between min-w-0">
                                            <span className="text-lg font-bold text-gray-900 truncate min-w-0 flex-1">
                                              {formatLargeNumber(deal.value)}
                                            </span>
                                            <span className={`text-sm font-medium ${getProbabilityColor(deal.probability)} flex-shrink-0 ml-2`}>
                                              {deal.probability}%
                                            </span>
                                          </div>

                                          <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                                            <Building className="w-4 h-4 flex-shrink-0 preserve-icon-color" />
                                            <span className="truncate flex-1 min-w-0" title={deal.company || 'No company'}>
                                              {deal.company || '--'}
                                            </span>
                                          </div>

                                          {deal.expectedCloseDate && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                                              <Calendar className="w-4 h-4 flex-shrink-0 preserve-icon-color" />
                                              <span className="truncate flex-1 min-w-0">
                                                {formatDate(deal.expectedCloseDate)}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between min-w-0">
                                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            <Avatar
                                              name={deal.leadName || 'No Lead'}
                                              size="xs"
                                              className="flex-shrink-0"
                                            />
                                            <span className="text-xs text-gray-600 truncate min-w-0" title={deal.leadName || 'No Lead'}>
                                              {deal.leadName || 'No Lead'}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                            <button
                                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                              onClick={() => {
                                                sessionStorage.setItem('navigatingToDealDetail', 'true');
                                                navigate(`/crm/Deals/${deal.id}`, { state: { from: location.pathname + location.search } });
                                              }}
                                              title="View Deal"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                            {can(getCurrentRole(), 'Deals', 'Edit') && (
                                              <button
                                                className={`p-1 rounded ${
                                                  isDealLinkedToPendingReassignment(deal)
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                                onClick={isDealLinkedToPendingReassignment(deal) ? undefined : () => handleEditDeal(deal)}
                                                disabled={isDealLinkedToPendingReassignment(deal)}
                                                title={isDealLinkedToPendingReassignment(deal) ? 'Cannot edit - Deal linked to converted lead with pending reassignment' : 'Edit Deal'}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {deal.tags && deal.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-3 overflow-hidden">
                                            {deal.tags.slice(0, 2).map((tag: string, index: number) => (
                                              <Badge key={index} variant="default" size="sm" className="truncate max-w-full">
                                                {tag}
                                              </Badge>
                                            ))}
                                            {deal.tags.length > 2 && (
                                              <Badge variant="default" size="sm" className="flex-shrink-0">
                                                +{deal.tags.length - 2}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                </div>
                              );
                            })
                          )}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </DragDropContext>

      {/* Empty State */}
      {!isLoading && deals.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
              {(searchQuery || selectedCompany) && (
                <p className="text-gray-500 mb-6">
                  Try adjusting your search query or filters
                </p>
              )}
              {!searchQuery && !selectedCompany && getCurrentRole() !== 'Sales_Manager' && getCurrentRole() !== 'Sales_VP' && (
                <>
                  <p className="text-gray-500 mb-6">
                    Get started by creating your first deal
                  </p>
                  <Button as={Link} to="/crm/Deals/new" variant="primary">
                    Create Your First Deal
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      {dragConfirmation.show && (
        <Modal 
          isOpen={true} 
          onClose={() => setDragConfirmation({ show: false, deal: null, targetStage: '', targetProbability: 0, isSkippingStages: false, remarks: '' })} 
          title="Confirm Stage Change" 
          size="sm"
          className="max-w-md"
        >
          <ModalContent className="px-4 py-3">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Are you sure you want to move <span className="font-semibold text-gray-900">{dragConfirmation.deal?.name}</span> to <span className="font-semibold text-gray-900">{dragConfirmation.targetStage === 'Closed_Won' ? 'Won' : dragConfirmation.targetStage === 'Closed_Lost' ? 'Lost' : dragConfirmation.targetStage}</span>?
            </p>
            
            {dragConfirmation.isSkippingStages && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Required for Lost deals) *
                </label>
                <div className="relative">
                  <textarea
                    value={dragConfirmation.remarks}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue.length <= 200) {
                        setDragConfirmation(prev => ({ ...prev, remarks: newValue }));
                      }
                    }}
                    rows={4}
                    maxLength={200}
                    className="w-full px-3 py-2 pb-10 border border-gray-300 rounded-lg resize-none text-sm"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    placeholder="Please provide reasons for marking this deal as lost"
                  />
                  <div className="absolute bottom-1 right-2 pointer-events-none">
                    <span className={`text-xs ${
                      dragConfirmation.remarks.length >= 200 ? 'text-red-600' :
                      dragConfirmation.remarks.length >= 178 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {dragConfirmation.remarks.length >= 200 ? 'Character limit reached - ' :
                       dragConfirmation.remarks.length >= 178 ? 'Approaching 200 character limit - ' : ''}{dragConfirmation.remarks.length}/200
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-9 bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
                onClick={() => setDragConfirmation({ show: false, deal: null, targetStage: '', targetProbability: 0, isSkippingStages: false, remarks: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 h-9"
                onClick={confirmStageChange}
                disabled={dragConfirmation.isSkippingStages && !dragConfirmation.remarks.trim()}
              >
                Confirm Move
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

    </div>
  );
};

export default DealsKanban;
