import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Profile Page
 * User profile view and edit functionality
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Edit3,
  Save,
  X,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useCurrentProfile, useUpdateCurrentProfile } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { COUNTRY_CODES, validatePhoneNumber, formatPhoneNumber } from '@/utils/countryCodes';

// Form validation schema
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  middleName: z.string().max(100, 'Middle name is too long').optional(),
  phoneNumber: z.string().optional(),
  countryCode: z.string().optional(),
}).refine((data) => {
  // Skip validation if no phone number provided
  if (!data.phoneNumber || data.phoneNumber.trim() === '') {
    return true;
  }
  
  // If phone number is provided, country code is required
  if (!data.countryCode) {
    return false;
  }
  
  // Validate phone number with country code
  const validation = validatePhoneNumber(data.phoneNumber, data.countryCode);
  return validation.isValid;
}, {
  message: "Please select a country code and enter a valid phone number",
  path: ["phoneNumber"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = React.useState(false);
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);
  
  const { data: profileData, isLoading, error } = useCurrentProfile();
  const updateProfileMutation = useUpdateCurrentProfile();
  
  const profile = profileData?.data;
  
  // Debug logging
  React.useEffect(() => {
    logger.info('Profile API Response:', profileData);
    logger.info('Profile Data:', profile);
    logger.info('Loading:', isLoading);
    logger.info('Error:', error);
  }, [profileData, profile, isLoading, error]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const watchedCountryCode = watch('countryCode');
  const watchedPhoneNumber = watch('phoneNumber');

  // Track previous country code to detect changes
  const prevCountryCodeRef = React.useRef<string>();

  // Click outside handler for country dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear phone number only when country code changes (not on initial edit)
  React.useEffect(() => {
    if (isEditing && watchedCountryCode && prevCountryCodeRef.current && prevCountryCodeRef.current !== watchedCountryCode) {
      setValue('phoneNumber', '');
    }
    prevCountryCodeRef.current = watchedCountryCode;
  }, [watchedCountryCode, isEditing, setValue]);

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        phoneNumber: profile.phoneNumber ? profile.phoneNumber.replace(/\D/g, '') : '',
        countryCode: profile.countryCode || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Format phone number to remove non-digits
      const formattedData = {
        ...data,
        phoneNumber: data.phoneNumber ? formatPhoneNumber(data.phoneNumber) : undefined,
      };
      await updateProfileMutation.mutateAsync(formattedData);
      setIsEditing(false);
    } catch (error) {
      logger.error('Error updating profile:', error);
    }
  };

  // Handle phone number input to only allow digits with max length based on country
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const country = COUNTRY_CODES.find(c => c.dialCode === watchedCountryCode);
    const maxLength = country?.maxLength || 15;
    setValue('phoneNumber', value.slice(0, maxLength));
  };

  // Custom validation for phone number
  const validateCurrentPhone = () => {
    const phoneNumber = watchedPhoneNumber;
    const countryCode = watchedCountryCode;
    
    // If no phone number, no validation needed
    if (!phoneNumber || phoneNumber.trim() === '') {
      return undefined;
    }
    
    // If phone number exists but no country code
    if (!countryCode) {
      return 'Country code is required when phone number is provided';
    }
    
    // Validate with the updated validation function
    const validation = validatePhoneNumber(phoneNumber, countryCode);
    if (!validation.isValid) {
      return validation.message;
    }
    
    return undefined;
  };

  // Country code options for dropdown
  const countryOptions = COUNTRY_CODES.map(country => ({
    value: country.dialCode,
    label: `${country.dialCode} ${country.name}`,
  }));

  const handleCancel = () => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        phoneNumber: profile.phoneNumber ? profile.phoneNumber.replace(/\D/g, '') : '',
        countryCode: profile.countryCode || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Loading profile data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading profile</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <p className="text-red-600 text-xs mt-2">Make sure you have signed up and your account is approved.</p>
        </div>
      </div>
    );
  }
  
  // Show message if no profile data exists
  if (!profile || (!profile.firstName && !profile.lastName && !profile.email)) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No Profile Data Found</h3>
          <p className="text-yellow-600 text-sm mt-1">
            No profile data found in the users table. Please ensure you have a valid user account with profile information.
          </p>
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
              // Check if we came from settings by looking at the referrer or using a more reliable method
              const currentPath = window.location.pathname;
              const searchParams = new URLSearchParams(window.location.search);
              const from = searchParams.get('from');
              
              if (from === 'settings') {
                navigate('/crm/Settings');
              } else {
                navigate('/crm/dashboard');
              }
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="primary"
            leftIcon={<Edit3 className="w-4 h-4" />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.fullName || 'User'}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {profile?.fullName || 'User'}
              </h2>
              <p className="text-gray-600 mb-2">{profile?.email}</p>
              <Badge variant="primary" size="sm">
                {profile?.role?.replace('_', ' ') || 'User'}
              </Badge>
              
              {profile?.phoneNumber && profile?.countryCode && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {profile.countryCode} {profile.phoneNumber.replace(/\D/g, '')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </div>
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<X className="w-4 h-4" />}
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        leftIcon={<Save className="w-4 h-4" />}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    {isEditing ? (
                      <Input
                        {...register('firstName')}
                        placeholder="Enter first name"
                        error={errors.firstName?.message}
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.firstName || '—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    {isEditing ? (
                      <Input
                        {...register('middleName')}
                        placeholder="Enter middle name"
                        error={errors.middleName?.message}
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.middleName || '—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    {isEditing ? (
                      <Input
                        {...register('lastName')}
                        placeholder="Enter last name"
                        error={errors.lastName?.message}
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.lastName || '—'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {profile?.email || '—'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                      {profile?.username || '—'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>
                </div>

                {/* Phone Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country Code
                    </label>
                    {isEditing ? (
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:shadow-md hover:border-primary-300 text-gray-700 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                        >
                          <span>
                            {watchedCountryCode ? (
                              `${watchedCountryCode} ${COUNTRY_CODES.find(c => c.dialCode === watchedCountryCode)?.name || ''}`
                            ) : 'Select country code'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isCountryDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            <div className="p-2">
                              {COUNTRY_CODES.map((country) => (
                                <button
                                  key={country.dialCode}
                                  type="button"
                                  onClick={() => {
                                    setValue('countryCode', country.dialCode);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    watchedCountryCode === country.dialCode ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  {country.dialCode} {country.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.countryCode ? (
                          `${profile.countryCode} ${COUNTRY_CODES.find(c => c.dialCode === profile.countryCode)?.name || ''}`
                        ) : '—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div>
                        <Input
                          value={watchedPhoneNumber || ''}
                          onChange={handlePhoneNumberChange}
                          placeholder="Enter phone number (digits only)"
                          error={validateCurrentPhone()}
                        />
                        {watchedCountryCode && watchedPhoneNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expected length: {COUNTRY_CODES.find(c => c.dialCode === watchedCountryCode)?.minLength}-{COUNTRY_CODES.find(c => c.dialCode === watchedCountryCode)?.maxLength} digits
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.phoneNumber ? profile.phoneNumber.replace(/\D/g, '') : '—'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created At
                      </label>
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.role?.replace('_', ' ') || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-900">
                        {profile?.gender || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
