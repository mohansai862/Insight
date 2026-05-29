// Replace the validateField function with this:

const validateField = (name: string, value: string) => {
  const newErrors = { ...errors };

  switch (name) {
    case 'accountName':
      if (!value.trim()) {
        newErrors.accountName = 'Company name cannot be empty.';
      } else if (/\s/.test(value.trim())) {
        newErrors.accountName = 'Spaces are not allowed.';
      } else {
        delete newErrors.accountName;
      }
      break;
    case 'contactName':
      if (!value.trim()) {
        newErrors.contactName = 'Contact name cannot be empty.';
      } else if (/\s/.test(value.trim())) {
        newErrors.contactName = 'Spaces are not allowed.';
      } else if (/\d/.test(value.trim())) {
        newErrors.contactName = 'Numbers are not allowed.';
      } else {
        delete newErrors.contactName;
      }
      break;
    case 'email':
      if (!value.trim()) {
        newErrors.email = 'Email cannot be empty.';
      } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
        newErrors.email = 'Enter a valid email address.';
      } else {
        delete newErrors.email;
      }
      break;
    case 'country':
      if (!value.trim()) {
        newErrors.country = 'Country is required.';
      } else {
        delete newErrors.country;
      }
      break;
    case 'industry':
      if (!value.trim()) {
        newErrors.industry = 'Industry is required.';
      } else {
        delete newErrors.industry;
      }
      break;
    case 'city':
      if (!value.trim()) {
        newErrors.city = 'Company location is required.';
      } else if (/\s/.test(value.trim())) {
        newErrors.city = 'Spaces are not allowed.';
      } else {
        delete newErrors.city;
      }
      break;
    case 'phoneNumber':
      if (!value.trim()) {
        newErrors.phoneNumber = 'Phone number is required.';
      } else if (!/^\d+$/.test(value.trim())) {
        if (/[a-zA-Z]/.test(value.trim())) {
          newErrors.phoneNumber = 'Alphabets are not allowed.';
        } else {
          newErrors.phoneNumber = 'Only digits are allowed.';
        }
      } else {
        delete newErrors.phoneNumber;
      }
      break;
    case 'numberOfEmployees':
      if (!value.trim()) {
        newErrors.numberOfEmployees = 'Number of employees is required.';
      } else if (!/^\d+$/.test(value.trim()) || parseInt(value.trim(), 10) < 1) {
        newErrors.numberOfEmployees = 'Only numbers are allowed.';
      } else {
        delete newErrors.numberOfEmployees;
      }
      break;
  }

  setErrors(newErrors);
};

// Also add required attributes to these fields:
// - Industry select: add required
// - Phone Number Input: add required  
// - Number of Employees Input: add required
// - City Input: add required
