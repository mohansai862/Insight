 /**
 * Role-based access control (RBAC) helpers
 * Centralizes permissions for modules and role-specific capabilities
 */



export type Role =
  | 'CEO'
  | 'IT_Admin'
  | 'Sales_Executive'
  | 'Sales_Manager'
  | 'Sales_VP';

export type ModuleKey =
  | 'Dashboard'
  | 'Leads'
  | 'Contacts'
  | 'Accounts'
  | 'Deals'
  | 'Tasks'
  | 'TeamManagers'
  | 'TeamManagement'
  | 'Communication'
  | 'Reports'
  | 'Support'
  | 'Integrations'
  | 'Settings'
  | 'TeamExecutives'
  | 'LeadAssignment'
  | 'Notifications';

// Role-Module Access Matrix (module visibility)
// Aligned to the provided matrix. View scope differences are enforced in the backend and action-level checks.
const moduleAccess: Record<ModuleKey, Role[]> = {
  // Everyone has a dashboard entry; the content varies per role (personal/team/org/tech)
  Dashboard: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],

  // CRM core
  Leads: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  Contacts: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  Accounts: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  Deals: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],

  Contracts: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],

  // Tasks & Activities -> VP has no access (per matrix)
  Tasks: ['IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  Communication: ['IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],

  // Business/Insights
  Reports: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],

  // Misc
  Support: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  Integrations: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
  Settings: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  TeamManagers: [],
  TeamManagement: ['CEO', 'IT_Admin'],
  TeamExecutives: ['CEO', 'IT_Admin', 'Sales_Manager'],
  LeadAssignment: ['IT_Admin', 'Sales_Manager'],
  Notifications: ['IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
};

export function canAccess(role: Role, moduleKey: ModuleKey): boolean {
  const allowed = moduleAccess[moduleKey] || [];
  return allowed.includes(role);
}

export function hasTeamVisibility(role: Role): boolean {
  return role === 'IT_Admin' || role === 'Sales_Manager' || role === 'Sales_VP';
}

export function canReassignDeals(role: Role): boolean {
  // IT_Admin is view-only on Deals per matrix, so cannot reassign
  return role === 'Sales_Manager';
}

// Action-level permissions
export type Action =
  | 'View'
  | 'Create'
  | 'Edit'
  | 'Delete'
  | 'Convert_Lead'
  | 'Reassign'
  | 'Export'
  | 'Import'
  | 'View_Reports';

// Per-module action capability matrix
// Rules:
// - IT_Admin: view-only on data modules (Leads, Contacts, Accounts, Deals, Tasks, Activities), full for Settings, partial for Reports (tech reports via backend filter)
// - Sales_Executive: create/edit own on Leads/Contacts/Accounts/Deals; own Tasks; no Reports; Comm allowed
// - Sales_Manager: team scope with create/edit/delete on applicable modules; Comm allowed
// - Sales_VP: org-wide read for Leads/Contacts; full Deals; no Tasks; Reports allowed
const actionMatrix: Partial<Record<ModuleKey, Partial<Record<Action, Role[]>>>> = {
  Leads: {
    View: ['CEO', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive'],
    Edit: ['Sales_Executive'],
    Delete: ['Sales_Manager'],
    Convert_Lead: ['Sales_Executive'],
    Export: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Import: ['IT_Admin', 'Sales_Manager', 'Sales_Executive'],
  },
  Contacts: {
    View: ['CEO', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive'],
    Edit: ['Sales_Executive'],
    Delete: ['Sales_Manager'],
    Export: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Import: ['IT_Admin', 'Sales_Manager', 'Sales_VP'],
  },
  Accounts: {
    View: ['CEO', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive'],
    Edit: ['Sales_Executive'],
    Delete: ['Sales_Manager'],
    Export: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Import: ['IT_Admin', 'Sales_Manager'],
  },
  Deals: {
    View: ['CEO', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive'],
    Edit: ['Sales_Executive'],
    Delete: ['Sales_Manager', 'Sales_VP'],
    Reassign: ['Sales_Manager', 'Sales_VP'],
    Export: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
  },
  Tasks: {
    View: ['Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Edit: ['Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Delete: ['Sales_Manager', 'Sales_VP'],
  },
  Communication: {
    View: ['Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['Sales_Executive'],
    Edit: ['Sales_Executive'],
    Delete: ['Sales_Manager'],
  },

  Reports: {
    View: ['CEO', 'Sales_Manager', 'Sales_VP'],
    View_Reports: ['CEO', 'Sales_Manager', 'Sales_VP'],
    Export: ['CEO', 'Sales_Manager', 'Sales_VP'],
  },
  Support: {
    View: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Create: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Edit: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Delete: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
  },
  Integrations: {
    View: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
    Edit: ['CEO', 'IT_Admin', 'Sales_Manager', 'Sales_VP'],
  },

  Settings: {
    View: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
    Edit: ['CEO', 'IT_Admin', 'Sales_Executive', 'Sales_Manager', 'Sales_VP'],
  },
  TeamManagement: {
    View: ['CEO', 'IT_Admin'],
  },
  TeamExecutives: {
    View: ['CEO', 'IT_Admin', 'Sales_Manager'],
  },
};

export function can(role: Role, moduleKey: ModuleKey, action: Action): boolean {
  const mod = actionMatrix[moduleKey];
  if (!mod) return canAccess(role, moduleKey) && action === 'View';
  const allowed = mod[action] || [];
  return allowed.includes(role);
}

export function getCurrentRole(): Role {
  try {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const parsed = JSON.parse(session);
      // Normalize signup/login roles into app Role union
      const raw: string = (parsed.role || '').toString().toLowerCase().trim();
      switch (raw) {
        case 'ceo':
        case 'chief executive officer':
        case 'chief executive':
          return 'CEO';
        case 'it admin':
        case 'it_admin':
        case 'admin':
        case 'administrator':
          return 'IT_Admin';
        case 'sales vp':
        case 'sales_vp':
        case 'vp sales':
        case 'vp':
          return 'Sales_VP';
        case 'sales manager':
        case 'sales_manager':
        case 'team lead':
        case 'manager':
          return 'Sales_Manager';
        case 'sales executive':
        case 'sales_executive':
        case 'sales':
        case 'rep':
          return 'Sales_Executive';
        default:
          break;
      }
    }
  } catch {}
  // Fallback to safest default for app modules
  return 'Sales_Executive';
}

export function getCurrentUserId(): string | null {
  try {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.id || null;
    }
  } catch {}
  return null;
}

export function getCurrentUserName(): string | null {
  try {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.firstName ? `${parsed.firstName} ${parsed.lastName || ''}`.trim() : null;
    }
  } catch {}
  return null;
}

export function getCurrentUserEmail(): string | null {
  try {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.email || null;
    }
  } catch {}
  return null;
}

export function isManagerOrVP(role?: Role): boolean {
  const currentRole = role || getCurrentRole();
  return currentRole === 'Sales_Manager' || currentRole === 'Sales_VP';
}

export function canAssignTasks(role?: Role): boolean {
  const currentRole = role || getCurrentRole();
  return can(currentRole, 'Tasks', 'Create') && isManagerOrVP(currentRole);
}

// Map route href to ModuleKey
export function hrefToModuleKey(href: string): ModuleKey | null {
  if (href.startsWith('/crm/Dashboard')) return 'Dashboard';
  if (href.startsWith('/crm/Leads')) return 'Leads';
  if (href.startsWith('/crm/Contacts')) return 'Contacts';
  if (href.startsWith('/crm/Accounts')) return 'Accounts';
  if (href.startsWith('/crm/Deals')) return 'Deals';
  if (href.startsWith('/crm/Tasks')) return 'Tasks';
  if (href.startsWith('/crm/Communication')) return 'Communication';
  if (href.startsWith('/crm/Team-Management')) return 'TeamManagement';
  if (href.startsWith('/crm/Reports')) return 'Reports';
  if (href.startsWith('/crm/Settings')) return 'Settings';
  if (href.startsWith('/crm/Lead-Assignment')) return 'LeadAssignment';
  if (href.startsWith('/crm/Notifications')) return 'Notifications';
  return null;
}
