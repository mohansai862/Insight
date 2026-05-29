/**
 * Tech Tammina CRM - Customer Segments
 * Customer segmentation and audience management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Copy,
  Trash2,
  Target,
  TrendingUp,
  Mail,
  Settings,
  Eye,
  Play,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils';

const Segments: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Mock segments data
  const segments = [
    {
      id: '1',
      name: 'Enterprise Customers',
      description: 'Large companies with 500+ employees and high-value contracts',
      size: 89,
      growth: '+12%',
      criteria: [
        { field: 'Company Size', operator: 'greater than', value: '500 employees' },
        { field: 'Contract Value', operator: 'greater than', value: '$50,000' },
        { field: 'Industry', operator: 'in', value: 'Technology, Finance' },
      ],
      engagement: {
        emailOpenRate: 45.2,
        clickRate: 8.7,
        conversionRate: 12.4,
        avgOrderValue: 75000,
      },
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      campaigns: 5,
      tags: ['high-value', 'enterprise', 'b2b'],
      status: 'active',
    },
    {
      id: '2',
      name: 'SMB Prospects',
      description: 'Small to medium businesses showing interest in our solutions',
      size: 156,
      growth: '+8%',
      criteria: [
        { field: 'Company Size', operator: 'between', value: '10-500 employees' },
        { field: 'Lead Score', operator: 'greater than', value: '70' },
        { field: 'Last Activity', operator: 'within', value: '30 days' },
      ],
      engagement: {
        emailOpenRate: 38.5,
        clickRate: 6.2,
        conversionRate: 8.7,
        avgOrderValue: 25000,
      },
      lastUpdated: new Date(Date.now() - 172800000).toISOString(),
      campaigns: 8,
      tags: ['smb', 'prospects', 'qualified'],
      status: 'active',
    },
    {
      id: '3',
      name: 'Free Trial Users',
      description: 'Users currently on free trial, high conversion potential',
      size: 234,
      growth: '+23%',
      criteria: [
        { field: 'Account Type', operator: 'equals', value: 'Free Trial' },
        { field: 'Trial Days Remaining', operator: 'less than', value: '7 days' },
        { field: 'Feature Usage', operator: 'greater than', value: '50%' },
      ],
      engagement: {
        emailOpenRate: 52.1,
        clickRate: 12.3,
        conversionRate: 15.2,
        avgOrderValue: 12000,
      },
      lastUpdated: new Date(Date.now() - 3600000).toISOString(),
      campaigns: 3,
      tags: ['trial', 'conversion', 'nurture'],
      status: 'active',
    },
    {
      id: '4',
      name: 'Newsletter Subscribers',
      description: 'Engaged subscribers who regularly open our newsletters',
      size: 1247,
      growth: '+5%',
      criteria: [
        { field: 'Subscription Status', operator: 'equals', value: 'Active' },
        { field: 'Email Opens', operator: 'greater than', value: '5 in last 30 days' },
        { field: 'Unsubscribe', operator: 'equals', value: 'False' },
      ],
      engagement: {
        emailOpenRate: 42.8,
        clickRate: 4.1,
        conversionRate: 5.3,
        avgOrderValue: 8500,
      },
      lastUpdated: new Date(Date.now() - 259200000).toISOString(),
      campaigns: 12,
      tags: ['newsletter', 'engaged', 'nurture'],
      status: 'active',
    },
    {
      id: '5',
      name: 'Churned Customers',
      description: 'Previous customers who cancelled their subscription',
      size: 67,
      growth: '-15%',
      criteria: [
        { field: 'Account Status', operator: 'equals', value: 'Cancelled' },
        { field: 'Cancellation Date', operator: 'within', value: '90 days' },
        { field: 'Previous Value', operator: 'greater than', value: '$1,000' },
      ],
      engagement: {
        emailOpenRate: 28.3,
        clickRate: 3.2,
        conversionRate: 2.1,
        avgOrderValue: 15000,
      },
      lastUpdated: new Date(Date.now() - 432000000).toISOString(),
      campaigns: 2,
      tags: ['churn', 'win-back', 'retention'],
      status: 'paused',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGrowthColor = (growth: string) => {
    return growth.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSegmentData = selectedSegment 
    ? segments.find(s => s.id === selectedSegment)
    : null;

  const segmentStats = {
    total: segments.length,
    active: segments.filter(s => s.status === 'active').length,
    totalSize: segments.reduce((sum, s) => sum + s.size, 0),
    avgEngagement: segments.reduce((sum, s) => sum + s.engagement.emailOpenRate, 0) / segments.length,
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Segments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage customer segments for targeted campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              New Segment
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Segments', value: segmentStats.total, icon: Users, color: 'bg-blue-500' },
          { label: 'Active', value: segmentStats.active, icon: Target, color: 'bg-green-500' },
          { label: 'Total Contacts', value: segmentStats.totalSize.toLocaleString(), icon: BarChart3, color: 'bg-purple-500' },
          { label: 'Avg Open Rate', value: `${segmentStats.avgEngagement.toFixed(1)}%`, icon: Mail, color: 'bg-orange-500' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  </div>
                  <div className={`w-5 h-5 ${stat.color} rounded flex items-center justify-center flex-shrink-0 ml-4`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Segments List */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Segments ({filteredSegments.length})</CardTitle>
                <div className="flex justify-end">
                  <Input
                    placeholder="Search segments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSegments.map((segment, index) => (
                  <motion.div
                    key={segment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedSegment(segment.id)}
                    className={`p-6 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md ${
                      selectedSegment === segment.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center flex-wrap gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{segment.name}</h3>
                          <Badge className={getStatusColor(segment.status)} size="sm">
                            {segment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{segment.description}</p>
                        <div className="flex flex-wrap gap-2 items-start mt-3">
                          {segment.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="default" size="sm" className="px-2 py-1 text-xs font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Size</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {segment.size.toLocaleString()}
                        </p>
                        <p className={`text-xs font-medium ${getGrowthColor(segment.growth)}`}>
                          {segment.growth}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Open Rate</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {segment.engagement.emailOpenRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conversion</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {segment.engagement.conversionRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Campaigns</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {segment.campaigns}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredSegments.length === 0 && (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No segments found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      {searchQuery 
                        ? 'Try adjusting your search criteria or create a new segment'
                        : 'Create your first customer segment to start organizing your audience for targeted campaigns'
                      }
                    </p>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                      Create First Segment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Details */}
        <div>
          {selectedSegmentData ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <Users className="w-5 h-5" />
                  <span>Segment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedSegmentData.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedSegmentData.description}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedSegmentData.status)} size="sm">
                      {selectedSegmentData.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Updated {formatRelativeTime(selectedSegmentData.lastUpdated)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Segment Criteria</h4>
                  <div className="space-y-2">
                    {selectedSegmentData.criteria.map((criterion, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium">{criterion.field}</span>
                        <span className="text-gray-600 mx-2">{criterion.operator}</span>
                        <span className="text-blue-600">{criterion.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Engagement Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Open Rate</span>
                      <span className="font-semibold">{selectedSegmentData.engagement.emailOpenRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Click Rate</span>
                      <span className="font-semibold">{selectedSegmentData.engagement.clickRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-semibold">{selectedSegmentData.engagement.conversionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg Order Value</span>
                      <span className="font-semibold">${selectedSegmentData.engagement.avgOrderValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSegmentData.tags.map((tag, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Button variant="primary" className="w-full" leftIcon={<Mail className="w-4 h-4" />}>
                    Create Campaign
                  </Button>
                  <Button variant="ghost" className="w-full" leftIcon={<Copy className="w-4 h-4" />}>
                    Duplicate Segment
                  </Button>
                  <Button variant="ghost" className="w-full" leftIcon={<Settings className="w-4 h-4" />}>
                    Edit Criteria
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Select a segment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    Choose a segment from the list to view its details, criteria, and engagement metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default Segments;
