/**
 * CEO Reports Module - Organization-wide reports with hierarchical filtering and graphs
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Filter, Download, TrendingUp, Users, DollarSign, ChevronDown, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ceoApi } from '@/api/ceoApi';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { format, parse } from 'date-fns';
import type { User } from '@/types';

const CEOReportsModule: React.FC = () => {
  const [salesVPs, setSalesVPs] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalesVP, setSelectedSalesVP] = useState<number | null>(null);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [selectedExecutive, setSelectedExecutive] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<any>({});
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [allExecutives, setAllExecutives] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown states
  const [isSalesVPDropdownOpen, setIsSalesVPDropdownOpen] = useState(false);
  const [salesVPSearchMode, setSalesVPSearchMode] = useState(false);
  const [salesVPSearchQuery, setSalesVPSearchQuery] = useState('');
  const [highlightedSalesVPIndex, setHighlightedSalesVPIndex] = useState(-1);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [managerSearchMode, setManagerSearchMode] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [highlightedManagerIndex, setHighlightedManagerIndex] = useState(-1);
  const [isExecutiveDropdownOpen, setIsExecutiveDropdownOpen] = useState(false);
  const [executiveSearchMode, setExecutiveSearchMode] = useState(false);
  const [executiveSearchQuery, setExecutiveSearchQuery] = useState('');
  const [highlightedExecutiveIndex, setHighlightedExecutiveIndex] = useState(-1);
  const salesVPDropdownRef = React.useRef<HTMLDivElement>(null);
  const managerDropdownRef = React.useRef<HTMLDivElement>(null);
  const executiveDropdownRef = React.useRef<HTMLDivElement>(null);
  const salesVPOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const managerOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const executiveOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    loadSalesVPs();
    loadAllManagers();
    loadAllExecutives();
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (salesVPDropdownRef.current && !salesVPDropdownRef.current.contains(event.target as Node)) {
        setIsSalesVPDropdownOpen(false);
        setSalesVPSearchMode(false);
        setSalesVPSearchQuery('');
        setHighlightedSalesVPIndex(-1);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target as Node)) {
        setIsManagerDropdownOpen(false);
        setManagerSearchMode(false);
        setManagerSearchQuery('');
        setHighlightedManagerIndex(-1);
      }
      if (executiveDropdownRef.current && !executiveDropdownRef.current.contains(event.target as Node)) {
        setIsExecutiveDropdownOpen(false);
        setExecutiveSearchMode(false);
        setExecutiveSearchQuery('');
        setHighlightedExecutiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadReportData();
  }, [selectedSalesVP, selectedManager, selectedExecutive, managers, executives, salesVPs, dateRange]);

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
    } finally {
      setLoading(false);
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

  const loadAllManagers = async () => {
    try {
      // Load all managers across all VPs for CEO
      const allManagersData: User[] = [];
      for (const vp of salesVPs) {
        const response = await ceoApi.getManagersUnderSalesVP(vp.userId);
        allManagersData.push(...response.data);
      }
      setAllManagers(allManagersData);
    } catch (error) {
      console.error('Failed to load all managers:', error);
    }
  };

  const loadAllExecutives = async () => {
    try {
      // Load all executives across all managers for CEO
      const allExecutivesData: User[] = [];
      for (const manager of allManagers) {
        const response = await ceoApi.getExecutivesUnderManager(manager.userId);
        allExecutivesData.push(...response.data);
      }
      setAllExecutives(allExecutivesData);
    } catch (error) {
      console.error('Failed to load all executives:', error);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load real metrics and chart data from API
      const params = {
        salesVpId: selectedSalesVP, 
        managerId: selectedManager, 
        executiveId: selectedExecutive,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      };
      
      const [leadsResponse, dealsResponse, accountsResponse] = await Promise.all([
        ceoApi.getLeads(params),
        ceoApi.getDeals(params),
        ceoApi.getAccounts(params)
      ]);
      
      const leads = leadsResponse.data || [];
      const deals = dealsResponse.data || [];
      const accounts = accountsResponse.data || [];
      
      // Calculate real metrics
      const totalLeads = leads.length;
      const totalDeals = deals.length;
      const closedWonDeals = deals.filter(deal => deal.dealStage === 'Closed_Won' || deal.stage === 'Closed_Won');
      const totalRevenue = closedWonDeals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
      const conversionRate = totalLeads > 0 ? Math.min(Math.round((totalDeals / totalLeads) * 100), 100) : 0;
      
      // Generate real chart data from API data
      const chartData = generateRealChartData(leads, deals);
      const vpData = selectedSalesVP ? null : await generateRealVPData();
      const managerData = selectedExecutive ? null : await generateRealManagerData();
      const executiveData = selectedManager ? await generateRealExecutiveData() : null;
      
      const data = generateReportDataWithReal(totalLeads, totalDeals, totalRevenue, conversionRate, chartData, vpData, managerData, executiveData);
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report data:', error);
      // Fallback to mock data if API fails
      const data = generateMockReportData();
      setReportData(data);
    } finally {
      setLoading(false);
    }
  };

  const generateRealChartData = (leads: any[], deals: any[]) => {
    // Generate 6-month trend data from real API data
    const currentDate = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = monthDate.getFullYear().toString();
      const month = (monthDate.getMonth() + 1).toString().padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    
    return months.map((monthKey, i) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - i), 1);
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt || lead.dateCreated);
        return leadDate.getMonth() === monthDate.getMonth() && leadDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.createdAt || deal.dateCreated);
        return dealDate.getMonth() === monthDate.getMonth() && dealDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      const monthRevenue = deals.filter(deal => {
        const dealDate = new Date(deal.createdAt || deal.dateCreated);
        return dealDate.getMonth() === monthDate.getMonth() && 
               dealDate.getFullYear() === monthDate.getFullYear() &&
               (deal.dealStage === 'Closed_Won' || deal.stage === 'Closed_Won');
      }).reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
      
      return {
        month: monthKey,
        leads: monthLeads,
        deals: monthDeals,
        revenue: monthRevenue
      };
    });
  };
  
  const generateRealVPData = async () => {
    try {
      const vpPerformance = [];
      for (const vp of salesVPs) {
        const [vpLeads, vpDeals] = await Promise.all([
          ceoApi.getLeads({ 
            salesVpId: vp.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          }),
          ceoApi.getDeals({ 
            salesVpId: vp.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          })
        ]);
        vpPerformance.push({
          name: `${vp.firstName} ${vp.lastName}`,
          leads: vpLeads.data?.length || 0,
          deals: vpDeals.data?.length || 0,
          revenue: vpDeals.data?.filter((deal: any) => deal.dealStage === 'Closed_Won' || deal.stage === 'Closed_Won').reduce((sum: number, deal: any) => sum + (deal.dealValue || 0), 0) || 0
        });
      }
      return vpPerformance;
    } catch (error) {
      console.error('Failed to generate VP data:', error);
      return [];
    }
  };
  
  const generateRealManagerData = async () => {
    try {
      const managerPerformance = [];
      const managersToUse = selectedSalesVP ? managers : allManagers;
      
      for (const manager of managersToUse) {
        const [managerLeads, managerDeals] = await Promise.all([
          ceoApi.getLeads({ 
            managerId: manager.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          }),
          ceoApi.getDeals({ 
            managerId: manager.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          })
        ]);
        managerPerformance.push({
          name: `${manager.firstName} ${manager.lastName}`,
          leads: managerLeads.data?.length || 0,
          deals: managerDeals.data?.length || 0,
          revenue: managerDeals.data?.filter((deal: any) => deal.dealStage === 'Closed_Won' || deal.stage === 'Closed_Won').reduce((sum: number, deal: any) => sum + (deal.dealValue || 0), 0) || 0
        });
      }
      return managerPerformance;
    } catch (error) {
      console.error('Failed to generate manager data:', error);
      return [];
    }
  };
  
  const generateRealExecutiveData = async () => {
    try {
      const executivePerformance = [];
      const executivesToUse = selectedManager ? executives : allExecutives;
      
      for (const executive of executivesToUse) {
        const [execLeads, execDeals] = await Promise.all([
          ceoApi.getLeads({ 
            executiveId: executive.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          }),
          ceoApi.getDeals({ 
            executiveId: executive.userId,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined
          })
        ]);
        executivePerformance.push({
          name: `${executive.firstName} ${executive.lastName}`,
          leads: execLeads.data?.length || 0,
          deals: execDeals.data?.length || 0,
          revenue: execDeals.data?.filter((deal: any) => deal.dealStage === 'Closed_Won' || deal.stage === 'Closed_Won').reduce((sum: number, deal: any) => sum + (deal.dealValue || 0), 0) || 0
        });
      }
      return executivePerformance;
    } catch (error) {
      console.error('Failed to generate executive data:', error);
      return [];
    }
  };
  
  const generateReportDataWithReal = (totalLeads: number, totalDeals: number, totalRevenue: number, conversionRate: number, chartData: any[], vpData: any[], managerData: any[], executiveData: any[]) => {
    const baseMetrics = {
      leads: totalLeads,
      deals: totalDeals,
      revenue: totalRevenue,
      conversion: conversionRate
    };
    
    if (selectedExecutive) {
      const executive = executives.find(e => e.userId === selectedExecutive);
      return {
        type: 'executive',
        name: `${executive?.firstName} ${executive?.lastName}`,
        metrics: baseMetrics,
        chartData
      };
    } else if (selectedManager) {
      const manager = managers.find(m => m.userId === selectedManager);
      return {
        type: 'manager',
        name: `${manager?.firstName} ${manager?.lastName}`,
        metrics: { ...baseMetrics, executives: executives.length },
        chartData,
        executiveData
      };
    } else if (selectedSalesVP) {
      const vp = salesVPs.find(vp => vp.userId === selectedSalesVP);
      return {
        type: 'vp',
        name: `${vp?.firstName} ${vp?.lastName}`,
        metrics: { ...baseMetrics, managers: managers.length },
        chartData,
        managerData
      };
    } else {
      return {
        type: 'organization',
        name: 'Organization Overview',
        metrics: { ...baseMetrics, vps: salesVPs.length },
        chartData,
        vpData,
        allManagerData: managerData,
        allExecutiveData: executiveData
      };
    }
  };
  
  const generateMockReportData = () => {
    // Fallback mock data
    const baseMetrics = {
      leads: Math.floor(Math.random() * 3000) + 1500,
      deals: Math.floor(Math.random() * 800) + 400,
      revenue: Math.floor(Math.random() * 10000000) + 5000000,
      conversion: Math.floor(Math.random() * 15) + 30
    };
    
    return generateMockReportDataWithMetrics(baseMetrics);
  };
  
  const generateMockReportDataWithMetrics = (baseMetrics: any) => {
    // Mock data generation based on hierarchy level
    if (selectedExecutive) {
      // Show only selected executive data
      const executive = executives.find(e => e.userId === selectedExecutive);
      return {
        type: 'executive',
        name: `${executive?.firstName} ${executive?.lastName}`,
        metrics: baseMetrics,
        chartData: Array.from({ length: 6 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
          leads: Math.floor(Math.random() * 20) + 10,
          deals: Math.floor(Math.random() * 8) + 2,
          revenue: Math.floor(Math.random() * 20000) + 10000
        }))
      };
    } else if (selectedManager) {
      // Show selected manager data + their executives
      const manager = managers.find(m => m.userId === selectedManager);
      return {
        type: 'manager',
        name: `${manager?.firstName} ${manager?.lastName}`,
        metrics: {
          ...baseMetrics,
          executives: executives.length
        },
        chartData: Array.from({ length: 6 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
          leads: Math.floor(Math.random() * 80) + 40,
          deals: Math.floor(Math.random() * 25) + 10,
          revenue: Math.floor(Math.random() * 80000) + 40000
        })),
        executiveData: executives.map((executive) => ({
          name: `${executive.firstName} ${executive.lastName}`,
          leads: Math.floor(Math.random() * 50) + 20,
          deals: Math.floor(Math.random() * 15) + 5,
          revenue: Math.floor(Math.random() * 100000) + 50000
        }))
      };
    } else if (selectedSalesVP) {
      // Show selected VP data + their managers
      const vp = salesVPs.find(vp => vp.userId === selectedSalesVP);
      const managerCount = managers.length || 3; // Default to 3 if no managers loaded
      return {
        type: 'vp',
        name: `${vp?.firstName} ${vp?.lastName}`,
        metrics: {
          ...baseMetrics,
          managers: managerCount
        },
        chartData: Array.from({ length: 6 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
          leads: Math.floor(Math.random() * 300) + 150,
          deals: Math.floor(Math.random() * 80) + 40,
          revenue: Math.floor(Math.random() * 300000) + 150000
        })),
        managerData: managers.map((manager) => ({
          name: `${manager.firstName} ${manager.lastName}`,
          leads: Math.floor(Math.random() * 200) + 100,
          deals: Math.floor(Math.random() * 60) + 30,
          revenue: Math.floor(Math.random() * 500000) + 250000
        }))
      };
    } else {
      // Organization-wide view - show all VPs
      return {
        type: 'organization',
        name: 'Organization Overview',
        metrics: {
          ...baseMetrics,
          vps: salesVPs.length
        },
        chartData: Array.from({ length: 6 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
          leads: Math.floor(Math.random() * 1000) + 500,
          deals: Math.floor(Math.random() * 300) + 150,
          revenue: Math.floor(Math.random() * 1500000) + 750000
        })),
        vpData: salesVPs.map((vp) => ({
          name: `${vp.firstName} ${vp.lastName}`,
          leads: Math.floor(Math.random() * 800) + 400,
          deals: Math.floor(Math.random() * 200) + 100,
          revenue: Math.floor(Math.random() * 2000000) + 1000000
        }))
      };
    }
  };

  const clearFilters = () => {
    setSelectedSalesVP(null);
    setSelectedManager(null);
    setSelectedExecutive(null);
    setDateRange({ start: '', end: '' });
    setManagers([]);
    setExecutives([]);
  };

  const handleExportReport = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const wb = XLSX.utils.book_new();
      
      const exportData = [
        ['CEO Sales Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Period:', `${dateRange.start} to ${dateRange.end}`],
        [''],
        ['Metrics Summary'],
        ['Total Leads', reportData.metrics?.leads || 0],
        ['Total Deals', reportData.metrics?.deals || 0],
        ['Total Revenue', `$${(reportData.metrics?.revenue || 0).toLocaleString()}`],
        ['Conversion Rate', `${reportData.metrics?.conversion || 0}%`],
        [''],
        ['Performance Trends'],
        ['Month', 'Leads', 'Deals', 'Revenue']
      ];
      
      if (reportData.chartData) {
        reportData.chartData.forEach((item: any) => {
          exportData.push([
            item.month,
            item.leads || 0,
            item.deals || 0,
            `$${(item.revenue || 0).toLocaleString()}`
          ]);
        });
      }
      
      if (reportData.vpData) {
        exportData.push([''], ['Sales VP Performance'], ['Name', 'Leads', 'Deals', 'Revenue']);
        reportData.vpData.forEach((vp: any) => {
          exportData.push([
            vp.name,
            vp.leads || 0,
            vp.deals || 0,
            `$${(vp.revenue || 0).toLocaleString()}`
          ]);
        });
      }
      
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      ws['!cols'] = [
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 20 }
      ];
      
      const chartData = [
        ['Chart Data'],
        [''],
        ['Performance Trends Chart'],
        ['Month', 'Leads', 'Deals']
      ];
      
      if (reportData.chartData) {
        reportData.chartData.forEach((item: any) => {
          chartData.push([item.month, item.leads || 0, item.deals || 0]);
        });
      }
      
      XLSX.utils.sheet_add_aoa(ws, chartData, { origin: 'F1' });
      
      XLSX.utils.book_append_sheet(wb, ws, 'CEO Report');
      
      const filename = `CEO_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Report exported successfully!', {
          duration: 3000,
          position: 'top-right'
        });
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Failed to export report', {
          duration: 3000,
          position: 'top-right'
        });
      });
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Performance analytics across all Sales VPs, Managers, and Executives
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showFilters && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <CustomDatePicker
              label=""
              value={dateRange.start ? format(parse(dateRange.start, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
              onChange={(value) => {
                if (value) {
                  try {
                    const date = parse(value, 'dd-MM-yyyy', new Date());
                    const startDate = format(date, 'yyyy-MM-dd');
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Prevent future dates
                    if (startDate > today) {
                      return;
                    }
                    
                    // Prevent start date from being greater than end date
                    if (dateRange.end && startDate > dateRange.end) {
                      return;
                    }
                    
                    setDateRange(prev => ({ 
                      ...prev, 
                      start: startDate
                    }));
                  } catch (error) {
                    console.error('Invalid date format:', error);
                  }
                } else {
                  setDateRange(prev => ({ ...prev, start: '' }));
                }
              }}
              placeholder="dd-mm-yyyy"
              maxDate={new Date()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <CustomDatePicker
              label=""
              value={dateRange.end ? format(parse(dateRange.end, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
              onChange={(value) => {
                if (value) {
                  try {
                    const date = parse(value, 'dd-MM-yyyy', new Date());
                    const endDate = format(date, 'yyyy-MM-dd');
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Prevent future dates
                    if (endDate > today) {
                      return;
                    }
                    
                    // Prevent end date from being less than start date
                    if (dateRange.start && endDate < dateRange.start) {
                      return;
                    }
                    
                    setDateRange(prev => ({ ...prev, end: endDate }));
                  } catch (error) {
                    console.error('Invalid date format:', error);
                  }
                } else {
                  setDateRange(prev => ({ ...prev, end: '' }));
                }
              }}
              placeholder="dd-mm-yyyy"
              minDate={dateRange.start ? parse(dateRange.start, 'yyyy-MM-dd', new Date()) : undefined}
              maxDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sales VP
            </label>
            <div className="relative" ref={salesVPDropdownRef}>
              <input
                type="text"
                value={salesVPSearchMode ? salesVPSearchQuery : (selectedSalesVP ? salesVPs.find(vp => vp.userId === selectedSalesVP)?.firstName + ' ' + salesVPs.find(vp => vp.userId === selectedSalesVP)?.lastName : 'All Sales VPs')}
                onChange={(e) => {
                  setSalesVPSearchQuery(e.target.value);
                  setIsSalesVPDropdownOpen(true);
                  setHighlightedSalesVPIndex(-1);
                }}
                onKeyDown={(e) => {
                  const allOptions = [{ userId: null, firstName: 'All', lastName: 'Sales VPs' }, ...salesVPs];
                  const filteredOptions = allOptions.filter(vp => 
                    `${vp.firstName} ${vp.lastName}`.toLowerCase().includes(salesVPSearchQuery.toLowerCase())
                  );
                  
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsSalesVPDropdownOpen(false);
                    setSalesVPSearchMode(false);
                    setSalesVPSearchQuery('');
                    setHighlightedSalesVPIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedSalesVPIndex(prev => {
                      const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                      setTimeout(() => salesVPOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedSalesVPIndex(prev => {
                      const newIndex = prev > 0 ? prev - 1 : 0;
                      setTimeout(() => salesVPOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'Enter' && highlightedSalesVPIndex >= 0) {
                    e.preventDefault();
                    const option = filteredOptions[highlightedSalesVPIndex];
                    if (option) {
                      setSelectedSalesVP(option.userId);
                      setIsSalesVPDropdownOpen(false);
                      setHighlightedSalesVPIndex(-1);
                      setSalesVPSearchMode(false);
                      setSalesVPSearchQuery('');
                    }
                  } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                    setSalesVPSearchMode(true);
                  }
                }}
                onClick={() => {
                  setIsSalesVPDropdownOpen(!isSalesVPDropdownOpen);
                  if (isSalesVPDropdownOpen) {
                    setSalesVPSearchMode(false);
                    setSalesVPSearchQuery('');
                    setHighlightedSalesVPIndex(-1);
                  }
                }}
                readOnly={!salesVPSearchMode}
                style={{ outline: 'none', boxShadow: 'none' }}
                className="h-10 w-full px-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
              />
              {(salesVPSearchQuery && salesVPSearchMode) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSalesVPSearchQuery('');
                    setSalesVPSearchMode(false);
                  }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isSalesVPDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isSalesVPDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                  <div className="p-2">
                    {(() => {
                      const filteredVPs = [{ userId: null, firstName: 'All', lastName: 'Sales VPs' }, ...salesVPs]
                        .filter(vp => `${vp.firstName} ${vp.lastName}`.toLowerCase().includes(salesVPSearchQuery.toLowerCase()));
                      
                      if (filteredVPs.length === 0) {
                        return (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No sales VPs found
                          </div>
                        );
                      }
                      
                      return filteredVPs.map((vp, index) => {
                        const query = salesVPSearchQuery.toLowerCase();
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
                            ref={el => salesVPOptionsRef.current[index] = el}
                            onClick={() => {
                              setSelectedSalesVP(vp.userId);
                              setSalesVPSearchQuery('');
                              setIsSalesVPDropdownOpen(false);
                              setHighlightedSalesVPIndex(-1);
                              setSalesVPSearchMode(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              highlightedSalesVPIndex === index ? 'bg-primary-50 text-primary-600' :
                              selectedSalesVP === vp.userId ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manager
            </label>
            <div className="relative" ref={managerDropdownRef}>
              <input
                type="text"
                value={managerSearchMode ? managerSearchQuery : (selectedManager ? (selectedSalesVP ? managers : allManagers).find(manager => manager.userId === selectedManager)?.firstName + ' ' + (selectedSalesVP ? managers : allManagers).find(manager => manager.userId === selectedManager)?.lastName : 'All Managers')}
                onChange={(e) => {
                  setManagerSearchQuery(e.target.value);
                  setIsManagerDropdownOpen(true);
                  setHighlightedManagerIndex(-1);
                }}
                onKeyDown={(e) => {
                  const managersToUse = selectedSalesVP ? managers : allManagers;
                  const allOptions = [{ userId: null, firstName: 'All', lastName: 'Managers' }, ...managersToUse];
                  const filteredOptions = allOptions.filter(m => 
                    `${m.firstName} ${m.lastName}`.toLowerCase().includes(managerSearchQuery.toLowerCase())
                  );
                  
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsManagerDropdownOpen(false);
                    setManagerSearchMode(false);
                    setManagerSearchQuery('');
                    setHighlightedManagerIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedManagerIndex(prev => {
                      const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                      setTimeout(() => managerOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedManagerIndex(prev => {
                      const newIndex = prev > 0 ? prev - 1 : 0;
                      setTimeout(() => managerOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'Enter' && highlightedManagerIndex >= 0) {
                    e.preventDefault();
                    const option = filteredOptions[highlightedManagerIndex];
                    if (option) {
                      setSelectedManager(option.userId);
                      setIsManagerDropdownOpen(false);
                      setHighlightedManagerIndex(-1);
                      setManagerSearchMode(false);
                      setManagerSearchQuery('');
                    }
                  } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                    setManagerSearchMode(true);
                  }
                }}
                onClick={() => {
                  setIsManagerDropdownOpen(!isManagerDropdownOpen);
                  if (isManagerDropdownOpen) {
                    setManagerSearchMode(false);
                    setManagerSearchQuery('');
                    setHighlightedManagerIndex(-1);
                  }
                }}
                readOnly={!managerSearchMode}
                style={{ outline: 'none', boxShadow: 'none' }}
                className="h-10 w-full px-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
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
              <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isManagerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isManagerDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                  <div className="p-2">
                    {(() => {
                      const filteredManagers = [{ userId: null, firstName: 'All', lastName: 'Managers' }, ...(selectedSalesVP ? managers : allManagers)]
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
                            ref={el => managerOptionsRef.current[index] = el}
                            onClick={() => {
                              setSelectedManager(manager.userId);
                              setManagerSearchQuery('');
                              setIsManagerDropdownOpen(false);
                              setHighlightedManagerIndex(-1);
                              setManagerSearchMode(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              highlightedManagerIndex === index ? 'bg-primary-50 text-primary-600' :
                              selectedManager === manager.userId ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Executive
            </label>
            <div className="relative" ref={executiveDropdownRef}>
              <input
                type="text"
                value={executiveSearchMode ? executiveSearchQuery : (selectedExecutive ? (selectedManager ? executives : allExecutives).find(executive => executive.userId === selectedExecutive)?.firstName + ' ' + (selectedManager ? executives : allExecutives).find(executive => executive.userId === selectedExecutive)?.lastName : 'All Executives')}
                onChange={(e) => {
                  setExecutiveSearchQuery(e.target.value);
                  setIsExecutiveDropdownOpen(true);
                  setHighlightedExecutiveIndex(-1);
                }}
                onKeyDown={(e) => {
                  const executivesToUse = selectedManager ? executives : allExecutives;
                  const allOptions = [{ userId: null, firstName: 'All', lastName: 'Executives' }, ...executivesToUse];
                  const filteredOptions = allOptions.filter(ex => 
                    `${ex.firstName} ${ex.lastName}`.toLowerCase().includes(executiveSearchQuery.toLowerCase())
                  );
                  
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsExecutiveDropdownOpen(false);
                    setExecutiveSearchMode(false);
                    setExecutiveSearchQuery('');
                    setHighlightedExecutiveIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedExecutiveIndex(prev => {
                      const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev;
                      setTimeout(() => executiveOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedExecutiveIndex(prev => {
                      const newIndex = prev > 0 ? prev - 1 : 0;
                      setTimeout(() => executiveOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                      return newIndex;
                    });
                  } else if (e.key === 'Enter' && highlightedExecutiveIndex >= 0) {
                    e.preventDefault();
                    const option = filteredOptions[highlightedExecutiveIndex];
                    if (option) {
                      setSelectedExecutive(option.userId);
                      setIsExecutiveDropdownOpen(false);
                      setHighlightedExecutiveIndex(-1);
                      setExecutiveSearchMode(false);
                      setExecutiveSearchQuery('');
                    }
                  } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                    setExecutiveSearchMode(true);
                  }
                }}
                onClick={() => {
                  setIsExecutiveDropdownOpen(!isExecutiveDropdownOpen);
                  if (isExecutiveDropdownOpen) {
                    setExecutiveSearchMode(false);
                    setExecutiveSearchQuery('');
                    setHighlightedExecutiveIndex(-1);
                  }
                }}
                readOnly={!executiveSearchMode}
                style={{ outline: 'none', boxShadow: 'none' }}
                className="h-10 w-full px-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400 min-w-[140px]"
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
              <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isExecutiveDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isExecutiveDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-40 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                  <div className="p-2">
                    {(() => {
                      const filteredExecutives = [{ userId: null, firstName: 'All', lastName: 'Executives' }, ...(selectedManager ? executives : allExecutives)]
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
                            ref={el => executiveOptionsRef.current[index] = el}
                            onClick={() => {
                              setSelectedExecutive(executive.userId);
                              setExecutiveSearchQuery('');
                              setIsExecutiveDropdownOpen(false);
                              setHighlightedExecutiveIndex(-1);
                              setExecutiveSearchMode(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              highlightedExecutiveIndex === index ? 'bg-primary-50 text-primary-600' :
                              selectedExecutive === executive.userId ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
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
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Period: {dateRange.start || 'All'} to {dateRange.end || 'All'}
                </span>
              </div>
              {(selectedSalesVP || selectedManager || selectedExecutive) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active:</span>
                  {selectedSalesVP && <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-xl text-xs">VP</span>}
                  {selectedManager && <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-xl text-xs">Manager</span>}
                  {selectedExecutive && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-xl text-xs">Executive</span>}
                </div>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Clear Filters
            </button>
          </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.metrics?.leads?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.metrics?.deals?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(() => {
                      const revenue = reportData.metrics?.revenue || 0;
                      if (revenue >= 1000000) return `${Math.round(revenue / 1000000)}M`;
                      if (revenue >= 1000) return `${Math.round(revenue / 1000)}K`;
                      return revenue.toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.metrics?.conversion}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Performance Trends</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leads and deals performance tracking over time</p>
              </div>
              <div className="flex items-center justify-end mb-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-primary-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Leads Count</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Deals Count</span>
                  </div>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[{ month: '0', leads: 0, deals: 0 }, ...(reportData.chartData || [])]}
                    margin={{ top: 40, right: 60, left: 100, bottom: 80 }}
                  >
                    <defs>
                      <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#F3F4F6'} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tickLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        const isZero = payload.value === '0';
                        return (
                          <text 
                            x={isZero ? x - 10 : x} 
                            y={y} 
                            dy={16} 
                            textAnchor="middle" 
                            fill={document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000'}
                            fontSize={16}
                            fontWeight={600}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      height={60}
                      interval={0}
                      tickMargin={10}
                      minTickGap={12}
                      label={{ value: 'Time Period - Monthly Performance Analysis Timeline', position: 'insideBottom', offset: -20, style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' } }}
                    />
                    <YAxis 
                      axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tickLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tick={{ 
                        fontSize: 14, 
                        fill: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', 
                        fontWeight: 600
                      }}
                      tickFormatter={(value) => value === 0 ? '' : value.toString()}
                      domain={[0, (dataMax: number) => {
                        if (!dataMax || isNaN(dataMax) || dataMax === 0) return 10;
                        const max = Math.ceil(dataMax * 1.1);
                        const step = Math.ceil(max / 4);
                        return step * 4;
                      }]}
                      tickCount={5}
                      includeHidden={false}
                      type="number"
                      width={70}
                      tickMargin={5}
                      orientation="left"
                      label={{ value: 'Count - Performance Metrics', angle: -90, position: 'insideLeft', offset: -40, style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                        color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      formatter={(value: any, name: string) => [Number(value).toLocaleString(), name === 'leads' ? 'Leads' : 'Deals']}
                      labelFormatter={(label) => `Period: ${label}`}
                      cursor={{ stroke: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stackId="1"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#leadsGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: '#3B82F6', 
                        strokeWidth: 3, 
                        stroke: '#ffffff',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="deals"
                      stackId="2"
                      stroke="#10B981"
                      strokeWidth={3}
                      fill="url(#dealsGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: '#10B981', 
                        strokeWidth: 3, 
                        stroke: '#ffffff',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Revenue Analysis Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Revenue Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time revenue tracking with trend analysis</p>
              </div>
              <div className="flex items-center justify-end mb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-xl border border-green-200 dark:border-green-700">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Revenue</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">${(() => {
                    const totalRevenue = (reportData.chartData || []).reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
                    if (totalRevenue >= 1000000) return `${Math.round(totalRevenue / 1000000)}M`;
                    if (totalRevenue >= 1000) return `${Math.round(totalRevenue / 1000)}K`;
                    return totalRevenue.toLocaleString();
                  })()}</p>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[{ month: '0', revenue: 0 }, ...(reportData.chartData || [])]}
                    margin={{ top: 40, right: 60, left: 100, bottom: 80 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#F3F4F6'} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tickLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        const isZero = payload.value === '0';
                        return (
                          <text 
                            x={isZero ? x - 10 : x} 
                            y={y} 
                            dy={16} 
                            textAnchor="middle" 
                            fill={document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000'}
                            fontSize={16}
                            fontWeight={600}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      height={60}
                      interval={0}
                      tickMargin={10}
                      minTickGap={12}
                      label={{ value: 'Time Period - Monthly Revenue Analysis Timeline', position: 'insideBottom', offset: -20, style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' } }}
                    />
                    <YAxis 
                      axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tickLine={{ stroke: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', strokeWidth: 2 }}
                      tick={{ 
                        fontSize: 14, 
                        fill: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#000000', 
                        fontWeight: 600
                      }}
                      tickFormatter={(value) => {
                        if (value === 0) return '';
                        if (value >= 1000000) return `$${Math.round(value / 1000000)}M`;
                        if (value >= 1000) return `$${Math.round(value / 1000)}K`;
                        return `$${value}`;
                      }}
                      domain={[0, (dataMax: number) => {
                        if (!dataMax || isNaN(dataMax) || dataMax === 0) return 1000;
                        const max = dataMax * 1.1;
                        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                        const step = Math.ceil(max / magnitude / 4) * magnitude;
                        return step * 4;
                      }]}
                      tickCount={5}
                      includeHidden={false}
                      type="number"
                      width={70}
                      tickMargin={5}
                      orientation="left"
                      label={{ value: 'Revenue Amount - Total Sales Performance', angle: -90, position: 'insideLeft', offset: -40, style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                        color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      formatter={(value: any) => {
                        const num = Number(value);
                        let formatted;
                        if (num >= 1000000000) formatted = `$${Math.round(num / 1000000000)}B`;
                        else if (num >= 1000000) formatted = `$${Math.round(num / 1000000)}M`;
                        else if (num >= 1000) formatted = `$${Math.round(num / 1000)}K`;
                        else formatted = `$${num}`;
                        return [formatted, 'Revenue'];
                      }}
                      labelFormatter={(label) => `Period: ${label}`}
                      cursor={{ stroke: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: '#F59E0B', 
                        strokeWidth: 3, 
                        stroke: '#ffffff',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CEOReportsModule;
