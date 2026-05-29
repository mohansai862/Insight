/**
 * Hook for handling form draft cleanup on user session changes
 */

import { useEffect } from 'react';
import { useAppSelector } from '@/lib/store';

export const useFormDraftCleanup = () => {
  const { user } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    let currentUserId = user?.id;
    let currentRole = '';
    
    // Get current session data
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        currentUserId = sessionData.id;
        currentRole = sessionData.role;
      } catch {}
    }
    
    // Monitor for session changes/logout
    const checkSession = () => {
      const newSession = localStorage.getItem('tech_tammina_session');
      
      // If session was removed (logout), clear form drafts
      if (!newSession && currentUserId) {
        localStorage.removeItem(`contactFormDraft_${currentUserId}`);
        localStorage.removeItem(`dealFormDraft_${currentUserId}`);
        localStorage.removeItem(`taskForm_${currentRole}_${currentUserId}`);
        sessionStorage.removeItem(`taskForm_${currentRole}_${currentUserId}`);
        delete (window as any)[`taskFormBackup_taskForm_${currentRole}_${currentUserId}`];
        currentUserId = null;
      }
    };
    
    // Check every 1 second for session changes
    const interval = setInterval(checkSession, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);
};