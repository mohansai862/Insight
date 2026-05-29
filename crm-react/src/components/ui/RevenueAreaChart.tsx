import { logger } from '@/utils/logger';
/**
 * Revenue Area Chart Component - Professional CRM Style
 */

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';

interface RevenueAreaChartProps {
  data: any[];
  totalRevenue?: number;
}

const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({ data, totalRevenue }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
        <div className="text-lg font-bold">Loading revenue data...</div>
        <div className="text-sm">Fetching real data from database</div>
      </div>
    );
  }

  // Transform data to match the area chart format with monthly dates
  const chartData = data.map((item) => {
    const revenue = Number(item.close || item.revenue || item.total || 0);
    logger.info('🔄 Transforming item:', item, 'Revenue:', revenue);
    
    let period = item.period || 'N/A';
    
    // Format YYYY-MM to YY-MM
    if (period && period.includes('-') && period.length >= 7) {
      const [year, month] = period.split('-');
      if (year && month && year.length === 4) {
        period = year.slice(-2) + '-' + month;
      }
    }
    
    return {
      date: period,
      revenue: revenue,
      period: period
    };
  });

  // Validation for real data - show chart even with zero values to indicate no closed deals
  const hasRealData = chartData.length > 0;
  const hasPositiveRevenue = chartData.some(item => item.revenue > 0);
  
  if (!hasRealData) {
    logger.info('⚠️ No revenue periods found. Chart data:', chartData);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 h-full">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 space-y-2">
          <div className="text-lg">No Revenue Data Available</div>
          <div className="text-sm">Revenue analytics will appear here once deals are created</div>
        </div>
      </div>
    );
  }
  
  if (!hasPositiveRevenue) {
    logger.info('⚠️ No positive revenue found. Showing zero revenue chart.');
  }

  const latest = chartData[chartData.length - 1];
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  
  // Use total revenue as current revenue, calculate change from previous month
  const currentRevenue = totalRevenue || 0;
  const latestMonthRevenue = latest ? latest.revenue : 0;
  const previousMonthRevenue = previous ? previous.revenue : 0;
  const change = latestMonthRevenue - previousMonthRevenue;
  
  logger.info('📊 Chart Data:', chartData);
  logger.info('💰 Latest Revenue:', latest?.revenue);
  logger.info('📈 Change Calculation:', change);

  // Export functions
  const exportToExcel = () => {
    const csvContent = [
      ['Period', 'Revenue'],
      ...chartData.map(item => [item.date, item.revenue])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div ref={chartRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 h-full min-h-[450px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Revenue Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={exportToExcel} leftIcon={<Download className="w-4 h-4" />}>
              Export Excel
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
<<<<<<< .mine            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Current Revenue</span>
            <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">
=======            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              {hasPositiveRevenue ? 'Current Revenue' : 'Revenue (No Closed Deals)'}
            </span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
>>>>>>> .theirs              ${currentRevenue > 0 ? currentRevenue.toLocaleString() : '0'}
            </span>
            {!hasPositiveRevenue && (
              <span className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                Mark deals as 'Closed Won' to track revenue
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Change</span>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold ${
              change >= 0 ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}>
              {latestMonthRevenue > 0 && previous 
                ? `${change >= 0 ? "+" : ""}$${Math.abs(change).toLocaleString()}` 
                : "$0"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 30, right: 60, left: 60, bottom: 80 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e40af" stopOpacity={0.4}/>
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} 
              strokeWidth={1}
            />
            <XAxis
              dataKey="date"
              axisLine={{ stroke: '#000000', strokeWidth: 2 }}
              tickLine={{ stroke: '#000000', strokeWidth: 2 }}
              tick={{ 
                fontSize: 14, 
                fontWeight: 'bold',
                fill: document.documentElement.classList.contains('dark') ? '#1e40af' : '#1e40af' 
              }}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tickMargin={30}
            />
            <YAxis
              axisLine={{ stroke: '#000000', strokeWidth: 2 }}
              tickLine={{ stroke: '#000000', strokeWidth: 2 }}
              tick={{ 
                fontSize: 14, 
                fontWeight: 'bold',
                fill: document.documentElement.classList.contains('dark') ? '#1e40af' : '#1e40af' 
              }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              domain={[0, 'dataMax + 1000']}
              width={70}
              tickMargin={10}
              label={{ 
                value: 'Revenue (USD)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '16px', fontWeight: 'bold', fill: '#1e40af' }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                color: '#1e40af',
                border: '2px solid #1e40af',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(30, 64, 175, 0.3)',
                padding: '16px 20px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              formatter={(value: any) => [
                `$${value.toLocaleString()}`, 
                'Revenue'
              ]}
              labelFormatter={(label) => `Period: ${label}`}
              cursor={{ stroke: '#1e40af', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1e40af'
              }}
            />
            <Area
              type="monotoneX"
              dataKey="revenue"
              stroke="#1e40af"
              strokeWidth={4}
              fill="url(#revenueGradient)"
              dot={{ 
                fill: '#1e40af', 
                strokeWidth: 3, 
                stroke: '#ffffff',
                r: 6,
                filter: 'drop-shadow(0 2px 4px rgba(30,64,175,0.3))'
              }}
              activeDot={{ 
                r: 8, 
                fill: '#1e40af', 
                strokeWidth: 4, 
                stroke: '#ffffff',
                filter: 'drop-shadow(0 4px 8px rgba(30,64,175,0.4))'
              }}
              name="Revenue Trend"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueAreaChart;
