/**
 * Lead Form Validation Utilities
 * Provides consistent validation logic for lead forms
 */

// Check if string contains only spaces
export const isOnlySpaces = (value: string): boolean => {
  return value.trim().length === 0;
};

// Check if string contains numbers
export const hasNumbers = (value: string): boolean => {
  return /[0-9]/.test(value);
};

// Check if string contains special characters (excluding spaces)
export const hasSpecialChars = (value: string): boolean => {
  return /[^a-zA-Z\s]/.test(value);
};

// Check if string is valid text only (letters and spaces)
export const isValidTextOnly = (value: string): boolean => {
  if (!value || value.length === 0) return true; // Empty is valid for optional fields
  return /^[a-zA-Z\s]+$/.test(value) && value.trim().length > 0;
};

// Validation functions for specific fields
export const validateTextField = (value: string, fieldName: string): string | null => {
  if (isOnlySpaces(value)) {
    return `${fieldName} cannot contain only spaces`;
  }
  if (hasNumbers(value) || hasSpecialChars(value)) {
    return `${fieldName} cannot contain numbers or special characters`;
  }
  if (!isValidTextOnly(value)) {
    return `${fieldName} must contain only letters and spaces`;
  }
  return null;
};

export const validateOptionalTextField = (value: string, fieldName: string): string | null => {
  if (!value) return null; // Optional field
  return validateTextField(value, fieldName);
};

export const validateSpacesOnlyField = (value: string, fieldName: string): string | null => {
  if (value && isOnlySpaces(value)) {
    return `${fieldName} cannot contain only spaces`;
  }
  return null;
};

// Field-specific validation messages
export const getFieldValidationMessage = (fieldName: string, validationType: 'text' | 'spaces'): string => {
  const fieldDisplayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
  
  if (validationType === 'text') {
    return `${fieldDisplayName} cannot contain numbers or special characters`;
  } else {
    return `${fieldDisplayName} cannot contain only spaces`;
  }
};

// Real-time validation for form fields
export const validateLeadField = (fieldName: string, value: string): string | null => {
  // Fields that should not allow numbers or special characters
  const textOnlyFields = [
    'firstName', 'lastName', 'companyName', 'designation', 
    'industry', 'country', 'companyLocation', 'technologies'
  ];
  
  // Fields that should not allow only spaces
  const noSpacesOnlyFields = [
    'email', 'phoneNumber', 'linkedIn', 'customerLocation', 
    'decisionAuthority', 'numberOfEmployees', 'prospectValue'
  ];
  
  if (textOnlyFields.includes(fieldName)) {
    return validateOptionalTextField(value, fieldName);
  }
  
  if (noSpacesOnlyFields.includes(fieldName)) {
    return validateSpacesOnlyField(value, fieldName);
  }
  
  return null;
};