import { logger } from '@/utils/logger';
import React, { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { updateUser } from '@/lib/slices/authSlice';
import { Avatar } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { User, Crown, Upload } from 'lucide-react';

const getRoleDisplayName = (role?: string): string => {
  if (!role) return 'User';
  if (role.toLowerCase() === 'it_admin' || role.toLowerCase() === 'it admin') {
    return 'Application Admin';
  }
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  const color = role === 'admin' ? 'bg-purple-100 text-purple-700' : role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  const label = getRoleDisplayName(role);
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${color}`}>{label}</span>;
};

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);

  const [name, setName] = useState('User');
  const [role, setRole] = useState('sales');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const session = localStorage.getItem('tech_tammina_session');
        if (session) {
          const userData = JSON.parse(session);
          logger.info('Profile loading userData:', userData); // Debug log
          
          // Use fullName from backend or construct from firstName/lastName
          let displayName = '';
          if (userData.fullName && userData.fullName.trim()) {
            displayName = userData.fullName.trim();
          } else {
            const firstName = (userData.firstName || '').trim();
            const lastName = (userData.lastName || '').trim();
            if (firstName && lastName) {
              displayName = `${firstName} ${lastName}`;
            } else if (firstName) {
              displayName = firstName;
            } else if (lastName) {
              displayName = lastName;
            } else {
              displayName = userData.username || userData.email?.split('@')[0] || 'User';
            }
          }
          
          logger.info('Profile display name:', displayName); // Debug log
          setName(displayName);
          setRole(userData.role || 'sales');
          setEmail(userData.email || '');
          setPhoneNumber(userData.phoneNumber || '');
        }
      } catch (error) {
        logger.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const initials = useMemo(() => (name || 'User').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(), [name]);

  const handleSave = () => {
    // Sanitize inputs to prevent XSS
    const sanitizedName = name.replace(/[<>"'&]/g, '').trim();
    const sanitizedAvatar = avatar.replace(/[<>"'&]/g, '').trim();
    
    dispatch(updateUser({ name: sanitizedName, avatar: sanitizedAvatar } as any));
    try {
      const session = localStorage.getItem('tech_tammina_session');
      if (session) {
        const u = JSON.parse(session);
        const [firstName, ...rest] = sanitizedName.split(' ');
        localStorage.setItem('tech_tammina_session', JSON.stringify({ 
          ...u, 
          firstName: firstName || '', 
          lastName: rest.join(' '), 
          fullName: sanitizedName,
          avatar: sanitizedAvatar 
        }));
      }
    } catch {}
  };

  const onAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar src={avatar} name={name || 'User'} size="xl" showStatus status="online" />
            <label className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1.5 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 text-gray-600" />
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) onAvatarFile(f); }} />
            </label>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Full name</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" value={email} disabled />
            </div>
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 capitalize" value={getRoleDisplayName(role)} disabled />
              <div className="mt-2"><RoleBadge role={role} /></div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Department</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" value={user?.department || ''} disabled />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save changes</Button>
        </div>
      </div>

      {/* Who is this user */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900">About this user</h3>
        <p className="text-gray-600 mt-1">You are logged in as <span className="font-medium">{name || user?.name || 'User'}</span> with the role <span className="font-medium capitalize">{getRoleDisplayName(role)}</span>.</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Crown className="w-4 h-4 text-yellow-600" />
          <span>Access is personalized based on your role.</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
