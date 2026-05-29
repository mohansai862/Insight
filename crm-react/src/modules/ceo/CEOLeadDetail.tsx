/**
 * CEO Lead Detail - Dedicated lead detail view for CEO role
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  Calendar,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Target,
  DollarSign
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatRelativeTime, getStatusColor } from '@/utils';

const CEOLeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      loadLeadDetails();
    } else {
      setError('Invalid lead ID');
      setLoading(false);
    }
  }, [id]);

  const loadLeadDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading lead details for ID:', id);
      
      // Use the CEO API to get lead details
      const { ceoApi } = await import('@/api/ceoApi');
      const data = await ceoApi.getLeadDetails(parseInt(id!));
      console.log('CEO Lead Details Response:', data);
      
      if (!data.data) {
        throw new Error('No lead data received');
      }
      
      // Transform the response data to match expected format
      const leadData = data.data;
      const formatLocation = (city?: string, state?: string, country?: string) => {
        return [city, state, country].filter(part => part && String(part).trim()).join(', ') || null;
      };

      const transformedLead = {
        id: leadData.leadId || leadData.id,
        name: `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim() || leadData.email || 'Unknown Lead',
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email,
        phoneNumber: leadData.phoneNumber,
        countryCode: leadData.countryCode || leadData.dialCode || leadData.countryDialCode,
        company: leadData.companyName || leadData.company,
        title: leadData.designation || leadData.title,
        status: leadData.leadStatus || leadData.status || 'NEW',
        source: leadData.leadSource || leadData.source || 'UNKNOWN',
        value: leadData.value || leadData.estimatedValue || 0,
        createdAt: leadData.createdAt,
        updatedAt: leadData.updatedAt,
        remarks: leadData.remarks || leadData.notes,
        location: formatLocation(
          leadData.city || leadData.companyLocation || leadData.customerLocation,
          leadData.state,
          leadData.country
        ),
        country: leadData.country,
        assignedToName: leadData.assignedToName,
        createdByName: leadData.createdByName
      };
      
      console.log('Transformed lead:', transformedLead);
      setLead(transformedLead);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load CEO lead details:', err);
      console.error('Error response:', err.response);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to load lead details';
      if (err.message && err.message.includes('Lead not found')) {
        errorMessage = 'Lead not found or you don\'t have access to it';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    if (!lead?.email) return;
    
    const subject = `Follow-up: ${lead.name}`;
    const body = `Dear ${lead.name},\n\nI hope this email finds you well.\n\nBest regards,`;
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(lead.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(outlookUrl, '_blank');
    
    import('react-hot-toast').then(({ default: toast }) => {
      toast.success(
        `Outlook opened for ${lead.name}!`,
        {
          duration: 2000,
          position: 'top-center',
          style: {
            background: '#0078D4',
            color: 'white',
            fontWeight: '500',
            padding: '12px 20px',
            borderRadius: '12px'
          },
          icon: '✉️'
        }
      );
    });
  };

  const normalizeDialCode = (code?: string, country?: string) => {
    if (code && String(code).trim()) {
      const trimmed = String(code).trim();
      return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
    }

    const countryCodes: { [key: string]: string } = {
      India: '+91',
      'United States': '+1',
      'United Kingdom': '+44',
      Canada: '+1',
      Australia: '+61',
      Germany: '+49',
      France: '+33',
      Japan: '+81',
      China: '+86',
      Singapore: '+65',
      UAE: '+971',
      'Saudi Arabia': '+966'
    };

    return country ? countryCodes[country] : undefined;
  };

  const formatPhoneForDisplay = (phoneNumber?: string, countryCode?: string, country?: string) => {
    if (!phoneNumber) return null;

    const trimmed = String(phoneNumber).trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('+')) return trimmed;

    const dialCode = normalizeDialCode(countryCode, country);
    if (!dialCode) return trimmed;

    const digitsOnly = trimmed.replace(/\D/g, '');
    const codeDigits = dialCode.replace(/\D/g, '');
    let localNumber = digitsOnly;

    if (codeDigits && digitsOnly.startsWith(codeDigits)) {
      localNumber = digitsOnly.slice(codeDigits.length);
    }

    return localNumber ? `${dialCode} ${localNumber}` : dialCode;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'QUALIFIED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CONVERTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'LOST':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source?.toUpperCase()) {
      case 'WEBSITE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'REFERRAL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOCIAL_MEDIA':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'EMAIL_CAMPAIGN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'COLD_CALL':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-xl w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Not Available</h3>
            <p className="text-red-600 mb-2">{error || 'Lead not found'}</p>
            <p className="text-gray-500 text-sm">
              The lead you're looking for might have been deleted, moved, or you may not have access to it.
            </p>
          </div>
          <div className="space-x-3">
            <Button onClick={() => navigate('/crm/Leads')} variant="primary">
              Back to Leads
            </Button>
            <Button onClick={() => window.location.reload()} variant="ghost">
              Refresh Page
            </Button>
          </div>
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
            onClick={() => navigate('/crm/Leads')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600 mt-1">
              {lead.title && `${lead.title} • `}
              {lead.company || 'Individual Lead'}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar
                  name={lead.name}
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                  {lead.title && (
                    <p className="text-gray-600">{lead.title}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-primary-100 text-primary-700">
                      {lead.status}
                    </span>
                    {/* <span className="text-sm font-bold text-white">
                      {lead.source?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || 'Unknown'}
                    </span> */}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium break-all break-words whitespace-normal overflow-hidden">
                        {lead.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  {lead.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">
                          {formatPhoneForDisplay(lead.phoneNumber, lead.countryCode, lead.country) || lead.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium">{lead.company}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>
                  {lead.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{lead.location}</p>
                      </div>
                    </div>
                  )}
                  {lead.assignedToName && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <p className="font-medium">{lead.assignedToName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Notes & Remarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {lead.remarks ? (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {String(lead.remarks).replace(/<[^>]*>/g, '')}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No notes added yet.</p>
                )}
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-primary-100 text-primary-700">
                  {lead.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Source</span>
                <span className="text-sm font-medium text-gray-900">
                  {lead.source?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || 'Unknown'}
                </span>
              </div>
              {lead.value > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimated Value</span>
                  <span className="font-semibold text-green-600">
                    ${lead.value.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-semibold">
                  {lead.updatedAt ? formatRelativeTime(lead.updatedAt) : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </motion.div>
  );
};

export default CEOLeadDetail;
