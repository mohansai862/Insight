/**
 * Tech Tammina CRM - Communication Module
 * Email threads, call logs, and messaging hub
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import CommunicationView from './CommunicationView';

import { can, getCurrentRole } from '@/utils/rbac';
import CallLogs from './CallLogs';
import CommunicationHub from './CommunicationHub';
import EmailThreads from './EmailThreads';

const CommunicationModule: React.FC = () => {
  const role = getCurrentRole();
  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => (
    can(role, 'Communication', action) ? children : <Navigate to="/crm/Dashboard" replace />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route
          path="/"
          element={(
            <Guard action="View">
              <CommunicationHub />
            </Guard>
          )}
        />
        <Route
          path=":id"
          element={(
            <Guard action="View">
              <CommunicationView />
            </Guard>
          )}
        />
        <Route
          path="/emails"
          element={(
            <Guard action="View">
              <EmailThreads />
            </Guard>
          )}
        />
        <Route
          path="/calls"
          element={(
            <Guard action="View">
              <CallLogs />
            </Guard>
          )}
        />

      </Routes>
    </motion.div>
  );
};

export default CommunicationModule;
