/**
 * Tech Tammina CRM - Integrations Module
 * Third-party integrations and connections
 */

import { motion } from 'framer-motion';
import { Check, ExternalLink, Filter, Plus, Search, Settings } from 'lucide-react';
import React from 'react';
import { Navigate } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { can, getCurrentRole } from '@/utils/rbac';

const IntegrationsModule: React.FC = () => {
  const role = getCurrentRole();
  if (!can(role, 'integrations', 'view')) {
    return <Navigate to="/crm/dashboard" replace />;
  }
  const integrations = [
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync emails, calendar, and contacts with Google Workspace',
      category: 'Email & Calendar',
      logo: '🔗',
      connected: true,
      popular: true,
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Connect with Outlook for email and calendar synchronization',
      category: 'Email & Calendar',
      logo: '📧',
      connected: false,
      popular: true,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get CRM notifications and updates in your Slack channels',
      category: 'Communication',
      logo: '💬',
      connected: true,
      popular: true,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Sync payment data and customer information from Stripe',
      category: 'Payments',
      logo: '💳',
      connected: false,
      popular: true,
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with 5000+ apps through Zapier automation',
      category: 'Automation',
      logo: '⚡',
      connected: false,
      popular: true,
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Send SMS and make calls directly from the CRM',
      category: 'Communication',
      logo: '📱',
      connected: false,
      popular: false,
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Sync contacts and track email campaign performance',
      category: 'Marketing',
      logo: '📮',
      connected: false,
      popular: false,
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Import data and sync with HubSpot CRM',
      category: 'CRM',
      logo: '🔄',
      connected: false,
      popular: false,
    },
  ];

  const categories = ['All', 'Email & Calendar', 'Communication', 'Payments', 'Marketing', 'Automation', 'CRM'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect with your favorite tools and services
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={<ExternalLink className="w-4 h-4" />}>
            Browse All
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Request Integration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Popular</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.popular).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-orange-600">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full hover-lift">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      {integration.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="default" size="sm">
                          {integration.category}
                        </Badge>
                        {integration.popular && (
                          <Badge variant="warning" size="sm">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {integration.connected && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-6">
                  {integration.description}
                </p>
                <div className="flex items-center justify-between">
                  <Button
                    variant={integration.connected ? 'ghost' : 'primary'}
                    size="sm"
                    fullWidth
                  >
                    {integration.connected ? 'Configure' : 'Connect'}
                  </Button>
                  {integration.connected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or category filter
              </p>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Request Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.filter(i => i.popular).slice(0, 4).map((integration) => (
              <button
                key={integration.id}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-2xl shadow-sm">
                  {integration.logo}
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {integration.name}
                </span>
                {integration.connected && (
                  <Badge variant="success" size="sm" className="mt-2">
                    Connected
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IntegrationsModule;
