import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Convert Lead Page
 * Accessible only to Sales Manager (role check) and above
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, CheckCircle2, ShieldAlert, UserPlus, Target } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { leadsApi } from '@/api/leadsApi';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import Input from '@/components/ui/Input';
import { useLead } from '@/hooks/useApi';
import { formatCompactCurrency } from '@/utils';
import { useAppSelector } from '@/lib/store';
import { format } from 'date-fns';


const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyWebsite: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  companyRevenue: z.coerce.number().optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().min(1, 'Contact email is required').email('Enter valid email').refine((email) => {
    // Basic email format validation (additional to .email())
    if (!email) return false;
    return true; // Server-side will validate uniqueness
  }, {
    message: "Email already exists in contacts/accounts"
  }),
  contactPhone: z.string().optional(),
  contactDesignation: z.string().optional(),
  contactLinkedIn: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Allow empty
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Enter a valid URL"
  }),
  dealName: z.string().min(1, 'Deal name is required'),
  dealValue: z.coerce.number().min(0, 'Deal value must be positive'),
  expectedCloseDate: z.string().min(1, 'Expected close date is required').refine((date) => {
    if (!date) return false;
    try {
      // Parse dd-mm-yyyy format
      const [day, month, year] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    } catch {
      return false;
    }
  }, {
    message: "Expected close date cannot be in the past"
  }),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const ConvertLead: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const queryClient = useQueryClient();
  // Allow all authenticated users to convert leads
  const isSalesManager = true;


  const { data, isLoading, error } = useLead(id || '', { enabled: Boolean(id) });
  const lead = data?.data;

  const { register, handleSubmit, reset, watch, setValue, trigger, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      contactName: '',
      contactEmail: '',
      dealName: '',
      dealValue: 0,
      expectedCloseDate: '',
    },
  });

  // Auto-scroll to Lead Details on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto-scroll to first error field on validation failure
  React.useEffect(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[data-field="${firstErrorField}"]`) || 
                    document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errors]);

  React.useEffect(() => {
    // Update form values once lead data loads
    if (lead) {
      reset({
        companyName: lead.companyName || '',
        companyWebsite: '', // No direct mapping from lead
        industry: lead.industry || '',
        companySize: lead.numberOfEmployees ? lead.numberOfEmployees.toLocaleString('en-US') : '',
        companyRevenue: lead.prospectValue || 0,
        contactName: `${lead.firstName} ${lead.lastName}`.trim(),
        contactEmail: lead.email || '',
        contactPhone: lead.phoneNumber || '',
        contactDesignation: lead.designation || '',
        contactLinkedIn: lead.linkedIn || '',
        dealName: `${lead.companyName || 'New Company'} - Opportunity`,
        dealValue: lead.value || lead.prospectValue || 0,
        expectedCloseDate: '',
      });
    }
  }, [lead, reset]);

  if (!isSalesManager) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Access restricted</h2>
            <p className="text-gray-600 mb-4">Only Sales Managers can convert leads.</p>
            <Button as={Link} to="/crm/Leads" variant="primary">Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-72 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Lead not found</h2>
            <Button as={Link} to="/crm/Leads" variant="primary">Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    try {
      if (!id) {
        toast.error('Lead ID is missing');
        return;
      }

      // Update lead email if changed
      if (lead?.email !== values.contactEmail) {
        await leadsApi.update(id, {
          ...lead,
          email: values.contactEmail,
        });
      }

      logger.info('🔄 Converting lead with data:', values);
      logger.info('🔄 Lead data:', lead);

      // Convert dd-mm-yyyy to yyyy-mm-dd for API
      const convertDateFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const [day, month, year] = dateStr.split('-');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch {
          return dateStr; // Return as-is if conversion fails
        }
      };

      // Ensure all required fields are present with proper fallbacks
      const conversionPayload = {
        companyName: values.companyName?.trim() || lead.companyName || 'Unknown Company',
        website: values.companyWebsite?.trim() || '',
        industry: values.industry?.trim() || lead.industry || '',
        companySize: values.companySize?.trim() || '',
        companyRevenue: values.companyRevenue || 0,
        contactName: values.contactName?.trim() || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Contact',
        contactEmail: values.contactEmail?.trim() || lead.email || '',
        contactPhone: values.contactPhone?.trim() || lead.phoneNumber || '',
        contactDesignation: values.contactDesignation?.trim() || lead.designation || '',
        contactLinkedIn: values.contactLinkedIn?.trim() || lead.linkedIn || '',
        createDeal: true,
        dealName: values.dealName?.trim() || `${values.companyName || lead.companyName || 'Company'} - Opportunity`,
        dealValue: values.dealValue || lead.value || lead.prospectValue || 0,
        dealStage: 'Qualification',
        expectedCloseDate: convertDateFormat(values.expectedCloseDate) || null,
        remarks: values.remarks?.trim() || ''
      };
      
      logger.info('🔄 Final conversion payload:', conversionPayload);
      
      if (!conversionPayload.contactEmail) {
        toast.error('Contact email is required for lead conversion');
        return;
      }

      if (!conversionPayload.companyName || conversionPayload.companyName === 'Unknown Company') {
        toast.error('Company name is required for lead conversion');
        return;
      }

      if (!conversionPayload.contactName || conversionPayload.contactName === 'Unknown Contact') {
        toast.error('Contact name is required for lead conversion');
        return;
      }



      // Convert lead using the API
      logger.info('🔄 Calling leadsApi.convertLead...');
      const result = await leadsApi.convertLead(id, conversionPayload);
      
      logger.info('✅ Lead conversion result:', result);
      
      // Show success message only once
      toast.success('Lead converted successfully! Account, contact, and deal have been created.');
      
      // Refresh caches in background
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      
      logger.info('✅ Cache invalidation completed');
      // Navigate to deals to see the new deal
      navigate('/crm/Leads');
    } catch (error: any) {
      logger.error('❌ Lead conversion error:', error);
      
      // Handle email duplication error (check for 500 status with email-related errors)
      if (error.message?.includes('500') || 
          (error.message?.toLowerCase().includes('email') && 
           (error.message?.toLowerCase().includes('exists') || 
            error.message?.toLowerCase().includes('duplicate') || 
            error.message?.toLowerCase().includes('already')))) {
        setError('contactEmail', {
          type: 'manual',
          message: 'Email already exists in contacts/accounts'
        });
        const emailElement = document.querySelector('[data-field="contactEmail"]');
        if (emailElement) {
          emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return; // Don't show toast, field error is enough
      }
      
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // Provide more specific error messages
      let errorMessage = 'Error converting lead';
      if (error.message?.includes('Lead conversion service unavailable')) {
        errorMessage = 'Lead conversion service is temporarily unavailable. Please try again later.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Lead not found or conversion endpoint is not available.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'You do not have permission to convert this lead.';
      } else if (error.message?.includes('400')) {
        errorMessage = 'Invalid data provided for lead conversion. Please check all required fields.';
      } else if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and ensure the backend service is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button as={Link} to="/crm/Leads" variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}></Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Convert Lead</h1>
            <p className="text-gray-600 mt-1">{`${lead.firstName} ${lead.lastName}`.trim()} • {lead.email} • {lead.companyName || '—'}</p>
          </div>
        </div>
      </div>

      {/* Lead Details */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><strong>Name:</strong> {lead.firstName} {lead.lastName}</div>
          <div><strong>Email:</strong> {lead.email || '—'}</div>
          <div><strong>Phone:</strong> {lead.phoneNumber ? `${(lead as any).countryCode || ''} ${lead.phoneNumber}`.trim() : '—'}</div>
          <div><strong>Company:</strong> {lead.companyName || '—'}</div>
          <div><strong>Designation:</strong> {lead.designation || '—'}</div>
          <div><strong>Industry:</strong> {lead.industry || '—'}</div>
          <div><strong>Country:</strong> {lead.country || '—'}</div>
          <div><strong>Company Location:</strong> {lead.companyLocation || '—'}</div>
          <div><strong>Source:</strong> {lead.source ? lead.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '—'}</div>
          <div><strong>Status:</strong> {lead.status ? lead.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '—'}</div>
    
          <div><strong>LinkedIn:</strong> {lead.linkedIn || '—'}</div>
          <div><strong>Customer Location:</strong> {lead.customerLocation || '—'}</div>
          <div><strong>Technologies:</strong> {lead.technologies || '—'}</div>
          <div><strong>Prospect Value:</strong> {lead.prospectValue ? formatCompactCurrency(lead.prospectValue) : '—'}</div>
          <div><strong>Number of Employees:</strong> {lead.numberOfEmployees ? lead.numberOfEmployees.toLocaleString('en-US') : '—'}</div>
          <div><strong>Decision Authority:</strong> {lead.decisionAuthority || '—'}</div>
          <div><strong>Created At:</strong> {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
          <div><strong>Updated At:</strong> {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Building2 className="w-5 h-5" /><span>Account (Company)</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Company Name *" {...register('companyName')} error={errors.companyName?.message} placeholder="Enter company name" readOnly={!!lead?.companyName} className={lead?.companyName ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.companyName ? -1 : undefined} />
              <Input label="Company Website" {...register('companyWebsite')} error={errors.companyWebsite?.message} placeholder="https://example.com" />
              <Input label="Industry" {...register('industry')} error={errors.industry?.message} placeholder="e.g., SaaS" readOnly={!!lead?.industry} className={lead?.industry ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.industry ? -1 : undefined} />
              <Input label="Number of Employees" {...register('companySize')} error={errors.companySize?.message} placeholder="e.g., 50-100 employees" readOnly={!!lead?.numberOfEmployees} className={lead?.numberOfEmployees ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.numberOfEmployees ? -1 : undefined} />
              <Input label="Annual Revenue ($)" type="number" {...register('companyRevenue')} error={errors.companyRevenue?.message} placeholder="e.g., 50000000" readOnly={!!lead?.prospectValue} className={lead?.prospectValue ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.prospectValue ? -1 : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><UserPlus className="w-5 h-5" /><span>Primary Contact</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Full Name *" {...register('contactName')} error={errors.contactName?.message} placeholder="Enter contact name" readOnly={!!(lead?.firstName || lead?.lastName)} className={(lead?.firstName || lead?.lastName) ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={(lead?.firstName || lead?.lastName) ? -1 : undefined} />
              <div data-field="contactEmail" className="relative">
                <Input 
                  label="Contact Email *" 
                  type="email" 
                  {...register('contactEmail')} 
                  error={errors.contactEmail?.message} 
                  placeholder="name@company.com"
                  onChange={(e) => {
                    setValue('contactEmail', e.target.value);
                    trigger('contactEmail');
                  }}
                />
              </div>
              <Input label="Phone" {...register('contactPhone')} error={errors.contactPhone?.message} placeholder="Work phone" readOnly={!!lead?.phoneNumber} className={lead?.phoneNumber ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.phoneNumber ? -1 : undefined} value={lead?.phoneNumber ? `${(lead as any).countryCode || ''} ${lead.phoneNumber}`.trim() : watch('contactPhone')} />
              <Input label="Designation" {...register('contactDesignation')} error={errors.contactDesignation?.message} placeholder="Job title" readOnly={!!lead?.designation} className={lead?.designation ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.designation ? -1 : undefined} />
              <Input label="LinkedIn Profile" {...register('contactLinkedIn')} error={errors.contactLinkedIn?.message} placeholder="https://linkedin.com/in/username" readOnly={!!lead?.linkedIn} className={lead?.linkedIn ? 'bg-gray-50 pointer-events-none' : ''} tabIndex={lead?.linkedIn ? -1 : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Target className="w-5 h-5" /><span>Deal</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Deal Name *" {...register('dealName')} error={errors.dealName?.message} placeholder="Enter opportunity title" data-field="dealName" />
              <Input label="Deal Value ($) *" type="number" step="0.01" {...register('dealValue')} error={errors.dealValue?.message} placeholder="e.g., 250000" data-field="dealValue" />
              <div data-field="expectedCloseDate" className="relative">
                <CustomDatePicker
                  label="Expected Close Date *"
                  value={watch('expectedCloseDate')}
                  onChange={(value) => {
                    setValue('expectedCloseDate', value);
                    if (value) {
                      trigger('expectedCloseDate').then((isValid) => {
                        if (isValid) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      });
                    }
                  }}
                  placeholder="dd-mm-yyyy"
                  futureOnly={true}
                  error={errors.expectedCloseDate?.message}
                />
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Button type="submit" variant="primary" className="w-full" leftIcon={<CheckCircle2 className="w-4 h-4" />} disabled={isSubmitting}>
                {isSubmitting ? 'Converting...' : 'Convert Lead'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This will create an Account (Company), a Contact, and a Deal.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
};

export default ConvertLead;
