/**
 * Tech Tammina CRM - Dashboard Module
 * Main dashboard with metrics, charts, and recent activities
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  Bell,
  Filter,
  Phone,
  Mail,
  CheckSquare
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonMetric, SkeletonChart } from '@/components/ui/Skeleton';
import QuickCallWidget from './widgets/QuickCallWidget';
import { useDashboardMetrics, useDashboardCharts, useActivities, useTasks } from '@/hooks/useApi';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/utils';
import {
  ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from 'recharts';
import { getCurrentRole } from '@/utils/rbac';
import { Link } from 'react-router-dom';
import { getRoleDisplayName } from '@/utils/roleDisplay';

const Dashboard: React.FC = () => {
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts();
  const [showQuickCall, setShowQuickCall] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('');


  // Use metrics directly from backend (already calculated)
  const metrics = metricsData?.data || [];
  const charts = chartsData?.data || {};

  // Parse backend charts into specific datasets
  const revenueBarData = React.useMemo(() => {
    const anyCharts = charts as any;
    let data: { name: string; value: number }[] = [];
    

    
    // Shape 1: Record with labels/datasets
    if (anyCharts?.revenue?.labels && anyCharts?.revenue?.datasets?.[0]?.data) {
      const c = anyCharts.revenue;
      data = c.labels.map((label: string, i: number) => ({ 
        name: label, 
        value: Number(c.datasets[0].data[i] || 0) 
      }));

    }
    // Shape 2: Array with { id, data: [{ name, value }] }
    else if (Array.isArray(anyCharts)) {
      const item = anyCharts.find((x: any) => x.id === 'revenue-trend');
      if (item?.data) {
        data = item.data.map((d: any) => ({ name: String(d.name), value: Number(d.value) }));

      }
    }
    
    // Convert YY-MM to YYYY-MM format
    data = data.map(item => {
      let name = item.name;
      if (name && name.match(/^\d{2}-\d{2}$/)) {
        const [yy, mm] = name.split('-');
        const year = parseInt(yy) >= 70 ? `19${yy}` : `20${yy}`;
        name = `${year}-${mm}`;
      }
      return { ...item, name };
    });
    
    // Add starting value of 0 if data exists
    if (data.length > 0) {
      const result = [{ name: '0', value: 0 }, ...data];

      return result;
    }
    

    return [{ name: '0', value: 0 }];
  }, [charts]);

  const pipelinePieData = React.useMemo(() => {
    const anyCharts = charts as any;
    let rawData: { name: string; value: number }[] = [];
    
    // Shape 1: Record with labels/datasets
    if (anyCharts?.pipeline?.labels && anyCharts?.pipeline?.datasets?.[0]?.data) {
      const c = anyCharts.pipeline;
      rawData = c.labels.map((label: string, i: number) => ({ name: label, value: Number(c.datasets[0].data[i] || 0) }));
    }
    // Shape 2: Array with { id, data: [{ name, value }] }
    else if (Array.isArray(anyCharts)) {
      const item = anyCharts.find((x: any) => x.id === 'pipeline-stages');
      if (item?.data) {
        rawData = item.data.map((d: any) => ({ name: String(d.name), value: Number(d.value) }));
      }
    }
    
    // Create a map for both space and underscore versions of stage names
    const stageMap = new Map();
    rawData.forEach(item => {
      const name = item.name;
      stageMap.set(name, item.value);
      // Also map the alternate format (space <-> underscore)
      if (name.includes(' ')) {
        stageMap.set(name.replace(/ /g, '_'), item.value);
      } else if (name.includes('_')) {
        stageMap.set(name.replace(/_/g, ' '), item.value);
      }
    });
    
    // Define expected stages with proper display names
    const expectedStages = [
      { key: 'Qualification', display: 'Qualified' },
      { key: 'Proposal', display: 'Proposal' },
      { key: 'Negotiation', display: 'Negotiation' },
      { key: 'Closed Won', display: 'Won' },
      { key: 'Closed Lost', display: 'Lost' }
    ];
    
    return expectedStages.map(stage => ({
      name: stage.display,
      value: stageMap.get(stage.key) || stageMap.get(stage.key.replace(/ /g, '_')) || 0
    }));
  }, [charts]);

  
  // Get user info from session
  const getUserInfo = () => {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const userData = JSON.parse(session);
      // Use fullName if available, otherwise construct from firstName and lastName
      let displayName = '';
      if (userData.fullName && userData.fullName.trim()) {
        displayName = userData.fullName.trim();
      } else {
        const firstName = (userData.firstName || '').trim();
        const lastName = (userData.lastName || '').trim();
        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
        } else if (firstName) {
          displayName = firstName;
        } else if (lastName) {
          displayName = lastName;
        } else {
          displayName = userData.username || userData.email?.split('@')[0] || 'User';
        }
      }
      return {
        ...userData,
        displayName,
        role: userData.role || 'User'
      };
    }
    return { displayName: 'User', role: 'User' };
  };

  const userInfo = getUserInfo();

  const role = getCurrentRole();
  const isItAdmin = role === 'IT_Admin';

  // Date range dropdown state
  type RangeKey = 'this_month' | 'last_month' | 'last_7' | 'last_30' | 'this_quarter' | 'custom';
  const [isRangeOpen, setIsRangeOpen] = React.useState(false);
  const [range, setRange] = React.useState<RangeKey>('this_month');
  const rangeLabels: Record<RangeKey, string> = {
    this_month: 'Till Month',
    last_month: 'Last Month',
    last_7: 'Last 7 Days',
    last_30: 'Last 30 Days',
    this_quarter: 'This Quarter',
    custom: 'Custom Range...'
  };
  const rangeRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rangeRef.current) return;
      if (!rangeRef.current.contains(e.target as Node)) {
        setIsRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleSelectRange = (key: RangeKey) => {
    setRange(key);
    setIsRangeOpen(false);
    // TODO: trigger refetch with selected range when backend supports filters
  };

  const { data: activitiesRes, isLoading: activitiesLoading } = useActivities();
  const recentActivities = React.useMemo(() => {
    const list = (activitiesRes as any)?.data || [];
    // Filter to only show activities where type is "task"
    const taskActivities = list.filter((activity: any) => activity.type === 'task');
    return taskActivities
      .slice()
      .sort((a: any, b: any) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
      .slice(0, 5);
  }, [activitiesRes]);

  const { data: tasksRes, isLoading: tasksLoading } = useTasks();
  const upcomingTasks = React.useMemo(() => {
    const list = (tasksRes as any)?.data || [];
    const now = new Date();
    return list
      .filter((t: any) => t.type === 'todo' && t.dueDate && new Date(t.dueDate).getTime() >= now.getTime() && (t.status === 'pending' || t.status === 'in_progress'))
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasksRes]);

  const formatLargeNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(num)) return value.toString();
    
    if (num >= 1000000000) {
      const formatted = (num / 1000000000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
    } else if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
    } else if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  const getMetricName = (id: string, originalName: string) => {
    // Backend now provides correct names, just return original
    return originalName;
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'total-revenue':
        return <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'active-deals':
        return <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'conversion-rate':
        return <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'avg-deal-size':
        return <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return '📞';
      case 'meeting':
        return '📅';
      case 'email':
        return '📧';
      case 'task':
        return '📝';
      case 'note':
        return '🗒️';
      default:
        return '📝';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '📅';
      case 'email':
        return '📧';
      case 'call':
        return '📞';
      default:
        return '📝';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userInfo.displayName}! 
            </h1>
            <p className="text-primary-100 text-lg">
              Ready to deliver excellence? Here's your sales overview for today.
            </p>
          </div>
          <div className="hidden md:flex items-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30">
              {getRoleDisplayName(userInfo.role)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-full">
              <SkeletonMetric />
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover-lift h-full">
                <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      {getMetricIcon(metric.id)}
                    </div>
                    {metric.change !== undefined && metric.change !== null && metric.change !== 0 && (
                      <div className={`flex items-center space-x-1 flex-shrink-0 ${
                        metric.change > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : metric.change < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {metric.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3 preserve-icon-color" />
                        ) : metric.change < 0 ? (
                          <ArrowDownRight className="w-3 h-3 preserve-icon-color" />
                        ) : null}
                        <span className="text-xs font-medium">
                          {metric.change > 0 ? '+' : ''}{Math.min(Math.abs(metric.change), 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                      {getMetricName(metric.id, metric.name)}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {metric.id === 'total-revenue' && metric.format === 'currency'
                        ? formatLargeNumber(metric.value)
                        : metric.format === 'currency' 
                        ? metric.value.replace('$', '$')
                        : metric.format === 'number'
                        ? formatNumber(Number(metric.value))
                        : metric.value
                      }
                    </p>
                    {metric.period && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {metric.period.replace('This Month', 'Till Month')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Section */}  
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <SkeletonChart type="bar" />
              ) : (
                <div className="h-80 relative">

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueBarData} margin={{ top: 16, right: 24, left: 20, bottom: 40 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-600" />
                      <XAxis 
                        dataKey="name" 
                        tickFormatter={(value) => value === '0' ? 'O' : value}
                        tick={{ fill: '#6B7280', fontSize: 10, dx: -5 }} 
                        axisLine={{ stroke: '#E5E7EB' }} 
                        tickLine={false}
                        className="dark:fill-white"
                      />
                      <YAxis 
                        tickFormatter={(v) => {
                          const num = Number(v);
                          if (num === 0) return '';
                          if (num >= 1000000000) return `$${(num / 1000000000).toFixed(0)}B`;
                          if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
                          if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
                          return `$${num}`;
                        }} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                        axisLine={{ stroke: '#E5E7EB' }} 
                        tickLine={false}
                        className="dark:fill-white"
                      />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value || 0);
                          return (
                            <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
                              <p className="text-xs text-gray-500 dark:text-gray-400">{String(label)}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(val)}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 6, fill: '#10B981' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Y-axis Label */}
                  <div className="absolute -left-16 transform -rotate-90 text-xs text-gray-500 whitespace-nowrap" style={{top: '130px', transform: 'translateY(-50%) rotate(-90deg)'}}>
                    Revenue Amount (USD)
                  </div>
                  {/* X-axis Label */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                    Time Period (Months)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <SkeletonChart type="bar" />
              ) : (
                <div className="h-80 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelinePieData} margin={{ top: 16, right: 24, left: 20, bottom: 40 }} width={undefined} height={undefined}>
                      <defs>
                        <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#34D399" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-600" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6B7280', fontSize: 10 }} 
                        axisLine={{ stroke: '#E5E7EB' }} 
                        tickLine={false}
                        className="dark:fill-white"
                      />
                      <YAxis 
                        tickFormatter={(v) => Math.floor(Number(v)).toString()} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                        axisLine={{ stroke: '#E5E7EB' }} 
                        tickLine={false}
                        className="dark:fill-white"
                        allowDecimals={false}
                        domain={[0, (() => {
                          const maxValue = Math.max(...pipelinePieData.map(d => d.value));
                          const step = Math.ceil(maxValue / 4);
                          return step * 4;
                        })()]}
                        tickCount={5}
                        interval={0}
                      />
                      <Tooltip 
                        cursor={false}
                        content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value || 0);
                          return (
                            <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
                              <p className="text-xs text-gray-500 dark:text-gray-400">{String(label)}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(val)}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar 
                        dataKey="value" 
                        fill="url(#pipelineGradient)" 
                        radius={[8, 8, 4, 4]}
                        cursor={false}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="top" 
                          formatter={(value: number) => formatNumber(value)}
                          className="fill-gray-700 dark:fill-white"
                          style={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Y-axis Label */}
                  <div className="absolute -left-8 transform -rotate-90 text-xs text-gray-500 whitespace-nowrap" style={{top: '130px', transform: 'translateY(-50%) rotate(-90deg)'}}>
                    Number of Deals
                  </div>
                  {/* X-axis Label */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                    Sales Pipeline Stages
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities & Quick Call */}
      {!isItAdmin && role !== 'Sales_Executive' && role !== 'Sales_Manager' && role !== 'Sales_VP' && role !== 'CEO' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Call Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <QuickCallWidget />
          </motion.div>
          
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button 
                  as={Link} 
                  to="/crm/Communication" 
                  variant="ghost" 
                  size="sm"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {activitiesLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No recent activities</div>
                ) : (
                  recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.subject || activity.type}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Avatar
                            src={undefined}
                            name={activity.createdBy ? String(activity.createdBy) : 'User'}
                            size="xs"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(activity.activityDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Tasks - Hidden for Sales Executive */}
          {role !== 'Sales_Executive' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <Button 
                    as={Link} 
                    to="/crm/Tasks/new" 
                    variant="ghost" 
                    size="sm" 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasksLoading ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                  ) : upcomingTasks.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming tasks</div>
                  ) : (
                    upcomingTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        <div className="text-lg">
                          {getTaskIcon(task.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.dueDate ? `Due ${formatRelativeTime(task.dueDate)}` : 'No due date'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            task.priority === 'high' || task.priority === 'urgent' ? 'error' :
                            task.priority === 'medium' ? 'warning' : 'default'
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!isItAdmin && role !== 'CEO' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(role === 'Sales_Executive' ? [
                  { icon: <Users className="w-5 h-5" />, label: 'Add Contact', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', to: '/crm/Contacts/new', isLink: true },
                  { icon: <Target className="w-5 h-5" />, label: 'Create Deal', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', to: '/crm/Deals/new', isLink: true },
                  { icon: <Phone className="w-5 h-5" />, label: 'Quick Call', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', isLink: false, onClick: () => setShowQuickCall(true) },
                  { icon: <TrendingUp className="w-5 h-5" />, label: 'Recent Activities', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', to: '/crm/Communication', isLink: true },
                ] : (role === 'Sales_Manager' || role === 'Sales_VP') ? [
                  { icon: <CheckSquare className="w-5 h-5" />, label: 'Add Task', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', to: '/crm/Tasks/new', isLink: true },
                  { icon: <Phone className="w-5 h-5" />, label: 'Quick Call', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', isLink: false, onClick: () => setShowQuickCall(true) },
                  { icon: <TrendingUp className="w-5 h-5" />, label: 'Recent Activities', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', to: '/crm/Communication', isLink: true },
                  { icon: <Mail className="w-5 h-5" />, label: 'Send via Email', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', isLink: false, onClick: () => {
                    const subject = 'CRM Communication';
                    const body = 'Hello,\n\nI hope this email finds you well.\n\nBest regards,';
                    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(outlookUrl, '_blank');
                    import('react-hot-toast').then(({ default: toast }) => {
                      toast.success('Outlook opened for composing email!', {
                        duration: 2000,
                        position: 'top-center',
                        style: {
                          background: '#0078D4',
                          color: 'white',
                          fontWeight: '500',
                          padding: '12px 20px',
                          borderRadius: '8px'
                        },
                        icon: '✉️'
                      });
                    });
                  } },
                ] : [
                  { icon: <Users className="w-5 h-5" />, label: 'Add Contact', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', to: '/crm/Contacts/new', isLink: true },
                  { icon: <Target className="w-5 h-5" />, label: 'Create Deal', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', to: '/crm/Deals/new', isLink: true },
                  { icon: <Calendar className="w-5 h-5" />, label: 'Schedule Meeting', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', isLink: false },
                  { icon: <Bell className="w-5 h-5" />, label: 'Set Reminder', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', isLink: false },
                ]).map((action, index) => (
                  action.isLink ? (
                    <Link
                      to={action.to!}
                      key={index}
                      className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.color}`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {action.label}
                      </span>
                    </Link>
                  ) : (
                    <div
                      key={index}
                      className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
                      onClick={(action as any).onClick}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.color}`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {action.label}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Quick Call Popup */}
      {showQuickCall && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Quick Call</span>
              </h2>
              <button 
                onClick={() => setShowQuickCall(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowQuickCall(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={!phoneNumber.trim()}
                  onClick={() => {
                    if (phoneNumber.trim()) {
                      window.open(`tel:${phoneNumber}`, '_self');
                      import('react-hot-toast').then(({ default: toast }) => {
                        toast.success(`Calling ${phoneNumber}...`, {
                          duration: 2000,
                          position: 'top-center',
                          style: {
                            background: '#10B981',
                            color: 'white',
                            fontWeight: '500',
                            padding: '12px 20px',
                            borderRadius: '8px'
                          },
                          icon: '📞'
                        });
                      });
                      setShowQuickCall(false);
                      setPhoneNumber('');
                    }
                  }}
                >
                  Call Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
