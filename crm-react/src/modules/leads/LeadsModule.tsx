/**
 * Tech Tammina CRM - Leads Module
 * Lead management with list view, filters, and CRUD operations
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { can, getCurrentRole } from '@/utils/rbac';
import ConvertLead from './ConvertLead';
import LeadDetail from './LeadDetail';
import LeadForm from './LeadForm';
import LeadsManagement from './LeadsManagement';
import CEOLeadsModule from '../ceo/CEOLeadsModule';

const LeadsModule: React.FC = () => {
  const role = getCurrentRole();

  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => {
    return can(role, 'Leads', action) ? children : <Navigate to="/crm/Dashboard" replace />;
  };

  // CEO gets organization-wide leads view with Sales VP filtering
  if (role === 'CEO') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes>
          <Route path="/" element={<CEOLeadsModule />} />
          <Route path="/new" element={<Guard action="Create"><LeadForm /></Guard>} />
          <Route path="/:id" element={<Guard action="View"><LeadDetail /></Guard>} />
          <Route path="/:id/edit" element={<Guard action="Edit"><LeadForm /></Guard>} />
          <Route path="/:id/convert" element={<Guard action="Convert_Lead"><ConvertLead /></Guard>} />
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
        <Route path="/" element={<LeadsManagement />} />
        <Route path="/new" element={<Guard action="Create"><LeadForm /></Guard>} />
        <Route path="/:id" element={<Guard action="View"><LeadDetail /></Guard>} />
        <Route path="/:id/edit" element={<Guard action="Edit"><LeadForm /></Guard>} />
        <Route path="/:id/convert" element={<Guard action="Convert_Lead"><ConvertLead /></Guard>} />
      </Routes>
    </motion.div>
  );
};

export default LeadsModule;
