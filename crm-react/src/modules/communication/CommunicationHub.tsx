import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Communication Hub
 * Modern unified communication center
 */

// Removed React Query hooks - using direct API calls
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Users,
  Calendar,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

import { useAppSelector } from '@/lib/store';
import { formatRelativeTime, getTypeColor } from '@/utils';
import { getCurrentRole } from '@/utils/rbac';


const CommunicationHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'all' | 'email' | 'call' | 'meeting'>(() => {
    // Clear tab filter if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('communicationActiveTab');
      return 'all';
    }
    return (localStorage.getItem('communicationActiveTab') as 'all' | 'email' | 'call' | 'meeting') || 'all';
  });
  const [searchQuery, setSearchQuery] = React.useState(() => {
    // Clear search if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      localStorage.removeItem('communicationSearchQuery');
      return '';
    }
    return localStorage.getItem('communicationSearchQuery') || '';
  });

  // Clear filters only when navigating away from communication module
  React.useEffect(() => {
    sessionStorage.setItem('inCommunicationModule', 'true');
    
    return () => {
      // Increase timeout to ensure proper navigation detection
      setTimeout(() => {
        const stillInCommunication = window.location.pathname.startsWith('/crm/communication') ||
                                   window.location.pathname.startsWith('/crm/Communication');
        if (!stillInCommunication) {
          localStorage.removeItem('communicationActiveTab');
          localStorage.removeItem('communicationSearchQuery');
          sessionStorage.removeItem('inCommunicationModule');
        }
      }, 300); // Increased timeout for better navigation detection
    };
  }, []);

  // Save filters to localStorage
  React.useEffect(() => {
    localStorage.setItem('communicationActiveTab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    localStorage.setItem('communicationSearchQuery', searchQuery);
  }, [searchQuery]);


  const { user } = useAppSelector(s => s.auth);
  const authUserEmail = user?.email;
  const userRole = user?.role;

  // State for all data
  const [activitiesData, setActivitiesData] = React.useState<any>(null);
  const [emailsData, setEmailsData] = React.useState<any>(null);
  const [leadsData, setLeadsData] = React.useState<any>(null);
  const [contactsData, setContactsData] = React.useState<any>(null);
  const [vpTeamData, setVpTeamData] = React.useState<any>(null);
  const [isLoadingVpData, setIsLoadingVpData] = React.useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const session = localStorage.getItem('tech_tammina_session');
    let userId = '';
    let userRole = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        userId = u.id || '';
        userRole = u.role || '';
      } catch {}
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...(userRole ? { 'X-User-Role': userRole } : {}),
    };
  };

  const loadData = async () => {
    try {
      setIsLoadingVpData(true);
      const headers = getAuthHeaders();
      
      // Get normalized role from RBAC utility
      const currentRole = getCurrentRole();
      
      if (currentRole === 'CEO') {
        // CEO users: load all organization data
        try {
          const activitiesResponse = await fetch('/api/activity', { headers });
          if (activitiesResponse.ok) {
            setActivitiesData(await activitiesResponse.json());
          } else {
            setActivitiesData({ data: [] });
          }
        } catch { setActivitiesData({ data: [] }); }
        
        try {
          const emailsResponse = await fetch('/api/emails?page=0&size=50', { headers });
          if (emailsResponse.ok) {
            setEmailsData(await emailsResponse.json());
          } else {
            setEmailsData({ content: [] });
          }
        } catch { setEmailsData({ content: [] }); }

        try {
          const leadsResponse = await fetch('/api/leads', { headers });
          if (leadsResponse.ok) {
            setLeadsData(await leadsResponse.json());
          } else {
            setLeadsData({ data: [] });
          }
        } catch { setLeadsData({ data: [] }); }

        try {
          const contactsResponse = await fetch('/api/contacts', { headers });
          if (contactsResponse.ok) {
            setContactsData(await contactsResponse.json());
          } else {
            setContactsData({ data: [] });
          }
        } catch { setContactsData({ data: [] }); }
      } else if (currentRole === 'Sales_VP') {
        // VP users: only load VP team data
        const vpResponse = await fetch('/api/communication/vp-team', { headers });
        if (vpResponse.ok) {
          setVpTeamData(await vpResponse.json());
        }
        setActivitiesData({ data: [] });
        setEmailsData({ content: [] });
        setLeadsData({ data: [] });
        setContactsData({ data: [] });
      } else if (currentRole === 'Sales_Manager') {
        // Manager users: load manager team data
        const managerResponse = await fetch('/api/communication/manager-team', { headers });
        if (managerResponse.ok) {
          setVpTeamData(await managerResponse.json());
        }
        setActivitiesData({ data: [] });
        setEmailsData({ content: [] });
        setLeadsData({ data: [] });
        setContactsData({ data: [] });
      } else {
        // Sales Executive users: load their own activities and emails
        try {
          const activitiesResponse = await fetch('/api/activity', { headers });
          if (activitiesResponse.ok) {
            setActivitiesData(await activitiesResponse.json());
          } else {
            setActivitiesData({ data: [] });
          }
        } catch { setActivitiesData({ data: [] }); }
        
        try {
          const emailsResponse = await fetch('/api/emails?page=0&size=50', { headers });
          if (emailsResponse.ok) {
            setEmailsData(await emailsResponse.json());
          } else {
            setEmailsData({ content: [] });
          }
        } catch { setEmailsData({ content: [] }); }

        try {
          const leadsResponse = await fetch('/api/leads', { headers });
          if (leadsResponse.ok) {
            setLeadsData(await leadsResponse.json());
          } else {
            setLeadsData({ data: [] });
          }
        } catch { setLeadsData({ data: [] }); }

        try {
          const contactsResponse = await fetch('/api/contacts', { headers });
          if (contactsResponse.ok) {
            setContactsData(await contactsResponse.json());
          } else {
            setContactsData({ data: [] });
          }
        } catch { setContactsData({ data: [] }); }
      }
    } catch (error) {
      logger.error('Error loading communication data:', error);
    } finally {
      setIsLoadingVpData(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [user, userRole]);

  const communications = React.useMemo(() => {
    let acts = [];
    let emails = [];
    let leads = [];
    let contacts = [];

    // Get normalized role for consistent checking
    const currentRole = getCurrentRole();

    // For Sales VP and Sales Manager, use team data
    if ((currentRole === 'Sales_VP' || currentRole === 'Sales_Manager') && vpTeamData) {
      acts = vpTeamData.activities || [];
      emails = vpTeamData.emails || [];
    } else {
      // For CEO and Sales Executive users, use regular data
      acts = Array.isArray(activitiesData) ? activitiesData : (activitiesData?.data || []);
      emails = Array.isArray(emailsData) ? emailsData : (emailsData?.content || []);
      leads = Array.isArray(leadsData) ? leadsData : (leadsData?.data || []);
      contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.data || []);
    }

    // Debug logging
    logger.info('Debug - Leads data:', leads);
    logger.info('Debug - Activities data:', acts);
    logger.info('Debug - Contacts data:', contacts);
    logger.info('Debug - VP Team data:', vpTeamData);

    // Helper function to get lead name by ID
    const getLeadName = (leadId: string | number) => {
      if (!leadId) return 'Unknown Lead';
      const lead = leads.find((l: any) =>
        String(l.id) === String(leadId) ||
        String(l.leadId) === String(leadId) ||
        String(l.id) === String(leadId) ||
        l.id === leadId || l.leadId === leadId
      );
      return lead?.name || lead?.firstName || `Lead #${leadId}`;
    };

    // Helper function to get contact name by ID
    const getContactName = (contactId: string | number) => {
      if (!contactId) return 'Unknown Contact';
      const contact = contacts.find((c: any) =>
        String(c.id) === String(contactId) ||
        String(c.contactId) === String(contactId) ||
        c.id === contactId || c.contactId === contactId
      );
      return contact?.name || contact?.firstName || `Contact #${contactId}`;
    };

    // Map activities to communication format
    const activityComms = acts.map((a: any) => {
      const activityType = String(a.activityType || a.type || 'call').toLowerCase();
      
      // For Sales Executive, show lead/contact name instead of user ID
      let contactName = 'Contact';
      if (currentRole === 'Sales_Executive') {
        if (a.relatedEntityType === 'lead' && a.relatedEntityId) {
          contactName = getLeadName(a.relatedEntityId);
        } else if (a.relatedEntityType === 'contact' && a.relatedEntityId) {
          contactName = getContactName(a.relatedEntityId);
        } else if (a.leadId) {
          contactName = getLeadName(a.leadId);
        } else if (a.contactId) {
          contactName = getContactName(a.contactId);
        } else {
          contactName = String(a.subject || 'Activity');
        }
      } else {
        // For other roles, keep existing logic
        contactName = String(a.createdBy || 'Contact');
      }
      
      return {
        id: `activity_${a.activityId || a.id}`,
        type: activityType,
        subject: String(a.subject || 'Activity'),
        from: String(a.createdBy || 'system'),
        to: '—',
        content: String(a.description || ''),
        timestamp: a.activityDate || a.createdAt,
        status: 'completed',
        hasAttachments: false,
        isStarred: false,
        contact: {
          name: contactName,
          company: String(a.createdByRole || ''),
          avatar: undefined,
        },
      };
    });

    // Map emails to communication format
    const emailComms = emails.map((e: any) => {
      // For Sales Executive, show lead/contact name instead of user ID
      let contactName = 'Contact';
      if (currentRole === 'Sales_Executive') {
        if (e.relatedEntityType === 'lead' && e.relatedEntityId) {
          contactName = getLeadName(e.relatedEntityId);
        } else if (e.relatedEntityType === 'contact' && e.relatedEntityId) {
          contactName = getContactName(e.relatedEntityId);
        } else {
          // Fallback: try to find by email address
          const leadByEmail = leads.find((l: any) => l.email === e.toAddresses || l.email === e.fromAddress);
          const contactByEmail = contacts.find((c: any) => c.email === e.toAddresses || c.email === e.fromAddress);
          contactName = leadByEmail?.name || leadByEmail?.firstName || contactByEmail?.name || contactByEmail?.firstName || 'Contact';
        }
      } else {
        // For other roles, keep existing logic
        contactName = String(e.createdBy || (e.relatedEntityType === 'lead' ? getLeadName(e.relatedEntityId) :
          e.relatedEntityType === 'contact' ? getContactName(e.relatedEntityId) : 'Contact'));
      }
      
      return {
        id: `email_${e.emailId}`,
        type: 'email',
        subject: String(e.subject || 'Email'),
        from: String(e.fromAddress || e.createdByEmail || 'Unknown'),
        to: String(e.toAddresses || 'Unknown'),
        content: String(e.body || ''),
        timestamp: e.sentDate || e.createdAt,
        status: String(e.status || 'sent').toLowerCase(),
        hasAttachments: e.hasAttachments || false,
        isStarred: false,
        contact: {
          name: contactName,
          company: String(e.createdByRole || ''),
          avatar: undefined,
        },
      };
    });

    // Combine, deduplicate, and sort by timestamp
    const allComms = [...activityComms, ...emailComms];
    const uniqueComms = allComms.filter((comm, index, self) => 
      index === self.findIndex(c => c.id === comm.id)
    );
    return uniqueComms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activitiesData, emailsData, leadsData, contactsData, vpTeamData]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'message':
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'call') {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'missed':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'scheduled':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      }
    } else {
      switch (status) {
        case 'sent':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'received':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'unread':
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'draft':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      }
    }
  };

  const filteredCommunications = React.useMemo(() => {
    const normalized = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized && !/\S/.test(searchQuery)) return communications;

    return communications.filter(comm => {
      const matchesTab = activeTab === 'all' || comm.type === activeTab;
      if (!matchesTab) return false;
      if (!normalized) return true;

      const tokens = normalized.split(' ');
      const subjectLower = (comm.subject || '').toLowerCase();
      const nameLower = (comm.contact?.name || '').toLowerCase();
      const companyLower = (comm.contact?.company || '').toLowerCase();

      if (tokens.length === 1) {
        return subjectLower.includes(tokens[0]) || nameLower.includes(tokens[0]) || companyLower.includes(tokens[0]);
      }

      // Multi-word: check if subject contains all tokens
      const subjectParts = subjectLower.split(/\s+/).filter(Boolean);
      if (subjectParts.length >= tokens.length) {
        const subjectMatch = tokens.every((token, i) => subjectParts[i]?.startsWith(token));
        if (subjectMatch) return true;
      }

      // Multi-word: check if company contains all tokens
      const companyParts = companyLower.split(/\s+/).filter(Boolean);
      if (companyParts.length >= tokens.length) {
        const companyMatch = tokens.every((token, i) => companyParts[i]?.startsWith(token));
        if (companyMatch) return true;
      }

      // Multi-word: check participant names (firstName + lastName pattern)
      const nameParts = nameLower.split(/\s+/);
      if (tokens.length > nameParts.length) return false;
      return tokens.every((token, i) => nameParts[i]?.startsWith(token));
    });
  }, [communications, searchQuery, activeTab]);

  // Communication metrics
  const metrics = {
    totalEmails: communications.filter(c => c.type === 'email').length,
    totalCalls: communications.filter(c => c.type === 'call').length,
    totalMeetings: communications.filter(c => c.type === 'meeting').length,
    todayActivity: communications.filter(c => {
      if (!c.timestamp) return false;
      const commDate = new Date(c.timestamp).toDateString();
      const today = new Date().toDateString();
      return commDate === today;
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Communication</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userRole === 'CEO' ? 'View all organization communications' : userRole === 'Sales_VP' ? 'View all team communications' : 'Manage emails, calls, and meetings'}
          </p>
        </div>
        {userRole === 'Sales_VP' && (
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoadingVpData}
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            {isLoadingVpData ? 'Refreshing...' : 'Refresh Team Data'}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Emails',
            value: metrics.totalEmails.toString(),
            icon: <Mail className="w-5 h-5 text-blue-600" />,
            color: ''
          },
          {
            label: 'Total Calls',
            value: metrics.totalCalls.toString(),
            icon: <Phone className="w-5 h-5 text-green-600" />,
            color: ''
          },
          {
            label: 'Total Meetings',
            value: metrics.totalMeetings.toString(),
            icon: <Users className="w-5 h-5 text-orange-600" />,
            color: ''
          },
          {
            label: 'Today',
            value: metrics.todayActivity.toString(),
            icon: <Calendar className="w-5 h-5 text-purple-600" />,
            color: ''
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center preserve-icon-color">
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md relative">
              <Input
                placeholder="Search communications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'email', label: 'Email' },
                { id: 'call', label: 'Call' },
                { id: 'meeting', label: 'Meeting' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recent Communications ({filteredCommunications.length})
            {userRole === 'Sales_VP' && isLoadingVpData && (
              <span className="ml-2 text-sm text-gray-500">(Loading team data...)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVpData && userRole === 'Sales_VP' ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading team communications...</p>
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No communications found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Start communicating with your contacts'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommunications.map((comm, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/crm/Communication/${comm.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={comm.contact.avatar}
                      name={comm.contact.name}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate mb-1">
                            {comm.subject}
                          </h3>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <span className="font-medium">{comm.contact.name}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(comm.timestamp)}</span>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {comm.content}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Badge
                            className={`${getTypeColor(comm.type)} flex items-center gap-1.5`}
                            size="sm"
                          >
                            {getTypeIcon(comm.type)}
                            {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>




    </div>
  );
};

export default CommunicationHub;
