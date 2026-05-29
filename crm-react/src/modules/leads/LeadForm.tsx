import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Lead Form
 * Create and edit lead form with validation
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useLead, useCreateLead, useUpdateLead } from '@/hooks/useApi';
import { phoneRules, getPhoneRule, getPhonePlaceholder } from '@/utils/phoneValidation';

// Lead form schema
const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  countryCode: z.string().default('+91'),
  phoneNumber: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.enum(['website', 'email', 'campaign', 'cold_call', 'referral', 'event', 'other']),
  status: z.enum(['new']),
  tags: z.array(z.string()).default([]),
  score: z.number().min(0).max(100).default(50),
}).superRefine((obj, ctx) => {
  const cc = obj.countryCode || '+91';
  const rule = getPhoneRule(cc);
  const phone = (obj.phoneNumber || '').replace(/\D/g, '');
  if (phone && !rule.regex.test(phone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message, path: ['phoneNumber'] });
  }
});

type LeadFormData = z.infer<typeof leadSchema>;

const LeadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [serverErrors, setServerErrors] = React.useState<Record<string, string>>({});
  
  const watchedCountryCode = watch('countryCode');
  const phoneRule = getPhoneRule(watchedCountryCode || '+91');

  const { data: leadData, isLoading: leadLoading } = useLead(id!, { enabled: isEditing });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const lead = leadData?.data;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: 'website',
      status: 'new',
      score: 50,
      tags: [],
      countryCode: '+91',
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (isEditing && lead) {
      reset({
        name: lead.name,
        email: lead.email,
        countryCode: lead.countryCode || '+91',
        phoneNumber: lead.phoneNumber || '',
        company: lead.company || '',
        title: lead.title || '',
        source: lead.source,
        status: lead.status,
        tags: lead.tags,
        score: lead.score,
      });
    }
  }, [lead, isEditing, reset]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (isEditing && id) {
        await updateLead.mutateAsync({ id, data });
        // Navigate back to leads list instead of detail view to see the updated list
        navigate('/crm/Leads');
      } else {
        const result = await createLead.mutateAsync(data);
        navigate(`/crm/Leads/${result.data.id}`);
      }
    } catch (error: any) {
      logger.error('Error saving lead:', error);
      // Clear previous server errors
      setServerErrors({});
      
      const errorMessage = error?.message || 'An error occurred while saving the lead';
      
      // Check if it's a duplicate email error
      if (errorMessage.includes('email address already exists')) {
        setServerErrors({ email: errorMessage });
      }
      
      // Show error message to user
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(errorMessage);
      });
    }
  };

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'email', label: 'Email' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'referral', label: 'Referral' },
    { value: 'event', label: 'Event' },
    { value: 'other', label: 'Other' },
  ];

  // Show only "New" status when creating a lead; show full list when editing
  // Only "New" is allowed for Lead status
  const statusOptions = [
    { value: 'new', label: 'New' },
  ];

  if (isEditing && leadLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
            to={isEditing ? `/crm/Leads/${id}` : '/crm/Leads'}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Lead' : 'New Lead'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update lead information' : 'Add a new lead to your CRM'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder="Enter full name"
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    {...register('email', {
                      onChange: () => {
                        if (serverErrors.email) {
                          setServerErrors(prev => ({ ...prev, email: '' }));
                        }
                      }
                    })}
                    error={errors.email?.message || serverErrors.email}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                    <select
                      {...register('countryCode', {
                        onChange: () => {
                          // Re-validate phone number when country code changes
                          setTimeout(() => {
                            import('react-hook-form').then(({ trigger }) => {
                              // trigger('phoneNumber');
                            });
                          }, 0);
                        }
                      })}
                      className="w-full h-10 min-w-[140px] px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+49">+49 (Germany)</option>
                    </select>
                  </div>
                  <Input
                    label="Phone Number"
                    type="tel"
                    {...register('phoneNumber')}
                    error={errors.phoneNumber?.message}
                    placeholder={getPhonePlaceholder(watchedCountryCode || '+91')}
                    maxLength={phoneRule.maxLength}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                  />
                </div>
                
                <Input
                  label="Company"
                  {...register('company')}
                  error={errors.company?.message}
                  placeholder="Enter company name"
                />

                <Input
                  label="Job Title"
                  {...register('title')}
                  error={errors.title?.message}
                  placeholder="Enter job title"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source *
                    </label>
                    <select
                      {...register('source')}
                      className="w-full h-10 min-w-[140px] px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {sourceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.source && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.source.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    {/* Hidden field to submit value, and read-only display */}
                    <input type="hidden" value="new" {...register('status')} />
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                      New
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      {...register('score', { valueAsNumber: true })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span className="font-medium text-primary-600">
                        {watch('score')}
                      </span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {watch('score')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {watch('score') >= 80 ? 'Hot Lead' : 
                       watch('score') >= 60 ? 'Warm Lead' : 'Cold Lead'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Add tags (comma separated)"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setValue('tags', tags);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {watch('tags')?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = watch('tags').filter((_, i) => i !== index);
                            setValue('tags', newTags);
                          }}
                          className="ml-1 text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEditing ? `/crm/Leads/${id}` : '/crm/Leads')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default LeadForm;
