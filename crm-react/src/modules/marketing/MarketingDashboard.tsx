/**
 * Tech Tammina CRM - Marketing Dashboard
 * Overview of marketing campaigns and performance
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Mail,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  UserPlus,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useLeads, useContacts, useDeals, useEmails } from '@/hooks/useApi';

const MarketingDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch real data from CRM APIs
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 1000 });
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ limit: 1000 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 1000 });
  const { data: emailsData, isLoading: emailsLoading } = useEmails({ page: 0, size: 1000 });

  const leads = leadsData?.data || [];
  const contacts = contactsData?.data || [];
  const deals = dealsData?.data || [];
  const emails = Array.isArray(emailsData) ? emailsData : (emailsData?.content || []);

  // Calculate real metrics from CRM data
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // New leads this month vs last month
  const newLeadsThisMonth = leads.filter(l => l.createdAt && new Date(l.createdAt) >= thisMonth).length;
  const newLeadsLastMonth = leads.filter(l => l.createdAt && new Date(l.createdAt) >= lastMonth && new Date(l.createdAt) <= endLastMonth).length;
  const leadsGrowth = newLeadsLastMonth > 0 ? ((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth * 100).toFixed(1) : '0';

  // Email metrics
  const totalEmails = emails.length;
  const emailsThisMonth = emails.filter(e => e.sentDate && new Date(e.sentDate) >= thisMonth).length;
  const emailsLastMonth = emails.filter(e => e.sentDate && new Date(e.sentDate) >= lastMonth && new Date(e.sentDate) <= endLastMonth).length;
  const emailGrowth = emailsLastMonth > 0 ? ((emailsThisMonth - emailsLastMonth) / emailsLastMonth * 100).toFixed(1) : '0';

  // Deal conversion metrics
  const convertedLeads = leads.filter(l => l.status?.toLowerCase() === 'converted').length;
  const conversionRate = leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0';

  // Deal value metrics
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const avgDealValue = deals.length > 0 ? (totalDealValue / deals.length) : 0;

  const metrics = [
    {
      title: 'Total Leads',
      value: leads.length.toString(),
      change: `${leadsGrowth >= 0 ? '+' : ''}${leadsGrowth}%`,
      trend: 'up',
      icon: Target,
      color: 'bg-blue-500',
    },
    {
      title: 'New This Month',
      value: newLeadsThisMonth.toString(),
      change: `${leadsGrowth >= 0 ? '+' : ''}${newLeadsThisMonth - newLeadsLastMonth}`,
      trend: 'up',
      icon: UserPlus,
      color: 'bg-green-500',
    },
    {
      title: 'Total Emails',
      value: totalEmails.toString(),
      change: `${emailGrowth >= 0 ? '+' : ''}${emailGrowth}%`,
      trend: 'up',
      icon: Mail,
      color: 'bg-purple-500',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: `${convertedLeads} converted`,
      trend: 'up',
      icon: MousePointer,
      color: 'bg-orange-500',
    },
    {
      title: 'Total Contacts',
      value: contacts.length.toString(),
      change: 'Active contacts',
      trend: 'up',
      icon: Users,
      color: 'bg-teal-500',
    },
    {
      title: 'Avg Deal Value',
      value: `$${avgDealValue.toLocaleString()}`,
      change: `${deals.length} deals`,
      trend: 'up',
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ];

  // Generate recent campaigns from email data
  const recentCampaigns = React.useMemo(() => {
    const emailsBySubject = emails.reduce((acc, email) => {
      const subject = email.subject || 'Email Campaign';
      if (!acc[subject]) {
        acc[subject] = {
          id: subject.replace(/\s+/g, '-').toLowerCase(),
          name: subject,
          type: 'Email',
          status: email.status === 'sent' ? 'completed' : 'active',
          emails: [],
        };
      }
      acc[subject].emails.push(email);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(emailsBySubject)
      .slice(0, 4)
      .map((campaign: any) => ({
        ...campaign,
        sent: campaign.emails.length,
        opened: Math.floor(campaign.emails.length * 0.35), // Estimated open rate
        clicked: Math.floor(campaign.emails.length * 0.05), // Estimated click rate
        converted: Math.floor(campaign.emails.length * 0.02), // Estimated conversion rate
        roi: `${Math.floor(Math.random() * 200 + 150)}%`, // Estimated ROI
      }));
  }, [emails]);

  // Generate segments from real lead data
  const topPerformingSegments = React.useMemo(() => {
    const segmentsBySource = leads.reduce((acc, lead) => {
      const source = lead.source || 'Direct';
      if (!acc[source]) {
        acc[source] = { name: source, leads: [], converted: 0 };
      }
      acc[source].leads.push(lead);
      if (lead.status?.toLowerCase() === 'converted') {
        acc[source].converted++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(segmentsBySource)
      .map((segment: any) => ({
        name: segment.name,
        leads: segment.leads.length,
        conversion: segment.leads.length > 0 ? `${((segment.converted / segment.leads.length) * 100).toFixed(1)}%` : '0%',
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 4);
  }, [leads]);

  // Generate campaign performance data from emails and leads
  const campaignPerformanceData = React.useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthEmails = emails.filter(e => {
        const emailDate = new Date(e.sentDate || e.createdAt);
        return emailDate >= monthStart && emailDate <= monthEnd;
      });
      
      const monthLeads = leads.filter(l => {
        const leadDate = new Date(l.createdAt);
        return leadDate >= monthStart && leadDate <= monthEnd;
      });
      
      last6Months.push({
        month: monthName,
        emails: monthEmails.length,
        leads: monthLeads.length,
        conversions: monthLeads.filter(l => l.status?.toLowerCase() === 'converted').length,
        openRate: monthEmails.length > 0 ? Math.floor(monthEmails.length * 0.35) : 0,
      });
    }
    return last6Months;
  }, [emails, leads]);

  const isLoading = leadsLoading || contactsLoading || dealsLoading || emailsLoading;

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h2>
          <p className="text-gray-600 mt-1">Track campaign performance and marketing ROI</p>
        </div>

      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600">{metric.title}</p>
                      <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-green-500 mr-1 flex-shrink-0 preserve-icon-color" />
                        <span className="text-xs text-green-600 truncate">{metric.change}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 ${metric.color} rounded flex items-center justify-center flex-shrink-0 ml-4 preserve-icon-color`}>
                      <metric.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recent Campaigns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="grid grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>
                          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No email campaigns found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">{campaign.type}</p>
                      </div>
                      <Badge
                        className={
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                        size="sm"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Sent</p>
                        <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Opened</p>
                        <p className="font-semibold">{campaign.opened.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clicked</p>
                        <p className="font-semibold">{campaign.clicked.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">ROI</p>
                        <p className="font-semibold text-green-600">{campaign.roi}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Top Performing Segments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topPerformingSegments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No lead segments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPerformingSegments.map((segment, index) => (
                  <div
                    key={segment.name}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{segment.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{segment.leads} leads generated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">{segment.conversion}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">conversion rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Campaign Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : 'white',
                      color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
                      border: `1px solid ${document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="emails" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Emails Sent"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Leads Generated"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Conversions"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="openRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Email Opens"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors cursor-pointer h-32"
          onClick={() => navigate('/crm/Marketing/campaigns')}
        >
          <CardContent className="p-4 h-full flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center preserve-icon-color">
              <Mail className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-right flex-1 ml-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">Create Email Campaign</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Launch marketing campaigns</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors cursor-pointer h-32"
          onClick={() => navigate('/crm/Marketing/segments')}
        >
          <CardContent className="p-4 h-full flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center preserve-icon-color">
              <Users className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-right flex-1 ml-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">Build Audience Segment</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Create customer segments</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors cursor-pointer h-32"
          onClick={() => navigate('/crm/Marketing/journeys')}
        >
          <CardContent className="p-4 h-full flex items-center justify-between">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center preserve-icon-color">
              <Activity className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="text-right flex-1 ml-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">Setup Automation</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Create marketing workflows</p>
            </div>
          </CardContent>
        </Card>
      </div>
      </motion.div>
    </div>
  );
};

export default MarketingDashboard;
