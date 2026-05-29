import { logger } from '@/utils/logger';
import HeroLeft from '@/components/hero/HeroLeft';
import { Eye, EyeOff, Home } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '@/utils/auth';
import logoUrl from '@/Tech Tammina logo.png';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isApprovalError, setIsApprovalError] = useState<boolean>(false);
  const [isDisabledError, setIsDisabledError] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Check for success message from password reset
  React.useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email || state.identifier) {
        setEmail(state.email || state.identifier);
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email && !password) {
      setErrorMessage('Username and password are required.');
      return;
    }
    if (!email) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    try {
      const apiUrl = '/api/auth/login';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
      
      const loginResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        logger.info('Full login response data:', loginData); // Debug log
        logger.info('Response firstName:', loginData.firstName);
        logger.info('Response lastName:', loginData.lastName);
        logger.info('Response fullName:', loginData.fullName);
        logger.info('Response username:', loginData.username);
        logger.info('Response email:', loginData.email);

        const userData = {
          id: loginData.userId.toString(),
          email: loginData.email || email,
          role: loginData.role,
          firstName: loginData.firstName || '',
          lastName: loginData.lastName || '',
          fullName: loginData.fullName || '',
          username: loginData.username || '',
          countryCode: loginData.countryCode || '',
          phoneNumber: loginData.phoneNumber || '',
          gender: loginData.gender || '',
          managerId: loginData.managerId || null,
          managerName: loginData.managerName || null,
          loginAt: new Date().toISOString(),
        };
        logger.info('Login response firstName:', loginData.firstName);
        logger.info('Login response lastName:', loginData.lastName);
        logger.info('Login response username:', loginData.username);
        logger.info('Storing userData:', userData); // Debug log

        // Store JWT token and session data
        if (loginData.token) {
          setAuthToken(loginData.token);
          logger.info('JWT token stored:', loginData.token.substring(0, 20) + '...');
        }
        localStorage.setItem('tech_tammina_session', JSON.stringify(userData));
        localStorage.setItem('tech_tammina_authenticated', 'true');
        localStorage.removeItem('tech_tammina_welcome_shown');
        sessionStorage.setItem('justLoggedIn', 'true');
        
        // Clear all account filters on login
        localStorage.removeItem('accountsSearchQuery');
        localStorage.removeItem('accountsSelectedIndustry');
        localStorage.removeItem('accountsFromDate');
        localStorage.removeItem('accountsToDate');
        localStorage.removeItem('accountsAppliedFromDate');
        localStorage.removeItem('accountsAppliedToDate');
        localStorage.removeItem('accountsViewMode');
        localStorage.removeItem('accountsPage');
        localStorage.removeItem('ceoAccountsSearchQuery');
        localStorage.removeItem('ceoAccountsSelectedIndustry');
        localStorage.removeItem('ceoAccountsFromDate');
        localStorage.removeItem('ceoAccountsToDate');
        localStorage.removeItem('ceoAccountsAppliedFromDate');
        localStorage.removeItem('ceoAccountsAppliedToDate');
        localStorage.removeItem('ceoAccountsViewMode');
        localStorage.removeItem('ceoAccountsPage');
        
        // Clear all task filters on login
        localStorage.removeItem('tasksSearchQuery');
        localStorage.removeItem('tasksSelectedType');
        localStorage.removeItem('tasksSelectedStatus');
        localStorage.removeItem('tasksSelectedPriority');
        localStorage.removeItem('tasksPage');
        
        logger.info('Session data stored:', JSON.stringify(userData));
        logger.info('Login successful, redirecting to /crm');

        navigate('/crm');
      } else {
        setIsApprovalError(false);
        setIsDisabledError(false);
        
        // Handle first login password reset requirement
        if (loginResponse.status === 428) { // 428 Precondition Required
          const errorData = await loginResponse.json();
          if (errorData.message === 'FIRST_LOGIN_PASSWORD_RESET_REQUIRED') {
            navigate('/first-login-reset', { state: { email: email.trim() } });
            return;
          }
        }
        
        // Handle different error types
        if (loginResponse.status === 403) {
          const errorData = await loginResponse.json();
          if (errorData.message && errorData.message.includes('disabled')) {
            setIsDisabledError(true);
            setErrorMessage('Your account is disabled! You cannot login');
          } else {
            setIsApprovalError(true);
            setErrorMessage('Your account is pending approval. Please contact your manager.');
          }
        } else if (loginResponse.status === 401 || loginResponse.status === 400 || loginResponse.status === 500) {
          setErrorMessage('Invalid email/username or password. Please try again.');
        } else {
          setErrorMessage('Invalid email/username or password. Please try again.');
        }
      }
    } catch (error) {
      setIsApprovalError(false);
      setIsDisabledError(false);
      logger.error('Network error caught:', error);
      logger.info('Setting network error message');
      
      // Handle different types of network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else if (error.name === 'AbortError') {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Left Section (Hero) */}
      <div className="w-full md:w-1/2 relative h-[46vh] sm:h-[52vh] md:h-auto">
        <HeroLeft />
      </div>

      {/* Right Section */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-8 md:px-20 relative">
        {/* Home Button (replaces theme toggle) */}
        <Link
          to="/"
          className="absolute top-6 right-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white/90"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>

        <div className="w-full max-w-md py-8 md:py-0">
          <h2 className="text-6xl font-bold mb-2">Insight</h2>
          <h3 className="text-xl font-semibold mb-6">Welcome!</h3>
          <p className="text-sm mb-4 text-gray-600 dark:text-white/70">
            Enter your credentials to access your account and continue your work.
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-lg mb-4 bg-green-50 border border-green-200 text-green-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={`p-4 rounded-lg mb-4 ${
              isApprovalError 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                : isDisabledError
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {isApprovalError ? (
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  {isApprovalError ? (
                    <>
                      <p className="text-sm font-medium">Account Pending Approval</p>
                      <p className="text-sm mt-1">{errorMessage}</p>
                      <p className="text-sm mt-2">
                        Please contact your manager or HR department for account activation.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm">{errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              tabIndex={1}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                tabIndex={2}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-white/70"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Login Now
            </button>

            <p className="text-sm text-gray-600 dark:text-white/70 mt-2">
              Forgot password?{' '}
              <Link to="/forgot-password" className="text-indigo-600 font-medium">
                Click here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}