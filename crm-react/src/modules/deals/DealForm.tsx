import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Deal Form
 * Create and edit deal form with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/lib/store';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Save,
  Tag,
  Target,
  TrendingUp,
  Paperclip,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import * as XLSX from 'xlsx';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { useCompanies, useCreateDeal, useDeal, useUpdateDeal, useDeals } from '@/hooks/useApi';
import { dealDocumentsApi } from '@/api/dealDocumentsApi';
import { formatRelativeTime } from '@/utils';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import UploadModal from '@/components/ui/UploadModal';

const REQUIRED_MESSAGE = 'This field is required';

// Form validation schema
const dealSchema = z.object({
  name: z.string()
    .min(1, REQUIRED_MESSAGE)
    .max(200, 'Name is too long')
    .refine(val => val.trim().length > 0, {
      message: 'Deal Name cannot be empty or only spaces.'
    })
    .refine(val => !/^\d+$/.test(val.trim()), {
      message: 'Deal name cannot contain only numbers'
    })
    .refine(val => !/^[^a-zA-Z0-9\s]+$/.test(val.trim()), {
      message: 'Deal name cannot contain only special characters'
    }),
  company: z.union([z.string(), z.number()])
    .refine(val => {
      if (val === '' || val === null || val === undefined) return false;
      return true;
    }, REQUIRED_MESSAGE),
  contact: z.union([z.string(), z.number()]).refine(val => {
    // For new deals, contact is required only if a company is selected
    const isEditing = window.location.pathname.includes('/edit');
    if (isEditing) return true;
    
    // For new deals, contact is required
    return val !== '' && val !== null && val !== undefined && String(val).trim() !== '';
  }, REQUIRED_MESSAGE),
  value: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({ required_error: REQUIRED_MESSAGE }).min(0.01, 'Deal value must be greater than 0')
  ),
  probability: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0, 'Probability must be between 0 and 100').max(100, 'Probability must be between 0 and 100')
  ),
  stage: z.enum(['qualified', 'proposal', 'negotiation', 'won', 'lost']),
  expectedCloseDate: z.string()
    .min(1, REQUIRED_MESSAGE)
    .refine(val => val.trim().length > 0, 'Expected Close Date should not allow only spaces')
    .refine((date) => {
    if (!date) return false;
    
    // Only validate for new deals, not when editing existing deals
    const isEditing = window.location.pathname.includes('/edit');
    if (isEditing) return true;
    
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
    message: 'Expected close date cannot be in the past'
  }),

  remarks: z.string().optional(),
}).refine((data) => {
  // Only validate remarks when stage is actually 'lost'
  if (data.stage === 'lost') {
    return data.remarks && data.remarks.trim().length > 0;
  }
  return true;
}, {
  message: REQUIRED_MESSAGE,
  path: ['remarks'],
});

// Excel Preview Modal Component
const ExcelPreviewModal: React.FC<{ excelPreview: { html: string; name: string }; onClose: () => void }> = ({ excelPreview, onClose }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Preview: ${excelPreview.name}`} size="lg">
      <ModalContent>
        <div className="max-h-96 overflow-auto" dangerouslySetInnerHTML={{ __html: excelPreview.html }} />
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

// PDF Preview Modal Component
const PDFPreviewModal: React.FC<{ pdfPreview: { url: string; name: string }; onClose: () => void }> = ({ pdfPreview, onClose }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Preview: ${pdfPreview.name}`} size="lg">
      <ModalContent>
        <iframe src={pdfPreview.url} className="w-full h-96" title={pdfPreview.name} />
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

type DealFormData = z.infer<typeof dealSchema>;

const DealForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [docs, setDocs] = React.useState<any[]>([]);
  const [excelPreview, setExcelPreview] = React.useState<{ html: string; name: string } | null>(null);
  const [pdfPreview, setPdfPreview] = React.useState<{ url: string; name: string } | null>(null);
  const pdfUrlRef = React.useRef<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState<{ docId: number; docName: string; fileIndex?: number } | null>(null);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [pendingUploads, setPendingUploads] = React.useState<File[]>([]);
  const [pendingDeletes, setPendingDeletes] = React.useState<Array<number | {docId: number, fileIndex: number}>>([]);
  const [nameValidationError, setNameValidationError] = React.useState<string>('');
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('');
  const [loadingContacts, setLoadingContacts] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string>('');
  const [highlightedCompanyIndex, setHighlightedCompanyIndex] = React.useState(-1);
  const [highlightedContactIndex, setHighlightedContactIndex] = React.useState(-1);
  const [companySearchMode, setCompanySearchMode] = React.useState(false);
  const [companySearchQuery, setCompanySearchQuery] = React.useState('');
  const [contactSearchMode, setContactSearchMode] = React.useState(false);
  const [contactSearchQuery, setContactSearchQuery] = React.useState('');
  
  // Dropdown states
  const [companyDropdownOpen, setCompanyDropdownOpen] = React.useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = React.useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = React.useState(false);
  const companyDropdownRef = React.useRef<HTMLDivElement>(null);
  const contactDropdownRef = React.useRef<HTMLDivElement>(null);
  const stageDropdownRef = React.useRef<HTMLDivElement>(null);
  const companyOptionsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  const { data, isLoading } = useDeal(id!);
  const deal = data?.data;

  const { data: companiesData } = useCompanies();
  const companies = companiesData?.data || [];
  
  const { data: dealsData } = useDeals();
  const existingDeals = dealsData?.data || [];

  // For editing, if deal has a company name that's not in the list, add it
  const companiesWithSelected = deal?.company && !companies.find(c => c.name === deal.company)
    ? [{ id: 'temp', name: deal.company }, ...companies]
    : companies;
  
  const selectedCompanyName = deal?.company || '';

  const createDealMutation = useCreateDeal();
  const updateDealMutation = useUpdateDeal();

  const fetchDocuments = React.useCallback(async () => {
    if (!deal?.id) return;
    try {
      const list = await dealDocumentsApi.list(deal.id);
      logger.info('Fetched documents:', list);
      // The API returns documents with documentId, documentName, uploadedAt properties
      setDocs(list || []);
    } catch (error) {
      logger.error('Error fetching documents:', error);
      setDocs([]);
    }
  }, [deal?.id]);

  React.useEffect(() => {
    if (isEditing && deal?.id) {
      logger.info('Fetching documents for deal:', deal.id);
      fetchDocuments();
    }
  }, [fetchDocuments, isEditing, deal?.id]);

  React.useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted, isDirty },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    shouldFocusError: false,
    defaultValues: {
      stage: 'qualified',
      probability: 25,
      value: undefined,
      expectedCloseDate: '',
    },
  });

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const handleDealFormError = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    requestAnimationFrame(() => {
      submitButtonRef.current?.focus();
    });
  };

  // Unsaved changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [initialFormValues, setInitialFormValues] = React.useState<DealFormData | null>(null);
  
  // Track form changes for unsaved changes detection
  React.useEffect(() => {
    if (isEditing && initialFormValues) {
      const currentValues = watch();
      const hasFormChanges = Object.keys(currentValues).some(key => {
        const currentValue = currentValues[key as keyof DealFormData];
        const initialValue = initialFormValues[key as keyof DealFormData];
        return currentValue !== initialValue;
      });
      const hasDocumentChanges = pendingUploads.length > 0 || pendingDeletes.length > 0;
      setHasUnsavedChanges(hasFormChanges || hasDocumentChanges);
    }
  }, [watch(), isEditing, initialFormValues, pendingUploads.length, pendingDeletes.length]);
  
  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setStageDropdownOpen(false);
      }
    };

    if (companyDropdownOpen || contactDropdownOpen || stageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [companyDropdownOpen, contactDropdownOpen, stageDropdownOpen]);

  const formData = watch();
  const { theme } = useAppSelector(state => state.preferences);
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 'anonymous';
  const userSpecificKey = `dealFormDraft_${userId}`;
  
  const isFormInitialized = React.useRef(false);
  
  // Update persisted values when form data changes (user-specific)
  React.useEffect(() => {
    if (!isEditing && isFormInitialized.current) {
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
            const form = document.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            if (form) {
              form.value = String(parsedData[key] || '');
              form.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        } catch (e) {
          logger.error('Failed to restore form data');
        }
      }
    }
    lastTheme.current = theme.mode;
  }, [theme.mode, isEditing, userSpecificKey]);

  // Load saved form data on mount (only once)
  React.useEffect(() => {
    if (!isEditing && !isFormInitialized.current) {
      const savedData = localStorage.getItem(userSpecificKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          reset(parsedData);
        } catch (e) {
          logger.error('Failed to parse saved form data');
        }
      }
      isFormInitialized.current = true;
    }
  }, [isEditing, reset, userSpecificKey]);

  // Clear form data on logout detection
  React.useEffect(() => {
    const clearFormDataOnLogout = () => {
      if (!isEditing) {
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
      if (!isEditing && !localStorage.getItem('tech_tammina_authenticated')) {
        clearFormDataOnLogout();
      }
    };
  }, [userSpecificKey, isEditing]);





  const watchedStage = watch('stage');

  // Define stage progression and get available stages for editing
  const getAvailableStages = React.useMemo(() => {
    const stageProgression = [
      { value: 'qualified', label: 'Qualified' },
      { value: 'proposal', label: 'Proposal' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' }
    ];

    if (!isEditing || !deal?.stage) {
      return stageProgression; // Show all stages for new deals
    }

    // For editing, only show current stage and forward stages
    const currentStageIndex = stageProgression.findIndex(stage => stage.value === deal.stage);
    if (currentStageIndex === -1) {
      return stageProgression; // Fallback if current stage not found
    }

    // Return current stage and all stages after it
    return stageProgression.slice(currentStageIndex);
  }, [isEditing, deal?.stage]);

  // Auto-update probability based on stage
  React.useEffect(() => {
    const stageToProb = {
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      won: 100,
      lost: 0,
    };

    const newProbability = stageToProb[watchedStage as keyof typeof stageToProb];
    setValue('probability', newProbability);
  }, [watchedStage, setValue]);

  // Reset form with deal data when editing
  React.useEffect(() => {
    if (isEditing && deal) {
      // Convert yyyy-mm-dd to dd-mm-yyyy for display
      const convertToDisplayFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const [year, month, day] = dateStr.split('T')[0].split('-');
          return `${day}-${month}-${year}`;
        } catch {
          return '';
        }
      };
      
      const formData = {
        name: deal.name,
        company: deal.company || '',
        contact: deal.contactId || deal.contact || '', // Add contact field for editing
        value: deal.value,
        probability: deal.probability,
        stage: deal.stage as any,
        expectedCloseDate: convertToDisplayFormat(deal.closeDate || ''),
        remarks: deal.remarks || '',
      };
      reset(formData);
      setInitialFormValues(formData);
      setHasUnsavedChanges(false);
    }
  }, [deal, isEditing, reset]);

  const onSubmit = async (data: DealFormData) => {
    try {
      // Validate data before processing
      const result = dealSchema.safeParse(data);
      if (!result.success) {
        logger.info('Validation failed:', result.error.issues);
        const firstError = result.error.issues[0];
        toast.error(firstError.message || 'Please fill in all required fields correctly');
        return;
      }
      
      // Check for duplicate deal name globally across all companies
      if (!isEditing) {
        const duplicateDeal = existingDeals.find(deal => 
          deal.name.toLowerCase() === data.name.toLowerCase()
        );
        
        if (duplicateDeal) {
          toast.error('Deal name must be unique');
          return;
        }
      }

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

      const dealData = {
        ...data,
        accountId: data.company, // Map company field to accountId for backend
        contactId: data.contact, // Map contact field to contactId
        expectedCloseDate: isEditing ? deal?.closeDate?.split('T')[0] : convertDateFormat(data.expectedCloseDate),
        closedDate: (data.stage === 'won' || data.stage === 'lost') ? new Date().toISOString().split('T')[0] : undefined,
      };

      logger.info('Form data being sent:', dealData);

      let effectiveDealId: string | null = null;
      if (isEditing && id) {
        const updated = await updateDealMutation.mutateAsync({ id, data: dealData });
        effectiveDealId = updated.data.id || id;
      } else {
        const created = await createDealMutation.mutateAsync(dealData);
        effectiveDealId = created.data.id;
      }

      // Handle pending document operations
      let uploadResults = { success: 0, failed: 0 };
      let deleteResults = { success: 0, failed: 0 };
      
      if (effectiveDealId) {
        let documentsChanged = false;
        
        // Upload pending files one by one to respect 10MB limit
        if (pendingUploads.length > 0) {
          for (const file of pendingUploads) {
            try {
              await dealDocumentsApi.upload(effectiveDealId, file);
              uploadResults.success++;
              documentsChanged = true;
            } catch (e) {
              logger.error('Failed to upload file:', file.name, e);
              uploadResults.failed++;
            }
          }
        }
        
        // Delete pending documents
        for (const deleteItem of pendingDeletes) {
          try {
            if (typeof deleteItem === 'object' && deleteItem.fileIndex !== undefined) {
              await dealDocumentsApi.delete(effectiveDealId, deleteItem.docId, deleteItem.fileIndex);
            } else {
              await dealDocumentsApi.delete(effectiveDealId, deleteItem);
            }
            deleteResults.success++;
            documentsChanged = true;
          } catch (e) {
            logger.error('Failed to delete document', deleteItem, e);
            deleteResults.failed++;
          }
        }
        
        // Refresh documents list if any changes were made
        if (documentsChanged && isEditing) {
          await fetchDocuments();
        }
      }

      // Clear saved form data and reset form for new deals
      localStorage.removeItem(userSpecificKey);
      setHasUnsavedChanges(false);
      
      if (!isEditing) {
        // Reset form fields for new deal creation
        reset({
          name: '',
          company: '',
          contact: '',
          value: '' as any,
          probability: 25,
          stage: 'qualified',
          expectedCloseDate: '',
          remarks: ''
        });
        
        // Clear pending uploads and deletes
        setPendingUploads([]);
        setPendingDeletes([]);
        setSelectedCompanyId('');
        setContacts([]);
        
        toast.success('Deal created successfully! You can add another deal.');
      } else {
        // Clear pending uploads and deletes for editing
        setPendingUploads([]);
        setPendingDeletes([]);
        
        // Show consolidated success message
        let message = 'Deal updated successfully!';
        
        
        toast.success(message);
        navigate('/crm/Deals');
      }
    } catch (error) {
      logger.error('Error saving deal:', error);
      const errorMessage = error?.message || 'Failed to save deal';
      if (errorMessage.toLowerCase().includes('deal name') && (errorMessage.toLowerCase().includes('unique') || errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('exists'))) {
        toast.error('Deal name must be unique');
      } else if (errorMessage.includes('value') || errorMessage.includes('Deal Value')) {
        toast.error('Please enter a valid Deal Value greater than 0');
      } else if (errorMessage.includes('expectedCloseDate') || errorMessage.includes('Expected Close Date')) {
        toast.error('Please select a valid Expected Close Date');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please fill in all required fields correctly');
      } else {
        toast.error('Deal name must be unique');
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
      navigate('/crm/Deals');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    // Clear pending uploads and deletes when discarding changes
    setPendingUploads([]);
    setPendingDeletes([]);
    if (!isEditing) {
      localStorage.removeItem(userSpecificKey);
    }
    navigate('/crm/Deals');
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isEditing) {
                localStorage.removeItem(userSpecificKey);
              }
              navigate('/crm/Deals');
            }}
            className="p-2 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {/* <span>Back</span> */}
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Deal' : 'New Deal'}
            </h1>
            {/* <p className="text-gray-600 mt-1">
              {isEditing ? 'Update deal information' : 'Add a new deal to your pipeline'}
            </p> */}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, handleDealFormError)} noValidate className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Deal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deal Name *
                  </label>
                  {isEditing && (deal?.stage === 'won' || deal?.stage === 'lost') ? (
                    <>
                      <input type="hidden" {...register('name')} />
                      <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {deal?.name || '—'}
                      </div>
                    </>
                  ) : (
                    <Input
                      {...register('name')}
                      placeholder="Enter deal name"
                      error={errors.name?.message}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name *
                    </label>
                    {isEditing ? (
                      <>
                        <input type="hidden" {...register('company')} />
                        <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {selectedCompanyName || '—'}
                        </div>
                      </>
                    ) : (
                      <div ref={companyDropdownRef}>
                        <input type="hidden" {...register('company')} />
                        <div className="relative">
                          <input
                            type="text"
                            value={companySearchMode ? companySearchQuery : (watch('company') ? companiesWithSelected.find(c => Number(c.id) === Number(watch('company')))?.name || 'Select a company' : 'Select a company')}
                            onChange={(e) => {
                              setCompanySearchQuery(e.target.value);
                              setCompanyDropdownOpen(true);
                            }}
                            onKeyDown={(e) => {
                              const filteredCompanies = companySearchQuery
                                ? companiesWithSelected.filter(c => c.name.toLowerCase().includes(companySearchQuery.toLowerCase()))
                                : companiesWithSelected;
                              
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setCompanyDropdownOpen(false);
                                setCompanySearchMode(false);
                                setHighlightedCompanyIndex(-1);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlightedCompanyIndex(prev => {
                                  const newIndex = prev < filteredCompanies.length ? prev + 1 : prev;
                                  setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                  return newIndex;
                                });
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlightedCompanyIndex(prev => {
                                  const newIndex = prev > 0 ? prev - 1 : 0;
                                  setTimeout(() => companyOptionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                                  return newIndex;
                                });
                              } else if (e.key === 'Enter' && highlightedCompanyIndex >= 0) {
                                e.preventDefault();
                                if (highlightedCompanyIndex === 0) {
                                  setValue('company', '');
                                  setSelectedCompanyId('');
                                  setContacts([]);
                                } else {
                                  const company = filteredCompanies[highlightedCompanyIndex - 1];
                                  if (company) {
                                    setValue('company', Number(company.id));
                                    trigger('company');
                                    setSelectedCompanyId(String(company.id));
                                    if (company.id) {
                                      setLoadingContacts(true);
                                      fetch(`/api/contacts/by-account/${company.id}`, {
                                        headers: {
                                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                          'X-User-Id': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').id,
                                          'X-User-Role': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role,
                                        }
                                      })
                                      .then(res => res.json())
                                      .then(data => {
                                        setContacts(data);
                                        setLoadingContacts(false);
                                      })
                                      .catch(() => {
                                        setContacts([]);
                                        setLoadingContacts(false);
                                      });
                                    } else {
                                      setContacts([]);
                                    }
                                  }
                                }
                                setCompanyDropdownOpen(false);
                                setHighlightedCompanyIndex(-1);
                                setCompanySearchMode(false);
                                setCompanySearchQuery('');
                              } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                                setCompanySearchMode(true);
                              }
                            }}
                            onFocus={() => {
                              setCompanyDropdownOpen(true);
                              setCompanySearchMode(false);
                              setCompanySearchQuery('');
                              setHighlightedCompanyIndex(-1);
                            }}
                            onClick={() => {
                              setCompanyDropdownOpen(true);
                              setCompanySearchMode(false);
                              setCompanySearchQuery('');
                              setHighlightedCompanyIndex(-1);
                            }}
                            readOnly={!companySearchMode}
                            className="w-full pl-3 pr-20 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 bg-white dark:bg-gray-800 cursor-pointer border-gray-200 dark:border-gray-600"
                            style={{ outline: 'none', boxShadow: 'none' }}
                          />
                          {companySearchQuery && companySearchMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompanySearchQuery('');
                                setHighlightedCompanyIndex(-1);
                              }}
                              className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                              title="Clear search"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${companyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          
                          {companyDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                              <div className="p-2">
                                {(() => {
                                  const filteredCompanies = companySearchQuery
                                    ? companiesWithSelected.filter(c => c.name.toLowerCase().includes(companySearchQuery.toLowerCase()))
                                    : companiesWithSelected;
                                  
                                  if (filteredCompanies.length === 0) {
                                    return (
                                      <div className="px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400">
                                        No companies found
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setValue('company', '');
                                          setSelectedCompanyId('');
                                          setContacts([]);
                                          setCompanyDropdownOpen(false);
                                          setHighlightedCompanyIndex(-1);
                                          setCompanySearchMode(false);
                                          setCompanySearchQuery('');
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                          highlightedCompanyIndex === 0 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                          !watch('company') ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        Select a company
                                      </button>
                                      {filteredCompanies.map((company, index) => (
                                        <button
                                          key={company.id}
                                          ref={el => companyOptionsRef.current[index + 1] = el}
                                          type="button"
                                          onClick={() => {
                                            setValue('company', Number(company.id));
                                            trigger('company');
                                            setSelectedCompanyId(String(company.id));
                                            if (company.id) {
                                              setLoadingContacts(true);
                                              fetch(`/api/contacts/by-account/${company.id}`, {
                                                headers: {
                                                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                                  'X-User-Id': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').id,
                                                  'X-User-Role': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role,
                                                }
                                              })
                                              .then(res => res.json())
                                              .then(data => {
                                                setContacts(data);
                                                setLoadingContacts(false);
                                              })
                                              .catch(() => {
                                                setContacts([]);
                                                setLoadingContacts(false);
                                              });
                                            } else {
                                              setContacts([]);
                                            }
                                            setCompanyDropdownOpen(false);
                                            setHighlightedCompanyIndex(-1);
                                            setCompanySearchMode(false);
                                            setCompanySearchQuery('');
                                          }}
                                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                            highlightedCompanyIndex === index + 1 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                            Number(watch('company')) === Number(company.id) ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                          }`}
                                        >
                                          {(() => {
                                            const label = company.name;
                                            const query = companySearchQuery;
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
                                      ))}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {errors.company && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.company.message}
                      </p>
                    )}
                  </div>
                  
                  {!isEditing && selectedCompanyId && (
                    <div ref={contactDropdownRef}>
                      <input type="hidden" {...register('contact')} />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contact Person *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={contactSearchMode ? contactSearchQuery : (watch('contact') ? contacts.find(c => Number(c.contactId) === Number(watch('contact')))?.name || 'Select a contact' : 'Select a contact')}
                          onChange={(e) => {
                            setContactSearchQuery(e.target.value);
                            setContactDropdownOpen(true);
                          }}
                          onKeyDown={(e) => {
                            const filteredContacts = contactSearchQuery
                              ? contacts.filter(c => c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                              : contacts;
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedContactIndex(prev => prev < filteredContacts.length ? prev + 1 : prev);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedContactIndex(prev => prev > 0 ? prev - 1 : 0);
                            } else if (e.key === 'Enter' && highlightedContactIndex >= 0) {
                              e.preventDefault();
                              if (highlightedContactIndex === 0) {
                                setValue('contact', '');
                              } else {
                                const contact = filteredContacts[highlightedContactIndex - 1];
                                if (contact) {
                                  setValue('contact', Number(contact.contactId));
                                  trigger('contact');
                                }
                              }
                              setContactDropdownOpen(false);
                              setHighlightedContactIndex(-1);
                              setContactSearchMode(false);
                              setContactSearchQuery('');
                            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                              setContactSearchMode(true);
                            }
                          }}
                          onFocus={() => {
                            setContactDropdownOpen(true);
                            setContactSearchMode(false);
                            setContactSearchQuery('');
                            setHighlightedContactIndex(-1);
                          }}
                          onClick={() => {
                            setContactDropdownOpen(true);
                            setContactSearchMode(false);
                            setContactSearchQuery('');
                            setHighlightedContactIndex(-1);
                          }}
                          disabled={loadingContacts}
                          readOnly={!contactSearchMode}
                          className="flex items-center justify-between w-full h-10 px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${contactDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        
                        {contactDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                            <div className="p-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('contact', '');
                                  setContactDropdownOpen(false);
                                  setHighlightedContactIndex(-1);
                                  setContactSearchMode(false);
                                  setContactSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  highlightedContactIndex === 0 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                  !watch('contact') ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                Select a contact
                              </button>
                              {(contactSearchQuery
                                ? contacts.filter(c => c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                                : contacts
                              ).map((contact, index) => (
                                <button
                                  key={contact.contactId}
                                  type="button"
                                  onClick={() => {
                                    setValue('contact', Number(contact.contactId));
                                    trigger('contact');
                                    setContactDropdownOpen(false);
                                    setHighlightedContactIndex(-1);
                                    setContactSearchMode(false);
                                    setContactSearchQuery('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    highlightedContactIndex === index + 1 ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                    Number(watch('contact')) === Number(contact.contactId) ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {contact.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {loadingContacts && (
                        <p className="text-xs text-gray-500 mt-1">Loading contacts...</p>
                      )}
                      {!loadingContacts && contacts.length === 0 && selectedCompanyId && (
                        <p className="text-xs text-gray-500 mt-1">No contacts found for this company</p>
                      )}
                      {errors.contact && (
                        <p className="text-sm text-red-600 mt-1">{errors.contact.message}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deal Value *
                    </label>
                    {isEditing && (deal?.stage === 'won' || deal?.stage === 'lost') ? (
                      <>
                        <input type="hidden" {...register('value', { valueAsNumber: true })} />
                        <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                          <span>{deal?.value ? `${deal.value.toLocaleString()}` : '0.00'}</span>
                        </div>
                      </>
                    ) : (
                      <Input
                        {...register('value', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        leftIcon={<DollarSign className="w-4 h-4" />}
                        error={errors.value?.message}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Probability *
                    </label>
                    <div className="relative">
                      <div className="flex items-center w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">{watch('probability') || 0}%</span>
                      </div>
                      <input type="hidden" {...register('probability', { valueAsNumber: true })} value={watch('probability') || 0} />
                    </div>
                    {errors.probability && (
                      <p className="text-sm text-red-600 mt-1">{errors.probability.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Close Date *
                    </label>
                    {isEditing ? (
                      <>
                        <input type="hidden" {...register('expectedCloseDate')} />
                        <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                          <span>{deal?.closeDate ? new Date(deal.closeDate).toLocaleDateString('en-GB') : '—'}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expected close date is locked to track performance
                        </p>
                      </>
                    ) : (
                      <CustomDatePicker
                        label=""
                        value={watch('expectedCloseDate')}
                        onChange={(value) => {
                          setValue('expectedCloseDate', value);
                          trigger('expectedCloseDate');
                        }}
                        placeholder="dd-mm-yyyy"
                        futureOnly={true}
                        error={errors.expectedCloseDate?.message}
                        errorIcon={true}
                      />
                    )}
                  </div>
                </div>

                {(watchedStage === 'won' || watchedStage === 'lost') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Actual Close Date
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Paperclip className="w-5 h-5" />
                  <span>Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const maxFileSize = 10 * 1024 * 1024; // 10MB
                        const oversizedFiles = files.filter(file => file.size > maxFileSize);
                        
                        if (oversizedFiles.length > 0) {
                          toast.error(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
                          e.target.value = ''; // Clear the input
                          return;
                        }
                        
                        if (files.length > 20) {
                          toast.error('Maximum 20 files can be uploaded at once');
                          e.target.value = ''; // Clear the input
                          return;
                        }
                        
                        // Check for duplicates with existing documents
                        const duplicates: string[] = [];
                        const existingFileNames = new Set<string>();
                        
                        // Collect existing document names
                        docs.forEach(doc => {
                          if (doc.documentName.includes(', ')) {
                            doc.documentName.split(', ').forEach(name => {
                              existingFileNames.add(name.trim().toLowerCase());
                            });
                          } else {
                            existingFileNames.add(doc.documentName.toLowerCase());
                          }
                        });
                        
                        // Collect pending upload names
                        pendingUploads.forEach(file => {
                          existingFileNames.add(file.name.toLowerCase());
                        });
                        
                        // Check for duplicates
                        files.forEach(file => {
                          if (existingFileNames.has(file.name.toLowerCase())) {
                            duplicates.push(file.name);
                          }
                        });
                        
                        if (duplicates.length > 0) {
                          setUploadError(`Document${duplicates.length > 1 ? 's' : ''} already added: ${duplicates.join(', ')}`);
                        } else {
                          setUploadError('');
                        }
                        
                        setPendingFiles(files);
                        setShowUploadModal(true);
                      }
                    }}
                    className="hidden"
                    id="document-upload"
                    key={pendingUploads.length} // Reset input when uploads change
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Upload Documents
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Supported Files PDF, DOC, XLS, PPT, Images (Max 10MB each)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Pending Uploads */}
                {pendingUploads.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Pending Uploads ({pendingUploads.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-scroll overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                      {pendingUploads.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-800 dark:text-blue-200">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingUploads(prev => prev.filter((_, i) => i !== idx))}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Documents */}
                {isEditing && docs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Existing Documents ({docs.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-scroll overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}>
                      {docs.filter(doc => {
                        const isDeleted = pendingDeletes.some(del => 
                          (typeof del === 'object' && del.docId === doc.documentId && del.fileIndex === (doc.fileIndex || 0)) ||
                          (typeof del === 'number' && del === doc.documentId)
                        );
                        return !isDeleted;
                      }).map((doc) => (
                        <div key={`${doc.documentId}-${doc.fileIndex || 0}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {doc.documentName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(doc.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ 
                              docId: doc.documentId, 
                              docName: doc.documentName,
                              fileIndex: doc.fileIndex
                            })}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Deletes */}
                {pendingDeletes.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                      Marked for Deletion ({pendingDeletes.length})
                    </h4>
                    <div className="space-y-1">
                      {pendingDeletes.map((deleteItem, index) => {
                        const docId = typeof deleteItem === 'object' ? deleteItem.docId : deleteItem;
                        const fileIndex = typeof deleteItem === 'object' ? deleteItem.fileIndex : undefined;
                        const doc = docs.find(d => d.documentId === docId && (fileIndex === undefined || d.fileIndex === fileIndex));
                        return doc ? (
                          <div key={`${docId}-${fileIndex || 0}-${index}`} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <span className="text-red-800 dark:text-red-200 line-through">{doc.documentName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingDeletes(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                              title="Undo delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage *
                  </label>
                  {isEditing && deal?.stage && (deal.stage === 'won' || deal.stage === 'lost') ? (
                    <>
                      <input type="hidden" {...register('stage')} />
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50">
                        {deal.stage === 'won' ? 'Won' : 'Lost'}
                      </div>
                    </>
                  ) : (
                    <div ref={stageDropdownRef}>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                          className="flex items-center justify-between w-full h-10 min-w-[140px] px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <span className="truncate capitalize">{getAvailableStages.find(s => s.value === watch('stage'))?.label || 'Select stage'}</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${stageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {stageDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                              {getAvailableStages.map((stage) => (
                                <button
                                  key={stage.value}
                                  type="button"
                                  onClick={() => {
                                    setValue('stage', stage.value as any);
                                    setStageDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    watch('stage') === stage.value ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''
                                  }`}
                                >
                                  {stage.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.stage && (isSubmitted || touchedFields.stage) && (
                    <p className="text-sm text-red-600 mt-1">{errors.stage.message}</p>
                  )}
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Stage Guidelines</h4>
                  <div className="text-xs text-gray-900 dark:text-white space-y-1">
                    <p><strong>Qualified:</strong> Budget and need confirmed</p>
                    <p><strong>Proposal:</strong> Formal proposal submitted</p>
                    <p><strong>Negotiation:</strong> Terms being discussed</p>
                    <p><strong>Won/Lost:</strong> Final decision made</p>
                  </div>
                </div>

                {watchedStage === 'lost' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Remarks (Required for Lost Deals)
                    </label>
                    <div className="relative">
                      <textarea
                        {...register('remarks')}
                        rows={6}
                        maxLength={200}
                        className="w-full px-3 py-2 pb-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-0 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Please provide reasons for the deal being lost"
                        onChange={(e) => {
                          if (e.target.value.length <= 200) {
                            setValue('remarks', e.target.value);
                            trigger('remarks');
                          }
                        }}
                      />
                      <div className="absolute bottom-1 right-2 pointer-events-none">
                        <span className={`text-xs ${
                          (watch('remarks')?.length || 0) >= 200 ? 'text-red-600' :
                          (watch('remarks')?.length || 0) >= 178 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {(watch('remarks')?.length || 0) >= 200 ? 'Character limit reached - ' :
                           (watch('remarks')?.length || 0) >= 178 ? 'Approaching 200 character limit - ' : ''}{watch('remarks')?.length || 0}/200
                        </span>
                      </div>
                    </div>
                    {watchedStage === 'lost' && errors.remarks && (
                      <p className="text-sm text-red-600 mt-1">{errors.remarks.message}</p>
                    )}
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Deal Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weighted Value</span>
                  <span className="font-semibold">
                    ${((watch('value') || 0) * (watch('probability') || 0) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stage</span>
                  <span className="font-semibold capitalize">{watch('stage')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Win Probability</span>
                  <span className="font-semibold">{watch('probability') || 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardContent className="p-6">
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
                      ? (isEditing ? 'Updating...' : 'Creating..') 
                      : (isEditing ? 'Update Deal' : 'Create Deal')
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


      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete ${confirmDelete?.docName ? (() => {
          const name = confirmDelete.docName;
          if (name.length <= 30) return name;
          const lastDot = name.lastIndexOf('.');
          if (lastDot === -1) return name.substring(0, 30) + '...';
          const extension = name.substring(lastDot);
          const filename = name.substring(0, lastDot);
          const maxFilenameLength = 30 - extension.length - 3; // 3 for '...'
          return filename.substring(0, maxFilenameLength) + '...' + extension;
        })() : ''}?`}
        onConfirm={() => {
          if (confirmDelete) {
            if (confirmDelete.fileIndex !== undefined) {
              setPendingDeletes(prev => [...prev, { docId: confirmDelete.docId, fileIndex: confirmDelete.fileIndex }]);
            } else {
              setPendingDeletes(prev => [...prev, confirmDelete.docId]);
            }
            toast.success('Document marked for deletion');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
        showIcon={false}
      />
      <UploadModal
        isOpen={showUploadModal}
        files={pendingFiles}
        uploading={false}
        onUpload={() => {
          if (pendingFiles.length > 0 && !uploadError) {
            setPendingUploads(prev => [...prev, ...pendingFiles]);
            toast.success(`${pendingFiles.length} file(s) queued for upload`);
            setShowUploadModal(false);
            setPendingFiles([]);
            setUploadError('');
          }
        }}
        onCancel={() => {
          setShowUploadModal(false);
          setPendingFiles([]);
          setUploadError('');
          // Force file input reset by updating key
          const fileInput = document.getElementById('document-upload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }}
        error={uploadError}
      />

      {/* Excel Preview Modal */}
      {excelPreview && (
        <ExcelPreviewModal 
          excelPreview={excelPreview} 
          onClose={() => setExcelPreview(null)} 
        />
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFPreviewModal 
          pdfPreview={pdfPreview} 
          onClose={() => setPdfPreview(null)} 
        />
      )}
      
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

export default DealForm;
