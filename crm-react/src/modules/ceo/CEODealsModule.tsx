/**
 * CEO Deals Module - Organization-wide deals view with hierarchical filtering
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Award, 
  BarChart3, 
  Building, 
  Calendar, 
  ChevronDown, 
  Edit, 
  Eye, 
  Filter, 
  GitBranch, 
  Percent, 
  Plus, 
  Search, 
  Target, 
  TrendingUp, 
  X 
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { ceoApi } from '@/api/ceoApi';
import { formatCurrency, formatDateTime } from '@/utils';
import { getCurrentRole } from '@/utils/rbac';
import type { Deal, User } from '@/types';



const CEODealsModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getCurrentRole();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [salesVPs, setSalesVPs] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('ceoDealsSearchQuery') || '';
  });
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    return localStorage.getItem('ceoDealsSelectedCompany') || '';
  });
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [companySearchMode, setCompanySearchMode] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [highlightedCompanyIndex, setHighlightedCompanyIndex] = useState(-1);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const companyOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const kanbanRef = React.useRef<HTMLDivElement>(null);

  // Extract unique companies from deals data
  const companiesFromDeals = React.useMemo(() => {
    const companies = new Set<string>();
    deals.forEach(deal => {
      const companyName = deal.accountName || deal.company;
      if (companyName && companyName.trim()) {
        companies.add(companyName.trim());
      }
    });
    return Array.from(companies).sort();
  }, [deals]);
  
  useEffect(() => {
    loadSalesVPs();
    
    sessionStorage.setItem('inCEODealsModule', 'true');
    
    return () => {
      setTimeout(() => {
        const stillInCEODeals = window.location.pathname.startsWith('/crm/ceo-deals') ||
                                 (window.location.pathname.startsWith('/crm/Deals/') && sessionStorage.getItem('inCEODealsModule') === 'true');
        if (!stillInCEODeals) {
          localStorage.removeItem('ceoDealsSearchQuery');
          localStorage.removeItem('ceoDealsSelectedCompany');
          sessionStorage.removeItem('inCEODealsModule');
        }
      }, 100);
    };
  }, []);

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

    if (companyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [companyDropdownOpen]);

  useEffect(() => {
    loadDeals();
    localStorage.setItem('ceoDealsSearchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('ceoDealsSelectedCompany', selectedCompany);
  }, [selectedCompany]);

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

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
      };
      const response = await ceoApi.getDeals(params);
      setDeals(response.data);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    localStorage.removeItem('ceoDealsSearchQuery');
    localStorage.removeItem('ceoDealsSelectedCompany');
  };

  // Client-side filtering for search and company
  const filteredDeals = React.useMemo(() => {
    let filtered = deals;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deal => 
        deal.dealName?.toLowerCase().includes(query) ||
        deal.name?.toLowerCase().includes(query) ||
        deal.accountName?.toLowerCase().includes(query) ||
        deal.company?.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected company
    if (selectedCompany) {
      filtered = filtered.filter(deal => 
        deal.accountName?.toLowerCase() === selectedCompany.toLowerCase() ||
        deal.company?.toLowerCase() === selectedCompany.toLowerCase()
      );
    }
    
    return filtered;
  }, [deals, searchQuery, selectedCompany]);

  // Calculate pipeline metrics
  const metrics = React.useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.dealValue || deal.value || 0), 0);
    const wonDeals = filteredDeals.filter(deal => deal.stage === 'Closed_Won');
    const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.dealValue || deal.value || 0), 0);
    const activeDeals = filteredDeals.filter(deal => !['Closed_Won', 'Closed_Lost'].includes(deal.stage));
    const avgDealSize = filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0;
    const winRate = filteredDeals.length > 0 ? (wonDeals.length / filteredDeals.length) * 100 : 0;

    return {
      totalValue,
      wonValue,
      activeDeals: activeDeals.length,
      avgDealSize,
      winRate,
      forecast: activeDeals.reduce((sum, deal) => sum + ((deal.dealValue || deal.value || 0) * (deal.probability || 0) / 100), 0),
    };
  }, [filteredDeals]);

  // Group deals by stage and calculate counts
  const { dealsByStage, stagesWithCounts } = React.useMemo(() => {
    const baseStages = [
      { id: 'Qualification', name: 'Qualified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' },
      { id: 'Proposal', name: 'Proposal', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' },
      { id: 'Negotiation', name: 'Negotiation', color: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' },
      { id: 'Closed_Won', name: 'Won', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' },
      { id: 'Closed_Lost', name: 'Lost', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' },
    ];

    const grouped = baseStages.reduce((acc, stage) => {
      acc[stage.id] = filteredDeals.filter(deal => deal.stage === stage.id);
      return acc;
    }, {} as Record<string, any[]>);

    const stagesWithCounts = baseStages.map(stage => ({
      ...stage,
      count: grouped[stage.id]?.length || 0
    }));

    return { dealsByStage: grouped, stagesWithCounts };
  }, [filteredDeals]);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

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

  const handleDealClick = (deal: Deal) => {
    const dealId = deal.dealId || deal.id;
    if (dealId) {
      navigate(`/crm/Deals/${dealId}`, { state: { from: location.pathname } });
    }
  };

  const handleEditDeal = (deal: Deal) => {
    const dealId = deal.dealId || deal.id;
    if (dealId) {
      navigate(`/crm/Deals/${dealId}/edit`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Reset scroll position of all kanban columns to top
    setTimeout(() => {
      const scrollableElements = document.querySelectorAll('.space-y-3.max-h-96.overflow-y-auto');
      scrollableElements.forEach(element => {
        if (element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
    }, 100);
  };

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    
    // Reset scroll position of all kanban columns to top
    setTimeout(() => {
      const scrollableElements = document.querySelectorAll('.space-y-3.max-h-96.overflow-y-auto');
      scrollableElements.forEach(element => {
        if (element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
    }, 100);
  };

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
      </div>

      {/* Pipeline Metrics */}
      <div className="flex flex-wrap gap-6">
        {[
          { 
            label: 'Pipeline Value', 
            value: (() => {
              const value = metrics.totalValue;
              if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return formatCurrency(value);
            })(), 
            icon: <GitBranch className="w-5 h-5 text-primary-600 preserve-icon-color" />, 
            color: '' 
          },
          { 
            label: 'Won This Month', 
            value: (() => {
              const value = metrics.wonValue;
              if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return formatCurrency(value);
            })(), 
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
            value: (() => {
              const value = metrics.avgDealSize;
              if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return formatCurrency(value);
            })(), 
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
            value: (() => {
              const value = metrics.forecast;
              if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return formatCurrency(value);
            })(), 
            icon: <TrendingUp className="w-5 h-5 text-primary-600 preserve-icon-color" />, 
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Company Filter */}
        <div className="relative" ref={companyDropdownRef}>
          <div className="relative">
            <Building className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={companySearchMode ? companySearchQuery : (selectedCompany || 'All Companies')}
              onChange={(e) => {
                setCompanySearchQuery(e.target.value);
                setCompanyDropdownOpen(true);
                setHighlightedCompanyIndex(-1);
              }}
              onKeyDown={(e) => {
                const allOptions = ['', ...companiesFromDeals];
                const filteredOptions = allOptions.filter(company => 
                  (company || 'All Companies').toLowerCase().includes(companySearchQuery.toLowerCase())
                );
                
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setCompanyDropdownOpen(false);
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                  setHighlightedCompanyIndex(-1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedCompanyIndex(prev => {
                    const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                    setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                    return newIndex;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedCompanyIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : 0;
                    setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                    return newIndex;
                  });
                } else if (e.key === 'Enter' && highlightedCompanyIndex >= 0) {
                  e.preventDefault();
                  const option = filteredOptions[highlightedCompanyIndex];
                  handleCompanyChange(option);
                  setCompanyDropdownOpen(false);
                  setHighlightedCompanyIndex(-1);
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                  setCompanySearchMode(true);
                }
              }}
              onClick={() => {
                setCompanyDropdownOpen(!companyDropdownOpen);
                if (companyDropdownOpen) {
                  setCompanySearchMode(false);
                  setCompanySearchQuery('');
                  setHighlightedCompanyIndex(-1);
                }
              }}
              readOnly={!companySearchMode}
              className="h-10 w-48 pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans truncate"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            {(companySearchQuery && companySearchMode) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCompanySearchQuery('');
                  setCompanySearchMode(false);
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
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
              <div className="p-2">
                {(() => {
                  const filteredCompanies = ['', ...companiesFromDeals]
                    .filter(company => (company || 'All Companies').toLowerCase().includes(companySearchQuery.toLowerCase()));
                  
                  if (filteredCompanies.length === 0) {
                    return (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        No deals found
                      </div>
                    );
                  }
                  
                  return filteredCompanies.map((companyName, index) => (
                    <button
                      key={companyName || 'all'}
                      ref={el => companyOptionsRef.current[index] = el}
                      onClick={() => {
                        handleCompanyChange(companyName);
                        setCompanySearchQuery('');
                        setCompanyDropdownOpen(false);
                        setHighlightedCompanyIndex(-1);
                        setCompanySearchMode(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors truncate font-sans ${
                        highlightedCompanyIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                        selectedCompany === companyName ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title={companyName || 'All Companies'}
                    >
                      {(() => {
                        const label = companyName || 'All Companies';
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
                  ));
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
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Kanban Board */}
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
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent', paddingBottom: '20px'}}>
                  <AnimatePresence>
                    {loading ? (
                      // Loading skeletons
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="bg-gray-200 rounded-xl h-32"></div>
                        </div>
                      ))
                    ) : (
                      dealsByStage[stage.id]?.map((deal, dealIndex) => (
                        <motion.div
                          key={deal.dealId || deal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: dealIndex * 0.05 }}
                        >
                          <Card className="hover-lift border border-gray-200 hover:border-primary-300 transition-all overflow-hidden">
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <Link
                                  to={`/crm/Deals/${deal.dealId || deal.id}`}
                                  state={{ from: location.pathname }}
                                  className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 block"
                                  title={deal.dealName || deal.name}
                                >
                                  {deal.dealName || deal.name || 'Untitled Deal'}
                                </Link>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between min-w-0">
                                  <span className="text-lg font-bold text-gray-900 truncate min-w-0 flex-1">
                                    {(() => {
                                      const value = deal.dealValue || deal.value || 0;
                                      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
                                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                                      return formatCurrency(value);
                                    })()}
                                  </span>
                                  <span className={`text-sm font-medium ${getProbabilityColor(deal.probability || 0)} flex-shrink-0 ml-2`}>
                                    {deal.probability || 0}%
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                                  <Building className="w-4 h-4 flex-shrink-0 preserve-icon-color" />
                                  <span className="truncate flex-1 min-w-0" title={deal.accountName || deal.company || 'No company'}>
                                    {deal.accountName || deal.company || '--'}
                                  </span>
                                </div>
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
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-xl"
                                    onClick={() => handleDealClick(deal)}
                                    title="View Deal"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  {role !== 'CEO' && (
                                    <button
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded-xl"
                                      onClick={() => handleEditDeal(deal)}
                                      title="Edit Deal"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && deals.length === 0 && (
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CEODealsModule;
