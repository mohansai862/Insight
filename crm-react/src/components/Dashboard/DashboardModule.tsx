import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { DashboardGrid } from './DashboardGrid';
import { analyticsApi, DashboardLayout, SalesFunnelData, PipelineForecast } from '../../../../../../frontend/src/api/analyticsApi';

interface KPISummary {
  totalPipeline: number;
  monthlyRevenue: number;
  winRate: number;
  openDeals: number;
}

export const DashboardModule: React.FC = () => {
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  const [kpiSummary, setKpiSummary] = useState<KPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = localStorage.getItem('userRole') || 'Sales_Executive';

  useEffect(() => {
    loadDashboard();
    loadKPISummary();
  }, []);

  const loadDashboard = async () => {
    try {
      const layout = await analyticsApi.getDefaultDashboard(userRole);
      setDashboardLayout(layout);
    } catch (err) {
      setError('Failed to load dashboard layout');
      logger.error('Dashboard load error:', err);
    }
  };

  const loadKPISummary = async () => {
    try {
      const [funnelData, pipelineData] = await Promise.all([
        analyticsApi.getSalesFunnel(),
        analyticsApi.getPipelineForecast()
      ]);

      setKpiSummary({
        totalPipeline: pipelineData.totalPipelineValue,
        monthlyRevenue: 450000, // This would come from revenue API
        winRate: funnelData.conversionRate,
        openDeals: pipelineData.openDealsCount
      });
    } catch (err) {
      logger.error('KPI load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizeDashboard = () => {
    // Open dashboard customization modal
    logger.info('Customize dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={handleCustomizeDashboard}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Customize Dashboard
        </button>
      </div>

      {/* KPI Summary Bar */}
      {kpiSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500">Total Pipeline</div>
            <div className="text-2xl font-bold text-gray-900">
              ${kpiSummary.totalPipeline.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500">Monthly Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              ${kpiSummary.monthlyRevenue.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500">Win Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {kpiSummary.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500">Open Deals</div>
            <div className="text-2xl font-bold text-orange-600">
              {kpiSummary.openDeals}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {dashboardLayout && (
        <DashboardGrid 
          layout={dashboardLayout} 
          userRole={userRole}
          onLayoutChange={(newLayout) => setDashboardLayout(newLayout)}
        />
      )}
    </div>
  );
};
