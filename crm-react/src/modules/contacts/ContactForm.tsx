import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Contact Form
 * Create and edit contact form with validation
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/lib/store';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Tag,
  ChevronDown,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { useContact, useUpdateContact } from '@/hooks/useApi';
import { contactsApi } from '@/api/contactsApi';
import { environment } from '@/lib/environment';
import toast from 'react-hot-toast';

// Phone Number Input Component with Country Code
const PhoneNumberInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const [selectedCountry, setSelectedCountry] = React.useState('India');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const countryCodeMap: Record<string, { code: string; digits: number; flag: string }> = {
    'India': { code: '+91', digits: 10, flag: '🇮🇳' },
    'United States': { code: '+1', digits: 10, flag: '🇺🇸' },
    'United Kingdom': { code: '+44', digits: 10, flag: '🇬🇧' },
    'Germany': { code: '+49', digits: 11, flag: '🇩🇪' },
  };

  const getCountryCode = (country: string) => countryCodeMap[country]?.code || '+91';
  const getRequiredDigits = (country: string) => countryCodeMap[country]?.digits || 10;

  // Initialize country based on existing phone number
  React.useEffect(() => {
    if (value && !isInitialized) {
      // Detect country from existing phone number
      if (value.startsWith('+1 ')) {
        setSelectedCountry('United States');
      } else if (value.startsWith('+44 ')) {
        setSelectedCountry('United Kingdom');
      } else if (value.startsWith('+49 ')) {
        setSelectedCountry('Germany');
      } else if (value.startsWith('+91 ')) {
        setSelectedCountry('India');
      } else {
        // If no country code format, assume it's just digits and default to India
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length >= 10) {
          setSelectedCountry('India');
          // Format the existing number with country code for consistency
          onChange(`+91 ${digitsOnly}`);
        }
      }
      setIsInitialized(true);
    }
  }, [value, isInitialized, onChange]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const requiredDigits = getRequiredDigits(selectedCountry);

    // Extract only digits from input
    const digitsOnly = inputValue.replace(/\D/g, '');

    // Limit to required digits for the country
    const phoneDigits = digitsOnly.slice(0, requiredDigits);

    // Store the full format but display only digits in input
    const countryCode = getCountryCode(selectedCountry);
    const fullValue = phoneDigits ? `${countryCode} ${phoneDigits}` : `${countryCode} `;
    onChange(fullValue);
  };

  // Get display value (only digits)
  const getDisplayValue = () => {
    if (!value) return '';
    // If value has country code format (+91 1234567890), extract digits after space
    if (value.includes(' ')) {
      return value.split(' ')[1] || '';
    }
    // If value is just digits without country code, return as is
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly;
  };

  // Update phone number when country changes (but not during initialization)
  React.useEffect(() => {
    if (isInitialized && value) {
      const countryCode = getCountryCode(selectedCountry);
      const currentDigits = getDisplayValue();
      if (currentDigits) {
        onChange(`${countryCode} ${currentDigits}`);
      }
    }
  }, [selectedCountry, isInitialized]);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 z-10">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <span>{getCountryCode(selectedCountry)}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <input
          type="tel"
          value={getDisplayValue()}
          onChange={handlePhoneChange}
          placeholder="1234567890"
          className={`w-full pl-20 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white ${error ? 'border-red-300' : ''
            }`}
        />
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {Object.keys(countryCodeMap).map(country => (
              <button
                key={country}
                type="button"
                onClick={() => {
                  setSelectedCountry(country);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
              >
                <span>{countryCodeMap[country].flag}</span>
                <span>{countryCodeMap[country].code}</span>
                <span className="text-gray-500">{country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-1 mt-1">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}
    </div>
  );
};

const REQUIRED_MESSAGE = 'This field is required';

// Form validation schema
const contactSchema = z.object({
  name: z.string()
    .min(1, REQUIRED_MESSAGE)
    .refine(val => val.trim().length > 0, REQUIRED_MESSAGE)
    .refine(val => !/^\s+$/.test(val), REQUIRED_MESSAGE)
    .refine(val => /^[a-zA-Z\s]+$/.test(val), 'Full Name cannot contain numbers or special characters'),
  email: z.string()
    .min(1, REQUIRED_MESSAGE)
    .email('Email Address should be a valid email format'),
  phoneNumber: z.string()
    .min(1, REQUIRED_MESSAGE)
    .refine(val => {
      if (!val || !val.startsWith('+')) return false;
      const parts = val.split(' ');
      if (parts.length !== 2) return false;
      const countryCode = parts[0];
      const phoneDigits = parts[1];

      // Validate based on country code
      if (countryCode === '+91' && phoneDigits?.length === 10) return true;
      if (countryCode === '+1' && phoneDigits?.length === 10) return true;
      if (countryCode === '+44' && (phoneDigits?.length === 10 || phoneDigits?.length === 11)) return true;
      if (countryCode === '+49' && (phoneDigits?.length === 10 || phoneDigits?.length === 11)) return true;

      return false;
    }, 'Please enter a valid phone number for the selected country'),
  company: z.string()
    .min(1, REQUIRED_MESSAGE)
    .refine(val => val.trim().length > 0, REQUIRED_MESSAGE)
    .refine(val => !/^\s+$/.test(val), REQUIRED_MESSAGE),
  title: z.string()
    .min(1, REQUIRED_MESSAGE)
    .refine(val => val.trim().length > 0, REQUIRED_MESSAGE)
    .refine(val => !/^\s+$/.test(val), REQUIRED_MESSAGE)
    .refine(val => !/^[^a-zA-Z0-9\s]+$/.test(val.trim()), 'Job Title cannot contain only special characters'),
  location: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  remarks: z.string().max(200, 'Maximum 200 characters allowed').optional(),
  reassignTo: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data, isLoading } = useContact(id!);
  const contact = data?.data;
  const updateContact = useUpdateContact();

  // State for company dropdown
  const [availableAccounts, setAvailableAccounts] = React.useState<any[]>([]);
  const [selectedCompanyType, setSelectedCompanyType] = React.useState<'existing' | 'new'>('existing');
  const [companySearchMode, setCompanySearchMode] = React.useState(false);
  const [loadingAccounts, setLoadingAccounts] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<any>(null);
  const [availableLocations, setAvailableLocations] = React.useState<string[]>([]);
  const [salesExecutives, setSalesExecutives] = React.useState<any[]>([]);
  const [loadingSalesExecs, setLoadingSalesExecs] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const companyOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const companyInputRef = React.useRef<HTMLInputElement>(null);

  // Dropdown states
  const [companyDropdownOpen, setCompanyDropdownOpen] = React.useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = React.useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const locationDropdownRef = React.useRef<HTMLDivElement>(null);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    clearErrors,
    setError,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    shouldFocusError: false,
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      company: '',
      title: '',
      location: '',
      type: 'lead',
      status: 'active',
    },
  });

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleFormError = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    requestAnimationFrame(() => {
      submitButtonRef.current?.focus();
    });
  };

  const normalizeErrorMessage = (message?: string) => {
    if (!message) return message;
    const trimmed = message.trim().toLowerCase();
    if (trimmed === 'required') return REQUIRED_MESSAGE;
    return message;
  };

  // Unsaved changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [initialFormValues, setInitialFormValues] = React.useState<ContactFormData | null>(null);

  // Track form changes for unsaved changes detection
  React.useEffect(() => {
    if (isEditing && initialFormValues) {
      const currentValues = watch();
      const hasChanges = Object.keys(currentValues).some(key => {
        const currentValue = currentValues[key as keyof ContactFormData];
        const initialValue = initialFormValues[key as keyof ContactFormData];
        return currentValue !== initialValue;
      });
      setHasUnsavedChanges(hasChanges);
    }
  }, [watch(), isEditing, initialFormValues]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && companyDropdownOpen) {
        setCompanyDropdownOpen(false);
        setCompanySearchMode(false);
        setHighlightedIndex(-1);
      }
    };

    if (companyDropdownOpen || locationDropdownOpen || typeDropdownOpen || statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [companyDropdownOpen, locationDropdownOpen, typeDropdownOpen, statusDropdownOpen]);

  // Filter companies based on input value
  const filteredAccounts = React.useMemo(() => {
    const searchQuery = watch('company') || '';
    if (!searchQuery.trim()) return availableAccounts;
    return availableAccounts.filter(account =>
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableAccounts, watch('company')]);

  // Check if current user is manager/admin for reassignment feature
  const currentRole = (() => {
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      try {
        const u = JSON.parse(session);
        return u.role || 'Sales_Executive';
      } catch { }
    }
    return 'Sales_Executive';
  })();
  const canReassign = ['Sales_Manager', 'Sales_VP', 'IT_Admin'].includes(currentRole);

  const formData = watch();
  const { theme } = useAppSelector(state => state.preferences);

  // Get current user for user-specific storage
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 'anonymous';
  const userSpecificKey = `contactFormDraft_${userId}`;

  const isFormInitialized = React.useRef(false);
  const wasSuccessfullySubmitted = React.useRef(false);

  // Update persisted values when form data changes (user-specific)
  React.useEffect(() => {
    if (!isEditing && isFormInitialized.current && !wasSuccessfullySubmitted.current) {
      const hasData = Object.values(formData).some(value => value && String(value).trim() !== '');
      if (hasData) {
        localStorage.setItem(userSpecificKey, JSON.stringify(formData));
      }
    }
  }, [formData, isEditing, userSpecificKey]);

  // Track theme changes to restore form data only when theme actually changes
  const lastTheme = React.useRef<string>('');

  React.useEffect(() => {
    if (lastTheme.current && lastTheme.current !== theme.mode && !isEditing && isFormInitialized.current) {
      // Theme changed, restore from localStorage
      const savedData = localStorage.getItem(userSpecificKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          Object.keys(parsedData).forEach(key => {
            setValue(key as keyof ContactFormData, parsedData[key]);
          });
        } catch (e) {
          logger.error('Failed to restore form data');
        }
      }
    }
    lastTheme.current = theme.mode;
  }, [theme.mode, isEditing, setValue, userSpecificKey]);

  // Load available accounts on component mount
  React.useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const session = localStorage.getItem('tech_tammina_session');
        let userId = '1';
        let userRole = 'Sales_Executive';

        if (session) {
          try {
            const u = JSON.parse(session);
            userId = u.id || '1';
            userRole = u.role || 'Sales_Executive';
          } catch { }
        }

        const response = await fetch(`${environment.apiURL}/contacts/available-accounts?filterByOwner=${userRole === 'Sales_Executive'}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-User-Role': userRole,
          },
        });

        if (response.ok) {
          const accounts = await response.json();
          console.log('Available accounts from backend:', accounts);
          setAvailableAccounts(accounts || []);
        } else {
          throw new Error('Failed to fetch accounts');
        }
      } catch (error) {
        logger.error('Error loading accounts:', error);
        toast.error('Failed to load company accounts');
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);



  // Load saved form data on mount (only once)
  React.useEffect(() => {
    if (!isEditing && !isFormInitialized.current) {
      // Check if we're coming from a successful submission
      const wasJustSubmitted = sessionStorage.getItem(`contactJustCreated_${userId}`);
      if (wasJustSubmitted) {
        sessionStorage.removeItem(`contactJustCreated_${userId}`);
        localStorage.removeItem(userSpecificKey);
      } else {
        const savedData = localStorage.getItem(userSpecificKey);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            reset(parsedData);
          } catch (e) {
            logger.error('Failed to parse saved form data');
          }
        }
      }
      isFormInitialized.current = true;
    }
  }, [isEditing, reset, userSpecificKey, userId]);

  // Clear form data on logout detection
  React.useEffect(() => {
    const clearFormDataOnLogout = () => {
      if (!isEditing && !wasSuccessfullySubmitted.current) {
        localStorage.removeItem(userSpecificKey);
      }
    };

    // Listen for storage changes (logout detection)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tech_tammina_authenticated' && e.newValue === null) {
        clearFormDataOnLogout();
      }
    };

    // Listen for beforeunload to catch logout
    const handleBeforeUnload = () => {
      if (!localStorage.getItem('tech_tammina_authenticated')) {
        clearFormDataOnLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final cleanup check
      if (!isEditing && !wasSuccessfullySubmitted.current && !localStorage.getItem('tech_tammina_authenticated')) {
        clearFormDataOnLogout();
      }
    };
  }, [userSpecificKey, isEditing]);





  // Reset form with contact data when editing
  React.useEffect(() => {
    if (isEditing && contact) {
      console.log('Contact data received:', contact);
      console.log('Country code:', contact.countryCode);
      console.log('Phone number:', contact.phoneNumber);
      
      // Combine country code and phone number for the form
      const phoneNumber = contact.countryCode && contact.phoneNumber 
        ? `${contact.countryCode} ${contact.phoneNumber}`
        : contact.phoneNumber || '';
      
      console.log('Combined phone number:', phoneNumber);
      
      const formData = {
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        email: contact.email,
        phoneNumber,
        company: contact.companyName || '',
        title: contact.designation || '',
        location: contact.location || '',
        type: contact.type as any,
        status: contact.status as any,
        remarks: contact.remarks || '',
      };
      reset(formData, { keepErrors: false, keepDirty: false, keepTouched: false });
      setInitialFormValues(formData);
      setHasUnsavedChanges(false);
    }
  }, [contact, isEditing, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Validate company exists when creating new contact
      if (!isEditing) {
        const companyExists = availableAccounts.find(acc => acc.accountName === data.company);
        if (!companyExists) {
          setError('company', { 
            type: 'manual', 
            message: 'Please select a valid company from the list' 
          });
          toast.error('Please select a valid company from the list');
          return;
        }
      }

      // Determine if we're creating a new company or using existing
      const isNewCompany = selectedCompanyType === 'new' || !availableAccounts.find(acc => acc.accountName === data.company);

      // Split name into first and last name
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Split phone number into country code and number
      const phoneParts = data.phoneNumber.split(' ');
      const countryCode = phoneParts[0] || '+91';
      const phoneNumber = phoneParts[1] || '';

      const contactData = {
        firstName,
        lastName,
        email: data.email,
        countryCode,
        phoneNumber,
        companyName: data.company,
        designation: data.title,
        linkedin: '',
        type: data.type || 'lead',
        status: data.status || 'active',
        remarks: data.remarks || '',
        industry: 'General',
        country: 'Unknown',
        city: 'Unknown',
        // Add accountId if existing company is selected
        ...(selectedAccount && { accountId: selectedAccount.accountId }),
      };

      if (isEditing && id) {
        await contactsApi.update(id, contactData);
        toast.success('Contact updated successfully');
      } else {
        // Use smart creation for new contacts
        const response = await fetch(`${environment.apiURL}/contacts/smart-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(() => {
              const session = localStorage.getItem('tech_tammina_session');
              if (session) {
                try {
                  const u = JSON.parse(session);
                  return {
                    'X-User-Id': u.id || '',
                    'X-User-Role': u.role || '',
                  };
                } catch { }
              }
              return {};
            })()
          },
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to create contact' }));

          // Handle validation errors
          if (errorData.errors) {
            // Set field-level errors from backend validation
            Object.keys(errorData.errors).forEach(field => {
              const message = normalizeErrorMessage(errorData.errors[field]);
              if (field === 'firstName' || field === 'lastName') {
                // Map firstName/lastName errors to 'name' field
                setError('name', { type: 'manual', message });
              } else if (field === 'designation') {
                // Map designation to 'title' field
                setError('title', { type: 'manual', message });
              } else if (field === 'companyName') {
                // Map companyName to 'company' field
                setError('company', { type: 'manual', message });
              } else {
                // Direct mapping for other fields
                setError(field as keyof ContactFormData, { type: 'manual', message });
              }
            });
            return; // Don't show toast, field errors are displayed
          }

          // Handle specific error messages from backend
          const errorMessage = errorData.message || 'Failed to create contact';
          if (errorMessage === 'Email already exists') {
            setError('email', { type: 'manual', message: 'Email already exists' });
            return; // Don't show toast, field error is displayed
          }

          throw new Error(errorMessage);
        }

        toast.success('Contact created successfully');
      }

      // Mark as successfully submitted and clear saved data
      wasSuccessfullySubmitted.current = true;
      sessionStorage.setItem(`contactJustCreated_${userId}`, 'true');
      localStorage.removeItem(`lastContactsRoute_${userId}`);
      localStorage.removeItem(userSpecificKey);
      setHasUnsavedChanges(false);
      navigate('/crm/Contacts', { replace: true });
    } catch (error) {
      logger.error('Error saving contact:', error);
      const errorMessage = error?.message || 'Failed to save contact';

      // Show appropriate error message
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('Contact already exists with the same email');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      if (!isEditing) {
        localStorage.removeItem(userSpecificKey);
      }
      navigate('/crm/Contacts');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    if (!isEditing) {
      localStorage.removeItem(userSpecificKey);
    }
    navigate('/crm/Contacts');
  };

  if (isEditing && isLoading) {
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
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            as={Link}
            to="/crm/Contacts"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className=""
            onClick={() => {
              if (!isEditing) {
                localStorage.removeItem(userSpecificKey);
              }
            }}
          >
            {/* Back */}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Contact' : 'New Contact'}
            </h1>
            {/* <p className="text-gray-600 mt-1">
              {isEditing ? 'Update contact information' : ''}
            </p> */}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} noValidate className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      {...register('name')}
                      placeholder="Enter full name"
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setValue('name', value);
                      }}
                      onKeyDown={(e) => {
                        if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      error={normalizeErrorMessage(errors.name?.message)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="Enter email address"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={normalizeErrorMessage(errors.email?.message)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <PhoneNumberInput
                      value={watch('phoneNumber') || ''}
                      onChange={(value) => {
                        setValue('phoneNumber', value);
                        clearErrors('phoneNumber');
                      }}
                      error={normalizeErrorMessage(errors.phoneNumber?.message)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <Input
                      {...register('title')}
                      placeholder="Enter job title"
                      onChange={(e) => {
                        // Prevent only special characters but allow mixed content
                        const value = e.target.value;
                        if (!/^[^a-zA-Z0-9\s]+$/.test(value) || value === '') {
                          setValue('title', value);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent typing if it would result in only special characters
                        const currentValue = watch('title') || '';
                        const newValue = currentValue + e.key;
                        if (/^[^a-zA-Z0-9\s]+$/.test(newValue) && !/[a-zA-Z0-9\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      error={normalizeErrorMessage(errors.title?.message)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="flex items-center w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm">{watch('company') || 'Company name'}</span>
                        </div>
                        <input type="hidden" {...register('company')} value={watch('company') || ''} />
                      </div>
                    ) : (
                      <div ref={companyDropdownRef}>
                        <div className="relative">
                          <input
                            ref={companyInputRef}
                            type="text"
                            value={watch('company') || ''}
                            onChange={(e) => {
                              setValue('company', e.target.value);
                              setCompanyDropdownOpen(true);
                              setHighlightedIndex(-1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlightedIndex(prev => {
                                  const newIndex = prev < filteredAccounts.length - 1 ? prev + 1 : prev;
                                  setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                  return newIndex;
                                });
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlightedIndex(prev => {
                                  const newIndex = prev > 0 ? prev - 1 : -1;
                                  setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                  return newIndex;
                                });
                              } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                e.preventDefault();
                                const account = filteredAccounts[highlightedIndex];
                                setValue('company', account.accountName);
                                clearErrors('company');
                                setSelectedCompanyType('existing');
                                setSelectedAccount(account);
                                const location = account.companyLocation && account.country
                                  ? `${account.companyLocation}, ${account.country}`
                                  : account.companyLocation || account.country || 'Not Available';
                                setValue('location', location);
                                clearErrors('location');
                                setCompanyDropdownOpen(false);
                                setHighlightedIndex(-1);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setCompanyDropdownOpen(false);
                                setCompanySearchMode(false);
                                setHighlightedIndex(-1);
                              } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                                setCompanySearchMode(true);
                              }
                            }}
                            onClick={() => {
                              setCompanyDropdownOpen(!companyDropdownOpen);
                              if (!companyDropdownOpen) {
                                setCompanySearchMode(false);
                                setHighlightedIndex(-1);
                              }
                            }}
                            placeholder="Select a company"
                            disabled={loadingAccounts}
                            readOnly={!companySearchMode}
                            className={`w-full pl-3 pr-20 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${companyDropdownOpen ? 'border-gray-200' : 'border-gray-200'}`}
                            style={{ outline: 'none', boxShadow: 'none' }}
                          />
                          {watch('company') && companySearchMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setValue('company', '');
                                setValue('location', '');
                                setCompanySearchMode(false);
                                companyInputRef.current?.focus();
                              }}
                              className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                              title="Clear search"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${companyDropdownOpen ? 'rotate-180' : ''}`} />

                          {companyDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                              <div className="p-2">
                                {filteredAccounts.length > 0 ? (
                                  filteredAccounts.map((account, index) => (
                                    <button
                                      key={account.accountId}
                                      type="button"
                                      ref={el => companyOptionsRef.current[index] = el}
                                      onClick={() => {
                                        setValue('company', account.accountName);
                                        clearErrors('company');
                                        setSelectedCompanyType('existing');
                                        setSelectedAccount(account);

                                        const location = account.companyLocation && account.country
                                          ? `${account.companyLocation}, ${account.country}`
                                          : account.companyLocation || account.country || 'Not Available';
                                        setValue('location', location);
                                        clearErrors('location');

                                        setCompanyDropdownOpen(false);
                                        setHighlightedIndex(-1);
                                        setCompanySearchMode(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${index === highlightedIndex ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                      {(() => {
                                        const label = account.accountName;
                                        const query = watch('company') || '';
                                        if (!query) return label;
                                        const index = label.toLowerCase().indexOf(query.toLowerCase());
                                        if (index === -1) return label;
                                        return (
                                          <>
                                            {label.slice(0, index)}
                                            <strong>{label.slice(index, index + query.length)}</strong>
                                            {label.slice(index + query.length)}
                                          </>
                                        );
                                      })()}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-left text-sm text-gray-500">No companies found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {errors.company && (
                      <div className="flex items-center space-x-1 mt-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-600">{normalizeErrorMessage(errors.company.message)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <div className="flex items-center w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">
                          {watch('location') || (watch('company') ? "-" : "Select company to auto-fill location")}
                        </span>
                      </div>
                      <input type="hidden" {...register('location')} value={watch('location') || ''} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remarks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Remarks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="relative">
                    <textarea
                      name="remarks"
                      value={watch('remarks') || ''}
                      rows={3}
                      maxLength={200}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setValue('remarks', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 pb-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-0 resize-none"
                      placeholder="Add remarks about contact status or deal progress"
                    />
                    <div className="absolute bottom-1 right-2 pointer-events-none">
                      <span className={`text-xs ${(watch('remarks')?.length || 0) >= 200 ? 'text-red-600' :
                          (watch('remarks')?.length || 0) >= 178 ? 'text-orange-600' :
                            'text-gray-500'
                        }`}>
                        {(watch('remarks')?.length || 0) >= 200 ? 'Character limit reached - ' :
                          (watch('remarks')?.length || 0) >= 178 ? 'Approaching 200 character limit - ' : ''}{watch('remarks')?.length || 0}/200
                      </span>
                    </div>
                  </div>
                  {errors.remarks && (
                    <p className="text-sm text-red-600 mt-1">{errors.remarks.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-1">
                <div ref={typeDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Type *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      <span className="truncate capitalize">{watch('type') || 'Select type'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${typeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {typeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          {['lead', 'prospect', 'customer', 'partner', 'vendor'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setValue('type', type);
                                setTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors capitalize ${watch('type') === type ? 'bg-primary-50 text-primary-600' : ''
                                }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.type && (
                    <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div ref={statusDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      <span className="truncate capitalize">{watch('status') || 'Select status'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          {['active', 'inactive', 'archived'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setValue('status', status);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors capitalize ${watch('status') === status ? 'bg-primary-50 text-primary-600' : ''
                                }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.status && (
                    <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardContent className="p-6 pt-8 pb-4">
                <div className="space-y-3">
                  <Button
                    ref={submitButtonRef}
                    type="submit"
                    variant="primary"
                    className="w-full h-10"
                    leftIcon={<Save className="w-4 h-4" />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (isEditing ? 'Updating...' : 'Creating...')
                      : (isEditing ? 'Update Contact' : 'Create Contact')
                    }
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-10 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white border border-gray-600 dark:border-gray-700 rounded-lg font-medium transition-colors"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Unsaved Changes"
        size="xs"
        closeOnOverlayClick={false}
      >
        <ModalContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You have unsaved changes. Are you sure you want to cancel?
          </p>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setShowCancelConfirm(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Continue
          </Button>
          <Button variant="danger" onClick={confirmCancel}>Discard</Button>
        </ModalFooter>
      </Modal>
    </motion.div>
  );
};

export default ContactForm;
