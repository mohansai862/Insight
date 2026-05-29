/**
 * Tech Tammina CRM - Main Entry Point
 * React.js Web Application (NOT React Native)
 * Delivering Excellence in every customer interaction
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, useLocation } from 'react-router-dom';

import App from './App';
import './index.css';
import { store } from './lib/store';

// Configure React Query with realistic latency simulation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

import { bestAvatar } from '@/utils/avatar';

// ScrollToTop component to handle route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Expose a small helper for generating avatars without refactoring all components now
// Safe no-op exposure for immediate use in components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).__bestAvatar = bestAvatar;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);