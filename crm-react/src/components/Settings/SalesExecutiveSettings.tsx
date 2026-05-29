import { logger } from '@/utils/logger';
/**
 * Sales Executive Settings Component
 */

import React from 'react';
import { User, Bell, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SalesExecutiveSettingsProps {
  options: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
}

const SalesExecutiveSettings: React.FC<SalesExecutiveSettingsProps> = ({ options }) => {
  // Filter out system-wide settings for Sales Executive
  const filteredOptions = options.filter(option => 
    option.key !== 'personal_details'
  );
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'user': return <User className="w-5 h-5" />;
      case 'bell': return <Bell className="w-5 h-5" />;
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
        <h2 className="text-2xl font-bold text-gray-900">Sales Executive Settings</h2>
        <p className="text-gray-600 mt-1">Manage your personal settings and preferences</p>
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
      </div>
    </div>
  );
};

export default SalesExecutiveSettings;
