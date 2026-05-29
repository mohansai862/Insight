/**
 * Tech Tammina CRM - Marketing Module
 * Marketing automation with campaigns, segments, and journey builder
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { can, getCurrentRole } from '@/utils/rbac';
import Campaigns from './Campaigns';
import JourneyBuilder from './JourneyBuilder';
import MarketingDashboard from './MarketingDashboard';
import Segments from './Segments';

const MarketingModule: React.FC = () => {
  const role = getCurrentRole();
  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => (
    can(role, 'Marketing', action) ? children : <Navigate to="/crm/dashboard" replace />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route path="/" element={<Guard action="View"><MarketingDashboard /></Guard>} />
        <Route path="/campaigns" element={<Guard action="Edit"><Campaigns /></Guard>} />
        <Route path="/segments" element={<Guard action="Edit"><Segments /></Guard>} />
        <Route path="/journeys" element={<Guard action="Edit"><JourneyBuilder /></Guard>} />
      </Routes>
    </motion.div>
  );
};

export default MarketingModule;
