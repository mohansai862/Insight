import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Contact Detail View
 * Detailed contact information with timeline and related data
 */

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  Calendar,
  Edit,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';


import { useContact, useDeals, useContactStats, useLeads } from '@/hooks/useApi';
import { mapBackendToDeal } from '@/api/dealsApi';
import { formatDate, formatRelativeTime, formatCompactCurrency } from '@/utils';
import { getCurrentRole, getCurrentUserId } from '@/utils/rbac';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'lead':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
    case 'prospect':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
    case 'customer':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'partner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    case 'vendor':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'archived':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    default:
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
  }
};

const getDealStageColor = (stage: string) => {
  const normalized = String(stage || '')
    .toLowerCase()
    .replace(/\s+/g, '_');

  const key =
    normalized === 'closed_won' ? 'won' :
    normalized === 'closed_lost' ? 'lost' :
    normalized === 'qualification' ? 'qualified' :
    normalized;

  switch (key) {
    case 'qualified':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case 'proposal':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'negotiation':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
    case 'won':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'lost':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
};

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = getCurrentRole();
  
  // For CEO role, fetch contact details from CEO API
  const [ceoContactData, setCeoContactData] = React.useState(null);
  const [ceoLoading, setCeoLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (role === 'CEO' && id && !isNaN(parseInt(id))) {
      setCeoLoading(true);
      import('@/api/ceoApi').then(({ ceoApi }) => {
        ceoApi.getContactDetails(parseInt(id))
          .then(response => {
            console.log('CEO Contact Details Response:', response);
            setCeoContactData(response.data);
          })
          .catch(error => {
            console.error('Failed to load CEO contact details:', error);
            console.error('Error details:', error.response?.data || error.message);
          })
          .finally(() => {
            setCeoLoading(false);
          });
      });
    }
  }, [role, id]);
  
  // Use regular API for non-CEO roles
  const { data, isLoading, error } = useContact(id!, {
    enabled: role !== 'CEO'
  });
  const { data: allLeadsResp } = useLeads({ limit: 1000 });
  const allLeads = (allLeadsResp as any)?.data || [];

  // Use CEO contact data if available, otherwise use regular contact data
  const contact = role === 'CEO' && ceoContactData ? {
    id: ceoContactData.id?.toString(),
    name: `${ceoContactData.firstName || ''} ${ceoContactData.lastName || ''}`.trim() || ceoContactData.email,
    email: ceoContactData.email,
    phoneNumber: ceoContactData.phoneNumber,
    countryCode: ceoContactData.countryCode,
    company: ceoContactData.companyName,
    title: ceoContactData.designation,
    status: ceoContactData.status || 'active',
    type: ceoContactData.type || 'lead',
    createdAt: ceoContactData.createdAt,
    updatedAt: ceoContactData.updatedAt,
    remarks: ceoContactData.remarks,
    location: `${ceoContactData.city || ''} ${ceoContactData.state || ''} ${ceoContactData.country || ''}`.trim() || null,
    companyId: (ceoContactData.companyId || ceoContactData.accountId)?.toString(),
    accountId: (ceoContactData.accountId || ceoContactData.companyId)?.toString()
  } : data?.data;
  
  // Check if this contact is linked to a converted lead with pending reassignment
  const hasConvertedLeadWithPendingReassignment = React.useMemo(() => {
    if (!contact?.email) return false;
    return allLeads.some((lead: any) => 
      lead.email?.toLowerCase() === contact.email?.toLowerCase() && 
      lead.status === 'converted' && 
      lead.reassignmentPending === true
    );
  }, [allLeads, contact?.email]);

  React.useEffect(() => {
    // Clear navigation flag when detail component mounts
    sessionStorage.removeItem('navigatingToContactDetail');
    
    // Set up cleanup for when component unmounts
    return () => {
      // If we're navigating away from this detail page, set the return flag
      const isNavigatingBack = window.location.pathname === '/crm/contacts' || window.location.pathname === '/crm/Contacts';
      if (isNavigatingBack) {
        sessionStorage.setItem('returningFromContactDetail', 'true');
      }
    };
  }, []);

  const handleEmailClick = () => {
    const subject = `Follow-up: ${contact.name}`;
    const body = `Dear ${contact.name},\n\nI hope this email finds you well.\n\nBest regards,`;
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(contact.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open Outlook web compose page directly
    window.open(outlookUrl, '_blank');
    
    // Show notification
    import('react-hot-toast').then(({ default: toast }) => {
      toast.success(
        `Outlook opened for ${contact.name}!`,
        {
          duration: 2000,
          position: 'top-center',
          style: {
            background: '#0078D4',
            color: 'white',
            fontWeight: '500',
            padding: '12px 20px',
            borderRadius: '8px'
          },
          icon: '✉️'
        }
      );
    });
  };

  // Get contact stats (deals based on account_id)
  const { data: contactStats } = useContactStats(id!, { enabled: !!contact });
  
  // Deals related to this contact's account
  const [ceoDeals, setCeoDeals] = React.useState<any[]>([]);
  const { data: dealsResp } = useDeals({ enabled: role !== 'CEO' });

  React.useEffect(() => {
    if (role === 'CEO' && contact?.companyId) {
      import('@/api/ceoApi').then(({ ceoApi }) => {
        ceoApi.getDeals()
          .then(response => {
            const rawDeals = response.data || [];
            const mappedDeals = rawDeals.map(mapBackendToDeal);
            setCeoDeals(mappedDeals);
          })
          .catch(error => {
            console.error('Failed to load CEO related deals:', error);
          });
      });
    }
  }, [role, contact?.companyId]);

  const relatedDeals = React.useMemo(() => {
    const list = role === 'CEO' ? ceoDeals : (dealsResp?.data || []) as any[];
    return contact ? list.filter(d => {
      const dealCompanyId = d.companyId?.toString();
      return dealCompanyId === contact.companyId;
    }) : [];
  }, [dealsResp, ceoDeals, contact, role]);



  const loading = role === 'CEO' ? ceoLoading : isLoading;
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // For CEO, show error only if no data is available after loading
  if (role === 'CEO' && !ceoContactData && !ceoLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Contact not found</p>
          <Button as={Link} to="/crm/Contacts" variant="ghost" className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  // For non-CEO roles, show error if API call failed
  if (role !== 'CEO' && (error || !contact)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading contact: {error?.message || 'Contact not found'}</p>
          <Button as={Link} to="/crm/Contacts" variant="ghost" className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  // If no contact data is available, show not found
  if (!contact) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Contact not found</p>
          <Button as={Link} to="/crm/Contacts" variant="ghost" className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              sessionStorage.setItem('returningFromContactDetail', 'true');
              navigate('/crm/Contacts');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{contact.name}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            leftIcon={<Mail className="w-4 h-4" />}
            onClick={handleEmailClick}
          >
            Email
          </Button>
          <Button 
            variant="ghost" 
            leftIcon={<Phone className="w-4 h-4" />}
            onClick={() => window.open(`tel:${contact.phoneNumber}`, '_self')}
          >
            Call
          </Button>
          {getCurrentRole() !== 'Sales_VP' && getCurrentRole() !== 'Sales_Manager' && getCurrentRole() !== 'CEO' && (
            <Button
              as={hasConvertedLeadWithPendingReassignment ? undefined : Link}
              to={hasConvertedLeadWithPendingReassignment ? undefined : `/crm/Contacts/${contact.id}/edit`}
              variant="primary"
              leftIcon={<Edit className="w-4 h-4" />}
              disabled={hasConvertedLeadWithPendingReassignment}
              className={hasConvertedLeadWithPendingReassignment ? 'opacity-50 cursor-not-allowed' : ''}
              title={hasConvertedLeadWithPendingReassignment ? 'Cannot edit - Contact linked to converted lead with pending reassignment' : 'Edit contact'}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={contact.avatar}
                  name={contact.name}
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                  {contact.title && (
                    <p className="text-gray-600">{contact.title}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusColor(contact.status)} size="sm">
                      {contact.status?.charAt(0).toUpperCase() + contact.status?.slice(1) || 'Active'}
                    </Badge>
                    <Badge className={getTypeColor(contact.type || 'lead')} size="sm">
                      {(contact.type || 'lead').charAt(0).toUpperCase() + (contact.type || 'lead').slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium break-all break-words whitespace-normal overflow-hidden">{contact.email}</p>
                    </div>
                  </div>
                  {contact.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{(contact as any).countryCode ? `${(contact as any).countryCode} ${contact.phoneNumber}` : contact.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium">{contact.company}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(contact.createdAt)}</p>
                    </div>
                  </div>
                  {contact.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{contact.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Remarks</span>
                </CardTitle>

              </div>
            </CardHeader>
            <CardContent>
              <div>
                {contact.remarks ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{String(contact.remarks).replace(/<[^>]*>/g, '')}</p>
                ) : (
                  <p className="text-gray-500 italic">No remarks added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              <div className="space-y-4">
                {(() => {
                  const events: { id: string; type: string; title: string; description?: string; timestamp: string; icon?: string; color?: string }[] = [];
                  
                  // Add contact lifecycle events
                  if (contact?.createdAt) {
                    events.push({ id: 'contact_created', type: 'contact', title: 'Contact created', description: contact.email || undefined, timestamp: contact.createdAt });
                  }
                  if (contact?.updatedAt && contact.updatedAt !== contact.createdAt) {
                    events.push({ id: 'contact_updated', type: 'contact', title: 'Contact updated', timestamp: contact.updatedAt });
                  }

                  // Related deals as events
                  (relatedDeals || []).forEach((d: any, idx: number) => {
                    if (d.createdAt) {
                      events.push({ id: `deal_created_${idx}_${d.id}`, type: 'deal', title: `Deal created: ${d.name}`, description: `Value ${formatCompactCurrency(Number(d.value) || 0).replace('$ ', '$')}`, timestamp: d.createdAt });
                    }
                    if (d.updatedAt && d.updatedAt !== d.createdAt) {
                      events.push({ id: `deal_stage_${idx}_${d.id}`, type: 'deal', title: `Deal ${d.stage}`, description: `Value ${formatCompactCurrency(Number(d.value) || 0).replace('$ ', '$')}`, timestamp: d.updatedAt });
                    }
                  });
                  
                  events.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  
                  if (events.length === 0) {
                    return <div className="text-center text-gray-500 py-6">No activity yet</div>;
                  }
                  
                  return events.map((ev) => {
                    const iconMap = {
                      email: <Mail className="w-4 h-4 text-blue-600" />,
                      deal: <FileText className="w-4 h-4 text-purple-600" />,
                      assignment: <User className="w-4 h-4 text-green-600" />
                    };
                    
                    const bgMap = {
                      email: 'bg-blue-100 dark:bg-blue-900',
                      deal: 'bg-purple-100 dark:bg-purple-900', 
                      assignment: 'bg-green-100 dark:bg-green-900'
                    };
                    
                    return (
                      <div key={ev.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgMap[ev.type] || 'bg-gray-100'}`}>
                          {iconMap[ev.type] || <User className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{ev.title}</h4>
                            <span className="text-xs text-gray-500">{formatRelativeTime(ev.timestamp)}</span>
                          </div>
                          {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Deals</span>
                <span className="font-semibold">{contactStats?.data?.totalDeals || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deal Value</span>
                <span className="font-semibold">{formatCompactCurrency(Number(contactStats?.data?.dealValue || 0)).replace('$ ', '$')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="font-semibold">{(() => {
                  const allTs: string[] = [];
                  if (contact?.createdAt) allTs.push(contact.createdAt);
                  if (contact?.updatedAt) allTs.push(contact.updatedAt);
                  (relatedDeals || []).forEach((d: any) => { if (d.updatedAt) allTs.push(d.updatedAt); if (d.createdAt) allTs.push(d.createdAt); });
                  const latest = allTs.sort((a,b)=> new Date(b).getTime() - new Date(a).getTime())[0];
                  return latest ? formatRelativeTime(latest) : '—';
                })()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Deals */}
          <Card>
            <CardHeader>
              <CardTitle>Related Deals</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {(!relatedDeals || relatedDeals.length === 0) ? (
                  <p>No related deals.</p>
                ) : (
                  (relatedDeals as any[]).map((deal: any) => (
                    <div key={deal.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{deal.name}</h4>
                        <span className="text-sm font-semibold text-gray-900">{formatCompactCurrency(Number(deal.value) || 0).replace('$ ', '$')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getDealStageColor(deal.stage)} size="sm">
                          {deal.stage === 'won' ? 'Won' : deal.stage === 'lost' ? 'Lost' : deal.stage?.charAt(0).toUpperCase() + deal.stage?.slice(1) || deal.stage}
                        </Badge>
                        {deal.probability != null && (
                          <span className="text-xs text-gray-500">{deal.probability}% probability</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>




        </div>
      </div>
    </motion.div>
  );
};

export default ContactDetail;
