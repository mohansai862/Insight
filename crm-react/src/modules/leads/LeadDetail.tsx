/**
 * Tech Tammina CRM - Lead Detail
 * Detailed view of a single lead
 */

import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Edit, Mail, Phone, Star } from 'lucide-react';
import React from 'react';
import { Link, useParams } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import EmailCompose from '@/components/EmailCompose';
import { useLead, useActivities } from '@/hooks/useApi';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useLead(id!, { enabled: Boolean(id) });
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useActivities({ leadId: id });

  const [showEmailCompose, setShowEmailCompose] = React.useState(false);
  
  // Refetch data when component mounts or id changes
  React.useEffect(() => {
    if (id) {
      refetch();
      refetchActivities();
    }
  }, [id, refetch, refetchActivities]);

  const lead = data?.data;

  // Debug logging
  React.useEffect(() => {
    console.log('LeadDetail Debug:', { id, data, isLoading, error, lead });
  }, [id, data, isLoading, error, lead]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Lead not found</p>
          <Link to="/crm/Leads" className="text-primary-600 hover:underline mt-2 inline-block">
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '';
  const formattedPhone = lead.phoneNumber || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/crm/Leads"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600">{lead.email || ''}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            leftIcon={<Mail className="w-4 h-4" />}
            onClick={() => setShowEmailCompose(true)}
          >
            Email
          </Button>
          <Button 
            variant="ghost" 
            leftIcon={<Phone className="w-4 h-4" />}
            onClick={() => window.open(`tel:${lead.phoneNumber}`, '_self')}
          >
            Call
          </Button>
          <Button 
            as={Link} 
            to={`/crm/Leads/${lead.id}/edit`}
            variant="primary" 
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Lead Info */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:flex-[2] space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900 text-sm break-words break-all whitespace-normal">{lead.email || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 whitespace-normal">{formattedPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-gray-900">{lead.companyName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-900">{lead.designation || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Source</label>
                  <p className="text-gray-900 capitalize">{lead.source ? lead.source.replace('_', ' ') : ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="text-gray-900 break-words">{lead.industry || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-gray-900">{lead.country || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <p className="text-gray-900">{lead.city || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">LinkedIn</label>
                  <p className="text-gray-900">
                    {lead.linkedIn?.trim() ? (
                      <a href={lead.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-words">
                        View Profile
                      </a>
                    ) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Location</label>
                  <p className="text-gray-900">{lead.customerLocation || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Technologies</label>
                  <p className="text-gray-900">{lead.technologies || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prospect Value</label>
                  <p className="text-gray-900 font-medium">
                    {lead.prospectValue ? `$${lead.prospectValue.toLocaleString()}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Number of Employees</label>
                  <p className="text-gray-900">{lead.numberOfEmployees ? `${lead.numberOfEmployees.toLocaleString()}` : ''}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Decision Authority</label>
                  <p className="text-gray-900">{lead.decisionAuthority?.trim() || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ) : activitiesData?.data && activitiesData.data.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activitiesData.data
                    .sort((a: any, b: any) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
                    .map((activity: any) => (
                    <div key={activity.activityId || activity.id} className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{activity.subject}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.activityDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 capitalize">
                          {(activity.activityType || activity.type || 'activity').toLowerCase().replace('_', ' ')}
                        </span>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            activity.status === 'completed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{activity.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No activities yet</p>
                  <p className="text-sm">Activities will appear here as they happen</p>
                  <button 
                    onClick={() => refetchActivities()}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 lg:flex-[1] space-y-6">

          
          {/* Email Compose */}
          <EmailCompose
            isOpen={showEmailCompose}
            onClose={() => {
              setShowEmailCompose(false);
              // Refetch activities after email compose closes to show any new email activities
              setTimeout(() => refetchActivities(), 1000);
            }}
            recipientEmail={lead.email}
            recipientName={fullName}
            entityType="lead"
            entityId={lead.id}
          />
          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  0
                </div>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="w-5 h-5 text-gray-300"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Cold Lead
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Status</label>
                <Badge variant="primary" className="capitalize">
                  {lead.status || 'new'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm text-gray-500">No tags</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-medium">
                    U
                  </span>
                </div>
                <p className="font-medium text-gray-900">
                  Unassigned
                </p>
                <p className="text-sm text-gray-500">
                  No owner assigned
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default LeadDetail;
