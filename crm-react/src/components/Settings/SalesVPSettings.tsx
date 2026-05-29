import { logger } from '@/utils/logger';
/**
 * Sales VP Settings Component
 */

import React from 'react';
import { Users, Settings, TrendingUp, Lock, UserX } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SalesVPSettingsProps {
  options: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
}

const SalesVPSettings: React.FC<SalesVPSettingsProps> = ({ options }) => {
  // Filter out system-wide settings for Sales VP
  const filteredOptions = options.filter(option => 
    option.key !== 'analytics_access' && 
    option.key !== 'user_roles' && 
    option.key !== 'system_settings'
  );
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users className="w-5 h-5" />;
      case 'settings': return <Settings className="w-5 h-5" />;
      case 'chart-line': return <TrendingUp className="w-5 h-5" />;
      case 'lock': return <Lock className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
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
        <h2 className="text-2xl font-bold text-gray-900">Sales VP Settings</h2>
        <p className="text-gray-600 mt-1">Manage organization-wide settings and permissions</p>
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
        
        {/* Data Reassignment Card - Only for Sales VP */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">User Reassignment</h3>
                <p className="text-sm text-gray-600">Transfer manager data when they leave</p>
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
      </div>
    </div>
  );
};

export default SalesVPSettings;
