/**
 * Tech Tammina CRM - Sidebar Navigation
 * Collapsible sidebar with navigation items and active states
 */
 
import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  Megaphone,
  HeadphonesIcon,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  Building2,
  Sun,
  Moon,
  UserCheck,
} from 'lucide-react';
 
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { toggleSidebar } from '@/lib/slices/uiSlice';
import { toggleThemeMode } from '@/lib/slices/preferencesSlice';
import { cn } from '@/utils';
import logoUrl from '@/Tech Tammina logo.png';
import { canAccess, hrefToModuleKey, getCurrentRole } from '@/utils/rbac';
import { resetPaginationOnNavigation } from '@/utils/pagination';
 
const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.preferences);
  const previousPathRef = useRef<string>('');

  // Reset pagination when navigating between modules
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;
    
    if (previousPath && currentPath !== previousPath) {
      resetPaginationOnNavigation(currentPath, previousPath);
    }
    
    previousPathRef.current = currentPath;
  }, [location.pathname]);
 
  // Navigation items based on role. For IT_Admin show only the requested entries.
  const role = getCurrentRole();
  const navigationItems = ((): { name: string; href: string; icon: any; description: string }[] => {
    if (role === 'IT_Admin') {
      return [
        {
          name: 'Dashboard',
          href: '/crm/Dashboard',
          icon: LayoutDashboard,
          description: 'Admin dashboard',
        },
        {
          name: 'Team Management',
          href: '/crm/Team-Management',
          icon: Users,
          description: 'Org tree: VP → Managers → Executives → Leads',
        },
        {
          name: 'User Approvals',
          href: '/crm/User-Approvals',
          icon: UserCheck,
          description: 'Approve or reject user registrations',
        },
        {
          name: 'Security',
          href: '/crm/Security',
          icon: Shield,
          description: 'Security settings',
        },
      ];
    }
 
    // Default: all modules filtered by RBAC canAccess
    const allItems = [
      {
        name: 'Dashboard',
        href: '/crm/Dashboard',
        icon: LayoutDashboard,
        description: 'Sales overview and metrics',
      },
      {
        name: 'Leads',
        href: '/crm/Leads',
        icon: UserPlus,
        description: 'Lead management & scoring',
      },
      {
        name: 'Accounts',
        href: '/crm/Accounts',
        icon: Building2,
        description: 'Companies and organizations',
      },
      {
        name: 'Contacts',
        href: '/crm/Contacts',
        icon: Users,
        description: 'Customer contact management',
      },
      {
        name: 'Deals',
        href: '/crm/Deals',
        icon: TrendingUp,
        description: 'Sales pipeline & forecasting',
      },
      {
        name: 'Tasks',
        href: '/crm/Tasks',
        icon: CheckSquare,
        description: 'Sales activities & follow-ups',
      },
      {
        name: 'Lead Assignment',
        href: '/crm/Lead-Assignment',
        icon: UserCheck,
        description: 'Assign leads to executives',
      },
      {
        name: 'Notifications',
        href: '/crm/Notifications',
        icon: Bell,
        description: 'View your notifications',
      },
      {
        name: 'Communication',
        href: '/crm/Communication',
        icon: MessageSquare,
        description: 'Email & call management',
      },
      {
        name: 'Reports',
        href: '/crm/Reports',
        icon: BarChart3,
        description: 'Sales analytics & insights',
      },
    ];
 
    return allItems.filter((item) => {
      const role = getCurrentRole();
      const key = hrefToModuleKey(item.href);
      return key ? canAccess(role, key) : true;
    });
  })();
 
  const isActive = (href: string) => {
    if (href === '/crm/Dashboard') {
      return location.pathname === '/crm/Dashboard' || location.pathname === '/crm' || location.pathname === '/crm/';
    }
    if (href === '/crm/Contacts') {
      return location.pathname.startsWith('/crm/Contacts');
    }
    return location.pathname.startsWith(href);
  };
 
  return (
    <div className="fixed left-0 top-0 z-30 h-screen flex flex-col pointer-events-none">
      {/* Fixed Header with Logo */}
      <div className="w-56 h-20 bg-[#0d2a4a] dark:bg-[#0d2a4a] border-b border-[#1a3f6f] dark:border-[#1a3f6f] flex items-center justify-start px-2.5 flex-shrink-0 pointer-events-auto">
        <Link to="/crm/Dashboard" className="flex items-center">
          <img
            src={logoUrl}
            alt="Tech Tammina logo"
            className="w-48 h-20 object-contain select-none"
            draggable={false}
          />
        </Link>
      </div>
     
      {/* Collapsible Navigation Area */}
      <motion.aside
        className={cn(
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-1 overflow-hidden pointer-events-auto',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
        initial={false}
        animate={{
          width: sidebarCollapsed ? 64 : 224,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
 
      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navigationItems.map((item, index) => {
          // Add collapse button after Dashboard item
          const isDashboard = item.name === 'Dashboard';
          const showCollapseButton = isDashboard && !sidebarCollapsed;
          const Icon = item.icon;
          const active = isActive(item.href);
         
          return (
            <React.Fragment key={item.name}>
              {/* Expand button for collapsed state - show before Dashboard */}
              {isDashboard && sidebarCollapsed && (
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="w-full flex items-center justify-center p-2 mb-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <Link
                to={item.href}
                className={cn(
                  'group flex items-center px-2.5 py-2 text-sm font-medium rounded-lg transition-all duration-120 relative',
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                    layoutId="activeIndicator"
                    transition={{ duration: 0.2 }}
                  />
                )}
               
                <Icon
                  className={cn(
                    'flex-shrink-0 w-4 h-4 transition-colors preserve-icon-color',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                    sidebarCollapsed ? 'mx-auto' : 'mr-2'
                  )}
                />
               
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="truncate">{item.name}</div>
                      {showCollapseButton && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dispatch(toggleSidebar());
                          }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label="Collapse sidebar"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
               
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                    {item.name}
                  </div>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>
     
      {/* Bottom Controls */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!sidebarCollapsed ? (
          <div className="space-y-1">
            {/* Theme Toggle - Functional toggle switch when expanded */}
            <div className="w-full flex items-center justify-between px-2.5 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                {theme.mode === 'dark' ? (
                  <Sun className="w-4 h-4 mr-2 preserve-icon-color" />
                ) : (
                  <Moon className="w-4 h-4 mr-2 preserve-icon-color" />
                )}
                <span className="truncate">
                  {theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </div>
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(toggleThemeMode());
                }}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                  theme.mode === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    theme.mode === 'dark' ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
           
            {/* Settings Link */}
            <Link
              to="/crm/Settings"
              className={cn(
                'flex items-center px-2.5 py-2 text-sm font-medium rounded-lg transition-all duration-120 relative',
                isActive('/crm/Settings')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {/* Active indicator */}
              {isActive('/crm/Settings') && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                  layoutId="activeIndicator"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Settings className="w-4 h-4 mr-2 preserve-icon-color" />
              <span className="truncate">Settings</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Theme Toggle - Toggle switch when collapsed */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(toggleThemeMode());
              }}
              className="w-full flex items-center justify-center p-2 rounded-lg transition-colors group relative hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              title={theme.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {/* Toggle Switch */}
              <div className={cn(
                'relative inline-flex h-5 w-8 items-center rounded-full border-2 transition-colors',
                theme.mode === 'dark'
                  ? 'bg-primary-600 border-primary-500'
                  : 'bg-gray-300 border-gray-400'
              )}>
                <span
                  className={cn(
                    'inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform',
                    theme.mode === 'dark' ? 'translate-x-3' : 'translate-x-0.5'
                  )}
                />
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </div>
            </button>
           
            {/* Settings - Collapsed */}
            <Link
              to="/crm/Settings"
              className="w-full flex items-center justify-center p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              title="Settings"
            >
              <Settings className="w-4 h-4 preserve-icon-color" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                Settings
              </div>
            </Link>
          </div>
        )}
      </div>
      </motion.aside>
    </div>
  );
};
 
export default Sidebar;