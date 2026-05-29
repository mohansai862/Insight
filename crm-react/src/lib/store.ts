/**
 * Tech Tammina CRM - Redux Store Configuration
 * State management with Redux Toolkit
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import filtersSlice from './slices/filtersSlice';
import preferencesSlice from './slices/preferencesSlice';
import leadSourcesSlice from './slices/leadSourcesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    filters: filtersSlice,
    preferences: preferencesSlice,
    leadSources: leadSourcesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;