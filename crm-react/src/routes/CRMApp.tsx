import { logger } from '@/utils/logger';
 /**
 * Tech Tammina CRM - Sales-Focused CRM Application
 * App shell with sales-only modules and routing
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/modules/dashboard/Dashboard';
import LeadsModule from '@/modules/leads/LeadsModule';
import ContactsModule from '@/modules/contacts/ContactsModule';
import DealsModule from '@/modules/deals/DealsModule';
import TasksModule from '@/modules/tasks/TasksModule';
import CommunicationModule from '@/modules/communication/CommunicationModule';
import LogsModule from '@/modules/logs/LogsModule';
import MarketingModule from '@/modules/marketing/MarketingModule';
import ReportsModule from '@/modules/reports/ReportsModule';
import TeamManagersPage from '@/modules/team/TeamManagersPage';
import TeamManagementPage from '@/modules/team/TeamManagementPage';
import AccountsModule from '@/modules/accounts/AccountsModule';
import CEOContactDetail from '@/modules/ceo/CEOContactDetail';
import CEOLeadDetail from '@/modules/ceo/CEOLeadDetail';

import TeamExecutivesModule from '@/modules/TeamExecutivesModule';
import LeadAssignment from '@/modules/lead-assignment/LeadAssignment';
import Notifications from '@/modules/notifications/Notifications';
import RequireAccess from '@/components/auth/RequireAccess';
import SettingsModule, { ProfileStandalone } from '@/modules/settings/SettingsModule';
import UserApprovalsPage from '@/modules/settings/pages/UserApprovalsPage';
import SecuritySettingsPage from '@/modules/settings/pages/SecuritySettingsPage';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { loginSuccess } from '@/lib/slices/authSlice';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useFormDraftCleanup } from '@/hooks/useFormDraftCleanup';
import { filterManager } from '@/utils/filterManager';

const CRMApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(s => s.preferences);
  
  // Initialize form draft cleanup
  useFormDraftCleanup();
  
  // Track previous location for filter management
  const previousLocationRef = React.useRef<string>('');
  
  // Handle navigation changes for filter cleanup
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocationRef.current;
    
    if (previousPath && currentPath !== previousPath) {
      filterManager.handleNavigation(currentPath, previousPath);
    }
    
    previousLocationRef.current = currentPath;
  }, [location.pathname]);

  useEffect(() => {
    // Check if user is authenticated (mock check)
    const isAuthenticated = localStorage.getItem('tech_tammina_authenticated');
    
    if (!isAuthenticated) {
      toast.error('Please login to access the dashboard');
      navigate('/login');
      return;
    }

    // Sync Redux auth from session
    const session = localStorage.getItem('tech_tammina_session');
    const welcomeShown = localStorage.getItem('tech_tammina_welcome_shown');
    if (session) {
      try {
        const u = JSON.parse(session);
        logger.info('Session user data:', u); // Debug log
        
        // Use fullName from backend or construct from firstName and lastName
        let displayName = '';
        if (u.fullName && u.fullName.trim()) {
          displayName = u.fullName.trim();
        } else {
          const firstName = (u.firstName || '').trim();
          const lastName = (u.lastName || '').trim();
          if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
          } else if (firstName) {
            displayName = firstName;
          } else if (lastName) {
            displayName = lastName;
          } else {
            displayName = u.username || u.email?.split('@')[0] || 'User';
          }
        }
        
        logger.info('Constructed display name:', displayName); // Debug log
        
        dispatch(loginSuccess({
          id: u.id || '1',
          name: displayName,
          email: u.email || 'user@example.com',
          avatar: u.avatar,
          role: (u.role || 'sales').toLowerCase(),
          department: u.department || 'Sales',
          isActive: true,
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: u.loginAt || new Date().toISOString(),
        } as any));
      } catch {}
    }

    // Welcome message disabled to prevent dark mode display issues
    if (session && !welcomeShown) {
      localStorage.setItem('tech_tammina_welcome_shown', 'true');
    }
  }, [navigate, theme.mode]);

  return (
    <NotificationProvider>
      <AppShell>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Dashboard - Default route */}
          <Route path="/" element={<Navigate to="/crm/Dashboard" replace />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          
          {/* Complete CRM Modules - All 8 Modules with access control */}
          <Route path="/Leads/*" element={
            <RequireAccess moduleKey="Leads" action="View"><LeadsModule /></RequireAccess>
          } />

          <Route path="/Contacts/*" element={
            <RequireAccess moduleKey="Contacts" action="View"><ContactsModule /></RequireAccess>
          } />
          <Route path="/Leads/:id" element={
            <RequireAccess moduleKey="Leads" action="View"><CEOLeadDetail /></RequireAccess>
          } />
          <Route path="/Accounts/*" element={
            <RequireAccess moduleKey="Accounts" action="View"><AccountsModule /></RequireAccess>
          } />
          <Route path="/Deals/*" element={
            <RequireAccess moduleKey="Deals" action="View"><DealsModule /></RequireAccess>
          } />

          <Route path="/Tasks/*" element={
            <RequireAccess moduleKey="Tasks" action="View"><TasksModule /></RequireAccess>
          } />
          <Route path="/Communication/*" element={
            <RequireAccess moduleKey="Communication" action="View"><CommunicationModule /></RequireAccess>
          } />
          <Route path="/Reports/*" element={
            <RequireAccess moduleKey="Reports" action="View"><ReportsModule /></RequireAccess>
          } />
          <Route path="/Team-Management" element={
            <RequireAccess moduleKey="TeamManagement" action="View"><TeamManagementPage /></RequireAccess>
          } />
          <Route path="/Lead-Assignment" element={
            <RequireAccess moduleKey="LeadAssignment" action="View"><LeadAssignment /></RequireAccess>
          } />
          <Route path="/Notifications" element={
            <RequireAccess moduleKey="Notifications" action="View"><Notifications /></RequireAccess>
          } />

          {/* Profile (standalone) */}
          <Route path="/profile" element={<ProfileStandalone />} />

          {/* Settings (public to authenticated users) */}
          <Route path="/Settings/*" element={<SettingsModule />} />
          {/* User Approvals (standalone) */}
          <Route path="/User-Approvals" element={
            <RequireAccess moduleKey="Settings" action="View"><UserApprovalsPage /></RequireAccess>
          } />

          {/* Security as a separate page for IT_Admin (guarded under Settings permission) */}
          <Route path="/Security" element={
            <RequireAccess moduleKey="Settings" action="View"><SecuritySettingsPage /></RequireAccess>
          } />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/crm/Dashboard" replace />} />
        </Routes>
      </AnimatePresence>
      </AppShell>
    </NotificationProvider>
  );
};

export default CRMApp;