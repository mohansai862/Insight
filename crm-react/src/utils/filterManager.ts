/**
 * Global Filter Manager
 * Manages filter state across all CRM modules
 * Handles cleanup on navigation and logout while preserving filters during theme changes
 */

// Define all module filter keys
export const FILTER_KEYS = {
  ACCOUNTS: 'accountsFilters',
  LEADS: 'leadsFilters', 
  CONTACTS: 'contactsFilters',
  DEALS: 'dealsFilters',
  TASKS: 'tasksFilters',
  QUOTES: 'quotesFilters',
  REPORTS: 'reportsFilters',
  MARKETING: 'marketingFilters'
} as const;

// Define module paths
export const MODULE_PATHS = {
  ACCOUNTS: '/crm/accounts',
  LEADS: '/crm/leads',
  CONTACTS: '/crm/contacts', 
  DEALS: '/crm/deals',
  TASKS: '/crm/tasks',
  QUOTES: '/crm/quotes',
  REPORTS: '/crm/reports',
  MARKETING: '/crm/marketing'
} as const;

class FilterManager {
  private static instance: FilterManager;
  private currentModule: string | null = null;
  private isThemeChanging = false;
  private themeChangeTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeListeners();
  }

  public static getInstance(): FilterManager {
    if (!FilterManager.instance) {
      FilterManager.instance = new FilterManager();
    }
    return FilterManager.instance;
  }

  private initializeListeners() {
    // Listen for theme changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tech_tammina_theme') {
        this.handleThemeChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Monitor theme changes by watching for class changes on document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            this.handleThemeChange();
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  private handleThemeChange() {
    this.isThemeChanging = true;
    
    if (this.themeChangeTimeout) {
      clearTimeout(this.themeChangeTimeout);
    }
    
    this.themeChangeTimeout = setTimeout(() => {
      this.isThemeChanging = false;
    }, 1000);
  }

  /**
   * Clear filters for a specific module
   */
  public clearModuleFilters(modulePath: string) {
    const filterKey = this.getFilterKeyForModule(modulePath);
    if (filterKey) {
      localStorage.removeItem(filterKey);
    }
  }

  /**
   * Clear all module filters (used on logout)
   */
  public clearAllFilters() {
    if (this.isThemeChanging) {
      return; // Don't clear during theme changes
    }
    
    // Clear generic filter keys
    Object.values(FILTER_KEYS).forEach(filterKey => {
      localStorage.removeItem(filterKey);
    });
    
    // Clear specific module filter keys
    const specificFilterKeys = [
      'contactsSearchQuery', 'contactsSelectedType', 'contactsSelectedStatus', 'contactsSelectedOwner',
      'contactsSelectedManager', 'contactsStartDate', 'contactsEndDate', 'contactsLocationFilter',
      'contactsSelectedMyContacts', 'contactsSelectedVPContacts', 'contactsPage',
      'ceoContactsSelectedSalesVP', 'ceoContactsSelectedManager', 'ceoContactsSelectedExecutive',
      'ceoContactsSearchQuery', 'ceoContactsStartDate', 'ceoContactsEndDate', 'ceoContactsPage',
      'ceoLeadsSelectedSalesVP', 'ceoLeadsSelectedManager', 'ceoLeadsSelectedExecutive',
      'ceoLeadsSearchQuery', 'ceoLeadsStatus', 'ceoLeadsSource', 'ceoLeadsStartDate', 'ceoLeadsEndDate', 'ceoLeadsPage',
      'ceoDealsSearchQuery', 'ceoDealsSelectedCompany',
      'ceoAccountsSearchQuery', 'ceoAccountsSelectedIndustry', 'ceoAccountsFromDate', 'ceoAccountsToDate',
      'ceoAccountsAppliedFromDate', 'ceoAccountsAppliedToDate', 'ceoAccountsViewMode', 'ceoAccountsPage',
      'accountsSearchQuery', 'accountsSelectedIndustry', 'accountsFromDate', 'accountsToDate',
      'accountsAppliedFromDate', 'accountsAppliedToDate', 'accountsViewMode', 'accountsPage'
    ];
    
    specificFilterKeys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Handle navigation between modules - clear filters when switching modules
   */
  public handleNavigation(newPath: string, previousPath?: string) {
    const newModule = this.getModuleFromPath(newPath);
    const previousModule = previousPath ? this.getModuleFromPath(previousPath) : null;

    // Clear ALL module filters when navigating between different modules
    if (previousModule && newModule && previousModule !== newModule) {
      Object.values(FILTER_KEYS).forEach(filterKey => {
        localStorage.removeItem(filterKey);
      });
    }

    this.currentModule = newModule;
  }

  /**
   * Get module path from full path
   */
  private getModuleFromPath(path: string): string | null {
    for (const modulePath of Object.values(MODULE_PATHS)) {
      if (path.startsWith(modulePath)) {
        return modulePath;
      }
    }
    return null;
  }

  /**
   * Get filter key for a module path
   */
  private getFilterKeyForModule(modulePath: string): string | null {
    const moduleEntries = Object.entries(MODULE_PATHS);
    for (const [key, path] of moduleEntries) {
      if (path === modulePath) {
        return FILTER_KEYS[key as keyof typeof FILTER_KEYS];
      }
    }
    return null;
  }

  /**
   * Check if filters should be preserved (e.g., during theme changes)
   */
  public shouldPreserveFilters(): boolean {
    return this.isThemeChanging;
  }
}

export const filterManager = FilterManager.getInstance();

/**
 * Hook to use filter manager in React components
 */
export const useFilterManager = () => {
  return {
    clearModuleFilters: filterManager.clearModuleFilters.bind(filterManager),
    clearAllFilters: filterManager.clearAllFilters.bind(filterManager),
    handleNavigation: filterManager.handleNavigation.bind(filterManager),
    shouldPreserveFilters: filterManager.shouldPreserveFilters.bind(filterManager)
  };
};