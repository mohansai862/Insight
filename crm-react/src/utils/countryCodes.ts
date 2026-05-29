/**
 * Country codes and phone number validation utilities
 */

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', name: 'India', dialCode: '+91', minLength: 10, maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', minLength: 10, maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', minLength: 10, maxLength: 11 },
  { code: 'DE', name: 'Germany', dialCode: '+49', minLength: 10, maxLength: 12 },
];

export const getCountryByDialCode = (dialCode: string): CountryCode | undefined => {
  return COUNTRY_CODES.find(country => country.dialCode === dialCode);
};

export const validatePhoneNumber = (phoneNumber: string, dialCode: string): { isValid: boolean; message?: string } => {
  // Handle empty phone number - it's optional
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: true };
  }
  
  // Normalize dial code - handle both +91 and 91 formats
  const normalizedDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const country = getCountryByDialCode(normalizedDialCode);
  
  if (!country) {
    // If country not found, check if it's one of our supported countries in different format
    const supportedCodes = ['+91', '+1', '+44', '+49'];
    const isSupported = supportedCodes.some(code => 
      dialCode === code || dialCode === code.substring(1) || dialCode === code.toLowerCase()
    );
    
    if (!isSupported) {
      return { isValid: false, message: 'Please select a valid country code (India, US, UK, or Germany)' };
    }
    
    // If supported but not found, allow it (for backward compatibility)
    return { isValid: true };
  }

  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (!cleanNumber) {
    return { isValid: true }; // Empty is valid
  }
  
  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, message: 'Phone number must contain only digits' };
  }
  
  if (cleanNumber.length < country.minLength) {
    return { isValid: false, message: `Phone number must be ${country.minLength === country.maxLength ? country.minLength : `${country.minLength}-${country.maxLength}`} digits for ${country.name}` };
  }
  
  if (cleanNumber.length > country.maxLength) {
    return { isValid: false, message: `Phone number must be ${country.minLength === country.maxLength ? country.minLength : `${country.minLength}-${country.maxLength}`} digits for ${country.name}` };
  }
  
  return { isValid: true };
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  return phoneNumber.replace(/\D/g, '');
};