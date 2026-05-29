/**
 * Tech Tammina CRM - Command Palette
 * Global search and quick actions (CMD/CTRL+K)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  UserPlus,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  Hash,
  X,
  Building2,
  Phone,
  Mail,
  DollarSign,
} from 'lucide-react';

import { useAppSelector, useAppDispatch } from '@/lib/store';
import { setCommandPaletteOpen } from '@/lib/slices/uiSlice';
import { cn } from '@/utils';
import { canAccess, can, getCurrentRole, type Role, type ModuleKey } from '@/utils/rbac';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'create' | 'search' | 'actions' | 'leads' | 'contacts' | 'deals' | 'accounts';
  keywords: string[];
}

const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { commandPaletteOpen } = useAppSelector(state => state.ui);
  
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Mock data for contextual search
  const mockLeads = [
    { id: 'lead-1', name: 'John Smith', company: 'Tech Corp', email: 'john@techcorp.com', phone: '+1-555-0123' },
    { id: 'lead-2', name: 'Sarah Johnson', company: 'Digital Solutions', email: 'sarah@digital.com', phone: '+1-555-0124' },
    { id: 'lead-3', name: 'Mike Wilson', company: 'Innovation Labs', email: 'mike@innovation.com', phone: '+1-555-0125' },
  ];

  const mockContacts = [
    { id: 'contact-1', name: 'Alice Brown', company: 'Global Systems', email: 'alice@global.com', phone: '+1-555-0126' },
    { id: 'contact-2', name: 'Bob Davis', company: 'Future Tech', email: 'bob@future.com', phone: '+1-555-0127' },
  ];

  const mockDeals = [
    { id: 'deal-1', name: 'Enterprise Software License', value: '$50,000', stage: 'Negotiation' },
    { id: 'deal-2', name: 'Cloud Migration Project', value: '$75,000', stage: 'Proposal' },
  ];

  const mockAccounts = [
    { id: 'account-1', name: 'TechCorp Industries', type: 'Enterprise', revenue: '$2.5M' },
    { id: 'account-2', name: 'StartupXYZ', type: 'Startup', revenue: '$150K' },
  ];

  // Generate contextual search results based on query
  const getContextualResults = (searchQuery: string): CommandItem[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const results: CommandItem[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search in leads
    mockLeads.forEach(lead => {
      if (lead.name.toLowerCase().includes(lowerQuery) || 
          lead.company.toLowerCase().includes(lowerQuery) ||
          lead.email.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `search-lead-${lead.id}`,
          title: lead.name,
          subtitle: `Lead at ${lead.company} • ${lead.email}`,
          icon: <UserPlus className="w-4 h-4" />,
          action: () => navigate(`/crm/Leads/${lead.id}`),
          category: 'leads',
          keywords: [lead.name, lead.company, lead.email, 'lead']
        });
      }
    });

    // Search in contacts
    mockContacts.forEach(contact => {
      if (contact.name.toLowerCase().includes(lowerQuery) || 
          contact.company.toLowerCase().includes(lowerQuery) ||
          contact.email.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `search-contact-${contact.id}`,
          title: contact.name,
          subtitle: `Contact at ${contact.company} • ${contact.email}`,
          icon: <Users className="w-4 h-4" />,
          action: () => navigate(`/crm/Contacts/${contact.id}`),
          category: 'contacts',
          keywords: [contact.name, contact.company, contact.email, 'contact']
        });
      }
    });

    // Search in deals
    mockDeals.forEach(deal => {
      if (deal.name.toLowerCase().includes(lowerQuery) || 
          deal.stage.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `search-deal-${deal.id}`,
          title: deal.name,
          subtitle: `${deal.value} • ${deal.stage}`,
          icon: <DollarSign className="w-4 h-4" />,
          action: () => navigate(`/crm/Deals/${deal.id}`),
          category: 'deals',
          keywords: [deal.name, deal.stage, 'deal', 'opportunity']
        });
      }
    });

    // Search in accounts
    mockAccounts.forEach(account => {
      if (account.name.toLowerCase().includes(lowerQuery) || 
          account.type.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `search-account-${account.id}`,
          title: account.name,
          subtitle: `${account.type} Account • ${account.revenue} revenue`,
          icon: <Building2 className="w-4 h-4" />,
          action: () => navigate(`/crm/Accounts/${account.id}`),
          category: 'accounts',
          keywords: [account.name, account.type, 'account', 'company']
        });
      }
    });

    return results;
  };

  // Get role-specific commands based on RBAC
  const getCommands = (): CommandItem[] => {
    const currentRole = getCurrentRole();
    const commands: CommandItem[] = [];
    
    // Navigation modules based on role
    let navigationModules = [];
    
    if (currentRole === 'IT_Admin') {
      navigationModules = [
        { key: 'Dashboard' as ModuleKey, title: 'Dashboard', subtitle: 'Go to dashboard', icon: <BarChart3 className="w-4 h-4" />, path: '/crm/dashboard', keywords: ['dashboard', 'home', 'overview'] },
        { key: 'TeamManagement' as ModuleKey, title: 'Team Management', subtitle: 'Manage organization structure', icon: <Users className="w-4 h-4" />, path: '/crm/team-management', keywords: ['team', 'management', 'organization', 'hierarchy'] },
        { key: 'Settings' as ModuleKey, title: 'User Approvals', subtitle: 'Approve pending users', icon: <UserPlus className="w-4 h-4" />, path: '/crm/User-Approvals', keywords: ['user', 'approvals', 'pending', 'signup'] },
        { key: 'Settings' as ModuleKey, title: 'Security', subtitle: 'Security settings', icon: <FileText className="w-4 h-4" />, path: '/crm/security', keywords: ['security', 'permissions', 'access'] },
        { key: 'Settings' as ModuleKey, title: 'Settings', subtitle: 'System configuration', icon: <Settings className="w-4 h-4" />, path: '/crm/Settings', keywords: ['settings', 'configuration', 'preferences'] },
      ];
    } else {
      navigationModules = [
        { key: 'Dashboard' as ModuleKey, title: 'Dashboard', subtitle: 'Go to dashboard', icon: <BarChart3 className="w-4 h-4" />, path: '/crm/dashboard', keywords: ['dashboard', 'home', 'overview'] },
        { key: 'Leads' as ModuleKey, title: 'Leads', subtitle: 'Manage leads', icon: <UserPlus className="w-4 h-4" />, path: '/crm/leads', keywords: ['leads', 'prospects'] },
        { key: 'Contacts' as ModuleKey, title: 'Contacts', subtitle: 'View contacts', icon: <Users className="w-4 h-4" />, path: '/crm/contacts', keywords: ['contacts', 'people', 'customers'] },
        { key: 'Accounts' as ModuleKey, title: 'Accounts', subtitle: 'Manage accounts', icon: <Building2 className="w-4 h-4" />, path: '/crm/accounts', keywords: ['accounts', 'companies'] },
        { key: 'Deals' as ModuleKey, title: 'Deals', subtitle: 'Sales pipeline', icon: <TrendingUp className="w-4 h-4" />, path: '/crm/deals', keywords: ['deals', 'sales', 'pipeline', 'opportunities'] },
        { key: 'Tasks' as ModuleKey, title: 'Tasks', subtitle: 'Task management', icon: <CheckSquare className="w-4 h-4" />, path: '/crm/tasks', keywords: ['tasks', 'todo', 'activities'] },
        { key: 'Communication' as ModuleKey, title: 'Communication', subtitle: 'Email & calls', icon: <MessageSquare className="w-4 h-4" />, path: '/crm/communication', keywords: ['communication', 'email', 'calls', 'messages'] },
        { key: 'Marketing' as ModuleKey, title: 'Marketing', subtitle: 'Marketing campaigns', icon: <Mail className="w-4 h-4" />, path: '/crm/marketing', keywords: ['marketing', 'campaigns', 'email'] },
        { key: 'Reports' as ModuleKey, title: 'Reports', subtitle: 'Analytics & reports', icon: <BarChart3 className="w-4 h-4" />, path: '/crm/reports', keywords: ['reports', 'analytics', 'insights'] },
        { key: 'Settings' as ModuleKey, title: 'Settings', subtitle: 'System configuration', icon: <Settings className="w-4 h-4" />, path: '/crm/Settings', keywords: ['settings', 'configuration', 'preferences'] },
      ];
      
      // Add Sales Manager specific modules
      if (currentRole === 'Sales_Manager') {
        navigationModules.push(
          { key: 'LeadAssignment' as ModuleKey, title: 'Lead Assignment', subtitle: 'Assign leads to team', icon: <UserPlus className="w-4 h-4" />, path: '/crm/lead-assignment', keywords: ['lead', 'assignment', 'distribute', 'team'] }
        );
      }
    }
    

    
    // Add navigation commands (IT Admin gets all, others filtered by RBAC)
    navigationModules.forEach(module => {
      if (currentRole === 'IT_Admin' || canAccess(currentRole, module.key)) {
        commands.push({
          id: `nav-${module.title.toLowerCase().replace(/\s+/g, '-')}`,
          title: module.title,
          subtitle: module.subtitle,
          icon: module.icon,
          action: () => navigate(module.path),
          category: 'navigation',
          keywords: module.keywords
        });
      }
    });
    
    // Create commands based on permissions
    const createActions = [
      { module: 'Leads' as ModuleKey, title: 'New Lead', subtitle: 'Create a new lead', path: '/crm/leads/new', keywords: ['new', 'create', 'lead', 'add'] },
      { module: 'Contacts' as ModuleKey, title: 'New Contact', subtitle: 'Add a new contact', path: '/crm/contacts/new', keywords: ['new', 'create', 'contact', 'add'] },
      { module: 'Accounts' as ModuleKey, title: 'New Account', subtitle: 'Create a new account', path: '/crm/accounts/new', keywords: ['new', 'create', 'account', 'company', 'add'] },
      { module: 'Deals' as ModuleKey, title: 'New Deal', subtitle: 'Create a new deal', path: '/crm/deals/new', keywords: ['new', 'create', 'deal', 'opportunity', 'add'] },
      { module: 'Tasks' as ModuleKey, title: 'New Task', subtitle: 'Add a new task', path: '/crm/tasks/new', keywords: ['new', 'create', 'task', 'todo', 'add'] },
    ];
    
    // Add IT Admin specific create actions
    if (currentRole === 'IT_Admin') {
      commands.push({
        id: 'create-user',
        title: 'Create User',
        subtitle: 'Add a new user to system',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/crm/User-Approvals'),
        category: 'create',
        keywords: ['new', 'create', 'user', 'add', 'employee']
      });
    } else {
      // Add create actions for other roles based on permissions
      createActions.forEach(action => {
        // Sales Executive cannot create tasks
        if (currentRole === 'Sales_Executive' && action.module === 'Tasks') {
          return;
        }
        
        if (can(currentRole, action.module, 'Create')) {
          commands.push({
            id: `create-${action.module.toLowerCase()}`,
            title: action.title,
            subtitle: action.subtitle,
            icon: <Plus className="w-4 h-4" />,
            action: () => navigate(action.path),
            category: 'create',
            keywords: action.keywords
          });
        }
      });
    }
    
    return commands;
  };
  
  const commands = getCommands();

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands;
    
    const lowercaseQuery = query.toLowerCase();
    const staticResults = commands.filter(command =>
      command.title.toLowerCase().includes(lowercaseQuery) ||
      command.subtitle?.toLowerCase().includes(lowercaseQuery) ||
      command.keywords.some(keyword => keyword.includes(lowercaseQuery))
    );
    
    // Only show contextual results for roles that have access to CRM data
    const currentRole = getCurrentRole();
    const contextualResults = (currentRole !== 'IT_Admin' && canAccess(currentRole, 'Leads')) ? getContextualResults(query) : [];
    
    return [...staticResults, ...contextualResults];
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!commandPaletteOpen) {
        // Open command palette with Alt + K
        if (event.altKey && event.key === 'k') {
          event.preventDefault();
          dispatch(setCommandPaletteOpen(true));
        }
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          dispatch(setCommandPaletteOpen(false));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            dispatch(setCommandPaletteOpen(false));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, dispatch]);

  // Focus input when opened
  React.useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  // Reset selected index when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleClose = () => {
    dispatch(setCommandPaletteOpen(false));
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleCommandClick = (command: CommandItem) => {
    command.action();
    handleClose();
  };

  const categoryLabels = {
    navigation: 'Navigation',
    create: 'Create New',
    search: 'Search',
    actions: 'Actions',
    leads: 'Leads',
    contacts: 'Contacts',
    deals: 'Deals',
    accounts: 'Accounts',
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />

          {/* Command Palette */}
          <motion.div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Search Header */}
            <div className="relative">
              <div className="flex items-center px-6 py-5 border-b border-gray-100">
                <div className="flex items-center flex-1">
                  <Search className="w-5 h-5 text-gray-400 mr-4 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search everything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 text-lg font-medium bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-900"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-150 mr-2"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 ml-2"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredCommands.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    {query ? `No results found for "${query}"` : 'Start typing to search...'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-1 last:mb-0">
                      <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </div>
                      <div className="px-2">
                        {commands.map((command, index) => {
                          const globalIndex = filteredCommands.indexOf(command);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <button
                              key={command.id}
                              onClick={() => handleCommandClick(command)}
                              className={cn(
                                'w-full flex items-center px-4 py-3 mx-2 my-1 text-left rounded-lg transition-all duration-150',
                                isSelected 
                                  ? 'bg-primary-50 border border-primary-200 shadow-sm' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              )}
                            >
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0',
                                isSelected 
                                  ? 'bg-primary-100 text-primary-600' 
                                  : 'bg-gray-100 text-gray-500'
                              )}>
                                {command.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  'font-semibold text-sm truncate',
                                  isSelected ? 'text-primary-900' : 'text-gray-900'
                                )}>
                                  {command.title}
                                </div>
                                {command.subtitle && (
                                  <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {command.subtitle}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
