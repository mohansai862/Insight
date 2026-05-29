import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - User Preferences Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences, ThemeSettings } from '@/types';

// Load theme from localStorage
const loadThemeFromStorage = (): ThemeSettings => {
  try {
    const stored = localStorage.getItem('tech_tammina_theme');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.warn('Failed to load theme from localStorage:', error);
  }
  return {
    mode: 'light',
    density: 'comfortable',
    primaryColor: '#2563eb',
    fontSize: 'medium',
  };
};

// Save theme to localStorage
const saveThemeToStorage = (theme: ThemeSettings) => {
  try {
    localStorage.setItem('tech_tammina_theme', JSON.stringify(theme));
  } catch (error) {
    logger.warn('Failed to save theme to localStorage:', error);
  }
};

const initialState: UserPreferences = {
  theme: loadThemeFromStorage(),
  notifications: {
    email: true,
    push: true,
    desktop: true,
    types: {
      tasks: true,
      deals: true,
      leads: true,
      campaigns: true,
      tickets: true,
    },
  },
  dashboard: {
    widgets: [
      'revenue-metrics',
      'pipeline-overview',
      'recent-activities',
      'lead-sources',
      'task-summary',
      'campaign-performance',
    ],
    layout: 'grid',
    refreshInterval: 300000, // 5 minutes
  },
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    updateTheme: (state, action: PayloadAction<Partial<ThemeSettings>>) => {
      state.theme = { ...state.theme, ...action.payload };
      saveThemeToStorage(state.theme);
    },
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
      saveThemeToStorage(state.theme);
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<UserPreferences['notifications']>>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    toggleNotificationType: (
      state,
      action: PayloadAction<keyof UserPreferences['notifications']['types']>
    ) => {
      state.notifications.types[action.payload] = !state.notifications.types[action.payload];
    },
    updateDashboardSettings: (
      state,
      action: PayloadAction<Partial<UserPreferences['dashboard']>>
    ) => {
      state.dashboard = { ...state.dashboard, ...action.payload };
    },
    addDashboardWidget: (state, action: PayloadAction<string>) => {
      if (!state.dashboard.widgets.includes(action.payload)) {
        state.dashboard.widgets.push(action.payload);
      }
    },
    removeDashboardWidget: (state, action: PayloadAction<string>) => {
      state.dashboard.widgets = state.dashboard.widgets.filter(
        widget => widget !== action.payload
      );
    },
    reorderDashboardWidgets: (state, action: PayloadAction<string[]>) => {
      state.dashboard.widgets = action.payload;
    },
    resetPreferences: () => initialState,
  },
});

export const {
  updateTheme,
  toggleThemeMode,
  updateNotificationSettings,
  toggleNotificationType,
  updateDashboardSettings,
  addDashboardWidget,
  removeDashboardWidget,
  reorderDashboardWidgets,
  resetPreferences,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
