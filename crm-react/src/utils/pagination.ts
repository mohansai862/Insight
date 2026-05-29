/**
 * Pagination utilities for localStorage management
 */

// List of all pagination keys used in the application
const PAGINATION_KEYS = [
  'contactsPage',
  'userApprovalsPage', 
  'tasksPage',
  'accountsPage',
  'leadsPage',
  'dealsPage',
  'ceoAccountsPage',
  'ceoContactsPage',
  'ceoLeadsPage'
];

// List of all view mode keys used in the application
const VIEW_MODE_KEYS = [
  'contactsViewMode',
  'accountsViewMode',
  'leadsViewMode',
  'dealsViewMode',
  'ceoContactsViewMode',
  'ceoAccountsViewMode'
];

// List of all filter keys used in the application
const FILTER_KEYS = [
  'contactsSearchQuery',
  'contactsSelectedType',
  'contactsSelectedStatus',
  'contactsSelectedOwner',
  'contactsSelectedManager',
  'contactsStartDate',
  'contactsEndDate',
  'contactsLocationFilter',
  'contactsSelectedMyContacts',
  'contactsSelectedVPContacts'
];

/**
 * Clear pagination for all modules except the specified one
 */
export const clearOtherModulesPagination = (currentModuleKey: string): void => {
  PAGINATION_KEYS.forEach(key => {
    if (key !== currentModuleKey) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Clear all pagination data from localStorage
 */
export const clearAllPagination = (): void => {
  PAGINATION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear all view modes from localStorage
 */
export const clearAllViewModes = (): void => {
  VIEW_MODE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear pagination for a specific module
 */
export const clearModulePagination = (moduleKey: string): void => {
  localStorage.removeItem(moduleKey);
};

/**
 * Clear all contacts module data (pagination, filters, view mode)
 */
export const clearContactsModuleData = (): void => {
  localStorage.removeItem('contactsPage');
  localStorage.removeItem('contactsViewMode');
  FILTER_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Check if user is navigating within the same module (e.g., from list to detail and back)
 */
export const isWithinSameModule = (currentPath: string, targetPath: string): boolean => {
  const getModuleBase = (path: string) => {
    if (path.includes('/contacts') || path.includes('/Contacts')) return 'contacts';
    if (path.includes('/leads') || path.includes('/Leads')) return 'leads';
    if (path.includes('/accounts') || path.includes('/Accounts')) return 'accounts';
    if (path.includes('/deals') || path.includes('/Deals')) return 'deals';
    return null;
  };
  
  return getModuleBase(currentPath) === getModuleBase(targetPath);
};

/**
 * Reset pagination when switching between modules
 */
export const resetPaginationOnNavigation = (currentPath: string, previousPath: string): void => {
  // Only reset if switching between different main modules
  const getCurrentModule = (path: string) => {
    if (path.includes('/leads') && !path.includes('/Leads')) return 'leads';
    if (path.includes('/contacts') && !path.includes('/ceo-contacts')) return 'contacts';
    if (path.includes('/accounts') && !path.includes('/ceo-accounts')) return 'accounts';
    if (path.includes('/deals')) return 'deals';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/approvals')) return 'approvals';
    if (path.includes('/Leads')) return 'ceo-leads';
    if (path.includes('/ceo-contacts')) return 'ceo-contacts';
    if (path.includes('/ceo-accounts')) return 'ceo-accounts';
    return null;
  };

  const currentModule = getCurrentModule(currentPath);
  const previousModule = getCurrentModule(previousPath);

  // If switching between different modules, clear pagination for ALL modules except current
  if (currentModule && previousModule && currentModule !== previousModule) {
    const moduleKeyMap: Record<string, string> = {
      'leads': 'leadsPage',
      'contacts': 'contactsPage', 
      'accounts': 'accountsPage',
      'deals': 'dealsPage',
      'tasks': 'tasksPage',
      'approvals': 'userApprovalsPage',
      'Leads': 'ceoLeadsPage',
      'ceo-contacts': 'ceoContactsPage',
      'ceo-accounts': 'ceoAccountsPage'
    };

    const viewModeKeyMap: Record<string, string> = {
      'leads': 'leadsViewMode',
      'contacts': 'contactsViewMode',
      'accounts': 'accountsViewMode',
      'deals': 'dealsViewMode',
      'ceo-contacts': 'ceoContactsViewMode',
      'ceo-accounts': 'ceoAccountsViewMode'
    };

    // Clear all pagination except current module
    Object.entries(moduleKeyMap).forEach(([module, key]) => {
      if (module !== currentModule) {
        localStorage.removeItem(key);
      }
    });

    // Clear all view modes except current module
    Object.entries(viewModeKeyMap).forEach(([module, key]) => {
      if (module !== currentModule) {
        localStorage.removeItem(key);
      }
    });
    
    // If leaving contacts module, clear all contacts data
    if (previousModule === 'contacts' && currentModule !== 'contacts') {
      clearContactsModuleData();
    }
  }
};