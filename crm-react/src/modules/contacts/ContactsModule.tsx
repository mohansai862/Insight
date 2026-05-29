/**
 * Tech Tammina CRM - Contacts Module
 * Complete contact management with CRUD operations
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { can, getCurrentRole } from '@/utils/rbac';
import ContactDetail from './ContactDetail';
import ContactForm from './ContactForm';
import ContactsList from './ContactsList';
import CEOContactsModule from '../ceo/CEOContactsModule';
import CEOContactDetail from '../ceo/CEOContactDetail';

const ContactsModule: React.FC = () => {
  const role = getCurrentRole();
  const location = useLocation();
  const navigate = useNavigate();
  
  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => (
    can(role, 'Contacts', action) ? children : <Navigate to="/crm/Dashboard" replace />
  );

  // CEO gets organization-wide contacts view with Sales VP filtering
  if (role === 'CEO') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes>
          <Route path="/" element={<CEOContactsModule />} />
          <Route path="/new" element={<Guard action="Create"><ContactForm /></Guard>} />
          <Route path="/:id" element={<Guard action="View"><ContactDetail /></Guard>} />
          <Route path="/:id/edit" element={<Guard action="Edit"><ContactForm /></Guard>} />
        </Routes>
      </motion.div>
    );
  }

  // Save current contacts route to localStorage
  React.useEffect(() => {
    localStorage.setItem('lastContactsRoute', location.pathname);
  }, [location.pathname]);

  // Restore last route when accessing contacts root
  React.useEffect(() => {
    if (location.pathname === '/crm/Contacts') {
      const lastRoute = localStorage.getItem('lastContactsRoute');
      if (lastRoute && lastRoute !== '/crm/Contacts' && lastRoute.startsWith('/crm/Contacts')) {
        navigate(lastRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route path="/" element={<ContactsList />} />
        <Route path="/new" element={<Guard action="Create"><ContactForm /></Guard>} />
        <Route path="/:id" element={<Guard action="View"><ContactDetail /></Guard>} />
        <Route path="/:id/edit" element={<Guard action="Edit"><ContactForm /></Guard>} />
      </Routes>
    </motion.div>
  );
};

export default ContactsModule;
