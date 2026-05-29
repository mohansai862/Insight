import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { updateUser } from '@/lib/slices/authSlice';

const GeneralSettingsPage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();

  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSave = () => {
    // Extend to persist to backend as needed; for now, update local session
    dispatch(updateUser({ phoneNumber } as any));
    try {
      const raw = localStorage.getItem('tech_tammina_session');
      if (raw) {
        const u = JSON.parse(raw);
        localStorage.setItem('tech_tammina_session', JSON.stringify({ ...u, phoneNumber, timezone, language }));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900">General</h3>
        <p className="text-gray-600 text-sm mt-1">Basic account preferences.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Language</label>
            <select className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl cursor-pointer" value={language} onChange={(e)=>setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Timezone</label>
            <select className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl cursor-pointer" value={timezone} onChange={(e)=>setTimezone(e.target.value)}>
              <option value="UTC">UTC</option>
              <option value="IST">IST (Asia/Kolkata)</option>
              <option value="EST">EST (America/New_York)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Present phone number</label>
            <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="+1 555-555-5555" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" value={user?.email || ''} disabled />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save changes</Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
