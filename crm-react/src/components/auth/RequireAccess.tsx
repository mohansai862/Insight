/**
 * RequireAccess - lightweight route guard for module-level permissions
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { can, getCurrentRole, ModuleKey, Action } from '@/utils/rbac';

interface RequireAccessProps {
  moduleKey: ModuleKey;
  action?: Action;
  children: React.ReactElement;
}

const RequireAccess: React.FC<RequireAccessProps> = ({ moduleKey, action = 'View', children }) => {
  const location = useLocation();
  const role = getCurrentRole();
  const hasAccess = can(role, moduleKey, action);
  


  React.useEffect(() => {
    if (!hasAccess) {
      const token = `no-access-${moduleKey}-${action}`;
      const existing = (window as any)[token];
      if (!existing) {
        (window as any)[token] = true;
        toast.error('You do not have permission to access this resource');
        setTimeout(() => { (window as any)[token] = false; }, 1000);
      }
    }
  }, [hasAccess, moduleKey, action]);

  if (!hasAccess) {
    return <Navigate to="/crm/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAccess;