import { ChevronRight, Settings as SettingsIcon, Loader2, ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { SettingsData } from '@/api/settingsApi';
import { useCurrentProfile, useCurrentUserSettings } from '@/hooks/useApi';
import SalesExecutiveSettings from '@/components/Settings/SalesExecutiveSettings';
import SalesManagerSettings from '@/components/Settings/SalesManagerSettings';
import SalesVPSettings from '@/components/Settings/SalesVPSettings';
import ITAdminSettings from '@/components/Settings/ITAdminSettings';
import CEOSettings from '@/components/Settings/CEOSettings';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import PreferencesPage from './pages/PreferencesPage';
import ProfilePage from './pages/ProfilePage';
import NewProfilePage from '@/modules/profile/ProfilePage';
import UserApprovalsPage from './pages/UserApprovalsPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import DataReassignmentPage from './pages/DataReassignmentPage';
 
const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const parts = location.pathname.replace(/^\/+|\/+$/g, '').split('/');
  const items = [{ label: 'CRM', href: '/crm/Dashboard' }, { label: 'Settings', href: '/crm/Settings' }];
  if (parts.includes('preferences')) items.push({ label: 'Appearance', href: '/crm/Settings/preferences' });
  return (
    <nav className="flex items-center text-sm text-gray-500">
      {items.map((it, idx) => (
        <React.Fragment key={it.href}>
          {idx > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          <Link to={it.href} className="hover:text-gray-900">{it.label}</Link>
        </React.Fragment>
      ))}
    </nav>
  );
};
 
const RoleBasedSettingsPage: React.FC = () => {
  const { data: profileData, isLoading: profileLoading } = useCurrentProfile();
  const userRole = profileData?.data?.role || getCurrentRole();
  const { data: settingsResponse, isLoading: settingsLoading, error } = useCurrentUserSettings();
  const settingsData = settingsResponse;
 
  const loading = profileLoading || settingsLoading;
 
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }
 
  if (error || !settingsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error?.message || 'Failed to load settings'}</p>
          <p className="text-sm text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }
 
  const renderRoleSettings = () => {
    const normalizedRole = userRole?.toLowerCase().replace(/\s+/g, '_');
   
    switch (normalizedRole) {
      case 'ceo':
        return <CEOSettings options={settingsData.options} />;
      case 'it_admin':
      case 'admin':
        return <ITAdminSettings options={settingsData.options} />;
      case 'sales_executive':
        return <SalesExecutiveSettings options={settingsData.options} />;
      case 'sales_manager':
        return <SalesManagerSettings options={settingsData.options} />;
      case 'sales_vp':
        return <SalesVPSettings options={settingsData.options} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">No settings available for role: {userRole}</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator if you believe this is an error</p>
          </div>
        );
    }
  };
 
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your role-specific settings and preferences
            {userRole && <span className="ml-2 text-primary-600 font-medium">({userRole.replace('_', ' ')})</span>}
          </p>
        </div>
      </div>
      {renderRoleSettings()}
    </div>
  );
};
 
 
 
import { can, getCurrentRole } from '@/utils/rbac';
 
const SettingsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = getCurrentRole();
  const navigate = useNavigate();
  const location = useLocation();
  const isITAdmin = role?.toLowerCase() === 'it_admin';
  const isSalesExecutive = role?.toLowerCase() === 'sales_executive';
  const isSalesManager = role?.toLowerCase() === 'sales_manager';
  const isSalesVP = role?.toLowerCase() === 'sales_vp';
  const isCEO = role?.toLowerCase() === 'ceo';
  const isUserApprovalsPage = location.pathname.includes('/approvals');
 
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/crm/Settings')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
          </div>
        </div>
      </div>
 
      {isITAdmin || isSalesManager || isSalesVP || isSalesExecutive || isCEO ? (
        <section className="min-w-0">{children}</section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-2">
              <Link to="/crm/Settings/general" className="flex items-center px-3 py-2 rounded-xl hover:bg-gray-50">
                <SettingsIcon className="w-4 h-4 mr-3 text-gray-400" />
                General
              </Link>
              <Link to="/crm/Settings/preferences" className="flex items-center px-3 py-2 rounded-xl hover:bg-gray-50">
                <SettingsIcon className="w-4 h-4 mr-3 text-gray-400" />
                Appearance
              </Link>
 
            </div>
          </aside>
          <section className="lg:col-span-3 min-w-0">{children}</section>
        </div>
      )}
    </div>
  );
};
 
const SettingsModule: React.FC = () => {
  const role = getCurrentRole();
 
  // Allow all authenticated users to access settings (role-based content is handled internally)
  return (
    <Routes>
      <Route path="/" element={<RoleBasedSettingsPage />} />
      <Route path="/general" element={<SettingsLayout><GeneralSettingsPage /></SettingsLayout>} />
      <Route path="/preferences" element={<SettingsLayout><PreferencesPage /></SettingsLayout>} />
      <Route path="/approvals" element={<SettingsLayout><UserApprovalsPage /></SettingsLayout>} />
      <Route path="/security" element={<SettingsLayout><SecuritySettingsPage /></SettingsLayout>} />
      <Route path="/data-reassignment" element={<SettingsLayout><DataReassignmentPage /></SettingsLayout>} />
 
      <Route path="*" element={<RoleBasedSettingsPage />} />
    </Routes>
  );
};
 
// Standalone profile page wrapper (uses full-page layout)
export const ProfileStandalone: React.FC = () => (
  <NewProfilePage />
);
 
export default SettingsModule;
 
