import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Reports Module Enhanced
 * Analytics and reporting dashboard with enhanced Manager Revenue Breakdown
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, TrendingUp, DollarSign } from 'lucide-react';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { reportsApi } from '@/api/reportsApi';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
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
import DashboardRevenueChart from '@/components/ui/DashboardRevenueChart';
import { can, getCurrentRole } from '@/utils/rbac';

const isDev = import.meta.env.DEV;
const log = (...args: any[]) => isDev && logger.info(...args);

const ManagerRevenueBreakdown: React.FC<{ dateRange?: { start?: string; end?: string } }> = ({ dateRange }) => {
  const [selectedManager, setSelectedManager] = React.useState<number | null>(null);
  const [showManagerDetail, setShowManagerDetail] = React.useState(false);
  const [selectedExecutive, setSelectedExecutive] = React.useState<number | null>(null);
  const [showExecutiveRevenue, setShowExecutiveRevenue] = React.useState(false);

  const { data: managerData, isLoading } = useQuery({
    queryKey: ['reports', 'managerRevenueBreakdown', dateRange?.start, dateRange?.end],
    queryFn: () => reportsApi.managerRevenueBreakdown(dateRange?.start, dateRange?.end),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const { data: managerRevenue, isLoading: managerRevenueLoading } = useQuery({
    queryKey: ['reports', 'managerRevenue', selectedManager, dateRange?.start, dateRange?.end],
    queryFn: async () => {
      if (!selectedManager) return null;
      const result = await reportsApi.managerRevenue(selectedManager, dateRange?.start, dateRange?.end);
      return result;
    },
    enabled: !!selectedManager && showManagerDetail,
    staleTime: 300000,
  });

  const { data: executiveRevenue, isLoading: executiveRevenueLoading } = useQuery({
    queryKey: ['reports', 'executiveRevenue', selectedExecutive, dateRange?.start, dateRange?.end],
    queryFn: async () => {
      if (!selectedExecutive) return null;
      const result = await reportsApi.executiveRevenue(selectedExecutive, dateRange?.start, dateRange?.end);
      return result;
    },
    enabled: !!selectedExecutive && showExecutiveRevenue,
    staleTime: 300000,
  });

  const managers = (managerData as any)?.data || [];
  const revenueData = (managerRevenue as any)?.data?.revenueData || [];
  const totalRevenue = (managerRevenue as any)?.data?.totalRevenue || 0;
  const executiveRevenueData = (executiveRevenue as any)?.data?.revenueData || [];
  const executiveTotalRevenue = (executiveRevenue as any)?.data?.totalRevenue || 0;

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
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Manager Revenue Breakdown</h3>
        
        {!showManagerDetail ? (
          <div className="space-y-4">
            {managers.map((manager: any) => (
              <div key={manager.managerId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{manager.managerName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {manager.executives.map((exec: any) => (
                      <div key={exec.id} className="bg-white dark:bg-gray-700 rounded p-3 border dark:border-gray-600">
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
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">${(() => {
                      const value = manager.totalRevenue;
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toLocaleString();
                    })()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedManager(manager.managerId);
                      setShowManagerDetail(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {managers.find((m: any) => m.managerId === selectedManager)?.managerName} - Team Performance
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue analytics and team overview</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => {
                setShowManagerDetail(false);
                setSelectedExecutive(null);
                setShowExecutiveRevenue(false);
              }} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-sm font-medium dark:bg-blue-900/30 dark:hover:bg-blue-800/40 dark:text-blue-300 dark:border-blue-700">Back to Overview</Button>
            </div>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${(() => {
                const value = totalRevenue;
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toLocaleString();
              })()}</p></CardContent></Card>
              <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Team Size</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{managers.find((m: any) => m.managerId === selectedManager)?.executives?.length || 0}</p></CardContent></Card>
              <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Avg Revenue</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${(() => {
                const avgValue = totalRevenue > 0 && managers.find((m: any) => m.managerId === selectedManager)?.executives?.length ? Math.round(totalRevenue / managers.find((m: any) => m.managerId === selectedManager)?.executives?.length) : 0;
                if (avgValue >= 1000000) return `${(avgValue / 1000000).toFixed(1)}M`;
                if (avgValue >= 1000) return `${(avgValue / 1000).toFixed(0)}K`;
                return avgValue.toLocaleString();
              })()}</p></CardContent></Card>
              <Card className="mb-4"><CardContent className="px-3 py-2"><p className="text-xs text-gray-600 dark:text-gray-400">Performance</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">Active</p></CardContent></Card>
            </div>

            {/* Revenue Analytics */}
            <div>
              <DashboardRevenueChart 
                data={revenueData && revenueData.length > 0 ? revenueData : []}
                onDateRangeChange={() => {}}
                showInternalFilters={false}
                isLoading={managerRevenueLoading}
              />
            </div>

            {/* Activities Overview - Sales Executive Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Activities Overview - Sales Executive Revenue</p>
                
                {!showExecutiveRevenue ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managers.find((m: any) => m.managerId === selectedManager)?.executives?.map((exec: any) => (
                      <div key={exec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{exec.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Sales Executive</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                            <p className="font-bold text-lg text-green-600 dark:text-green-400">${(() => {
                              const value = exec.revenue;
                              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                              return value.toLocaleString();
                            })()}</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
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
                    )) || []}
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {managers.find((m: any) => m.managerId === selectedManager)?.executives?.find((e: any) => e.id === selectedExecutive)?.name} - Revenue Analytics
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Lead-generated revenue performance</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowExecutiveRevenue(false);
                            setSelectedExecutive(null);
                          }}
                        >
                          Back
                        </Button>
                      </div>
                      
                      {/* Performance Summary */}
                      {(executiveTotalRevenue > 0 || executiveRevenueData.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-3 rounded-lg border border-green-100 dark:border-green-700 mb-4">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">${(() => {
                              const value = (executiveRevenue as any)?.data?.currentRevenue || executiveTotalRevenue || 0;
                              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                              return value.toLocaleString();
                            })()}</p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-700 mb-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Deal Count</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{(executiveRevenue as any)?.data?.leadCount || 0}</p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-3 rounded-lg border border-purple-100 dark:border-purple-700 mb-4">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Avg Revenue/Lead</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                              ${(() => {
                                const currentRev = (executiveRevenue as any)?.data?.currentRevenue || executiveTotalRevenue || 0;
                                const leadCnt = (executiveRevenue as any)?.data?.leadCount || 0;
                                const avgValue = currentRev > 0 && leadCnt > 0 ? Math.round(currentRev / leadCnt) : 0;
                                if (avgValue >= 1000000) return `${(avgValue / 1000000).toFixed(1)}M`;
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
                        <ExecutiveRevenueChart data={executiveRevenueData} totalRevenue={executiveTotalRevenue} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerRevenueBreakdown;
