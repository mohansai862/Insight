/**
 * Dashboard Revenue Chart - Matches Reports Page REVENUE ANALYSIS Design
 */

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DollarSign, X } from 'lucide-react';

interface DashboardRevenueChartProps {
  data: any[];
  onDateRangeChange?: (range: { start?: string; end?: string }) => void;
  showInternalFilters?: boolean;
  isLoading?: boolean;
}

const DashboardRevenueChart: React.FC<DashboardRevenueChartProps> = ({ data, onDateRangeChange, showInternalFilters = true, isLoading = false }) => {
  const [selectedRange, setSelectedRange] = useState<string>('');
  


  const getDateRange = (period: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '1D':
        start.setDate(start.getDate() - 1);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '2M':
        start.setMonth(start.getMonth() - 2);
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
    
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const handleRangeClick = (period: string) => {
    if (selectedRange === period) {
      clearFilter();
    } else {
      setSelectedRange(period);
      onDateRangeChange?.(getDateRange(period));
    }
  };

  const clearFilter = () => {
    setSelectedRange('');
    onDateRangeChange?.({});
  };

  // No client-side filtering needed - all filtering handled by backend API
  
  // Always use the data from props (which comes from backend API)
  const displayData = data;
  const hasData = displayData.length > 0 && displayData.some(item => {
    const revenue = Number(item.total || item.close || item.revenue || 0);
    return revenue > 0;
  });

  // Transform data for chart - use only real data from backend
  const chartData = [{ period: '0', revenue: 0, change: 0 }, ...displayData.map((item) => {
    const period = item.period || item.month || 'N/A';
    
    return {
      period: period,
      revenue: Number(item.total || item.close || item.revenue || 0),
      change: Number(item.change || 0)
    };
  })];

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Revenue Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time revenue tracking with trend analysis</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-700">
              <div className="flex items-center space-x-2">
                {/* <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" /> */}
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">$0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-[700px] bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">No Revenue Data Available</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Revenue analytics will appear here once deals are created</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Revenue Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time revenue tracking with trend analysis</p>
        </div>
        <div className="flex items-center justify-end mb-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">${(() => {
              const value = totalRevenue;
              if (value >= 1000000000) {
                const formatted = (value / 1000000000).toFixed(1);
                return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B';
              }
              if (value >= 1000000) {
                const formatted = (value / 1000000).toFixed(1);
                return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
              }
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toLocaleString();
            })()}</p>
          </div>
        </div>
        <div className="h-[500px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">No data available</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">No revenue data found</div>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 40, right: 60, left: 100, bottom: 80 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#F3F4F6'} />
              <XAxis 
                dataKey="period" 
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
                  if (value === 0) return '0';
                  if (value >= 1000000000) {
                    const formatted = (value / 1000000000).toFixed(1);
                    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
                  }
                  if (value >= 1000000) {
                    const formatted = (value / 1000000).toFixed(1);
                    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
                  }
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                  return `$${value}`;
                }}
                domain={[0, (dataMax: number) => {
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
                  if (num >= 1000000000) {
                    const formatted = (num / 1000000000).toFixed(1);
                    return [`$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`, 'Revenue'];
                  }
                  if (num >= 1000000) {
                    const formatted = (num / 1000000).toFixed(1);
                    return [`$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`, 'Revenue'];
                  }
                  if (num >= 1000) {
                    const formatted = (num / 1000).toFixed(1);
                    return [`$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`, 'Revenue'];
                  }
                  return [`$${num.toLocaleString()}`, 'Revenue'];
                }}
                labelFormatter={(label) => `Period: ${label}`}
                cursor={{ stroke: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#revenueGradient)"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardRevenueChart;