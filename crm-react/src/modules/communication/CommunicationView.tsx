import { logger } from '@/utils/logger';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useActivity, useLeads, useContacts } from '@/hooks/useApi';
import { useAppSelector } from '@/lib/store';
import { ArrowLeft, FileText, Mail, MessageSquare, Phone, Users } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTypeColor } from '@/utils';

const CommunicationView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useActivity(id || '', { enabled: Boolean(id) });
  const { user: currentUser } = useAppSelector(s => s.auth);
  const { data: leadsData } = useLeads();
  const { data: contactsData } = useContacts();
  const [users, setUsers] = React.useState<any[]>([]);

  // Mark that we're in communication module to preserve filters
  React.useEffect(() => {
    sessionStorage.setItem('inCommunicationModule', 'true');
  }, []);

  // Fetch users data
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Try to fetch all users first
        let allUsers = [];
        try {
          const allUsersRes = await fetch('/api/users');
          if (allUsersRes.ok) {
            allUsers = await allUsersRes.json();
            logger.info('Fetched all users:', allUsers);
          }
        } catch (e) {
          logger.warn('Failed to fetch all users, trying role-specific endpoints');
        }
        
        // Fallback to role-specific endpoints if needed
        if (allUsers.length === 0) {
          const [vpRes, mgrRes, execRes] = await Promise.all([
            fetch('/api/users/sales-vps'),
            fetch('/api/users/sales-managers'),
            fetch('/api/users/sales-executives')
          ]);
          const [vps, managers, executives] = await Promise.all([
            vpRes.json(),
            mgrRes.json(),
            execRes.json()
          ]);
          allUsers = [...vps, ...managers, ...executives];
        }
        
        setUsers(allUsers);
        logger.info('Final users list:', allUsers);
      } catch (error) {
        logger.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const getUserName = (userId: string | number) => {
    if (!userId || userId === '—' || userId === '' || userId === null || userId === undefined) return 'Unknown User';
    
    logger.info('Getting user name for ID:', userId, 'Current user:', currentUser, 'All users:', users);
    
    // Check current user first
    if (currentUser && (String(currentUser.id) === String(userId) || String(currentUser.userId) === String(userId))) {
      // Try multiple field combinations for current user
      const name = currentUser.fullName || 
                   currentUser.name ||
                   `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                   currentUser.username ||
                   'Current User';
      logger.info('Found current user name:', name);
      return name;
    }
    
    // Check in users list
    const user = users.find(u => String(u.userId) === String(userId) || String(u.id) === String(userId));
    if (user) {
      const name = user.fullName || 
                   user.name ||
                   `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                   user.username ||
                   `User ${userId}`;
      logger.info('Found user:', user, 'Name:', name);
      return name;
    }
    
    return `User ${userId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getLeadName = (leadId: string | number) => {
    if (!leadId) return null;
    const leads = leadsData?.data || [];
    const lead = leads.find((l: any) => String(l.leadId) === String(leadId) || String(l.id) === String(leadId));
    return lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name : null;
  };

  const getContactName = (contactId: string | number) => {
    if (!contactId) return null;
    const contacts = contactsData?.data || [];
    const contact = contacts.find((c: any) => String(c.contactId) === String(contactId) || String(c.id) === String(contactId));
    return contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name : null;
  };

  const comm = React.useMemo(() => {
    const a = data?.data;
    if (!a) return null;
    logger.info('Activity data:', a);
    logger.info('Activity type fields:', { type: a.type, activityType: a.activityType });
    logger.info('CreatedBy:', a.createdBy, 'AssignedUserId:', a.assignedUserId, 'LeadId:', a.leadId);
    
    const fromName = getUserName(a.createdBy);
    let toName = 'Not Assigned';
    
    // Check if activity is related to a lead
    if (a.leadId) {
      const leadName = getLeadName(a.leadId);
      if (leadName) toName = leadName;
    }
    // Check if activity is related to a contact
    else if (a.contactId) {
      const contactName = getContactName(a.contactId);
      if (contactName) toName = contactName;
    }
    // Check if activity is assigned to a user
    else if (a.assignedUserId) {
      toName = getUserName(a.assignedUserId);
    }
    
    logger.info('Resolved names - From:', fromName, 'To:', toName);
    
    return {
      id: a.id || a.activityId,
      type: a.activityType || a.type || 'message',
      subject: a.subject || a.activityType || a.type || 'Communication',
      from: fromName,
      to: toName,
      content: a.description || '',
      timestamp: formatDate(a.activityDate || a.createdAt),
      status: a.status || 'pending',
    };
  }, [data, users, currentUser, leadsData, contactsData]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-6">Loading...</CardContent></Card>
      </div>
    );
  }

  if (isError || !comm) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-6">Communication not found.</CardContent></Card>
      </div>
    );
  }

  const handleBackClick = () => {
    // Ensure we're still in communication module to preserve filters
    sessionStorage.setItem('inCommunicationModule', 'true');
    navigate('/crm/Communication');
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBackClick}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          style={{ 
            minWidth: '40px', 
            minHeight: '40px',
            position: 'relative',
            zIndex: 9999
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{comm.subject}</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getTypeColor(comm.type)} flex items-center gap-1.5`}>
                {getTypeIcon(comm.type)}
                {comm.type ? comm.type.charAt(0).toUpperCase() + comm.type.slice(1).toLowerCase() : 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-700">
            <div className="mb-2"><strong>From:</strong> {comm.from}</div>
            <div className="mb-2"><strong>To:</strong> {comm.to}</div>
            <div className="mb-2"><strong>Date:</strong> {comm.timestamp}</div>
          </div>
          {comm.content && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Remarks</h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comm.content}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationView;
