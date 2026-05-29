export const phoneRules = {
  '+91': { regex: /^\d{10}$/, message: 'phone number must contain exactly 10 digits.', maxLength: 10 },
  '+1': { regex: /^\d{10}$/, message: 'phone number must contain exactly 10 digits.', maxLength: 10 },
  '+44': { regex: /^\d{10,11}$/, message: 'phone number must be 10–11 digits.', maxLength: 11 },
  '+49': { regex: /^\d{10,12}$/, message: 'phone number must be 10–12 digits.', maxLength: 12 },
  default: { regex: /^\d{6,15}$/, message: 'Phone number must be 6–15 digits.', maxLength: 15 }
};

export const getPhoneRule = (countryCode: string) => {
  return phoneRules[countryCode as keyof typeof phoneRules] || phoneRules.default;
};

export const getPhonePlaceholder = (countryCode: string) => {
  const rule = getPhoneRule(countryCode);
  switch (countryCode) {
    case '+91': return '9876543210';
    case '+1': return '5551234567';
    case '+44': return '7911123456';
    case '+49': return '15123456789';
    default: return 'Enter phone number';
  }
};