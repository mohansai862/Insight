import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import NotificationModal from '@/components/ui/NotificationModal';
import { useAppSelector } from '@/lib/store';
import { getCurrentUserEmail, getCurrentRole } from '@/utils/rbac';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { logout } from '@/utils/auth';

// NOTE: This implements an email + OTP verification gate.
// - User enters email and requests an OTP (simulated send)
// - After entering the OTP and verifying, password fields are enabled
// - Replace the mock send/verify with real API calls when backend is ready

const SecuritySettingsPage: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);

  // Email + OTP state
  const currentRole = getCurrentRole();
  const isITAdmin = currentRole === 'IT_Admin';
  const isCEO = currentRole === 'CEO';
  const [email, setEmail] = useState<string>((isITAdmin || isCEO) ? (getCurrentUserEmail() || user?.email || '') : (getCurrentUserEmail() || user?.email || ''));
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Password state (locked until otpVerified)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: 'success', title: '', message: '' });
  };

  const sendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showModal('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const { authApi } = await import('@/api/authApi');
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authApi.getAuthHeaders()
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setOtpSent(true);
        showModal('success', 'OTP Sent', `OTP sent to ${email}. Please check your email.`);
      } else {
        const errorText = await response.text();
        console.log('OTP Error Response:', errorText, 'Status:', response.status);
        let errorMessage = 'Failed to send OTP. Please try again.';
        
        try {
          const errorData = JSON.parse(errorText);
          console.log('Parsed Error Data:', errorData);
          if (errorData.message) {
            if (errorData.message.includes('Mail server connection failed')) {
              errorMessage = 'Email service is temporarily unavailable. Please contact your administrator.';
            } else if (errorData.message.includes('User not found')) {
              errorMessage = 'Email address not found in system. Please check your email or contact administrator.';
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch {
          errorMessage = `Server error (${response.status}): ${errorText}`;
        }
        
        showModal('error', 'Failed to Send OTP', errorMessage);
      }
    } catch (error) {
      showModal('error', 'Failed to Send OTP', 'Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showModal('error', 'Invalid OTP', 'Enter the 6-digit OTP.');
      return;
    }
    setVerifying(true);
    try {
      const { authApi } = await import('@/api/authApi');
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authApi.getAuthHeaders()
        },
        body: JSON.stringify({ email, otp })
      });
      
      if (response.ok) {
        setOtpVerified(true);
        showModal('success', 'Email Verified', 'Email verified successfully.');
      } else {
        const error = await response.text();
        showModal('error', 'Invalid OTP', 'Invalid or expired OTP. Please check and try again.');
      }
    } catch (error) {
      showModal('error', 'Verification Failed', 'Failed to verify OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otpVerified) return; // Guard
    if (newPassword.length < 8) {
      showModal('error', 'Invalid Password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }
    
    try {
      const { authApi } = await import('@/api/authApi');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authApi.getAuthHeaders()
        },
        body: JSON.stringify({ 
          email, 
          otp,
          newPassword, 
          confirmPassword 
        })
      });
      
      if (response.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpVerified(false);
        setOtpSent(false);
        setOtp('');
        showModal('success', 'Password Updated', 'Password updated successfully.');
      } else {
        const error = await response.text();
        showModal('error', 'Update Failed', `Failed to update password: ${error}`);
      }
    } catch (error) {
      showModal('error', 'Update Failed', 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900">Security</h3>
        <p className="text-gray-600 text-sm mt-1">Verify your email with OTP to access password change.</p>

        {/* Email + OTP Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-500">Email</label>
            <div className="mt-1 flex gap-2 items-center">
              <input
                type="email"
                className={`flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-xl ${!(isITAdmin || isCEO) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                value={email}
                onChange={(isITAdmin || isCEO) ? (e) => setEmail(e.target.value) : undefined}
                placeholder="name@example.com"
                disabled={!(isITAdmin || isCEO) || otpVerified}
                readOnly={!(isITAdmin || isCEO)}
              />
              <Button
                variant="primary"
                onClick={sendOtp}
                disabled={sending || otpVerified}
                className="whitespace-nowrap"
              >
                {sending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            </div>
            {otpSent && !otpVerified && (
              <div className="mt-3 flex gap-2">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="w-40 px-3 py-2 border border-gray-200 rounded-xl tracking-widest"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(sanitized);
                  }}
                />
                <Button variant="secondary" onClick={verifyOtp} disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            )}
            {otpVerified && (
              <p className="mt-2 text-sm text-green-600">Email verified. You can now change your password.</p>
            )}
          </div>
        </div>

        {/* Password Section (disabled until verified) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-100">
          <div>
            <label className="text-sm text-gray-500">Current password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                className="mt-1 w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={!otpVerified}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={!otpVerified}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">New password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className="mt-1 w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!otpVerified}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={!otpVerified}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="mt-1 w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!otpVerified}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!otpVerified}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {currentRole !== 'CEO' && (
            <Button 
              variant="outline" 
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={() => {
                if (confirm('Are you sure you want to logout? Any unsaved form data will be cleared.')) {
                  // Get current user ID
                  const session = localStorage.getItem('tech_tammina_session');
                  let userId = '';
                  if (session) {
                    try {
                      const u = JSON.parse(session);
                      userId = u.id || '';
                    } catch {}
                  }
                  
                  // Clear all form drafts for this user
                  if (userId) {
                    // Clear contact form
                    localStorage.removeItem(`contactFormDraft_${userId}`);
                    // Clear deal form
                    localStorage.removeItem(`dealFormDraft_${userId}`);
                    // Clear task form
                    const role = JSON.parse(session || '{}').role || '';
                    localStorage.removeItem(`taskForm_${role}_${userId}`);
                    sessionStorage.removeItem(`taskForm_${role}_${userId}`);
                    delete (window as any)[`taskFormBackup_taskForm_${role}_${userId}`];
                  }
                  
                  logout();
                }
              }}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              Logout
            </Button>
          )}
          <div className={`flex items-center gap-3 ${currentRole === 'CEO' ? 'ml-auto' : ''}`}>
            <Button variant="ghost" className="bg-gray-500 hover:bg-gray-600 text-white">Cancel</Button>
            <Button variant="primary" onClick={handleChangePassword} disabled={!otpVerified}>
              Update password
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
};

export default SecuritySettingsPage;
