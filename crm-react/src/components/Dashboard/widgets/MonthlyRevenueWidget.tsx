import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { analyticsApi, RevenueTrend, formatCurrency } from '../../../../../../../frontend/src/api/analyticsApi';

export const MonthlyRevenueWidget: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      const data = await analyticsApi.getRevenueTrends();
      setRevenueData(data.slice(-6)); // Last 6 months
    } catch (error) {
      logger.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!revenueData.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No revenue data available
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const currentMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];
  
  const growthRate = previousMonth 
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;

  const formatMonth = (monthStr: string) => {
    if (monthStr && monthStr.includes('-') && monthStr.length >= 7) {
      const [year, month] = monthStr.split('-');
      if (year && month && year.length === 4) {
        return year.slice(-2) + '-' + month;
      }
    }
    // Fallback to short month name if not in YYYY-MM format
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    } catch {
      return monthStr;
    }
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
      
      {/* Current Month Revenue */}
      <div className="text-center mb-4 p-4 bg-green-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">This Month</div>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(currentMonth.revenue)}
        </div>
        {growthRate !== 0 && (
          <div className={`text-sm ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate > 0 ? '↗' : '↘'} {Math.abs(growthRate).toFixed(1)}% vs last month
          </div>
        )}
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Last 6 Months</div>
        {revenueData.map((item, index) => {
          const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-8 text-xs text-gray-600">
                {formatMonth(item.month)}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${barHeight}%` }}
                ></div>
              </div>
              <div className="w-16 text-xs text-right text-gray-600">
                {formatCurrency(item.revenue).replace('$', '$').replace(',000', 'K')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
