import { can, getCurrentRole } from '@/utils/rbac';
import { clearOtherModulesPagination } from '@/utils/pagination';
import React from 'react';
import { Upload, Download, X, Search, Filter, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { format, parse } from 'date-fns';
 
interface PendingUser {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface ApprovedUser {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  approvedAt?: string;
}
 
interface ExcelUser {
  empId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  role: string;
  reportingId: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}
 
const fetchPending = async (currentUserRole: string, currentUserId?: number): Promise<PendingUser[]> => {
  const { authApi } = await import('@/api/authApi');
  const res = await fetch('/api/signup/pending-approvals', {
    headers: {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch pending users');
  const allUsers = await res.json();
 
  // Filter based on role hierarchy
  const normalizedRole = currentUserRole?.toLowerCase();
  if (normalizedRole === 'it_admin') {
    return allUsers; // IT Admin sees all pending users
  } else if (normalizedRole === 'sales_vp') {
    return allUsers.filter((user: PendingUser) =>
      user.role?.toLowerCase() === 'sales_manager'
    );
  } else if (normalizedRole === 'sales_manager') {
    return allUsers.filter((user: PendingUser) =>
      user.role?.toLowerCase() === 'sales_executive'
    );
  }
 
  return []; // Other roles see no pending users
};

const fetchApproved = async (search?: string, status?: string, role?: string, startDate?: string, endDate?: string, page = 0, size = 10) => {
  try {
    const { authApi } = await import('@/api/authApi');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    if (role && role !== 'All') params.append('role', role);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const res = await fetch(`/api/users/approved?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authApi.getAuthHeaders(),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch approved users');
    }
    return await res.json();
  } catch (error) {
    console.error('Error in fetchApproved:', error);
    throw error;
  }
};
 
const updateStatus = async (id: number, status: 'Approved' | 'Rejected'): Promise<void> => {
  const { authApi } = await import('@/api/authApi');
  const res = await fetch(`/api/signup/${id}/status?status=${status}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authApi.getAuthHeaders(),
    },
  });
 
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt || 'Failed to update status'}`);
  }
};
 
// Available roles and country codes for validation
const AVAILABLE_ROLES = ['sales_executive', 'sales_manager', 'sales_vp', 'it_admin'];
const COUNTRY_CODES = ['+91', '+1', '+44', '+49'];
const GENDERS = ['Male', 'Female', 'Others'];

// Validation functions with exact Edit User modal rules
const validateEmpId = (empId: string): string | null => {
  if (!empId || empId.trim() === '') return 'Employee ID is required';
  const trimmed = empId.trim();
  if (/^\s+$/.test(empId)) return 'Employee ID cannot contain only spaces';
  if (/^\d+$/.test(trimmed)) return 'Employee ID cannot contain only numbers';
  if (!(/[a-zA-Z]/.test(trimmed))) return 'Employee ID must include at least 1 alphabet';
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) return 'Employee ID cannot contain only special symbols';
  return null;
};

const validateFirstName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'First name is required';
  const trimmed = name.trim();
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'First name must contain only alphabets';
  return null;
};

const validateLastName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Last name is required';
  const trimmed = name.trim();
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'Last name must contain only alphabets';
  return null;
};

const validateMiddleName = (name: string): string | null => {
  if (!name || name.trim() === '') return null; // Optional field
  const trimmed = name.trim();
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'Middle name must contain only alphabets';
  return null;
};

const validateUsername = (username: string): string | null => {
  if (!username || username.trim() === '') return 'Username is required';
  const trimmed = username.trim();
  if (trimmed.includes(' ')) return 'Username cannot contain spaces';
  if (!(/[a-zA-Z]/.test(trimmed.charAt(0)))) return 'Username must start with an alphabet';
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(trimmed)) return 'Username can only contain alphabets, numbers, underscore (_), hyphen (-), and dot (.)';
  if (!(/[a-zA-Z]/.test(trimmed))) return 'Username must contain at least one alphabet';
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Email is required';
  const trimmed = email.trim();
  if (trimmed.includes(' ')) return 'Email cannot contain spaces';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
  return null;
};

const validateGender = (gender: string): string | null => {
  if (!gender || gender.trim() === '') return 'Gender is required';
  const trimmed = gender.trim();
  const validGenders = ['Male', 'Female', 'Others'];
  if (!validGenders.includes(trimmed)) return `Gender must be one of: ${validGenders.join(', ')}`;
  return null;
};

const validateCountryCode = (countryCode: string): string | null => {
  if (!countryCode || countryCode.trim() === '') return 'Country code is required';
  const trimmed = countryCode.trim();
  const normalizedCode = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  if (!COUNTRY_CODES.includes(normalizedCode)) return `Country code must be one of: ${COUNTRY_CODES.join(', ')}`;
  return null;
};

const validatePhoneNumber = (phoneNumber: string, countryCode: string): string | null => {
  if (!phoneNumber || phoneNumber.trim() === '') return 'Phone number is required';
  const trimmed = phoneNumber.trim();
  if (!/^\d+$/.test(trimmed)) return 'Phone number can only contain digits';
  
  // Country-based length validation
  const normalizedCode = countryCode?.startsWith('+') ? countryCode : `+${countryCode}`;
  const phoneLength = trimmed.length;
  
  switch (normalizedCode) {
    case '+91': // India
      if (phoneLength !== 10) return 'For +91, phone number must be exactly 10 digits';
      break;
    case '+1': // USA/Canada
      if (phoneLength !== 10) return 'For +1, phone number must be exactly 10 digits';
      break;
    case '+44': // UK
      if (phoneLength < 10 || phoneLength > 11) return 'For +44, phone number must be 10-11 digits';
      break;
    case '+49': // Germany
      if (phoneLength < 10 || phoneLength > 11) return 'For +49, phone number must be 10-11 digits';
      break;
    default:
      return 'Invalid country code for phone validation';
  }
  
  return null;
};

const validateRole = (role: string): string | null => {
  if (!role || role.trim() === '') return 'Role is required';
  const trimmed = role.trim().toLowerCase();
  if (!AVAILABLE_ROLES.includes(trimmed)) return `Role must be one of: ${AVAILABLE_ROLES.join(', ')}`;
  return null;
};

const validateReportingId = (reportingId: string, role: string): string | null => {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === 'sales_vp' || normalizedRole === 'it_admin') return null;
  if (!reportingId || reportingId.trim() === '') return 'Reporting ID is required';
  const trimmed = reportingId.trim();
  return validateEmpId(trimmed); // Use same validation as Employee ID
};



const validateExcelData = async (data: ExcelUser[]): Promise<ValidationError[]> => {
  const errors: ValidationError[] = [];
  const emails = new Set<string>();
  const usernames = new Set<string>();
  const phoneNumbers = new Set<string>();
  const empIds = new Set<string>();

  if (data.length === 0) {
    errors.push({ row: 0, field: 'File', message: 'No data found in the uploaded file' });
    return errors;
  }

  data.forEach((user, index) => {
    const rowNum = index + 1;

    // Validate each field with exact Edit User modal rules
    const empIdError = validateEmpId(user.empId);
    if (empIdError) errors.push({ row: rowNum, field: 'EmpId', message: empIdError });

    const firstNameError = validateFirstName(user.firstName);
    if (firstNameError) errors.push({ row: rowNum, field: 'FirstName', message: firstNameError });

    const middleNameError = validateMiddleName(user.middleName || '');
    if (middleNameError) errors.push({ row: rowNum, field: 'MiddleName', message: middleNameError });

    const lastNameError = validateLastName(user.lastName);
    if (lastNameError) errors.push({ row: rowNum, field: 'LastName', message: lastNameError });

    const usernameError = validateUsername(user.username);
    if (usernameError) errors.push({ row: rowNum, field: 'Username', message: usernameError });

    const emailError = validateEmail(user.email);
    if (emailError) errors.push({ row: rowNum, field: 'Email', message: emailError });

    const genderError = validateGender(user.gender);
    if (genderError) errors.push({ row: rowNum, field: 'Gender', message: genderError });

    const countryCodeError = validateCountryCode(user.countryCode);
    if (countryCodeError) errors.push({ row: rowNum, field: 'CountryCode', message: countryCodeError });

    const phoneError = validatePhoneNumber(user.phoneNumber, user.countryCode);
    if (phoneError) errors.push({ row: rowNum, field: 'PhoneNumber', message: phoneError });

    const roleError = validateRole(user.role);
    if (roleError) errors.push({ row: rowNum, field: 'Role', message: roleError });

    const reportingIdError = validateReportingId(user.reportingId, user.role);
    if (reportingIdError) errors.push({ row: rowNum, field: 'ReportingId', message: reportingIdError });

    // Check for duplicates within Excel file
    if (user.empId && user.empId.trim()) {
      const trimmedEmpId = user.empId.trim();
      if (empIds.has(trimmedEmpId.toLowerCase())) {
        errors.push({ row: rowNum, field: 'EmpId', message: 'Duplicate Employee ID found in file' });
      } else {
        empIds.add(trimmedEmpId.toLowerCase());
      }
    }

    if (user.email && user.email.trim()) {
      const trimmedEmail = user.email.trim().toLowerCase();
      if (emails.has(trimmedEmail)) {
        errors.push({ row: rowNum, field: 'Email', message: 'Duplicate email found in file' });
      } else {
        emails.add(trimmedEmail);
      }
    }

    if (user.username && user.username.trim()) {
      const trimmedUsername = user.username.trim().toLowerCase();
      if (usernames.has(trimmedUsername)) {
        errors.push({ row: rowNum, field: 'Username', message: 'Duplicate username found in file' });
      } else {
        usernames.add(trimmedUsername);
      }
    }

    if (user.phoneNumber && user.phoneNumber.trim()) {
      const trimmedPhone = user.phoneNumber.trim();
      if (phoneNumbers.has(trimmedPhone)) {
        errors.push({ row: rowNum, field: 'PhoneNumber', message: 'Duplicate phone number found in file' });
      } else {
        phoneNumbers.add(trimmedPhone);
      }
    }
  });

  return errors;
};

const validateExcelDataSimple = (data: ExcelUser[]): ValidationError[] => {
  return validateExcelData(data); // Use the same validation logic
};

// Edit form validation functions
const validateEditFirstName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'First name is required';
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'First name must contain only alphabets';
  return '';
};

const validateEditLastName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'Last name is required';
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'Last name must contain only alphabets';
  return '';
};

const validateEditMiddleName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return ''; // Optional field
  if (!/^[A-Za-z]+$/.test(trimmed)) return 'Middle name must contain only alphabets';
  return '';
};

const validateEditUsername = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'Username is required';
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(trimmed)) return 'Username must start with a letter and contain only letters, numbers, dots, hyphens, and underscores';
  if (!/[A-Za-z]/.test(trimmed)) return 'Username must contain at least one letter';
  return '';
};

const validateEditEmail = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
  return '';
};

const UserApprovalsPage: React.FC = () => {
  const role = getCurrentRole();
  const canView = can(role, 'Settings', 'View');
  const canEdit = can(role, 'Settings', 'Edit');
 
  const [pending, setPending] = React.useState<PendingUser[]>([]);
  const [approved, setApproved] = React.useState<ApprovedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [excelData, setExcelData] = React.useState<ExcelUser[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<number | null>(null);
  const [bulkProcessing, setBulkProcessing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(() => {
    const saved = localStorage.getItem('userApprovalsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [itemsPerPage] = React.useState(10);

  // Save page to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('userApprovalsPage', currentPage.toString());
  }, [currentPage]);

  // Clear other modules' pagination when this module loads
  React.useEffect(() => {
    clearOtherModulesPagination('userApprovalsPage');
  }, []);

  // Click outside handlers for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (editRoleDropdownRef.current && !editRoleDropdownRef.current.contains(event.target as Node)) {
        setIsEditRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [editingUser, setEditingUser] = React.useState<ApprovedUser | null>(null);
  const [editForm, setEditForm] = React.useState<any>({});
  const [editLoading, setEditLoading] = React.useState(false);
  const [editValidationErrors, setEditValidationErrors] = React.useState<{[key: string]: string}>({});
  
  // New filter states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [roleFilter, setRoleFilter] = React.useState('All');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();
  const normalizeSearchQuery = React.useCallback((value: string) => {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
  }, []);
  const normalizedSearchQuery = React.useMemo(
    () => normalizeSearchQuery(searchQuery),
    [searchQuery, normalizeSearchQuery]
  );
  const searchTokens = React.useMemo(
    () => (normalizedSearchQuery ? normalizedSearchQuery.split(' ') : []),
    [normalizedSearchQuery]
  );
  const apiSearchQuery = React.useMemo(
    () => searchTokens[0] || '',
    [searchTokens]
  );

  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);
  const [isEditRoleDropdownOpen, setIsEditRoleDropdownOpen] = React.useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const roleDropdownRef = React.useRef<HTMLDivElement>(null);
  const editRoleDropdownRef = React.useRef<HTMLDivElement>(null);

  // Validation helper functions
  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'firstName':
        error = validateEditFirstName(value);
        break;
      case 'lastName':
        error = validateEditLastName(value);
        break;
      case 'middleName':
        error = validateEditMiddleName(value);
        break;
      case 'username':
        error = validateEditUsername(value);
        break;
      case 'email':
        error = validateEditEmail(value);
        break;
    }
    setEditValidationErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'username', 'email', 'role'];
    const hasAllFields = requiredFields.every(field => editForm[field]?.trim());
    const hasNoErrors = Object.values(editValidationErrors).every(error => !error);
    return hasAllFields && hasNoErrors;
  };
 
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchApproved(apiSearchQuery, statusFilter, roleFilter, startDate, endDate, currentPage, itemsPerPage);
      setApproved(response.users || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setAvailableRoles(response.availableRoles || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [apiSearchQuery, statusFilter, roleFilter, startDate, endDate, currentPage, itemsPerPage]);
  
  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
    localStorage.setItem('userApprovalsPage', '0');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      // Trigger reload through useEffect
    }, 300);
  };

  const filteredApproved = React.useMemo(() => {
    if (!normalizedSearchQuery) return approved;
    const tokens = searchTokens;
    return approved.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName || ''}`.trim().toLowerCase();
      const nameParts = fullName.split(' ').filter(Boolean);
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      const nameMatch = tokens.length <= 1
        ? nameParts.some((p) => p.includes(normalizedSearchQuery))
        : (
            tokens.length <= nameParts.length &&
            tokens.every((t, i) => nameParts[i]?.startsWith(t))
          );

      const usernameMatch = username.includes(normalizedSearchQuery);
      const emailMatch = email.includes(normalizedSearchQuery);

      return nameMatch || usernameMatch || emailMatch;
    });
  }, [approved, normalizedSearchQuery, searchTokens]);
  
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(0);
    localStorage.setItem('userApprovalsPage', '0');
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'role':
        setRoleFilter(value);
        break;
    }
  };
  
  const handleDateRangeChange = (start: string, end: string) => {
    // Validate date range
    if (start && end && new Date(start) > new Date(end)) {
      setError('From date cannot be greater than to date');
      return;
    }
    
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(0);
    localStorage.setItem('userApprovalsPage', '0');
    setError(null); // Clear any previous date validation errors
  };
 
  React.useEffect(() => { load(); }, [load]);
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
 
  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Pending Approval</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is awaiting approval from an administrator. Once your request is approved by the IT Admin,
            you will be able to access the Settings approvals area.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="p-6 space-y-4 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Approvals</h2>
          <p className="text-gray-600 dark:text-gray-400">Approve or reject newly registered users.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsValidating(true);
                setError(null);
                try {
                  // Use backend preview API instead of frontend validation
                  const { authApi } = await import('@/api/authApi');
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const res = await fetch('/api/users/preview-excel', {
                    method: 'POST',
                    headers: {
                      ...authApi.getAuthHeaders(),
                    },
                    body: formData
                  });
                  
                  const result = await res.json();
                  
                  if (result.success) {
                    const users = result.users || [];
                    const structuredErrors = result.validationErrors || [];
                    
                    setExcelData(users);
                    setValidationErrors(structuredErrors);
                    setShowPreview(true);
                  } else {
                    // Show validation errors
                    const errors = (result.errors || []).map((error: string, index: number) => ({
                      row: index + 1,
                      field: 'File Error',
                      message: error
                    }));
                    setValidationErrors(errors);
                    setExcelData([]);
                    setShowPreview(true); // Show preview even with errors to display them
                    setError(result.message || 'Invalid Excel file format or content');
                  }
                } catch (err) {
                  setError('Failed to process Excel file');
                } finally {
                  setIsValidating(false);
                }
              }
              // Reset file input value to allow same file to be selected again
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Excel
          </button>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/Users.xlsx';
              link.download = 'Users.xlsx';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel
          </button>
        </div>
      </div>
 
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-900/20 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 dark:text-blue-300">Loading pending users...</span>
          </div>
        </div>
      )}
      {error && (
        <div className={`border rounded-xl p-4 ${
          error.includes('Successfully') 
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' 
            : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
        }`}>
          {error}
        </div>
      )}
 
      {/* Excel Preview Section - MOVED TO TOP */}
      {showPreview && excelData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-semibold ${
                validationErrors.length === 0 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                📊 Excel Data Preview
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                validationErrors.length === 0
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                {validationErrors.length === 0 
                  ? `✅ All Valid (${excelData.length} users)` 
                  : `❌ ${validationErrors.length} Errors (${excelData.length} users)`
                }
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                setExcelData([]);
                setValidationErrors([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Show detailed validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-red-800 dark:text-red-200 font-semibold text-lg">
                  🚨 Validation Errors ({validationErrors.length} Errors Found)
                </h4>
                <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Fix all errors before approval
                </span>
              </div>
              <div className="max-h-48 overflow-y-scroll overflow-x-hidden bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700 p-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
                <div className="space-y-2">
                  {validationErrors.map((error, index) => {
                    const fieldDisplayName = {
                      'empId': 'Employee ID',
                      'firstName': 'First Name',
                      'lastName': 'Last Name', 
                      'middleName': 'Middle Name',
                      'username': 'Username',
                      'email': 'Email',
                      'gender': 'Gender',
                      'countryCode': 'Country Code',
                      'phoneNumber': 'Phone Number',
                      'role': 'Role',
                      'reportingId': 'Reporting ID'
                    }[error.field] || error.field;
                    
                    return (
                      <div key={index} className="flex items-start gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded border-l-4 border-red-400 dark:border-red-500">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-bold rounded-full">
                            {error.row}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">
                            <span className="font-semibold text-red-900 dark:text-red-200">Row {error.row}</span>
                            <span className="text-gray-600 dark:text-gray-400 mx-2">→</span>
                            <span className="font-medium text-red-800 dark:text-red-300">{fieldDisplayName}:</span>
                            <span className="text-red-700 dark:text-red-300 ml-1">{error.message}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="text-xs text-red-600 dark:text-red-400">
                  💡 Tip: Fix the errors in your Excel file and re-upload to proceed with approval.
                </div>
              </div>
            </div>
          )}
         
          <div className="overflow-x-auto overflow-y-scroll mb-4 max-h-96" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}>
            <table className="min-w-full table-fixed border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-3 py-2 w-24 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Emp ID</th>
                  <th className="px-3 py-2 w-32 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-3 py-2 w-28 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Username</th>
                  <th className="px-3 py-2 w-48 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-3 py-2 w-36 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Phone</th>
                  <th className="px-3 py-2 w-28 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Role</th>
                  <th className="px-3 py-2 w-20 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Gender</th>
                  <th className="px-3 py-2 w-32 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-sm text-gray-700 dark:text-gray-300">Reporting ID</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((user, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.empId}>{user.empId}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[140px] overflow-hidden text-ellipsis" title={`${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`}>{`${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.username}>{user.username}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[160px] overflow-hidden text-ellipsis" title={user.email}>{user.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.countryCode && user.phoneNumber ? `${user.countryCode.startsWith('+') ? user.countryCode : '+' + user.countryCode} ${user.phoneNumber}` : '-'}>{user.countryCode && user.phoneNumber ? `${user.countryCode.startsWith('+') ? user.countryCode : '+' + user.countryCode} ${user.phoneNumber}` : '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.role}>{user.role}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.gender}>{user.gender}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[110px] overflow-hidden text-ellipsis" title={user.reportingId || '-'}>{user.reportingId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         
          <div className="flex gap-3 justify-end">
            <button
              onClick={async () => {
                // Validate data before sending
                const errors = await validateExcelData(excelData);
                if (errors.length > 0) {
                  setValidationErrors(errors);
                  setError('Please fix all validation errors before approving');
                  return;
                }
                
                setBulkProcessing(true);
                try {
                  setError(null);
                  const { authApi } = await import('@/api/authApi');
                  const res = await fetch('/api/users/accept-excel-preview', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...authApi.getAuthHeaders(),
                    },
                    body: JSON.stringify({ users: excelData })
                  });
                 
                  const result = await res.json();
                  
                  if (result.success) {
                    setShowPreview(false);
                    setExcelData([]);
                    setValidationErrors([]);
                    setError(result.message || 'Successfully approved and imported all users!');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    // Refresh the approved users list
                    load();
                  } else {
                    const errorMessage = result.message || 'Failed to import users';
                    const errors = result.errors || [];
                    setError(errorMessage + (errors.length > 0 ? '\n' + errors.join('\n') : ''));
                  }
                } catch (err: any) {
                  setError(`Failed to import users: ${err.message}`);
                } finally {
                  setBulkProcessing(false);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                validationErrors.length > 0 || bulkProcessing
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
              }`}
              disabled={validationErrors.length > 0 || bulkProcessing}
            >
              {bulkProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {bulkProcessing ? 'Processing...' : validationErrors.length > 0 ? `❌ Fix ${validationErrors.length} Error${validationErrors.length > 1 ? 's' : ''} First` : `✅ Approve (${excelData.length})`}
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                setExcelData([]);
                setValidationErrors([]);
                setError('Users rejected - Excel data discarded');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Reject ({excelData.length})
            </button>
          </div>
        </div>
      )}

      {/* Approved Users Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Approved Users</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, username, email, or role"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                      <div className="p-2">
                        {['All', 'Active', 'Inactive'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              handleFilterChange('status', status);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                              statusFilter === status ? 'bg-primary-50 text-primary-600' : ''
                            }`}
                          >
                            {status === 'All' ? 'All Status' : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <span>{roleFilter === 'All' ? 'All Roles' : roleFilter}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            handleFilterChange('role', 'All');
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                            roleFilter === 'All' ? 'bg-primary-50 text-primary-600' : ''
                          }`}
                        >
                          All Roles
                        </button>
                        {availableRoles.map(role => (
                          <button
                            key={role}
                            onClick={() => {
                              handleFilterChange('role', role);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                              roleFilter === role ? 'bg-primary-50 text-primary-600' : ''
                            }`}
                          >
                            {role.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <CustomDatePicker
                  label=""
                  value={startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                  onChange={(value) => {
                    if (value) {
                      try {
                        const date = parse(value, 'dd-MM-yyyy', new Date());
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        if (endDate && new Date(formattedDate) > new Date(endDate)) {
                          setError('From date cannot be greater than to date');
                          return;
                        }
                        handleDateRangeChange(formattedDate, endDate);
                      } catch (error) {
                        console.error('Invalid date format:', error);
                      }
                    } else {
                      handleDateRangeChange('', endDate);
                    }
                  }}
                  placeholder="dd-mm-yyyy"
                  maxDate={new Date()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <CustomDatePicker
                  label=""
                  value={endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : ''}
                  onChange={(value) => {
                    if (value) {
                      try {
                        const date = parse(value, 'dd-MM-yyyy', new Date());
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        if (startDate && new Date(formattedDate) < new Date(startDate)) {
                          setError('To date cannot be less than from date');
                          return;
                        }
                        handleDateRangeChange(startDate, formattedDate);
                      } catch (error) {
                        console.error('Invalid date format:', error);
                      }
                    } else {
                      handleDateRangeChange(startDate, '');
                    }
                  }}
                  placeholder="dd-mm-yyyy"
                  minDate={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                  maxDate={new Date()}
                />
              </div>
            </div>
            
            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setRoleFilter('All');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(0);
                  localStorage.setItem('userApprovalsPage', '0');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
          </div>
        )}
        
        {/* No Results */}
        {!loading && filteredApproved.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2">No users found</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery || statusFilter !== 'All' || roleFilter !== 'All' || startDate || endDate
                ? 'Try adjusting your search or filters'
                : 'No approved users available'}
            </div>
          </div>
        )}
        
        {/* Users Table */}
        {!loading && filteredApproved.length > 0 && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Approved Date</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.map(u => (
                    <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={`${u.firstName} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName}`}>{`${u.firstName} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName}`}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={u.username}>{u.username}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate max-w-[180px]" title={u.email}>{u.email}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.role?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.approvedAt ? new Date(u.approvedAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditForm({
                                firstName: u.firstName,
                                middleName: u.middleName || '',
                                lastName: u.lastName,
                                username: u.username,
                                email: u.email,
                                role: u.role
                              });
                              setEditValidationErrors({});
                            }}
                            className="px-3 py-1 text-xs rounded-md font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { authApi } = await import('@/api/authApi');
                                const res = await fetch(`/api/users/${u.id}/toggle-status`, {
                                  method: 'PUT',
                                  headers: authApi.getAuthHeaders()
                                });
                                if (res.ok) {
                                  load();
                                  setError(`User ${u.isActive ? 'disabled' : 'enabled'} successfully`);
                                } else {
                                  setError('Failed to update user status');
                                }
                              } catch (err) {
                                setError('Failed to update user status');
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                              u.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
                            }`}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} users
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 border rounded transition-colors ${
                          currentPage === i
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))
                  ) : (
                    // Show smart pagination for more than 5 pages
                    <>
                      {/* First page */}
                      <button
                        onClick={() => setCurrentPage(0)}
                        className={`px-3 py-1 border rounded transition-colors ${
                          currentPage === 0
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        1
                      </button>
                      
                      {/* Ellipsis if needed */}
                      {currentPage > 2 && (
                        <span className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
                      )}
                      
                      {/* Current page and neighbors */}
                      {Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(currentPage, totalPages - 3)) + i;
                        if (pageNum === 0 || pageNum === totalPages - 1) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      
                      {/* Ellipsis if needed */}
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
                      )}
                      
                      {/* Last page */}
                      <button
                        onClick={() => setCurrentPage(totalPages - 1)}
                        className={`px-3 py-1 border rounded transition-colors ${
                          currentPage === totalPages - 1
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>




 
      {/* Validation Loading */}
      {isValidating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-900/20 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 dark:text-blue-300">Validating Excel data...</span>
          </div>
        </div>
      )}



      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit User Information</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update user details and credentials</p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditForm({});
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              try {
                const { authApi } = await import('@/api/authApi');
                const originalEmail = editingUser.email;
                const res = await fetch(`/api/users/${editingUser.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...authApi.getAuthHeaders()
                  },
                  body: JSON.stringify(editForm)
                });
                
                if (res.ok) {
                  load();
                  setEditingUser(null);
                  setEditForm({});
                  
                  // If email was changed, send notification to new email
                  if (originalEmail !== editForm.email) {
                    setError(`User updated successfully. Credentials sent to new email: ${editForm.email}`);
                  } else {
                    setError('User updated successfully');
                  }
                } else {
                  const errorText = await res.text();
                  setError(`Failed to update user: ${errorText}`);
                }
              } catch (err: any) {
                setError(`Failed to update user: ${err.message}`);
              } finally {
                setEditLoading(false);
              }
            }} className="px-8 pt-8 pb-0">
              
              <div className="max-w-lg mx-auto mb-8">
                <div className="space-y-8">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label>
                      <input
                        type="text"
                        value={editForm.firstName || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditForm({...editForm, firstName: value});
                          validateField('firstName', value);
                        }}
                        onBlur={(e) => validateField('firstName', e.target.value)}
                        className={`w-full px-4 py-3.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                          editValidationErrors.firstName 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter first name"
                        required
                      />
                      {editValidationErrors.firstName && (
                        <p className="text-sm text-red-600 dark:text-red-400">{editValidationErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name *</label>
                      <input
                        type="text"
                        value={editForm.lastName || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditForm({...editForm, lastName: value});
                          validateField('lastName', value);
                        }}
                        onBlur={(e) => validateField('lastName', e.target.value)}
                        className={`w-full px-4 py-3.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                          editValidationErrors.lastName 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter last name"
                        required
                      />
                      {editValidationErrors.lastName && (
                        <p className="text-sm text-red-600 dark:text-red-400">{editValidationErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Middle Name & Username */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                      <input
                        type="text"
                        value={editForm.middleName || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditForm({...editForm, middleName: value});
                          validateField('middleName', value);
                        }}
                        onBlur={(e) => validateField('middleName', e.target.value)}
                        className={`w-full px-4 py-3.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                          editValidationErrors.middleName 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter middle name (optional)"
                      />
                      {editValidationErrors.middleName && (
                        <p className="text-sm text-red-600 dark:text-red-400">{editValidationErrors.middleName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username *</label>
                      <input
                        type="text"
                        value={editForm.username || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditForm({...editForm, username: value});
                          validateField('username', value);
                        }}
                        onBlur={(e) => validateField('username', e.target.value)}
                        className={`w-full px-4 py-3.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                          editValidationErrors.username 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter username"
                        required
                      />
                      {editValidationErrors.username && (
                        <p className="text-sm text-red-600 dark:text-red-400">{editValidationErrors.username}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Email & Role */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address *</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditForm({...editForm, email: value});
                          validateField('email', value);
                        }}
                        onBlur={(e) => validateField('email', e.target.value)}
                        className={`w-full px-4 py-3.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                          editValidationErrors.email 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter email address"
                        required
                      />
                      {editValidationErrors.email && (
                        <p className="text-sm text-red-600 dark:text-red-400">{editValidationErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role *</label>
                      <div className="relative" ref={editRoleDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsEditRoleDropdownOpen(!isEditRoleDropdownOpen)}
                          className="flex items-center justify-between w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary-600"
                        >
                          <span>{editForm.role ? editForm.role.replace('_', ' ') : 'Select a role'}</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isEditRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isEditRoleDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-60">
                            <div className="p-2">
                              {['Sales_Executive', 'Sales_Manager', 'Sales_VP'].map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => {
                                    setEditForm({...editForm, role});
                                    setIsEditRoleDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                                    editForm.role === role ? 'bg-primary-50 text-primary-600' : ''
                                  }`}
                                >
                                  {role.replace(/_/g, ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Email Change Notification */}
                {editForm.email !== editingUser.email && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      New credentials will be sent to this email
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-4 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditForm({});
                    setEditValidationErrors({});
                  }}
                  className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !isFormValid()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  {editLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {editLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
 
export default UserApprovalsPage;
 
