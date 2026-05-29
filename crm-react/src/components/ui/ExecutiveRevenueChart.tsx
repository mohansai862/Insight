/**
 * Executive Revenue Chart Component - Simple and Reliable
 */

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ExecutiveRevenueChartProps {
  data: any[];
  totalRevenue?: number;
}

const ExecutiveRevenueChart: React.FC<ExecutiveRevenueChartProps> = ({ data, totalRevenue }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-2">
        <div className="text-lg font-bold">No data available</div>
        <div className="text-sm">No executive revenue data found</div>
      </div>
    );
  }

  // Transform data for the chart
  const chartData = [{ period: '0', revenue: 0 }, ...data.map((item: any) => {
    const revenue = Number(item.close || item.revenue || item.total || 0);
    const period = item.period || 'N/A';
    
    return {
      period: period,
      revenue: revenue
    };
  })];

  const hasData = chartData.length > 0 && chartData.some((item: any) => item.revenue > 0);
  
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">No Revenue Data</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Executive revenue will appear here once deals are closed</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">Executive Revenue Trend</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400">Monthly revenue performance</p>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 40, right: 60, left: 100, bottom: 120 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e40af" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} />
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
                if (value === 0) return '$0';
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
              label={{ value: 'Revenue Amount', angle: -90, position: 'insideLeft', offset: -40, style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : 'white',
                color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #1e40af',
                borderRadius: '8px',
                fontSize: '14px'
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
              labelFormatter={(label: any) => `Period: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              fill="url(#colorRevenue)"
              stroke="#1e40af"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 7, fill: '#1e40af', strokeWidth: 2, stroke: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExecutiveRevenueChart;