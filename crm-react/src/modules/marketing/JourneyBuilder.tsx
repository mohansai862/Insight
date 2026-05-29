/**
 * Tech Tammina CRM - Journey Builder
 * Visual marketing automation journey builder
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Plus,
  Save,
  Settings,
  Mail,
  MessageSquare,
  Clock,
  Users,
  Target,
  Zap,
  GitBranch,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const JourneyBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mock journey data
  const journey = {
    id: '1',
    name: 'Welcome Series for New Customers',
    status: 'active',
    trigger: 'Customer signs up',
    totalContacts: 1247,
    activeContacts: 89,
    completedContacts: 1158,
    nodes: [
      {
        id: 'trigger',
        type: 'trigger',
        title: 'Customer Signs Up',
        description: 'New customer registration trigger',
        position: { x: 400, y: 50 },
        config: {
          event: 'user_signup',
          conditions: [],
        },
      },
      {
        id: 'wait-1',
        type: 'wait',
        title: 'Wait 1 Hour',
        description: 'Give customer time to explore',
        position: { x: 400, y: 150 },
        config: {
          duration: 1,
          unit: 'hours',
        },
      },
      {
        id: 'email-1',
        type: 'email',
        title: 'Welcome Email',
        description: 'Send welcome email with getting started guide',
        position: { x: 400, y: 250 },
        config: {
          template: 'welcome-email',
          subject: 'Welcome to Tech Tammina!',
          sendTime: 'immediate',
        },
        stats: {
          sent: 1247,
          delivered: 1223,
          opened: 734,
          clicked: 156,
        },
      },
      {
        id: 'wait-2',
        type: 'wait',
        title: 'Wait 3 Days',
        description: 'Wait for customer engagement',
        position: { x: 400, y: 350 },
        config: {
          duration: 3,
          unit: 'days',
        },
      },
      {
        id: 'condition-1',
        type: 'condition',
        title: 'Opened Welcome Email?',
        description: 'Check if customer opened the welcome email',
        position: { x: 400, y: 450 },
        config: {
          field: 'email_opened',
          operator: 'equals',
          value: true,
        },
      },
      {
        id: 'email-2a',
        type: 'email',
        title: 'Feature Highlight',
        description: 'Show key features (for engaged users)',
        position: { x: 250, y: 550 },
        config: {
          template: 'feature-highlight',
          subject: 'Discover powerful features',
          sendTime: 'immediate',
        },
        stats: {
          sent: 734,
          delivered: 720,
          opened: 432,
          clicked: 89,
        },
      },
      {
        id: 'email-2b',
        type: 'email',
        title: 'Re-engagement',
        description: 'Re-engage inactive users',
        position: { x: 550, y: 550 },
        config: {
          template: 're-engagement',
          subject: 'We miss you! Here\'s what you\'re missing',
          sendTime: 'immediate',
        },
        stats: {
          sent: 513,
          delivered: 498,
          opened: 124,
          clicked: 23,
        },
      },
      {
        id: 'wait-3',
        type: 'wait',
        title: 'Wait 1 Week',
        description: 'Give time for feature exploration',
        position: { x: 400, y: 650 },
        config: {
          duration: 1,
          unit: 'weeks',
        },
      },
      {
        id: 'email-3',
        type: 'email',
        title: 'Success Stories',
        description: 'Share customer success stories',
        position: { x: 400, y: 750 },
        config: {
          template: 'success-stories',
          subject: 'See how others are succeeding',
          sendTime: 'immediate',
        },
        stats: {
          sent: 1158,
          delivered: 1134,
          opened: 567,
          clicked: 134,
        },
      },
    ],
    connections: [
      { from: 'trigger', to: 'wait-1' },
      { from: 'wait-1', to: 'email-1' },
      { from: 'email-1', to: 'wait-2' },
      { from: 'wait-2', to: 'condition-1' },
      { from: 'condition-1', to: 'email-2a', condition: 'yes' },
      { from: 'condition-1', to: 'email-2b', condition: 'no' },
      { from: 'email-2a', to: 'wait-3' },
      { from: 'email-2b', to: 'wait-3' },
      { from: 'wait-3', to: 'email-3' },
    ],
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5" />;
      case 'wait':
        return <Clock className="w-5 h-5" />;
      case 'condition':
        return <GitBranch className="w-5 h-5" />;
      case 'action':
        return <Target className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300';
      case 'email':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      case 'sms':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300';
      case 'wait':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
      case 'condition':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300';
      case 'action':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300';
    }
  };

  const selectedNodeData = selectedNode 
    ? journey.nodes.find(n => n.id === selectedNode)
    : null;

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Journey Builder</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create automated marketing workflows</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" leftIcon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
            <Button variant="ghost" leftIcon={<Save className="w-4 h-4" />}>
              Save
            </Button>
            <Button variant="primary" leftIcon={<Play className="w-4 h-4" />}>
              Activate
            </Button>
          </div>
        </div>
      </div>

      {/* Journey Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: journey.totalContacts.toLocaleString(), icon: Users, color: 'bg-blue-500' },
          { label: 'Active', value: journey.activeContacts, icon: Play, color: 'bg-green-500' },
          { label: 'Completed', value: journey.completedContacts.toLocaleString(), icon: CheckCircle, color: 'bg-purple-500' },
          { label: 'Completion Rate', value: `${((journey.completedContacts / journey.totalContacts) * 100).toFixed(1)}%`, icon: Target, color: 'bg-orange-500' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="h-full"
          >
            <Card className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-glass border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-200">
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Journey Canvas */}
        <div className="xl:col-span-3">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-glass">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center flex-wrap gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  <GitBranch className="w-5 h-5" />
                  <span>{journey.name}</span>
                  <Badge className="bg-green-100 text-green-800" size="sm">
                    {journey.status}
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isEditing ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Add Step
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 min-h-[700px] overflow-auto">
                <div className="w-full max-w-5xl mx-auto">
                  {/* Journey Flow - Compact */}
                  <div className="flex flex-col items-center space-y-3">
                    
                    {/* Step 1: Trigger */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedNode('trigger')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'trigger' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'trigger' ? 'border-blue-500' : 'border-green-300 dark:border-green-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Customer Signs Up</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">New customer registration trigger</p>
                        </div>
                      </div>
                      <ArrowDown className="w-6 h-6 text-blue-500 mt-1" />
                    </div>

                    {/* Step 2: Wait 1 Hour */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedNode('wait-1')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'wait-1' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'wait-1' ? 'border-blue-500' : 'border-yellow-300 dark:border-yellow-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Wait 1 Hour</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Give customer time to explore</p>
                        </div>
                      </div>
                      <ArrowDown className="w-6 h-6 text-blue-500 mt-1" />
                    </div>

                    {/* Step 3: Welcome Email */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedNode('email-1')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'email-1' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-72 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'email-1' ? 'border-blue-500' : 'border-blue-300 dark:border-blue-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Welcome Email</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Send welcome email with getting started guide</p>
                          <div className="grid grid-cols-4 gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">1,247</div>
                              <div className="text-gray-500 dark:text-gray-400">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">734</div>
                              <div className="text-gray-500 dark:text-gray-400">Opened</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">156</div>
                              <div className="text-gray-500 dark:text-gray-400">Clicked</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600 dark:text-green-400">58.9%</div>
                              <div className="text-gray-500 dark:text-gray-400">Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ArrowDown className="w-6 h-6 text-blue-500 mt-1" />
                    </div>

                    {/* Step 4: Wait 3 Days */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedNode('wait-2')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'wait-2' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'wait-2' ? 'border-blue-500' : 'border-yellow-300 dark:border-yellow-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Wait 3 Days</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Wait for customer engagement</p>
                        </div>
                      </div>
                      <ArrowDown className="w-6 h-6 text-blue-500 mt-1" />
                    </div>

                    {/* Step 5: Condition */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedNode('condition-1')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'condition-1' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-72 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'condition-1' ? 'border-blue-500' : 'border-orange-300 dark:border-orange-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <GitBranch className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Opened Welcome Email?</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Check if customer opened the welcome email</p>
                        </div>
                      </div>
                      
                      {/* Branch Arrows */}
                      <div className="flex items-center justify-center space-x-24 mt-2">
                        <div className="flex flex-col items-center">
                          <ArrowDown className="w-6 h-6 text-green-500 mb-1" />
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">YES</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <ArrowDown className="w-6 h-6 text-red-500 mb-1" />
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">NO</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 6: Branch Emails */}
                    <div className="flex items-center justify-center space-x-12 mt-2">
                      {/* Feature Highlight Email */}
                      <div
                        onClick={() => setSelectedNode('email-2a')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'email-2a' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'email-2a' ? 'border-blue-500' : 'border-green-300 dark:border-green-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Feature Highlight</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Show key features (engaged users)</p>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">734</div>
                              <div className="text-gray-500 dark:text-gray-400">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600 dark:text-green-400">58.9%</div>
                              <div className="text-gray-500 dark:text-gray-400">Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Re-engagement Email */}
                      <div
                        onClick={() => setSelectedNode('email-2b')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'email-2b' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'email-2b' ? 'border-blue-500' : 'border-red-300 dark:border-red-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Re-engagement</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Re-engage inactive users</p>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">513</div>
                              <div className="text-gray-500 dark:text-gray-400">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-red-600 dark:text-red-400">24.2%</div>
                              <div className="text-gray-500 dark:text-gray-400">Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Merge Point */}
                    <div className="flex justify-center items-center mt-1">
                      <div className="flex items-center space-x-6">
                        <ArrowDown className="w-6 h-6 text-blue-500 transform rotate-12" />
                        <ArrowDown className="w-6 h-6 text-blue-500 transform -rotate-12" />
                      </div>
                    </div>

                    {/* Final Steps */}
                    <div className="flex flex-col items-center space-y-3 mt-2">
                      {/* Wait 1 Week */}
                      <div
                        onClick={() => setSelectedNode('wait-3')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'wait-3' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-64 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'wait-3' ? 'border-blue-500' : 'border-yellow-300 dark:border-yellow-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Wait 1 Week</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Give time for feature exploration</p>
                        </div>
                      </div>

                      <ArrowDown className="w-6 h-6 text-blue-500 mt-1" />

                      {/* Success Stories Email */}
                      <div
                        onClick={() => setSelectedNode('email-3')}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedNode === 'email-3' ? 'scale-105 shadow-lg' : 'hover:scale-102'
                        }`}
                      >
                        <div className={`w-72 p-4 rounded-lg border-2 bg-white dark:bg-gray-700 shadow-md ${
                          selectedNode === 'email-3' ? 'border-blue-500' : 'border-purple-300 dark:border-purple-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Success Stories</h4>
                            </div>
                            {isEditing && <Button variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Share customer success stories</p>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">1,158</div>
                              <div className="text-gray-500 dark:text-gray-400">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-purple-600 dark:text-purple-400">49.0%</div>
                              <div className="text-gray-500 dark:text-gray-400">Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add Step Button */}
                {isEditing && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="primary"
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="shadow-lg"
                    >
                      Add Step
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Node Details Panel */}
        <div>
          {selectedNodeData ? (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  {getNodeIcon(selectedNodeData.type)}
                  <span>Step Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{selectedNodeData.title}</h4>
                  <p className="text-sm text-gray-600">{selectedNodeData.description}</p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Configuration</h5>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedNodeData.config).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedNodeData.stats && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Performance</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sent:</span>
                        <span className="font-medium">{selectedNodeData.stats.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivered:</span>
                        <span className="font-medium">{selectedNodeData.stats.delivered.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Opened:</span>
                        <span className="font-medium">{selectedNodeData.stats.opened.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clicked:</span>
                        <span className="font-medium">{selectedNodeData.stats.clicked.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Rate:</span>
                        <span className="font-medium">
                          {((selectedNodeData.stats.opened / selectedNodeData.stats.sent) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Click Rate:</span>
                        <span className="font-medium">
                          {((selectedNodeData.stats.clicked / selectedNodeData.stats.opened) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <Button variant="primary" className="w-full" leftIcon={<Edit className="w-4 h-4" />}>
                    Edit Step
                  </Button>
                  <Button variant="ghost" className="w-full" leftIcon={<Plus className="w-4 h-4" />}>
                    Add After
                  </Button>
                  <Button variant="ghost" className="w-full text-red-600" leftIcon={<Trash2 className="w-4 h-4" />}>
                    Delete Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit bg-white/70 dark:bg-gray-800/70 backdrop-blur-glass">
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Select a step
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    Click on any step in the journey to view its details, configuration, and performance metrics
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

export default JourneyBuilder;
