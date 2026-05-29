import { logger } from '@/utils/logger';
/**
 * Sales Manager Settings Component
 */

import React from 'react';
import { BarChart3, Bell, User, Lock, UserX } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { can, getCurrentRole } from '@/utils/rbac';

interface SalesManagerSettingsProps {
  options: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
}

const SalesManagerSettings: React.FC<SalesManagerSettingsProps> = ({ options }) => {
  // Filter out system-wide settings for Sales Manager
  const filteredOptions = options.filter(option => 
    option.key !== 'analytics_access' && 
    option.key !== 'team_reports' && 
    option.key !== 'profile'
  );
  const role = getCurrentRole();
  const canView = can(role, 'Settings', 'View');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'chart-bar': return <BarChart3 className="w-5 h-5" />;
      case 'bell': return <Bell className="w-5 h-5" />;
      case 'user': return <User className="w-5 h-5" />;
      case 'lock': return <Lock className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const handleOptionClick = (key: string) => {
    switch (key) {
      case 'change_password':
        window.location.href = '/crm/Settings/security';
        break;
      default:
        logger.info(`Configure ${key}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Manager Settings</h2>
        <p className="text-gray-600 mt-1">Manage team settings and your profile</p>
      </div>

      <div className="grid gap-4">
        {filteredOptions.map((option) => (
          <Card key={option.key} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                  {getIcon(option.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOptionClick(option.key)}
                disabled={!option.enabled}
              >
                Configure
              </Button>
            </div>
          </Card>
        ))}
        

        
        {/* Data Reassignment Card - Only for Sales Manager */}
        {canView && role?.toLowerCase() === 'sales_manager' && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">User Reassignment</h3>
                  <p className="text-sm text-gray-600">Transfer executive data when they leave</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/crm/Settings/data-reassignment'}
              >
                Manage
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SalesManagerSettings;
