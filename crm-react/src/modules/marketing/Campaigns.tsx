import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Marketing Campaigns
 * Campaign management and analytics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Users,
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatRelativeTime, formatCurrency } from '@/utils';
import { marketingApi, type CampaignAnalytics } from '@/api/marketingApi';
import { useLeads, useContacts, useDeals, useEmails } from '@/hooks/useApi';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'draft'>('all');
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchCampaignAnalytics = async () => {
      try {
        const data = await marketingApi.getRecentCampaigns();
        setCampaignAnalytics(data);
      } catch (error) {
        logger.error('Failed to fetch campaign analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaignAnalytics();
  }, []);

  // Fetch real data from CRM APIs
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 1000 });
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ limit: 1000 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 1000 });
  const { data: emailsData, isLoading: emailsLoading } = useEmails({ page: 0, size: 1000 });

  const leads = leadsData?.data || [];
  const contacts = contactsData?.data || [];
  const deals = dealsData?.data || [];
  const emails = Array.isArray(emailsData) ? emailsData : (emailsData?.content || []);

  const dataLoading = leadsLoading || contactsLoading || dealsLoading || emailsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <BarChart3 className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };



  // Calculate real campaign stats from CRM data
  const campaignStats = React.useMemo(() => {
    const totalLeads = leads.length;
    const totalContacts = contacts.length;
    const totalEmails = emails.length;
    const totalDeals = deals.length;
    const totalDealValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const convertedLeads = leads.filter(l => l.status?.toLowerCase() === 'converted').length;
    const avgDealValue = totalDeals > 0 ? totalDealValue / totalDeals : 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      total: totalLeads + totalContacts, // Total prospects
      active: totalEmails, // Active email campaigns
      totalBudget: totalDealValue, // Total deal pipeline value
      totalSpent: totalDealValue * 0.15, // Estimated 15% of deal value as marketing spend
      totalRevenue: deals.filter(d => d.stage?.toLowerCase().includes('won')).reduce((sum, d) => sum + (d.value || 0), 0),
      avgROI: conversionRate,
    };
  }, [leads, contacts, emails, deals]);

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Marketing Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your marketing campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        {dataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Top 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Prospects', value: campaignStats.total, icon: Target, color: 'bg-blue-500' },
                { label: 'Email Campaigns', value: campaignStats.active, icon: Play, color: 'bg-green-500' },
                { label: 'Pipeline Value', value: formatCurrency(campaignStats.totalBudget), icon: DollarSign, color: 'bg-purple-500' },
                { label: 'Marketing Spend', value: formatCurrency(campaignStats.totalSpent), icon: TrendingUp, color: 'bg-orange-500' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full bg-white/70 backdrop-blur-glass border-gray-200/50 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0 ml-3`}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Bottom 2 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Won Revenue', value: formatCurrency(campaignStats.totalRevenue), icon: DollarSign, color: 'bg-emerald-500' },
                { label: 'Conversion Rate', value: `${campaignStats.avgROI.toFixed(1)}%`, icon: BarChart3, color: 'bg-teal-500' },
              ].map((stat, index) => (
                <motion.div
                  key={index + 4}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (index + 4) * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full bg-white/70 backdrop-blur-glass border-gray-200/50 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0 ml-3`}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recent Campaigns Section */}
      <Card className="bg-white/70 backdrop-blur-glass">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recent Campaign Activity
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            New leads from contact forms ({campaignAnalytics?.period || 'Last 30 days'})
          </p>
        </CardHeader>
        <CardContent>
          {isLoading || dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : campaignAnalytics ? (
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total New Leads</p>
                      <p className="text-2xl font-bold text-blue-900">{campaignAnalytics.totalLeads}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Homepage Contacts</p>
                      <p className="text-2xl font-bold text-green-900">
                        {campaignAnalytics.sourceBreakdown.HOMEPAGE_CONTACT || 0}
                      </p>
                    </div>
                    <MousePointer className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Contact Page</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {campaignAnalytics.sourceBreakdown.CONTACT_PAGE || 0}
                      </p>
                    </div>
                    <Mail className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Recent Leads List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h4>
                <div className="space-y-3">
                  {campaignAnalytics.recentLeads.slice(0, 10).map((lead) => (
                    <div key={lead.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-gray-900">{lead.name}</h5>
                          <Badge 
                            className={lead.source === 'HOMEPAGE_CONTACT' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}
                            size="sm"
                          >
                            {lead.source === 'HOMEPAGE_CONTACT' ? 'Homepage' : 'Contact Page'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{lead.email}</p>
                        {lead.subject && (
                          <p className="text-sm font-medium text-gray-700 mb-1">Subject: {lead.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">{lead.message}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">{formatRelativeTime(lead.createdAt)}</p>
                        <Button variant="ghost" size="sm" className="mt-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {campaignAnalytics.recentLeads.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No recent leads from contact forms</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Failed to load campaign analytics</p>
            </div>
          )}
        </CardContent>
      </Card>


      </motion.div>
    </div>
  );
};

export default Campaigns;
