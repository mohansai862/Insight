import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, analyticsApi } from '../../api/analyticsApi';
import DashboardGrid from './components/DashboardGrid';
import CustomizeDashboard from './components/CustomizeDashboard';

const DashboardModule: React.FC = () => {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardLayout | null>(null);
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<any>({});

  useEffect(() => {
    loadDashboard();
    loadKpiData();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Try to get default dashboard first
      const defaultDashboard = await analyticsApi.getDefaultDashboard();
      setCurrentDashboard(defaultDashboard);
      
      // Load all available dashboards
      const allDashboards = await analyticsApi.getDashboards();
      setDashboards(allDashboards);
    } catch (error) {
      logger.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKpiData = async () => {
    try {
      const kpis = await analyticsApi.getKpiSummary();
      setKpiData(kpis);
    } catch (error) {
      logger.error('Error loading KPI data:', error);
    }
  };

  const handleDashboardChange = async (dashboardId: number) => {
    try {
      const dashboard = await analyticsApi.getDashboardById(dashboardId);
      setCurrentDashboard(dashboard);
    } catch (error) {
      logger.error('Error loading dashboard:', error);
    }
  };

  const handleCustomizeComplete = () => {
    setShowCustomize(false);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your key metrics and performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Dashboard Selector */}
          <select
            value={currentDashboard?.layoutId || ''}
            onChange={(e) => handleDashboardChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dashboards.map(dashboard => (
              <option key={dashboard.layoutId} value={dashboard.layoutId}>
                {dashboard.layoutName}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCustomize(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Customize
          </button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-blue-600">
            {analyticsApi.formatCurrency(kpiData.totalPipelineValue || 0)}
          </div>
          <div className="text-sm text-gray-500">Pipeline Value</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-green-600">
            {analyticsApi.formatCurrency(kpiData.monthlyRevenue || 0)}
          </div>
          <div className="text-sm text-gray-500">Monthly Revenue</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-purple-600">
            {analyticsApi.formatPercentage(kpiData.winRate || 0)}
          </div>
          <div className="text-sm text-gray-500">Win Rate</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-orange-600">
            {analyticsApi.formatCurrency(kpiData.averageDealSize || 0)}
          </div>
          <div className="text-sm text-gray-500">Avg Deal Size</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-indigo-600">
            {analyticsApi.formatPercentage(kpiData.leadConversionRate || 0)}
          </div>
          <div className="text-sm text-gray-500">Lead Conversion</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-teal-600">
            {analyticsApi.formatPercentage(kpiData.quotaAttainment || 0)}
          </div>
          <div className="text-sm text-gray-500">Quota Attainment</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-red-600">
            {analyticsApi.formatNumber(kpiData.openCases || 0)}
          </div>
          <div className="text-sm text-gray-500">Open Cases</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-emerald-600">
            {analyticsApi.formatPercentage(kpiData.slaCompliance || 0)}
          </div>
          <div className="text-sm text-gray-500">SLA Compliance</div>
        </div>
      </div>

      {/* Dashboard Content */}
      {showCustomize ? (
        <CustomizeDashboard
          currentDashboard={currentDashboard}
          onComplete={handleCustomizeComplete}
          onCancel={() => setShowCustomize(false)}
        />
      ) : (
        <DashboardGrid dashboard={currentDashboard} />
      )}
    </div>
  );
};

export default DashboardModule;
