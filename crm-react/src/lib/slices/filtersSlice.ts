/**
 * Tech Tammina CRM - Filters State Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchFilters, SortOption } from '@/types';

interface FiltersState {
  leads: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'grid' | 'kanban';
  };
  contacts: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'grid';
  };
  deals: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'kanban';
  };
  tasks: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'calendar';
  };
  tickets: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'kanban';
  };
  campaigns: {
    filters: SearchFilters;
    sortBy?: SortOption;
    view: 'table' | 'grid';
  };
}

const initialState: FiltersState = {
  leads: {
    filters: {},
    sortBy: { field: 'createdAt', direction: 'desc' },
    view: 'table',
  },
  contacts: {
    filters: {},
    sortBy: { field: 'name', direction: 'asc' },
    view: 'table',
  },
  deals: {
    filters: {},
    sortBy: { field: 'value', direction: 'desc' },
    view: 'kanban',
  },
  tasks: {
    filters: {},
    sortBy: { field: 'dueDate', direction: 'asc' },
    view: 'table',
  },
  tickets: {
    filters: {},
    sortBy: { field: 'createdAt', direction: 'desc' },
    view: 'table',
  },
  campaigns: {
    filters: {},
    sortBy: { field: 'createdAt', direction: 'desc' },
    view: 'table',
  },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<{
        module: keyof FiltersState;
        filters: SearchFilters;
      }>
    ) => {
      state[action.payload.module].filters = action.payload.filters;
    },
    updateFilters: (
      state,
      action: PayloadAction<{
        module: keyof FiltersState;
        filters: Partial<SearchFilters>;
      }>
    ) => {
      state[action.payload.module].filters = {
        ...state[action.payload.module].filters,
        ...action.payload.filters,
      };
    },
    clearFilters: (state, action: PayloadAction<keyof FiltersState>) => {
      state[action.payload].filters = {};
    },
    setSortBy: (
      state,
      action: PayloadAction<{
        module: keyof FiltersState;
        sortBy: SortOption;
      }>
    ) => {
      state[action.payload.module].sortBy = action.payload.sortBy;
    },
    setView: (
      state,
      action: PayloadAction<{
        module: keyof FiltersState;
        view: string;
      }>
    ) => {
      (state[action.payload.module] as any).view = action.payload.view;
    },
    resetModuleFilters: (state, action: PayloadAction<keyof FiltersState>) => {
      const module = action.payload;
      state[module] = initialState[module];
    },
  },
});

export const {
  setFilters,
  updateFilters,
  clearFilters,
  setSortBy,
  setView,
  resetModuleFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;