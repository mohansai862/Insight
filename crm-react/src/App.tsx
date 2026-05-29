/**
 * Tech Tammina CRM - Main App Component
 * React.js CRM Application with full functionality
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store';
import { useEffect } from 'react';

// Lazy load pages
const HomePage = React.lazy(() => import('./routes/HomePage'));
const AboutPage = React.lazy(() => import('./routes/AboutPage'));
const ContactPage = React.lazy(() => import('./routes/ContactPage'));

const LoginPage = React.lazy(() => import('./routes/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./routes/ForgotPasswordPage'));
const FirstLoginPasswordReset = React.lazy(() => import('./routes/FirstLoginPasswordReset'));
const CRMApp = React.lazy(() => import('./routes/CRMApp'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-gray-600 font-medium">Loading Tech Tammina CRM...</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const { theme } = useAppSelector(s => s.preferences);
  const [toasterKey, setToasterKey] = React.useState(0);

  // Apply theme mode for authenticated CRM routes
  useEffect(() => {
    const isCRMRoute = location.pathname.startsWith('/crm');
    const isDarkMode = isCRMRoute && theme.mode === 'dark';
    
    // Apply theme immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.setProperty('--toast-bg', '#1F2937');
      document.documentElement.style.setProperty('--toast-text', '#F9FAFB');
      document.documentElement.style.setProperty('--toast-border', '1px solid #374151');
      document.documentElement.style.setProperty('--toast-icon-bg', '#1F2937');
      
      // Inject global toast dark mode styles
      let styleEl = document.getElementById('toast-dark-mode-override');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'toast-dark-mode-override';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        body.dark div[style*="background"],
        html.dark div[style*="background"] {
          background: #1F2937 !important;
          color: #F9FAFB !important;
          border-color: #374151 !important;
        }
        body.dark div[style*="background"] *:not(svg):not(path),
        html.dark div[style*="background"] *:not(svg):not(path) {
          color: #F9FAFB !important;
        }
      `;
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.setProperty('--toast-bg', '#ffffff');
      document.documentElement.style.setProperty('--toast-text', '#374151');
      document.documentElement.style.setProperty('--toast-border', '1px solid #e5e7eb');
      document.documentElement.style.setProperty('--toast-icon-bg', '#ffffff');
      
      // Remove dark mode override
      const styleEl = document.getElementById('toast-dark-mode-override');
      if (styleEl) styleEl.remove();
    }
  }, [theme.mode, location.pathname]);

  // Force Toaster to re-render when theme changes
  useEffect(() => {
    setToasterKey(Date.now());
    // Ensure theme persistence
    const isCRMRoute = location.pathname.startsWith('/crm');
    if (isCRMRoute) {
      // Force DOM update for theme
      setTimeout(() => {
        if (theme.mode === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }, 0);
    }
  }, [theme.mode, location.pathname]);

  // Add click handler for toast close buttons
  useEffect(() => {
    const handleToastClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const toastElement = target.closest('.crm-toast');
      if (toastElement && e.offsetX > (toastElement as HTMLElement).offsetWidth - 30) {
        const toastId = (toastElement as any)._toastId;
        if (toastId) {
          toast.dismiss(toastId);
        } else {
          toast.dismiss();
        }
      }
    };
    
    document.addEventListener('click', handleToastClick);
    return () => document.removeEventListener('click', handleToastClick);
  }, []);

  return (
    <div className="App">
      <style>{`
        .crm-toast::after {
          content: '×';
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          color: var(--toast-text);
          opacity: 0.7;
          transition: all 0.2s;
        }
        .crm-toast:hover::after {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }
        .crm-toast {
          position: relative;
        }
      `}</style>
      <Toaster 
        key={toasterKey}
        position="top-right"
        containerClassName="crm-toast-container"
        containerStyle={{
          zIndex: 999999,
        }}
        toastOptions={{
          duration: 2000,
          className: 'crm-toast',
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-text)',
            border: 'var(--toast-border)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 999999,
            maxWidth: '400px',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            paddingRight: '2.5rem',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: 'var(--toast-icon-bg)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'var(--toast-icon-bg)',
            },
          },
        }}
      />
      
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={<PageLoader />}>
          {/*
            Keep the CRM app shell mounted across /crm/* route changes to avoid
            unmount/remount flicker in persistent UI (Topbar/Sidebar).
          */}
          <Routes
            location={location}
            key={location.pathname.startsWith('/crm') ? 'crm' : location.pathname}
          >
            {/* Landing Page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Public Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/first-login-reset" element={<FirstLoginPasswordReset />} />
            
            {/* CRM Application - Sales Dashboard */}
            <Route path="/crm/*" element={<CRMApp />} />
            
            {/* Redirect unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  );
}

export default App;
