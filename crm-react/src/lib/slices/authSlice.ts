/**
 * Tech Tammina CRM - Authentication Slice
 */

import { User } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearAllPagination, clearAllViewModes } from '@/utils/pagination';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null, // Will be populated from profile API
  isAuthenticated: true, // Mock authenticated state
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      // Clear pagination data on logout
      clearAllPagination();
      // Clear view modes on logout
      clearAllViewModes();
      // Clear all filter data on logout
      const filterKeys = [
        'contactsSearchQuery', 'contactsSelectedType', 'contactsSelectedStatus', 'contactsSelectedOwner',
        'contactsSelectedManager', 'contactsStartDate', 'contactsEndDate', 'contactsLocationFilter',
        'contactsSelectedMyContacts', 'contactsSelectedVPContacts',
        'ceoContactsSelectedSalesVP', 'ceoContactsSelectedManager', 'ceoContactsSelectedExecutive',
        'ceoContactsSearchQuery', 'ceoContactsStartDate', 'ceoContactsEndDate',
        'ceoLeadsSelectedSalesVP', 'ceoLeadsSelectedManager', 'ceoLeadsSelectedExecutive',
        'ceoLeadsSearchQuery', 'ceoLeadsStatus', 'ceoLeadsSource', 'ceoLeadsStartDate', 'ceoLeadsEndDate',
        'ceoDealsSearchQuery', 'ceoDealsSelectedCompany',
        'ceoAccountsSearchQuery', 'ceoAccountsSelectedIndustry', 'ceoAccountsFromDate', 'ceoAccountsToDate',
        'ceoAccountsAppliedFromDate', 'ceoAccountsAppliedToDate', 'ceoAccountsViewMode'
      ];
      filterKeys.forEach(key => localStorage.removeItem(key));
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setUserFromProfile: (state, action: PayloadAction<any>) => {
      const profile = action.payload;
      state.user = {
        id: profile.userId?.toString() || '1',
        name: profile.fullName || profile.username || 'User',
        email: profile.email || 'user@example.com',
        avatar: profile.avatarUrl,
        role: profile.role || 'user',
        department: profile.department || 'Unknown',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setUserFromProfile,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;