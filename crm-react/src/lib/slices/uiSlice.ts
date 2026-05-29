/**
 * Tech Tammina CRM - UI State Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalState } from '@/types';

interface UIState {
  sidebarCollapsed: boolean;
  // Removed commandPaletteOpen - global search functionality removed
  modal: ModalState;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
  }>;
  loading: {
    [key: string]: boolean;
  };
}

// Load sidebar state from localStorage
const loadSidebarState = (): boolean => {
  try {
    const saved = localStorage.getItem('crm-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
};

const initialState: UIState = {
  sidebarCollapsed: loadSidebarState(),
  // Removed commandPaletteOpen - global search functionality removed
  modal: {
    isOpen: false,
  },
  notifications: [
    {
      id: '1',
      type: 'info',
      title: 'Welcome to Tech Tammina CRM',
      message: 'Your futuristic CRM experience starts here!',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'System Update',
      message: 'All integrations are running smoothly.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
  ],
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('crm-sidebar-collapsed', JSON.stringify(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('crm-sidebar-collapsed', JSON.stringify(action.payload));
    },
    // Removed toggleCommandPalette and setCommandPaletteOpen - global search functionality removed
    openModal: (state, action: PayloadAction<{ type?: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
      };
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
      }>
    ) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      const { [action.payload]: removed, ...rest } = state.loading;
      state.loading = rest;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  // Removed toggleCommandPalette and setCommandPaletteOpen - global search functionality removed
  openModal,
  closeModal,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  setLoading,
  clearLoading,
} = uiSlice.actions;

export default uiSlice.reducer;