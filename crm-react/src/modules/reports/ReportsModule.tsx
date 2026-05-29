import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Reports Module
 * Analytics and reporting dashboard placeholder
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, TrendingUp, DollarSign } from 'lucide-react';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { reportsApi } from '@/api/reportsApi';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { format, parse } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { dealsApi } from '@/api/dealsApi';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import DashboardRevenueChart from '@/components/ui/DashboardRevenueChart';
import ExecutiveRevenueChart from '@/components/ui/ExecutiveRevenueChart';
import { can, getCurrentRole } from '@/utils/rbac';
import ManagerRevenueBreakdownEnhanced from './ReportsModuleEnhanced';
import CEOReportsModule from '../ceo/CEOReportsModule';

const isDev = import.meta.env.DEV;
const log = (...args: any[]) => isDev && logger.info(...args);

const ManagerRevenueBreakdown: React.FC = () => {
  const { data: managerData, isLoading } = useQuery({
    queryKey: ['reports', 'managerRevenueBreakdown'],
    queryFn: () => reportsApi.managerRevenueBreakdown(),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const managers = (managerData as any)?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Manager Revenue Breakdown</h3>
        <div className="space-y-4">
          {managers.map((manager: any) => (
            <div key={manager.managerId} className="border rounded-lg p-4 bg-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{manager.managerName}</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="font-bold text-lg text-green-600 dark:text-green-400">${(() => {
                    const value = manager.totalRevenue;
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toLocaleString();
                  })()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {manager.executives.map((exec: any) => (
                  <div key={exec.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{exec.name}</p>
                    <p className="text-green-600 dark:text-green-400 font-semibold">${(() => {
                      const value = exec.revenue;
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toLocaleString();
                    })()}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ExecutiveRevenueOverview: React.FC<{ dateRange?: { start?: string; end?: string } }> = ({ dateRange }) => {
  const [selectedExecutive, setSelectedExecutive] = React.useState<number | null>(null);
  const [showExecutiveRevenue, setShowExecutiveRevenue] = React.useState(false);

  const { data: executives } = useQuery({
    queryKey: ['reports', 'salesExecutives', dateRange?.start, dateRange?.end],
    queryFn: () => reportsApi.salesExecutives(dateRange?.start, dateRange?.end),
    staleTime: 300_000,
  });

  const { data: executiveRevenue, isLoading: executiveRevenueLoading } = useQuery({
    queryKey: ['reports', 'executiveRevenue', selectedExecutive, dateRange?.start, dateRange?.end],
    queryFn: async () => {
      if (!selectedExecutive) return null;
      log('🔄 Fetching revenue for executive ID:', selectedExecutive);
      const result = await reportsApi.executiveRevenue(selectedExecutive, dateRange?.start, dateRange?.end);
      log('📊 Executive revenue result:', result);
      return result;
    },
    enabled: !!selectedExecutive && showExecutiveRevenue,
    staleTime: 300000,
    refetchOnMount: false,
  });

  const executiveList = (executives as any)?.data || [];
  const revenueData = (executiveRevenue as any)?.data?.revenueData || [];
  const totalRevenue = (executiveRevenue as any)?.data?.totalRevenue || 0;

  log('🔍 Executive Revenue Data:', { revenueData, totalRevenue });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <p className="text-sm font-medium text-gray-600 mb-3">Activities Overview - Sales Executive Revenue</p>

        {!showExecutiveRevenue ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {executiveList.map((exec: any) => (
              <div key={exec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{exec.firstName} {exec.lastName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{exec.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Deals</p>
                    <p className="font-bold text-lg dark:text-gray-100">{exec.leadCount || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                    <p className="font-bold text-green-600 dark:text-green-400">${(() => {
                      const value = exec.totalRevenue || 0;
                      if (value >= 1000000) {
                        const formatted = (value / 1000000).toFixed(1);
                        return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
                      }
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toLocaleString();
                    })()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedExecutive(exec.id);
                      setShowExecutiveRevenue(true);
                    }}
                  >
                    View Revenue
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {executiveList.find((e: any) => e.id === selectedExecutive)?.firstName} {executiveList.find((e: any) => e.id === selectedExecutive)?.lastName} - Revenue Analytics
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{executiveList.find((e: any) => e.id === selectedExecutive)?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lead-generated revenue performance</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowExecutiveRevenue(false);
                    setSelectedExecutive(null);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-sm font-medium dark:bg-blue-900/30 dark:hover:bg-blue-800/40 dark:text-blue-300 dark:border-blue-700"
                >
                  Back
                </Button>
              </div>

              {/* Performance Summary - Only show if we have real data */}
              {(totalRevenue > 0 || revenueData.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-3 rounded-lg border border-green-100 dark:border-green-700 mb-4">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">${(() => {
                      const value = (executiveRevenue as any)?.data?.currentRevenue || totalRevenue || 0;
                      if (value >= 1000000) {
                        const formatted = (value / 1000000).toFixed(1);
                        return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
                      }
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toLocaleString();
                    })()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-700 mb-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Deal Count</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{(executiveRevenue as any)?.data?.leadCount || executiveList.find((e: any) => e.id === selectedExecutive)?.leadCount || 0}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-3 rounded-lg border border-purple-100 dark:border-purple-700 mb-4">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Avg Revenue/Lead</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      ${(() => {
                        const currentRev = (executiveRevenue as any)?.data?.currentRevenue || totalRevenue || 0;
                        const leadCnt = (executiveRevenue as any)?.data?.leadCount || executiveList.find((e: any) => e.id === selectedExecutive)?.leadCount || 0;
                        const avgValue = currentRev > 0 && leadCnt > 0 ? Math.round(currentRev / leadCnt) : 0;
                        if (avgValue >= 1000000) {
                          const formatted = (avgValue / 1000000).toFixed(1);
                          return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
                        }
                        if (avgValue >= 1000) return `${(avgValue / 1000).toFixed(0)}K`;
                        return avgValue.toLocaleString();
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="h-96 w-full">
              {executiveRevenueLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Loading revenue data...</div>
                  </div>
                </div>
              ) : (
                <ExecutiveRevenueChart data={revenueData} totalRevenue={totalRevenue} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatDateDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return 'All';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const ReportsModule: React.FC = () => {
  const role = getCurrentRole();
  if (!can(role, 'Reports', 'View')) {
    return <Navigate to="/crm/Dashboard" replace />;
  }

  // Add CSS for forcing background colors in dark mode
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .force-bg-color {
        background-color: var(--stage-color) !important;
        background: var(--stage-color) !important;
      }
      .dark .force-bg-color {
        background-color: var(--stage-color) !important;
        background: var(--stage-color) !important;
      }
      [data-theme="dark"] .force-bg-color {
        background-color: var(--stage-color) !important;
        background: var(--stage-color) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  // CEO gets organization-wide reports with hierarchical filtering
  if (role === 'CEO') {
    return <CEOReportsModule />;
  }

  const getDateRange = (period: string) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();

    switch (period) {
      case '1D':
        start.setDate(start.getDate() - 1);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        return {};
    }

    return { start: start.toISOString().split('T')[0], end };
  };

  const [range, setRange] = React.useState<{ start?: string; end?: string }>({});
  const [isCustomOpen, setCustomOpen] = React.useState(false);
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = React.useState<number | null>(null);
  const [dateError, setDateError] = React.useState<string>('');
  const [initialTotalValue, setInitialTotalValue] = React.useState<number | null>(null);
  const [initialTotalRevenue, setInitialTotalRevenue] = React.useState<number | null>(null);
  const [chartResetKey, setChartResetKey] = React.useState<number>(0);

  const { data: sales, refetch: refetchSales, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales', range.start, range.end],
    queryFn: () => reportsApi.sales({ startDate: range.start, endDate: range.end }),
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    initialData: { data: { byStage: {}, totalDeals: 0, wonDeals: 0, totalValue: 0, winRate: 0 } },
  });

  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['reports', 'activities', range.start, range.end],
    queryFn: () => reportsApi.activities({ startDate: range.start, endDate: range.end }),
    staleTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  const { data: revenue, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['reports', 'revenue', range.start || 'all', range.end || 'all', role],
    queryFn: async () => {
      let result;
      if (role === 'Sales_Manager') {
        // Get current user ID for manager-specific revenue
        const session = localStorage.getItem('tech_tammina_session');
        let managerId = 5; // Default fallback
        if (session) {
          try {
            const user = JSON.parse(session);
            managerId = user.id || 5;
          } catch { }
        }
        result = await reportsApi.managerRevenue(managerId, range.start, range.end);
      } else {
        result = await reportsApi.revenue({ startDate: range.start, endDate: range.end });
      }

      return result;
    },
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  React.useEffect(() => {
    refetchRevenue();
    refetchSales();
    refetchActivities();
  }, [range.start, range.end]);


  const rawSales = (sales as any)?.data || {};
  const a = (activities as any)?.data || {};
  const r = (revenue as any)?.data || {};

  const revenueData = r.revenueData || [];
  const currentRevenue = r.currentRevenue || 0; // Filtered revenue (by date + manager team)
  const totalRevenue = r.totalRevenue || 0; // Global total revenue (constant)
  const managerTotalRevenue = r.managerTotalRevenue || 0; // Manager team total (unfiltered by date)

  // Store initial total value on first load
  React.useEffect(() => {
    if (initialTotalValue === null && rawSales.totalValue) {
      setInitialTotalValue(rawSales.totalValue);
    }
  }, [rawSales.totalValue, initialTotalValue]);

  // Store initial total revenue on first load
  React.useEffect(() => {
    if (initialTotalRevenue === null && totalRevenue > 0) {
      setInitialTotalRevenue(totalRevenue);
    }
  }, [totalRevenue, initialTotalRevenue]);



  // Fallback: derive sales metrics from deals list if backend sales is empty
  const { data: dealsFallback } = useQuery({
    queryKey: ['reports', 'dealsFallback'],
    queryFn: () => dealsApi.list({}),
    staleTime: 60_000,
  });

  const handleExportReports = () => {
    // Prepare comprehensive report data
    const reportData = {
      summary: {
        'Total Deals': s.totalDeals ?? 0,
        'Won Deals': s.wonDeals ?? 0,
        'Win Rate': `${(s.winRate ?? 0).toFixed?.(1) ?? s.winRate}%`,
        'Total Value': s.totalValue ?? 0,
        'Total Activities': a.total ?? 0
      },
      dealsByStage: stageData,
      activitiesByType: Object.entries(a.byType ?? {}),
      activitiesByStatus: Object.entries(a.byStatus ?? {})
    };

    // Create CSV content
    let csvContent = 'CRM Reports Export\n\n';

    // Summary section
    csvContent += 'SUMMARY\n';
    Object.entries(reportData.summary).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });

    // Deals by stage
    csvContent += '\nDEALS BY STAGE\n';
    csvContent += 'Stage,Count\n';
    reportData.dealsByStage.forEach(item => {
      csvContent += `${item.stage},${item.count}\n`;
    });

    // Activities by type
    csvContent += '\nACTIVITIES BY TYPE\n';
    csvContent += 'Type,Count\n';
    reportData.activitiesByType.forEach(([type, count]) => {
      csvContent += `${type},${count}\n`;
    });

    // Activities by status
    csvContent += '\nACTIVITIES BY STATUS\n';
    csvContent += 'Status,Count\n';
    reportData.activitiesByStatus.forEach(([status, count]) => {
      csvContent += `${status},${count}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    import('react-hot-toast').then(({ default: toast }) => {
      toast.success('Reports exported successfully');
    });
  };

  const deriveSalesFromDeals = (list: any[]) => {
    const stageMap: Record<string, string> = {
      qualified: 'Qualification',
      proposal: 'Proposal',
      negotiation: 'Negotiation',
      won: 'Won',
      lost: 'Lost',
    };
    const byStage: Record<string, number> = {};
    let totalDeals = 0;
    let wonDeals = 0;
    let lostDeals = 0;
    let totalValue = 0;

    for (const d of list) {
      totalDeals += 1;
      const stageKey = stageMap[(d as any).stage] || (d as any).stage || 'Unknown';
      byStage[stageKey] = (byStage[stageKey] || 0) + 1;
      if ((d as any).stage === 'won') wonDeals += 1;
      if ((d as any).stage === 'lost') lostDeals += 1;
      totalValue += Number((d as any).value || 0);
    }
    const winRate = totalDeals > 0 ? (wonDeals * 100.0) / totalDeals : 0;
    return { byStage, totalValue, totalDeals, wonDeals, lostDeals, winRate };
  };

  const dealsList = (dealsFallback as any)?.data || [];
  const hasBackendSales = (typeof (rawSales as any).totalDeals === 'number' && (rawSales as any).totalDeals > 0)
    || ((rawSales as any).byStage && Object.keys((rawSales as any).byStage).length > 0)
    || (typeof (rawSales as any).totalValue === 'number' && (rawSales as any).totalValue > 0);

  const s = hasBackendSales ? rawSales : (dealsList.length ? deriveSalesFromDeals(dealsList) : rawSales);

  // Function to get consistent stage colors matching DealsKanban
  const getStageChartColor = (stageName: string): string => {
    const normalizedStageName = stageName.toLowerCase().replace(/[_\s]/g, '');
    
    const stageColorMap: Record<string, string> = {
      'qualified': '#2563EB',    // Blue - matches bg-blue-100 text-blue-800
      'qualification': '#2563EB',
      'proposal': '#F59E0B',     // Yellow - matches bg-yellow-100 text-yellow-800
      'negotiation': '#EA580C',  // Orange - matches bg-orange-100 text-orange-800
      'won': '#10B981',          // Green - matches bg-green-100 text-green-800
      'closedwon': '#10B981',
      'closed_won': '#10B981',
      'lost': '#EF4444',         // Red - matches bg-red-100 text-red-800
      'closedlost': '#EF4444',
      'closed_lost': '#EF4444'
    };

    return stageColorMap[normalizedStageName] || '#6B7280';
  };

  // Prepare data for charts
  const stageData = Object.entries((s.byStage ?? {}) as Record<string, number>).map(([k, v]) => ({
    stage: k === 'Closed_Won' ? 'Won' : k === 'Closed_Lost' ? 'Lost' : k === 'Qualification' ? 'Qualified' : k.replace(/_/g, ' '),
    count: Number(v || 0),
  }));

  const activityTypeData = Object.entries((a.byType ?? {}) as Record<string, number>).map(([k, v]) => ({ name: k, value: Number(v || 0) }));
  const activityStatusData = Object.entries((a.byStatus ?? {}) as Record<string, number>).map(([k, v]) => ({ name: k, value: Number(v || 0) }));
  
  // Activity chart colors (keep original colors for activities)
  const ACTIVITY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-6 pt-3 pb-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            leftIcon={<Upload className="w-4 h-4 preserve-icon-color" />}
            onClick={handleExportReports}
          >
            Export Excel
          </Button>
          <Button variant="primary" leftIcon={<TrendingUp className="w-4 h-4 preserve-icon-color" />} onClick={() => setCustomOpen(true)}>
            Custom Report
          </Button>
        </div>
      </div>

      {/* CEO Date Filter - Right aligned */}
      {role === 'CEO' && (
        <div className="flex justify-end">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 w-auto">
            <div className="flex items-center gap-3">
              {(range.start || range.end) && (
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                    Filtered: {formatDateDisplay(range.start)} to {formatDateDisplay(range.end)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRange({});
                      setFromDate('');
                      setToDate('');
                      setSelectedQuickFilter(null);
                      setChartResetKey(prev => prev + 1);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
              {!(range.start || range.end) && (
                <span className="text-sm text-gray-600 dark:text-gray-400">Showing all data</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomOpen(true)}
                className="text-sm ml-2"
              >
                Set Date Range
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter - Only for non-CEO roles */}
      {role !== 'CEO' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(range.start || range.end) && (
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                    Filtered: {formatDateDisplay(range.start)} to {formatDateDisplay(range.end)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRange({});
                      setFromDate('');
                      setToDate('');
                      setSelectedQuickFilter(null);
                      setChartResetKey(prev => prev + 1);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
              {!(range.start || range.end) && (
                <span className="text-sm text-gray-600 dark:text-gray-400">Showing all data</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomOpen(true)}
              className="text-sm"
            >
              Set Date Range
            </Button>
          </div>
        </div>
      )}

      {/* Show KPIs and other sections only if not Sales VP */}
      {role !== 'Sales_VP' && (
        <div>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Deals', value: s.totalDeals ?? 0 },
              { label: 'Won Deals', value: s.wonDeals ?? 0 },
              { label: 'Win Rate', value: `${(s.winRate ?? 0).toFixed?.(1) ?? s.winRate}%` },
              { 
                label: 'Total Revenue', 
                value: (() => {
                  const value = initialTotalValue ?? s.totalValue ?? 0;
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                  return `$${value.toLocaleString()}`;
                })()
              },
            ].map((k, i) => (
              <Card key={i} className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">{k.label}</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{k.value}</p></CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* Sales VP KPIs */}
      {(role === 'Sales_VP' || role === 'IT_Admin') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${(() => {
            const value = r.totalRevenue || 0;
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value.toLocaleString();
          })()}</p></CardContent></Card>
          <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Total Managers</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{r.totalManagers || 0}</p></CardContent></Card>
          <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Avg Revenue</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${(() => {
            const avgValue = r.totalManagers > 0 ? Math.round((r.totalRevenue || 0) / r.totalManagers) : 0;
            if (avgValue >= 1000000) return `${(avgValue / 1000000).toFixed(1)}M`;
            if (avgValue >= 1000) return `${(avgValue / 1000).toFixed(0)}K`;
            return avgValue.toLocaleString();
          })()}</p></CardContent></Card>
        </div>
      )}

      {/* Sales VP Overall Revenue Chart */}
      {(role === 'Sales_VP' || role === 'IT_Admin') && (
        <div>
          <DashboardRevenueChart
            key={`vp-chart-${chartResetKey}`}
            data={revenueData && revenueData.length > 0 ? revenueData : []}
            onDateRangeChange={setRange}
            showInternalFilters={false}
            isLoading={revenueLoading}
            title="Sales VP - Overall Team Revenue"
          />
        </div>
      )}

      {/* Manager Revenue Breakdown */}
      {(role === 'Sales_VP' || role === 'IT_Admin') && (
        <ManagerRevenueBreakdownEnhanced dateRange={range} />
      )}

      {/* Show other sections only if not Sales VP */}
      {role !== 'Sales_VP' && (
        <div>
          {/* Revenue Analytics */}
          <div className="mb-8">
            <DashboardRevenueChart
              key={chartResetKey}
              data={revenueData && revenueData.length > 0 ? revenueData : []}
              onDateRangeChange={setRange}
              showInternalFilters={false}
              isLoading={revenueLoading}
            />
          </div>

          {/* By Stage */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Deals by Stage</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donut Chart */}
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageData}
                        dataKey="count"
                        nameKey="stage"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        label={({ stage, count }) => `${stage}: ${count}`}
                        labelLine={{
                          stroke: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#666',
                          strokeWidth: 1,
                          strokeDasharray: '2 2'
                        }}
                        isAnimationActive={false}
                      >
                        {stageData.map((entry, idx) => (
                          <Cell key={`stage-${idx}`} fill={getStageChartColor(entry.stage)} style={{ pointerEvents: 'none' }} />
                        ))}
                      </Pie>
                      <Tooltip
                        active={false}
                        formatter={(value: any) => [value, 'Deals']}
                        contentStyle={{
                          backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                          color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                          border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend and Stats */}
                <div className="space-y-2 flex flex-col justify-center">
                  {(() => {
                    const totalCount = stageData.reduce((sum, d) => sum + d.count, 0);
                    let remainingPercentage = 100;
                    
                    return stageData.map((item, idx) => {
                      let percentage;
                      if (totalCount === 0) {
                        percentage = '0.0';
                      } else if (idx === stageData.length - 1) {
                        // Last item gets the remaining percentage to ensure total = 100%
                        percentage = remainingPercentage.toFixed(1);
                      } else {
                        // Calculate percentage and subtract from remaining
                        const calculatedPercentage = (item.count / totalCount) * 100;
                        percentage = calculatedPercentage.toFixed(1);
                        remainingPercentage -= calculatedPercentage;
                      }
                      
                      const stageColor = getStageChartColor(item.stage);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 force-bg-color"
                              style={{ 
                                '--stage-color': stageColor,
                                backgroundColor: `${stageColor} !important`,
                                background: `${stageColor} !important`,
                                border: `1px solid ${stageColor}`,
                                boxShadow: `inset 0 0 0 10px ${stageColor}`
                              } as React.CSSProperties & { '--stage-color': string }}
                            ></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.stage}</span>
                          </div>
                          <div className="text-right leading-tight">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.count}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{percentage}%</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Activities by Type</p>
                <div className="space-y-2">
                  {Object.entries(a.byType ?? {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}</span>
                      <span className="font-medium dark:text-gray-100">{count as any}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Activities by Status</p>
                <div className="space-y-2">
                  {Object.entries(a.byStatus ?? {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{status}</span>
                      <span className="font-medium dark:text-gray-100">{count as any}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities Overview - Sales Executive Revenue Analytics (Sales Manager) */}
          {role === 'Sales_Manager' ? (
            <ExecutiveRevenueOverview dateRange={range} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Activities Overview</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={activityTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false}>
                            {activityTypeData.map((_, idx) => (
                              <Cell key={`type-${idx}`} fill={ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                              color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                              border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-1">
                      {activityTypeData.map((d, idx) => (
                        <div key={`type-legend-${idx}`} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span 
                              className="w-2.5 h-2.5 rounded-sm mr-2 border border-gray-300 dark:border-gray-600 flex-shrink-0" 
                              style={{ 
                                backgroundColor: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length],
                                boxShadow: `0 0 0 1px ${ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]}40`
                              }} 
                            />
                            <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
                          </div>
                          <span className="font-medium dark:text-gray-100">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={activityStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false}>
                            {activityStatusData.map((_, idx) => (
                              <Cell key={`status-${idx}`} fill={ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                              color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                              border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-1">
                      {activityStatusData.map((d, idx) => (
                        <div key={`status-legend-${idx}`} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span 
                              className="w-2.5 h-2.5 rounded-sm mr-2 border border-gray-300 dark:border-gray-600 flex-shrink-0" 
                              style={{ 
                                backgroundColor: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length],
                                boxShadow: `0 0 0 1px ${ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]}40`
                              }} 
                            />
                            <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
                          </div>
                          <span className="font-medium dark:text-gray-100">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Custom Report Modal */}
      <Modal isOpen={isCustomOpen} onClose={() => setCustomOpen(false)} title="Custom Report" size="lg">
        <ModalContent className="overflow-visible">
          <div className="space-y-4">
            {/* Quick Date Range Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: 'Last Month', months: 1 },
                  { label: 'Last 2 Months', months: 2 },
                  { label: 'Last 3 Months', months: 3 },
                  { label: 'Last 4 Months', months: 4 },
                  { label: 'Last 5 Months', months: 5 },
                  { label: 'Last 6 Months', months: 6 }
                ].map((option) => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setMonth(startDate.getMonth() - option.months);
                  const isSelected = selectedQuickFilter === option.months;

                  return (
                    <button
                      key={option.months}
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          // Remove filter
                          setSelectedQuickFilter(null);
                          setFromDate('');
                          setToDate('');
                        } else {
                          // Apply filter
                          setSelectedQuickFilter(option.months);
                          const startFormatted = format(startDate, 'dd-MM-yyyy');
                          const endFormatted = format(endDate, 'dd-MM-yyyy');
                          setFromDate(startFormatted);
                          setToDate(endFormatted);
                        }
                      }}
                    >
                      <span>{option.label}</span>
                      {isSelected && <span className="text-red-600 dark:text-red-400 ml-2">✕</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Date Range</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">From Date</label>
                  <div className="relative z-[99999]">
                    <CustomDatePicker
                      label=""
                      value={fromDate}
                      onChange={(value) => {
                        if (value) {
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
                          
                          const valueISO = convertToISO(value);
                          const toDateISO = convertToISO(toDate);
                          const today = new Date().toISOString().split('T')[0];
                          
                          if (valueISO && valueISO > today) {
                            setDateError('From date cannot be in the future');
                            return;
                          }
                          
                          setFromDate(value);
                          if (valueISO && toDateISO && valueISO > toDateISO) {
                            setDateError('From date cannot be greater than To date');
                          } else {
                            setDateError('');
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
                </div>
                <div className="relative">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">To Date</label>
                  <div className="relative z-[9999]">
                    <CustomDatePicker
                      label=""
                      value={toDate}
                      onChange={(value) => {
                        if (value) {
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
                          
                          const valueISO = convertToISO(value);
                          const fromDateISO = convertToISO(fromDate);
                          const today = new Date().toISOString().split('T')[0];
                          
                          if (valueISO && valueISO > today) {
                            setDateError('To date cannot be in the future');
                            return;
                          }
                          
                          setToDate(value);
                          if (fromDateISO && valueISO && fromDateISO > valueISO) {
                            setDateError('From date cannot be greater than To date');
                          } else {
                            setDateError('');
                          }
                        } else {
                          setToDate('');
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
                  </div>
                </div>
              </div>
              {dateError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <strong>Error:</strong> {dateError}
                  </p>
                </div>
              )}
              {(fromDate || toDate) && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Preview:</strong> {fromDate || 'All dates'} to {toDate || 'All dates'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </ModalContent>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setRange({});
              setFromDate('');
              setToDate('');
              setSelectedQuickFilter(null);
              setChartResetKey(prev => prev + 1);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Clear Filter
          </Button>
          <Button
            variant="primary"
            disabled={!!dateError}
            onClick={() => {
              if (dateError) return;
              
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
              
              setRange({
                start: convertDateForAPI(fromDate) || undefined,
                end: convertDateForAPI(toDate) || undefined
              });
              setChartResetKey(prev => prev + 1);
              setCustomOpen(false);
            }}
          >
            Apply Filter
          </Button>
        </ModalFooter>
      </Modal>
    </motion.div>
  );
};

export default ReportsModule;
