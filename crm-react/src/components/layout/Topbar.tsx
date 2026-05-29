/**
 * Tech Tammina CRM - Top Navigation Bar
 * Global search, notifications, and user menu
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { useAppSelector, useAppDispatch } from '@/lib/store';
// Removed setCommandPaletteOpen import - search functionality removed
import { toggleThemeMode } from '@/lib/slices/preferencesSlice';
import { useCurrentProfile } from '@/hooks/useApi';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { cn } from '@/utils';
import logoUrl from '@/Tech Tammina logo.png';
import { filterManager } from '@/utils/filterManager';
import { getRoleDisplayName } from '@/utils/roleDisplay';

const Topbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.preferences);
  
  // Get current user profile with full name
  const { data: profileData } = useCurrentProfile();
  const profile = profileData?.data;
  
  // Use full name from profile API (first + middle + last)
  const displayName = profile?.fullName || user?.name || 'User';
  const userEmail = profile?.email || user?.email || 'user@example.com';
  const userRole = profile?.role || user?.role || 'User';
  
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();
  


  // Removed handleGlobalSearch function - search functionality removed



  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 right-0 z-50 h-20 bg-[#0d2a4a] dark:bg-[#0d2a4a] border-b border-[#1a3f6f] dark:border-[#1a3f6f] left-56">
      <div className="flex items-center justify-end h-full pl-2 pr-6">
        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Notifications - Hidden for IT Admin */}
          {userRole?.toLowerCase() !== 'it_admin' && userRole?.toLowerCase() !== 'ceo' && (
            <button
              onClick={() => navigate('/crm/Notifications')}
              className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 preserve-icon-color" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center space-x-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Avatar
                src={profile?.avatarUrl || user?.avatar}
                name={displayName}
                size="sm"
              />
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-large border border-gray-200 dark:border-gray-700 py-2 z-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={profile?.avatarUrl || user?.avatar}
                        name={displayName}
                        size="lg"
                        showStatus
                        status="online"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={displayName}>
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={userEmail}>
                          {userEmail}
                        </p>
                        <div className="flex flex-col space-y-1 mt-1">
                          <Badge variant="primary" size="sm">
                            {getRoleDisplayName(userRole)}
                          </Badge>
                          {profile?.managerName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Reports to: {profile.managerName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {[
                      { icon: User, label: 'Profile', action: () => {
                        setShowUserMenu(false);
                        navigate && navigate('/crm/Profile');
                      } },
                      { icon: LogOut, label: 'Sign out', action: () => {
                        setShowUserMenu(false);
                        setShowSignOutConfirm(true);
                      } },
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal isOpen={showSignOutConfirm} onClose={() => setShowSignOutConfirm(false)} title="Sign out" size="sm">
        <ModalContent className="py-2">
          <p className="text-gray-700 mb-2">Are you sure you want to sign out?</p>
        </ModalContent>
        <ModalFooter className="pt-2">
          <Button variant="ghost" className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => setShowSignOutConfirm(false)}>Cancel</Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              try {
                // Clear all form data for all users before logout
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith('taskForm_') || key.startsWith('contactFormDraft_') || key.startsWith('dealFormDraft_')) {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                    delete (window as any)[`taskFormBackup_${key}`];
                  }
                });
                
                // Clear all module filters on logout
                filterManager.clearAllFilters();
                
                localStorage.removeItem('tech_tammina_session');
                localStorage.removeItem('tech_tammina_authenticated');
                localStorage.removeItem('tech_tammina_welcome_shown');
              } catch {}
              window.location.href = '/login';
            }}
          >
            Sign out
          </Button>
        </ModalFooter>
      </Modal>
    </header>
  );
};

export default Topbar;