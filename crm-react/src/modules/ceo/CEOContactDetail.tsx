/**
 * CEO Contact Detail - Dedicated contact detail view for CEO role
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
  User
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ceoApi } from '@/api/ceoApi';
import { formatDate, formatRelativeTime, getStatusColor } from '@/utils';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'lead':
      return <User className="w-4 h-4" />;
    case 'prospect':
      return <User className="w-4 h-4" />;
    case 'customer':
      return <User className="w-4 h-4" />;
    case 'partner':
      return <User className="w-4 h-4" />;
    case 'vendor':
      return <Building className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

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
  switch (status) {
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

const CEOContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      loadContactDetails();
    } else {
      setError('Invalid contact ID');
      setLoading(false);
    }
  }, [id]);

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading contact details for ID:', id);
      const response = await ceoApi.getContactDetails(parseInt(id!));
      console.log('CEO Contact Details Response:', response);
      
      if (!response.data) {
        throw new Error('No contact data received');
      }
      
      // Transform the response data to match expected format
      const contactData = response.data;
      const formatLocation = (city?: string, state?: string, country?: string) => {
        return [city, state, country].filter(part => part && String(part).trim()).join(', ') || null;
      };

      const transformedContact = {
        id: contactData.id,
        name: `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || contactData.email || 'Unknown Contact',
        email: contactData.email,
        phoneNumber: contactData.phoneNumber,
        company: contactData.companyName,
        title: contactData.designation,
        status: contactData.status || 'active',
        type: contactData.type || 'lead',
        createdAt: contactData.createdAt,
        updatedAt: contactData.updatedAt,
        remarks: contactData.remarks,
        location: formatLocation(contactData.city, contactData.state, contactData.country),
        companyId: contactData.companyId,
        createdByName: contactData.createdByName
      };
      
      console.log('Transformed contact:', transformedContact);
      setContact(transformedContact);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load CEO contact details:', err);
      console.error('Error response:', err.response);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to load contact details';
      if (err.message && err.message.includes('Contact not found')) {
        errorMessage = 'Contact not found or you don\'t have access to it';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    if (!contact?.email) return;
    
    const subject = `Follow-up: ${contact.name}`;
    const body = `Dear ${contact.name},\n\nI hope this email finds you well.\n\nBest regards,`;
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(contact.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(outlookUrl, '_blank');
    
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
            borderRadius: '12px'
          },
          icon: '✉️'
        }
      );
    });
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

  if (error || !contact) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Not Available</h3>
            <p className="text-red-600 mb-2">{error || 'Contact not found'}</p>
            <p className="text-gray-500 text-sm">
              The contact you're looking for might have been deleted, moved, or you may not have access to it.
            </p>
          </div>
          <div className="space-x-3">
            <Button onClick={() => navigate('/crm/Contacts')} variant="primary">
              Back to Contacts
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
            onClick={() => navigate('/crm/Contacts')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
            <p className="text-gray-600 mt-1">
              {contact.title && `${contact.title} • `}
              {contact.company || 'Individual Contact'}
            </p>
          </div>
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
                      <span className="capitalize">{contact.type || 'lead'}</span>
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
                      <p className="font-medium break-all break-words whitespace-normal overflow-hidden">
                        {contact.email || 'No email'}
                      </p>
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
                  {contact.createdByName && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Owner</p>
                        <p className="font-medium">{contact.createdByName}</p>
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
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Remarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {contact.remarks ? (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {String(contact.remarks).replace(/<[^>]*>/g, '')}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No remarks added yet</p>
                )}
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
                <span className="text-sm text-gray-600">Contact Type</span>
                <Badge className={getTypeColor(contact.type || 'lead')} size="sm">
                  <span className="capitalize">{contact.type || 'lead'}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getStatusColor(contact.status)} size="sm">
                  {contact.status?.charAt(0).toUpperCase() + contact.status?.slice(1) || 'Active'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-semibold">
                  {contact.updatedAt ? formatRelativeTime(contact.updatedAt) : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </motion.div>
  );
};

export default CEOContactDetail;
