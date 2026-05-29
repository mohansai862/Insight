/**
 * Tech Tammina CRM - Support Module
 * Customer support and ticket management placeholder
 */

import { motion } from 'framer-motion';
import { Clock, Filter, HeadphonesIcon, Plus, Search } from 'lucide-react';
import React from 'react';
import { Navigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { can, getCurrentRole } from '@/utils/rbac';

const SupportModule: React.FC = () => {
  const role = getCurrentRole();
  if (!can(role, 'support', 'view')) {
    return <Navigate to="/crm/dashboard" replace />;
  }
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
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">
            Customer support and ticket management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={<Clock className="w-4 h-4" />}>
            SLA Status
          </Button>
          <Button variant="ghost" leftIcon={<Search className="w-4 h-4" />}>
            Search
          </Button>
          <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Ticket
          </Button>
        </div>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <HeadphonesIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Support Center Coming Soon
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Comprehensive customer support with ticket management, SLA tracking, 
              and knowledge base integration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                'Ticket Management',
                'SLA Tracking',
                'Knowledge Base',
                'Customer Portal',
                'Team Collaboration',
                'Performance Analytics',
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SupportModule;
