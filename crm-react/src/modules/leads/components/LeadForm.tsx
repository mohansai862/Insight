import { logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { useAppSelector } from '@/lib/store';
import type { LeadRow } from '../LeadsManagement';

const countries = ['India', 'United States', 'UK', 'Germany'];

const leadFormSchema = z.object({
  source: z.enum(['website', 'email', 'campaign', 'cold_call', 'referral', 'event', 'other']).default('website'),
  firstName: z.string()
    .min(1, 'First name is required')
    .refine((val) => val.trim().length > 0, 'First name cannot be only spaces')
    .refine((val) => !/\d/.test(val), 'First name cannot contain numbers'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .refine((val) => val.trim().length > 0, 'Last name cannot be only spaces')
    .refine((val) => !/\d/.test(val), 'Last name cannot contain numbers'),
  companyName: z.string()
    .min(1, 'Company name is required')
    .refine((val) => val.trim().length > 0, { message: 'Company name cannot be empty or contain only spaces' }),
  designation: z.string()
    .min(1, 'Designation is required')
    .refine((val) => val.trim().length > 0, { message: 'Designation cannot be empty or contain only spaces' }),
  email: z.string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  countryCode: z.string().optional(),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .refine((val) => /^\d{10,15}$/.test(val), { message: 'Phone number must contain only digits (10-15)' }),
  linkedIn: z.string().optional(),
  industry: z.string().min(1, 'Industry is required')
  .refine((val) => val.trim().length > 0 , { message: 'Industry cannot be empty or contain only spaces'}),
  country: z.string().min(1, 'Country is required'),
  companyLocation: z.string()
    .min(1, 'Company location is required')
    .refine((val) => val.trim().length > 0, { message: 'Company location cannot be empty or contain only spaces' }),
  customerLocation: z.string()
    .min(1, 'Customer location is required')
    .refine((val) => val.trim().length > 0, { message: 'Customer location cannot be empty or contain only spaces' }),
  technologies: z.string()
    .min(1, 'Technologies is required')
    .refine((val) => val.trim().length > 0, { message: 'Technologies cannot be empty or contain only spaces' }),
  prospectValue: z.coerce.number()
    .min(0, 'Prospect value must be 0 or greater')
    .refine((val) => !isNaN(val), { message: 'Prospect value must be a valid number' }),
  numberOfEmployees: z.coerce.number()
    .min(1, 'Number of employees is required')
    .refine((val) => Number.isInteger(val) && val > 0, { message: 'Number of employees must be a positive integer' }),
  decisionAuthority: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormValues) => Promise<void>;
  editingLead?: LeadRow | null;
  isSubmitting?: boolean;
}

const DynamicLeadSourceSelect: React.FC<{ register: any }> = ({ register }) => {
  return (
    <select
      {...register('source', { required: true })}
      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      defaultValue="website"
    >
      <option value="website">Website</option>
      <option value="email">Email</option>
      <option value="campaign">Campaign</option>
      <option value="cold_call">Cold Call</option>
      <option value="referral">Referral</option>
      <option value="event">Event</option>
      <option value="other">Other</option>
    </select>
  );
};

export const LeadForm: React.FC<LeadFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingLead,
  isSubmitting = false,
}) => {
  const isEditMode = !!editingLead;
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const [formValues, setFormValues] = React.useState<any>({
    source: 'website',
    status: 'new',
    country: 'India',
    countryCode: '+91',
    firstName: '',
    lastName: '',
    companyName: '',
    designation: '',
    email: '',
    phoneNumber: '',
    companyLocation: '',
    customerLocation: '',
    technologies: '',
    industry: '',
    prospectValue: 0,
    numberOfEmployees: 0,
  });
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = React.useState<Record<string, string>>({});

  const methods = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onChange',
    criteriaMode: 'all',
    defaultValues: {
      source: 'website',
      status: 'new',
      country: 'India',
      countryCode: '+91',
    },
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = methods;

  const validateField = (name: string, value: any) => {
    logger.info('validateField called:', name, value);
    let error = '';
    
    if (name === 'firstName' || name === 'lastName') {
      if (!value || value.trim().length === 0) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (/\d/.test(value)) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name cannot contain numbers`;
      }
    } else if (name === 'companyName' || name === 'designation' || name === 'companyLocation' || name === 'customerLocation' || name === 'technologies' || name === 'industry') {
      if (!value || value.trim().length === 0) {
        const fieldName = name.replace(/([A-Z])/g, ' $1').trim();
        error = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
    } else if (name === 'email') {
      if (!value || value.trim().length === 0) {
        error = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Enter a valid email address';
      }
    } else if (name === 'phoneNumber') {
      if (!value || value.trim().length === 0) {
        error = 'Phone number is required';
      } else if (!/^\d{10,15}$/.test(value)) {
        error = 'Phone number must contain only digits (10-15)';
      }
    } else if (name === 'prospectValue') {
      if (value < 0) {
        error = 'Prospect value must be 0 or greater';
      }
    } else if (name === 'numberOfEmployees') {
      if (value < 1 || !Number.isInteger(Number(value))) {
        error = 'Number of employees must be a positive integer';
      }
    } else if (name === 'decisionAuthority') {
      // Skip validation for decision authority - it's optional
      return;
    }
    
    logger.info('Setting error for', name, ':', error);
    setValidationErrors(prev => {
      const newErrors = { ...prev, [name]: error };
      // Clear error if validation passes
      if (!error) {
        delete newErrors[name];
      }
      logger.info('All errors:', newErrors);
      return newErrors;
    });
  };

  const handleInputChange = (name: string, value: any) => {
    logger.info('handleInputChange called:', name, value);
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Reset form when modal opens/closes or editing lead changes
  React.useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      setServerErrors({});
      if (editingLead) {
        const editValues = {
          source: editingLead.source || 'website',
          firstName: editingLead.firstName || '',
          lastName: editingLead.lastName || '',
          companyName: editingLead.companyName || '',
          designation: editingLead.designation || '',
          email: editingLead.email || '',
          countryCode: editingLead.countryCode || '+91',
          phoneNumber: editingLead.phoneNumber || '',
          linkedIn: editingLead.linkedIn || '',
          industry: editingLead.industry || '',
          country: editingLead.country || 'India',
          companyLocation: editingLead.companyLocation || '',
          customerLocation: editingLead.customerLocation || '',
          technologies: editingLead.technologies || '',
          prospectValue: editingLead.prospectValue || 0,
          numberOfEmployees: editingLead.numberOfEmployees || 0,
          decisionAuthority: editingLead.decisionAuthority || '',
          status: editingLead.status || 'new',
        };
        setFormValues(editValues);
        reset(editValues);
      } else {
        const defaultValues = {
          source: 'website',
          status: 'new',
          country: 'India',
          countryCode: '+91',
          firstName: '',
          lastName: '',
          companyName: '',
          designation: '',
          email: '',
          phoneNumber: '',
          companyLocation: '',
          customerLocation: '',
          technologies: '',
          industry: '',
          prospectValue: 0,
          numberOfEmployees: 0,
          decisionAuthority: '',
        };
        setFormValues(defaultValues);
        reset(defaultValues);
      }
    }
  }, [isOpen, editingLead, reset]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur();
    
    // Validate all fields before submission
    const fieldsToValidate = [
      'firstName', 'lastName', 'companyName', 'designation', 'email', 
      'phoneNumber', 'industry', 'companyLocation', 'customerLocation', 
      'technologies', 'prospectValue', 'numberOfEmployees'
    ];
    
    let hasErrors = false;
    const newErrors: Record<string, string> = {};
    
    fieldsToValidate.forEach(field => {
      const value = formValues[field];
      
      if (field === 'firstName' || field === 'lastName') {
        if (!value || value.trim().length === 0) {
          newErrors[field] = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
          hasErrors = true;
        } else if (/\d/.test(value)) {
          newErrors[field] = `${field === 'firstName' ? 'First' : 'Last'} name cannot contain numbers`;
          hasErrors = true;
        }
      } else if (['companyName', 'designation', 'companyLocation', 'customerLocation', 'technologies', 'industry'].includes(field)) {
        if (!value || value.trim().length === 0) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
          newErrors[field] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
          hasErrors = true;
        }
      } else if (field === 'email') {
        if (!value || value.trim().length === 0) {
          newErrors[field] = 'Email is required';
          hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field] = 'Enter a valid email address';
          hasErrors = true;
        }
      } else if (field === 'phoneNumber') {
        if (!value || value.trim().length === 0) {
          newErrors[field] = 'Phone number is required';
          hasErrors = true;
        } else if (!/^\d{10,15}$/.test(value)) {
          newErrors[field] = 'Phone number must contain only digits (10-15)';
          hasErrors = true;
        }
      } else if (field === 'prospectValue') {
        if (value < 0) {
          newErrors[field] = 'Prospect value must be 0 or greater';
          hasErrors = true;
        }
      } else if (field === 'numberOfEmployees') {
        if (value < 1 || !Number.isInteger(Number(value))) {
          newErrors[field] = 'Number of employees must be a positive integer';
          hasErrors = true;
        }
      }
    });
    
    setValidationErrors(newErrors);
    if (hasErrors) {
      requestAnimationFrame(() => {
        submitButtonRef.current?.focus();
      });
      return;
    }
    
    // if (hasErrors) {
    //   import('react-hot-toast').then(({ default: toast }) => {
    //     toast.error('Please correct the highlighted fields before saving.');
    //   });
    //   return;
    // }
    
    try {
      const validated = await leadFormSchema.parseAsync(formValues);
      await onSubmit(validated);
      if (!isEditMode) {
        const defaultValues = {
          source: 'website',
          status: 'new',
          country: 'India',
          countryCode: '+91',
          firstName: '',
          lastName: '',
          companyName: '',
          designation: '',
          email: '',
          phoneNumber: '',
          companyLocation: '',
          customerLocation: '',
          technologies: '',
          industry: '',
          prospectValue: 0,
          numberOfEmployees: 0,
          decisionAuthority: '',
        };
        setFormValues(defaultValues);
        setValidationErrors({});
        reset(defaultValues);
      }
      onClose();
    } catch (error: any) {
      logger.error('Submission error:', error);
      
      let errorMessage = 'An error occurred while saving the lead';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Parse JSON error messages if they exist
      if (typeof errorMessage === 'string' && errorMessage.includes('{"errors":{')) {
        try {
          const parsed = JSON.parse(errorMessage.replace(/&quot;/g, '"'));
          if (parsed.errors) {
            // Extract individual field errors and show them as separate toast messages
            const fieldErrors = Object.entries(parsed.errors);
            import('react-hot-toast').then(({ default: toast }) => {
              fieldErrors.forEach(([field, message]) => {
                toast.error(`${field}: ${message}`);
              });
            });
            return; // Keep modal open
          }
        } catch (parseError) {
          // If parsing fails, fall back to original message
          logger.warn('Failed to parse error message:', parseError);
        }
      }
      
      // Check if it's a duplicate email error
      if (errorMessage.includes('email address already exists')) {
        setServerErrors({ email: errorMessage });
      } else {
        // Show generic error message
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(errorMessage);
        });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Lead" : "Add Lead"}
      size="xl"
    >
      <ModalContent>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lead Source *
              </label>
              <DynamicLeadSourceSelect register={register} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lead Status *
              </label>
              {isEditMode ? (
                formValues.status === 'converted' ? (
                  <>
                    <input type="hidden" value="converted" {...register('status')} />
                    <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Converted
                    </div>
                  </>
                ) : (
                  <select
                    {...register('status')}
                    value={formValues.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {(() => {
                      const statusOrder = ['new', 'contacted', 'qualified', 'unqualified'];
                      const currentIndex = statusOrder.indexOf(formValues.status);
                      const availableStatuses = statusOrder.slice(currentIndex >= 0 ? currentIndex : 0);
                      
                      return availableStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ));
                    })()} 
                  </select>
                )
              ) : (
                <>
                  <input type="hidden" value="new" {...register('status')} />
                  <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    New
                  </div>
                </>
              )}
            </div>

            <Input
              label="First Name *"
              value={formValues.firstName}
              onChange={(e) => {
                logger.info('Input onChange event fired!', e.target.value);
                handleInputChange('firstName', e.target.value);
              }}
              onInput={(e: any) => logger.info('onInput fired:', e.target.value)}
              onKeyUp={(e: any) => logger.info('onKeyUp fired:', e.target.value)}
              error={validationErrors.firstName}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name *"
              value={formValues.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={validationErrors.lastName}
              placeholder="Enter last name"
            />

            <Input
              label="Company Name *"
              value={formValues.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              error={validationErrors.companyName}
              placeholder="Enter company name"
            />
            <Input
              label="Designation *"
              value={formValues.designation}
              onChange={(e) => handleInputChange('designation', e.target.value)}
              error={validationErrors.designation}
              placeholder="Enter designation"
            />

            <Input
              label="Email *"
              type="email"
              value={formValues.email}
              onChange={(e) => {
                handleInputChange('email', e.target.value);
                // Clear server error when user starts typing
                if (serverErrors.email) {
                  setServerErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              error={validationErrors.email || serverErrors.email}
              placeholder="Enter email"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country Code
              </label>
              <select
                {...register('countryCode')}
                value={formValues.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="+91">+91 (India)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+49">+49 (Germany)</option>
              </select>
              {errors.countryCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.countryCode.message}</p>
              )}
            </div>
            <Input
              label="Phone Number *"
              value={formValues.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              error={validationErrors.phoneNumber}
              placeholder="Digits only (10–15)"
            />

            <Input
              label="LinkedIn (URL)"
              {...register('linkedIn')}
              error={errors.linkedIn?.message}
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              label="Industry *"
              value={formValues.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              onBlur={(e) => validateField('industry', e.target.value)}
              error={validationErrors.industry}
              placeholder="e.g., SaaS"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country *
              </label>
              <select
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country.message}</p>
              )}
            </div>

            <Input
              label="Company Location *"
              value={formValues.companyLocation}
              onChange={(e) => handleInputChange('companyLocation', e.target.value)}
              onBlur={(e) => validateField('companyLocation', e.target.value)}
              error={validationErrors.companyLocation}
              placeholder="e.g., Mumbai, India"
            />

            <Input
              label="Customer Location *"
              value={formValues.customerLocation}
              onChange={(e) => handleInputChange('customerLocation', e.target.value)}
              error={validationErrors.customerLocation}
              placeholder="e.g., Mumbai, India"
            />

            <Input
              label="Technologies *"
              value={formValues.technologies}
              onChange={(e) => handleInputChange('technologies', e.target.value)}
              error={validationErrors.technologies}
              placeholder="e.g., Java, React"
            />

            <Input
              label="Prospect Value *"
              type="number"
              step="0.01"
              value={formValues.prospectValue}
              onChange={(e) => handleInputChange('prospectValue', parseFloat(e.target.value) || 0)}
              error={validationErrors.prospectValue}
              placeholder="Enter prospect value"
              leftIcon={<span className="text-gray-500">$</span>}
            />

            <Input
              label="Number of Employees *"
              type="number"
              value={formValues.numberOfEmployees}
              onChange={(e) => handleInputChange('numberOfEmployees', parseInt(e.target.value) || 0)}
              error={validationErrors.numberOfEmployees}
              placeholder="e.g., 50"
            />

            <Input
              label="Decision Authority"
              {...register('decisionAuthority')}
              error={errors.decisionAuthority?.message}
              placeholder="e.g., CTO"
            />


          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} ref={submitButtonRef}>
              {isEditMode ? 'Update Lead' : 'Save Lead'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
