import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../../api/reportsApi';
import RevenueAreaChart from '../../../components/ui/RevenueAreaChart';

interface MonthlyRevenueWidgetProps {
  style?: React.CSSProperties;
  title?: string;
}

const MonthlyRevenueWidget: React.FC<MonthlyRevenueWidgetProps> = ({ 
  style, 
  title = "Monthly Revenue" 
}) => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async (dateRange?: { start?: string; end?: string }) => {
    try {
      setLoading(true);
      const response = await reportsApi.revenue(dateRange);
      logger.info('Real revenue data loaded:', response.data);
      setRevenueData(response.data);
    } catch (error) {
      logger.error('Error loading real revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={style} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const revenueChartData = revenueData?.revenueData || [];
  const totalRevenue = revenueData?.totalRevenue || revenueData?.globalTotalRevenue || 0;

  return (
    <div style={style} className="h-full">
      <RevenueAreaChart 
        data={revenueChartData} 
        totalRevenue={totalRevenue}
      />
    </div>
  );
};

export default MonthlyRevenueWidget;
