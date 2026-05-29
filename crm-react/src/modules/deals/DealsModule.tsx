/**
 * Tech Tammina CRM - Deals Module
 * Sales pipeline with Kanban board and deal management
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { can, getCurrentRole } from '@/utils/rbac';
import DealDetail from './DealDetail';
import DealForm from './DealForm';
import DealsKanban from './DealsKanban';
import CEODealsModule from '../ceo/CEODealsModule';

const DealsModule: React.FC = () => {
  const role = getCurrentRole() || 'Sales_Manager'; // Default to Sales_Manager if no role set
  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => (
    can(role, 'Deals', action) ? children : <Navigate to="/crm/Dashboard" replace />
  );

  // CEO gets organization-wide deals view with Sales VP filtering
  if (role === 'CEO') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes>
          <Route path="/" element={<CEODealsModule />} />
          <Route path="/new" element={<Guard action="Create"><DealForm /></Guard>} />
          <Route path="/:id" element={<Guard action="View"><DealDetail /></Guard>} />
          <Route path="/:id/edit" element={<Guard action="Edit"><DealForm /></Guard>} />
        </Routes>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route path="/" element={<Guard action="View"><DealsKanban /></Guard>} />
        <Route path="/new" element={<Guard action="Create"><DealForm /></Guard>} />
        <Route path="/:id" element={<Guard action="View"><DealDetail /></Guard>} />
        <Route path="/:id/edit" element={<Guard action="Edit"><DealForm /></Guard>} />
      </Routes>
    </motion.div>
  );
};

export default DealsModule;
