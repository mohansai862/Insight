/**
 * Tech Tammina CRM - Communication Templates
 * Email and message templates management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  Mail,
  MessageSquare,
  Phone,
  Star,
  Filter,
  Eye,
  Send,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils';

const Templates: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'email' | 'sms' | 'call'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Mock templates data
  const templates = [
    {
      id: '1',
      name: 'Welcome Email',
      category: 'email',
      type: 'Email',
      subject: 'Welcome to Tech Tammina!',
      content: `Hi {{firstName}},

Welcome to Tech Tammina! We're excited to have you on board.

Here's what you can expect:
• Personalized onboarding experience
• 24/7 customer support
• Access to our comprehensive knowledge base

If you have any questions, don't hesitate to reach out to our support team.

Best regards,
The Tech Tammina Team`,
      variables: ['firstName', 'companyName'],
      tags: ['onboarding', 'welcome'],
      isStarred: true,
      usageCount: 45,
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
      id: '2',
      name: 'Follow-up After Demo',
      category: 'email',
      type: 'Email',
      subject: 'Thank you for your time - Next steps',
      content: `Hi {{firstName}},

Thank you for taking the time to see our product demo today. I hope you found it valuable and informative.

As discussed, here are the next steps:
1. {{nextStep1}}
2. {{nextStep2}}
3. {{nextStep3}}

I've attached the pricing information and implementation timeline we discussed.

Please let me know if you have any questions or if you'd like to schedule a follow-up call.

Best regards,
{{senderName}}`,
      variables: ['firstName', 'nextStep1', 'nextStep2', 'nextStep3', 'senderName'],
      tags: ['demo', 'follow-up', 'sales'],
      isStarred: false,
      usageCount: 32,
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 1296000000).toISOString(),
    },
    {
      id: '3',
      name: 'Appointment Reminder',
      category: 'sms',
      type: 'SMS',
      subject: '',
      content: `Hi {{firstName}}, this is a reminder about your appointment with {{companyName}} tomorrow at {{appointmentTime}}. Please reply CONFIRM to confirm or RESCHEDULE if you need to change the time.`,
      variables: ['firstName', 'companyName', 'appointmentTime'],
      tags: ['reminder', 'appointment'],
      isStarred: true,
      usageCount: 78,
      lastUsed: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 1728000000).toISOString(),
    },
    {
      id: '4',
      name: 'Contract Renewal Notice',
      category: 'email',
      type: 'Email',
      subject: 'Your contract renewal is coming up',
      content: `Dear {{firstName}},

I hope this email finds you well. I wanted to reach out regarding your contract with {{companyName}}, which is set to expire on {{expirationDate}}.

We've been thrilled to work with {{customerCompany}} over the past year and would love to continue our partnership.

Here's what's new in our renewed offering:
• {{newFeature1}}
• {{newFeature2}}
• {{newFeature3}}

I'd love to schedule a call to discuss your renewal options and answer any questions you might have.

Best regards,
{{senderName}}`,
      variables: ['firstName', 'companyName', 'expirationDate', 'customerCompany', 'newFeature1', 'newFeature2', 'newFeature3', 'senderName'],
      tags: ['renewal', 'contract', 'retention'],
      isStarred: false,
      usageCount: 23,
      lastUsed: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 2160000000).toISOString(),
    },
    {
      id: '5',
      name: 'Cold Call Script',
      category: 'call',
      type: 'Call Script',
      subject: '',
      content: `Hi {{firstName}}, this is {{senderName}} from {{companyName}}.

I hope I'm not catching you at a bad time. I'm reaching out because I noticed that {{customerCompany}} might benefit from our {{productName}} solution.

We've helped companies like {{similarCompany}} achieve {{benefit}} in just {{timeframe}}.

I'd love to share how we might be able to help {{customerCompany}} as well. Do you have 2 minutes for me to tell you more, or would you prefer I send you some information via email?

[Wait for response]

If interested: Great! Let me tell you about...
If not interested: I understand. Would it be helpful if I sent you a brief overview via email that you could review when convenient?`,
      variables: ['firstName', 'senderName', 'companyName', 'customerCompany', 'productName', 'similarCompany', 'benefit', 'timeframe'],
      tags: ['cold-call', 'prospecting', 'sales'],
      isStarred: false,
      usageCount: 15,
      lastUsed: new Date(Date.now() - 259200000).toISOString(),
      createdAt: new Date(Date.now() - 1555200000).toISOString(),
    },
  ];

  const getTypeIcon = (category: string) => {
    switch (category) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (category: string) => {
    switch (category) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'call':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const selectedTemplateData = selectedTemplate 
    ? templates.find(t => t.id === selectedTemplate)
    : null;

  const templateStats = {
    total: templates.length,
    email: templates.filter(t => t.category === 'email').length,
    sms: templates.filter(t => t.category === 'sms').length,
    call: templates.filter(t => t.category === 'call').length,
    starred: templates.filter(t => t.isStarred).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication Templates</h2>
          <p className="text-gray-600 mt-1">Manage email, SMS, and call script templates</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{templateStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-xl font-bold text-gray-900">{templateStats.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">SMS</p>
                <p className="text-xl font-bold text-gray-900">{templateStats.sms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Call Scripts</p>
                <p className="text-xl font-bold text-gray-900">{templateStats.call}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Starred</p>
                <p className="text-xl font-bold text-gray-900">{templateStats.starred}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="space-y-4">
                <CardTitle>Templates</CardTitle>
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="call">Call Scripts</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTemplate === template.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate flex-1">
                        {template.name}
                      </h4>
                      {template.isStarred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current ml-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getTypeColor(template.category)} size="sm">
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(template.category)}
                          <span>{template.type}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {template.subject || template.content.substring(0, 50) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Used {template.usageCount} times</span>
                      <span>{formatRelativeTime(template.lastUsed)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="default" size="xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge variant="default" size="xs">
                          +{template.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-2">
          {selectedTemplateData ? (
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getTypeIcon(selectedTemplateData.category)}
                      <span>{selectedTemplateData.name}</span>
                      {selectedTemplateData.isStarred && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTemplateData.type} • Used {selectedTemplateData.usageCount} times
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                      Preview
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Copy className="w-4 h-4" />}>
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTemplateData.subject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{selectedTemplateData.subject}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                      {selectedTemplateData.content}
                    </pre>
                  </div>
                </div>
                
                {selectedTemplateData.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplateData.variables.map((variable, index) => (
                        <Badge key={index} variant="default" size="sm">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplateData.tags.map((tag, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Created: {formatRelativeTime(selectedTemplateData.createdAt)}</p>
                    <p>Last used: {formatRelativeTime(selectedTemplateData.lastUsed)}</p>
                  </div>
                  <Button variant="primary" leftIcon={<Send className="w-4 h-4" />}>
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a template
                  </h3>
                  <p className="text-gray-600">
                    Choose a template from the list to view its content and details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Templates;
