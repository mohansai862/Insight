import { logger } from '@/utils/logger';
/**
 * IT Admin Settings Component
 */
 
import React from 'react';
import { Users, Palette, Settings, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
 
interface ITAdminSettingsProps {
  options: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
}
 
const ITAdminSettings: React.FC<ITAdminSettingsProps> = ({ options }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users className="w-5 h-5" />;
      case 'palette': return <Palette className="w-5 h-5" />;
      case 'settings': return <Settings className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };
 
  const handleOptionClick = (key: string) => {
    logger.info(`IT Admin clicked: ${key}`);
    // TODO: Implement specific actions for each setting
  };
 
  // Filter out password-related options
  const filteredOptions = options.filter(option =>
    !option.key.toLowerCase().includes('password') &&
    !option.key.toLowerCase().includes('security')
  );
 
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">IT Admin Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user approvals and website appearance</p>
      </div>
 
      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">User Reassignment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transfer VP data when they leave</p>
              </div>
            </div>
            <Link to="/crm/Settings/data-reassignment">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
        </Card>
      </div>
 
      {/* Additional Settings */}
      {filteredOptions.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Settings</h3>
          {filteredOptions.map((option) => (
            <Card key={option.key} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                    {getIcon(option.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
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
      )}
    </div>
  );
};
 
export default ITAdminSettings;
 
 
