import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Home, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import HeroLeft from '@/components/hero/HeroLeft';
import { authApi } from '@/api/authApi';
import toast from 'react-hot-toast';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      // Extract clean error message from API response
      let errorMessage = error.message || 'Failed to send OTP. Please try again.';
      
      // Handle JSON error responses that come as strings
      if (typeof errorMessage === 'string' && errorMessage.includes('{"message"')) {
        try {
          // Extract JSON from the error string
          const jsonMatch = errorMessage.match(/\{"message":"[^"]+"\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // Keep original error message if JSON parsing fails
        }
      }
      
      // Clean up any remaining formatting
      if (errorMessage.includes(' - ')) {
        errorMessage = errorMessage.split(' - ')[1];
      }
      
      // Check for user not found error
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        errorMessage = 'User not found with this email address.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authApi.verifyOtp(email.trim().toLowerCase(), otp);
      toast.success('OTP verified successfully!');
      setStep('password');
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid or expired OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), otp, newPassword, confirmPassword);
      // Redirect immediately to login with success message
      navigate('/login', { 
        state: { 
          message: 'Password reset successfully! Please login with your new password.',
          identifier: email 
        } 
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    } else if (step === 'password') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <h3 className="text-xl font-semibold mb-6">Forgot Password</h3>
            <p className="text-sm mb-4 text-gray-600 dark:text-white/70">
              Enter your registered email and we'll send you an OTP to reset your password.
            </p>
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 pl-11 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        );

      case 'otp':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={goBack} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold">Verify OTP</h3>
            </div>
            <p className="text-sm mb-4 text-gray-600 dark:text-white/70">
              Enter the 6-digit OTP sent to <strong>{email}</strong>
            </p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg tracking-widest"
                maxLength={6}
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        );

      case 'password':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={goBack} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold">Reset Password</h3>
            </div>
            <p className="text-sm mb-4 text-gray-600 dark:text-white/70">
              Enter your new password below.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password (min 8 chars, 1 upper, 1 lower, 1 number, 1 special)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-6 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400 text-lg">Password Reset Successful!</p>
                <p className="text-sm text-green-700/80 dark:text-green-400/80 mt-2">
                  Your password has been successfully reset. Redirecting to login...
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Left Section (Form) */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-8 md:px-20 relative order-2 md:order-1">
        {/* Home Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white/90"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>

        <div className="w-full max-w-md py-8 md:py-0">
          <h2 className="text-6xl font-bold mb-2">Insight</h2>
          
          {renderStepContent()}
          
          {step !== 'success' && (
            <p className="text-sm text-gray-600 dark:text-white/70 mt-4 text-center">
              Remember your password?{' '}
              <Link to="/login" className="text-indigo-600 font-medium">
                Back to Login
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right Section (Hero/Image) */}
      <div className="w-full md:w-1/2 relative h-[46vh] sm:h-[52vh] md:h-auto order-1 md:order-2">
        <HeroLeft
          eyebrowText="Secure access"
          title="Reset your password"
          description={step === 'email' ? "Enter your email to receive an OTP for password reset." : 
                      step === 'otp' ? "Check your email and enter the OTP we sent you." :
                      step === 'password' ? "Create a new secure password for your account." :
                      "Your password has been successfully reset!"}
          ctaLabels={[]}
          footerText={`© ${new Date().getFullYear()} Tech Tammina. All rights reserved.`}
        />
      </div>
    </div>
  );
}