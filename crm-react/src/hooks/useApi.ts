import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - API Hooks
 * React Query hooks for data fetching with real backend API
 */

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store';
import { setUserFromProfile } from '@/lib/slices/authSlice';

// Import API services
import { activitiesApi } from '@/api/activitiesApi';
import { companiesApi } from '@/api/companiesApi';
import { contactsApi } from '@/api/contactsApi';
import { dealsApi } from '@/api/dealsApi';
import { leadsApi } from '@/api/leadsApi';
import { tasksApi } from '@/api/tasksApi';
import { reportsApi } from '@/api/reportsApi';
import { profileApi } from '@/api/profileApi';
import { settingsApi } from '@/api/settingsApi';

// Leads hooks - Connected to real backend API
export const useLeads = (options?: {
  search?: string;
  page?: number;
  limit?: number;
  ownerId?: string; // legacy: creator id
  assignedToId?: string; // new: assignee filter
  createdById?: string; // new: creator filter
}) => {
  return useQuery({
    queryKey: ['leads', options],
    queryFn: () => leadsApi.list({
      q: options?.search,
      page: options?.page,
      limit: options?.limit,
      ownerId: options?.ownerId,
      assignedToId: options?.assignedToId,
      createdById: options?.createdById,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLead = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => leadsApi.create(data),
    onSuccess: (newLead) => {
      // Invalidate all leads queries (with any options)
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      // Add to cache
      queryClient.setQueryData(['leads', newLead.data.id], newLead);

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leadsApi.update(id, data),
    onSuccess: (updatedLead, { id }) => {
      // Update specific lead in cache
      queryClient.setQueryData(['leads', id], updatedLead);

      // Update the lead in all list caches to prevent empty state
      queryClient.setQueriesData({ queryKey: ['leads'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) {
          return oldData;
        }
        return {
          ...oldData,
          data: oldData.data.map((lead: any) =>
            (lead.id === id || lead.leadId === id) ? updatedLead.data : lead
          ),
        };
      });

      // Invalidate queries after updating cache to ensure fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }, 100);

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['leads', id] });

      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Companies hooks - Connected to real backend API
export const useCompanies = (options?: {
  search?: string;
  page?: number;
  limit?: number;
  filters?: any;
  ownerId?: string;
  createdById?: string;
}) => {
  return useQuery({
    queryKey: ['companies', options],
    queryFn: () => companiesApi.list({
      q: options?.search,
      page: options?.page,
      limit: options?.limit,
      filters: options?.filters,
      ownerId: options?.ownerId,
      createdById: options?.createdById,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCompany = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => companiesApi.create(data),
    onSuccess: (newCompany) => {
      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      // Add to cache
      queryClient.setQueryData(['companies', newCompany.data.id], newCompany);

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companiesApi.update(id, data),
    onSuccess: (updatedCompany, { id }) => {
      // Update specific company in cache
      queryClient.setQueryData(['companies', id], updatedCompany);

      // Invalidate companies list to refresh
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['companies', id] });

      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Contacts hooks - Connected to real backend API
export const useContacts = (options?: {
  search?: string;
  page?: number;
  limit?: number;
  filters?: any;
  ownerId?: string;
  createdById?: string;
}) => {
  return useQuery({
    queryKey: ['contacts', options],
    queryFn: () => contactsApi.list({
      q: options?.search,
      page: options?.page,
      limit: options?.limit,
      filters: options?.filters,
      ownerId: options?.ownerId,
      createdById: options?.createdById,
    }),
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });
};

export const useContact = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 0, // Always fetch fresh data for individual contacts
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => contactsApi.create(data),
    onSuccess: (newContact) => {
      // Add new contact to the top of all contacts list caches
      queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) {
          return oldData;
        }
        return {
          ...oldData,
          data: [newContact.data, ...oldData.data],
        };
      });

      // Add to individual contact cache
      queryClient.setQueryData(['contacts', newContact.data.id], newContact);

      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.refetchQueries({ queryKey: ['contacts'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contactsApi.update(id, data),
    onSuccess: (updatedContact, { id }) => {
      // Update specific contact in cache
      queryClient.setQueryData(['contacts', id], updatedContact);

      // Update the contact in all list caches
      queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((contact: any) =>
            contact.id === id || contact.contactId === id ? updatedContact.data : contact
          ),
        };
      });

      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.refetchQueries({ queryKey: ['contacts'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['contacts', id] });

      // Invalidate contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateContactRemarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) => contactsApi.updateRemarks(id, remarks),
    onSuccess: (updatedContact, { id }) => {
      // Update specific contact in cache
      queryClient.setQueryData(['contacts', id], updatedContact);

      // Update the contact in all list caches to reflect remarks change
      queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((contact: any) =>
            contact.id === id || contact.contactId === id ? updatedContact.data : contact
          ),
        };
      });

      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.refetchQueries({ queryKey: ['contacts', id] });
    },
  });
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      try {
        // Use dashboard endpoint for global values (not role-filtered)
        const { environment } = await import('@/lib/environment');
        const response = await fetch(`${environment.apiURL}/dashboard/metrics`);
        const fallbackData = await response.json();
        const data = fallbackData?.data || {};
        
        // Map backend data to frontend format with real calculated values
        return {
          data: [
            { id: 'total-revenue', name: 'Total Revenue', value: `$${(data.totalRevenue || 0).toLocaleString()}`, format: 'currency', change: data.revenueChange || 0, changeType: 'increase', period: 'This Month' },
            { id: 'active-deals', name: 'Won Deals', value: `${data.wonDeals || 0}`, format: 'number', change: data.wonDealsChange || 0, changeType: 'increase', period: 'This Month' },
            { id: 'conversion-rate', name: 'Conversion Rate', value: `${data.conversionRate || 0}%`, format: 'string', change: data.conversionRateChange || 0, changeType: 'increase', period: 'This Month' },
            { id: 'total-deals', name: 'Total Deals', value: `${data.totalDeals || 0}`, format: 'number', change: data.totalDealsChange || 0, changeType: 'increase', period: 'This Month' },
          ],
        };
      } catch (error) {
        // Fallback with zeros if dashboard endpoint fails
        return {
          data: [
            { id: 'total-revenue', name: 'Total Revenue', value: '$0', format: 'currency', change: 0, changeType: 'increase', period: 'This Month' },
            { id: 'active-deals', name: 'Won Deals', value: '0', format: 'number', change: 0, changeType: 'increase', period: 'This Month' },
            { id: 'conversion-rate', name: 'Conversion Rate', value: '0%', format: 'string', change: 0, changeType: 'increase', period: 'This Month' },
            { id: 'total-deals', name: 'Total Deals', value: '0', format: 'number', change: 0, changeType: 'increase', period: 'This Month' },
          ],
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardCharts = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['dashboard', 'charts', params],
    queryFn: async () => {
      try {
        // Use dashboard charts endpoint for real global revenue data
        const { environment } = await import('@/lib/environment');
        const response = await fetch(`${environment.apiURL}/dashboard/charts`);
        const data = await response.json();
        
        const chartsData = data?.data || {};
        const revenueData = chartsData.revenue || {};
        const pipelineData = chartsData.pipeline || {};
        
        // Format revenue data
        const revenueLabels = revenueData.labels || [];
        const revenueValues = revenueData.datasets?.[0]?.data || [];
        
        // Format labels from YYYY-MM to YY-MM if needed
        const formattedLabels = revenueLabels.map((label: string) => {
          if (label.includes('-') && label.length >= 7) {
            const [year, month] = label.split('-');
            if (year && month && year.length === 4) {
              return year.slice(-2) + '-' + month;
            }
          }
          return label;
        });
        
        const revenue = {
          labels: formattedLabels,
          datasets: [{ data: revenueValues }],
        };

        // Pipeline data is already in correct format
        const pipeline = {
          labels: pipelineData.labels || ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
          datasets: [{ data: pipelineData.datasets?.[0]?.data || [0, 0, 0, 0, 0] }],
        };

        return { data: { revenue, pipeline } };
      } catch (error) {
        logger.error('Dashboard charts error:', error);
        // Fallback with empty data
        return {
          data: {
            revenue: { 
              labels: [], 
              datasets: [{ data: [] }] 
            },
            pipeline: { 
              labels: ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], 
              datasets: [{ data: [0, 0, 0, 0, 0] }] 
            }
          }
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds for faster updates
  });
}

export const useDeals = (options?: {
  search?: string;
  page?: number;
  limit?: number;
  filters?: any;
}) => {
  return useQuery({
    queryKey: ['deals', options],
    queryFn: () => dealsApi.list({
      q: options?.search,
      page: options?.page,
      limit: options?.limit,
      filters: options?.filters,
    }),
    staleTime: 500, // 0.5 seconds
  });
};

export const useDeal = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () => dealsApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => dealsApi.create(data),
    onSuccess: (newDeal) => {
      // Add new deal to the top of all deals list caches
      queryClient.setQueriesData({ queryKey: ['deals'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) {
          return oldData;
        }
        return {
          ...oldData,
          data: [newDeal.data, ...oldData.data],
        };
      });

      // Add to individual deal cache
      queryClient.setQueryData(['deals', newDeal.data.id], newDeal);

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => dealsApi.update(id, data),
    onSuccess: (updatedDeal, { id }) => {
      // Update specific deal in cache
      queryClient.setQueryData(['deals', id], updatedDeal);

      // Update the deal in all list caches
      queryClient.setQueriesData({ queryKey: ['deals'] }, (oldData: any) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((deal: any) =>
            deal.id === id || deal.dealId === id ? updatedDeal.data : deal
          ),
        };
      });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['deals', id] });

      // Invalidate deals list
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useTasks = (options?: {
  search?: string;
  page?: number; // reserved for later backend paging
  limit?: number; // reserved for later backend paging
  filters?: any;
}) => {
  return useQuery({
    queryKey: ['tasks', options],
    queryFn: async () => {
      const res = await tasksApi.list({
        q: options?.search, // Add search parameter
        ownerId: options?.filters?.ownerId?.[0],
        createdBy: options?.filters?.createdById?.[0],
        status: options?.filters?.status?.[0],
        type: options?.filters?.type?.[0],
        priority: options?.filters?.priority?.[0],
      });
      // Provide a pagination-like shape to not break UI expectations
      return {
        data: res.data,
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || res.data.length,
          total: res.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        success: true,
        message: res.message,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    placeholderData: (previousData: any) => previousData,
  });
};

export const useTask = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => tasksApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => tasksApi.create(data),
    onSuccess: (newTask) => {
      // Invalidate all task-related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assignedTasks'] });
      
      // Force refetch of executive categorized tasks for immediate updates
      queryClient.refetchQueries({ queryKey: ['executiveTasks'] });
      
      queryClient.setQueryData(['tasks', newTask.data.id], newTask);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Show success toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Task created successfully');
      });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: (updatedTask, { id }) => {
      queryClient.setQueryData(['tasks', id], updatedTask);
      
      // Invalidate all task-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assignedTasks'] });
      
      // Force refetch of executive categorized tasks
      queryClient.refetchQueries({ queryKey: ['executiveTasks'] });
      
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['tasks', id] });
      
      // Invalidate all task-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assignedTasks'] });
      
      // Force refetch of executive categorized tasks
      queryClient.refetchQueries({ queryKey: ['executiveTasks'] });
      
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      // Show error toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Failed to delete task: ${error.message || error}`);
      });
    },
  });
};

// Activities hooks - Connected to real backend API
export const useActivities = (options?: {
  leadId?: string;
}) => {
  return useQuery({
    queryKey: ['activities', options],
    queryFn: () => activitiesApi.list({
      leadId: options?.leadId,
    }),
    staleTime: 10 * 1000, // 10 seconds for more frequent updates
    refetchOnMount: 'always', // Always refetch when component mounts
    // Fetch all activities if no leadId, or specific lead activities if leadId provided
  });
};

export const useActivity = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesApi.get(id),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 30 * 1000, // 30 seconds for more frequent updates
  });  
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => activitiesApi.create(data),
    onSuccess: (newActivity) => {
      // Invalidate all activities queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Invalidate VP team communications for real-time updates
      queryClient.invalidateQueries({ queryKey: ['vpTeamCommunications'] });

      // Add to individual activity cache
      queryClient.setQueryData(['activities', newActivity.data.id || newActivity.data.activityId], newActivity);
      
      // Show success toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Activity created successfully');
      });
    },
    onError: (error: any) => {
      // Show error toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Failed to create activity: ${error.message || error}`);
      });
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => activitiesApi.update(id, data),
    onSuccess: (updatedActivity, { id }) => {
      // Update specific activity in cache
      queryClient.setQueryData(['activities', id], updatedActivity);

      // Invalidate all activities queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Invalidate VP team communications for real-time updates
      queryClient.invalidateQueries({ queryKey: ['vpTeamCommunications'] });
      
      // Show success toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Activity updated successfully');
      });
    },
    onError: (error: any) => {
      // Show error toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Failed to update activity: ${error.message || error}`);
      });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['activities', id] });

      // Invalidate activities list
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Show success toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Activity deleted successfully');
      });
    },
    onError: (error: any) => {
      // Show error toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Failed to delete activity: ${error.message || error}`);
      });
    },
  });
};

// Profile hooks - Connected to real backend API
export const useCurrentProfile = () => {
  const dispatch = useAppDispatch();
  
  const query = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: () => profileApi.getCurrentProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update auth slice when profile data is loaded
  React.useEffect(() => {
    if (query.data?.data) {
      dispatch(setUserFromProfile(query.data.data));
    }
  }, [query.data, dispatch]);
  
  return query;
};

export const useProfile = (userId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileApi.getProfile(userId),
    enabled: options?.enabled !== false && Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateCurrentProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: any) => profileApi.updateCurrentProfile(data),
    onSuccess: (updatedProfile) => {
      // Update current profile in cache
      queryClient.setQueryData(['profile', 'current'], updatedProfile);
      
      // Update auth slice with new user data
      // This will update the navbar and other UI components immediately
      if (updatedProfile?.data) {
        dispatch(setUserFromProfile(updatedProfile.data));
      }
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      profileApi.updateProfile(userId, data),
    onSuccess: (updatedProfile, { userId }) => {
      // Update specific profile in cache
      queryClient.setQueryData(['profile', userId], updatedProfile);
    },
  });
};

// Settings hooks - Connected to real backend API
export const useCurrentUserSettings = () => {
  return useQuery({
    queryKey: ['settings', 'current'],
    queryFn: () => settingsApi.getCurrentUserSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSettingsByRole = (role: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['settings', role],
    queryFn: () => settingsApi.getSettingsByRole(role),
    enabled: options?.enabled !== false && Boolean(role),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Calls API hooks
import { getCallsForExecutive, getCallsForManager, getCallAnalytics, createCall } from '@/api/callsApi';

export const useCallsForExecutive = (executiveId: number) => {
  return useQuery({
    queryKey: ['calls', 'executive', executiveId],
    queryFn: () => getCallsForExecutive(executiveId),
    enabled: !!executiveId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCallsForManager = (managerId: number) => {
  return useQuery({
    queryKey: ['calls', 'manager', managerId],
    queryFn: () => getCallsForManager(managerId),
    enabled: !!managerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCallAnalytics = (executiveId: number, period: 'today' | 'week' | 'month' = 'today') => {
  return useQuery({
    queryKey: ['callAnalytics', executiveId, period],
    queryFn: () => getCallAnalytics(executiveId, period),
    enabled: !!executiveId,
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};

export const useCreateCall = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => createCall(data),
    onSuccess: (newCall) => {
      // Invalidate calls lists
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['callAnalytics'] });
      
      // Update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Email hooks - Connected to real backend API
import { emailApi, Email } from '@/api/emailApi';

export const useEmails = (options?: {
  page?: number;
  size?: number;
  entityType?: string;
  entityId?: number;
}) => {
  return useQuery({
    queryKey: ['emails', options],
    queryFn: () => {
      if (options?.entityType && options?.entityId) {
        return emailApi.getEmailsForEntity(options.entityType, options.entityId);
      }
      return emailApi.getEmails(options?.page, options?.size);
    },
    staleTime: 10 * 1000, // 10 seconds for more frequent updates
    refetchOnMount: 'always', // Always refetch when component mounts
  });
};

export const useSendEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Email) => emailApi.sendEmail(data),
    onSuccess: (newEmail) => {
      // Invalidate emails list
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      // Invalidate activities to show email activity
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      // Invalidate VP team communications for real-time updates
      queryClient.invalidateQueries({ queryKey: ['vpTeamCommunications'] });
      // Toast handled in component
    },
    onError: (error: any) => {
      // Show error toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Failed to send email: ${error.message || error}`);
      });
    },
  });
};

export const useSaveDraftEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Email) => emailApi.saveDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Draft saved successfully');
      });
    },
  });
};

// Export all hooks for easy importing
export * from './useDebounce';
export * from './useLocalStorage';


export const useContactStats = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['contacts', id, 'stats'],
    queryFn: async () => {
      const { getContactStats } = await import('@/api/contactsApi');
      return getContactStats(id);
    },
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};



export const useAssignedTasks = (options?: { 
  search?: string;
  filters?: any;
  enabled?: boolean; 
}) => {
  return useQuery({
    queryKey: ['assignedTasks', options],
    queryFn: async () => {
      const res = await tasksApi.getAssignedTasks({
        q: options?.search, // Add search parameter
        status: options?.filters?.status?.[0],
        priority: options?.filters?.priority?.[0],
      });
      return {
        data: res.data,
        success: true,
        message: res.message,
      };
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    placeholderData: (previousData: any) => previousData,
  });
};

// VP Team Communications hook
export const useVpTeamCommunications = (userId?: string | number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['vpTeamCommunications', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const res = await fetch('/api/communication/vp-team', {
        headers: {
          'X-User-Id': userId.toString()
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch VP team communications');
      }
      return res.json();
    },
    enabled: options?.enabled !== false && Boolean(userId),
    staleTime: 0, // Always consider stale for immediate refresh
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
};