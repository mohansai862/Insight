/**
 * Tech Tammina CRM - App Shell Layout
 * Main layout with sidebar, topbar, and content area
 */

import React from 'react';
import { motion } from 'framer-motion';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppSelector } from '@/lib/store';
// Removed CommandPalette import - global search functionality removed

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { sidebarCollapsed } = useAppSelector(state => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar />
        
        {/* Page Content */}
        <main 
          className={`flex-1 transition-all duration-300 pt-16 overflow-y-auto ${
            sidebarCollapsed ? 'ml-16' : 'ml-56'
          }`}
        >
          <motion.div
            className="min-h-[calc(100vh-4rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Removed CommandPalette - global search functionality removed */}
    </div>
  );
};

export default AppShell;