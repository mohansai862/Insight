/**
 * Form Draft Cleanup Utilities
 * Handles clearing user-specific form drafts on logout
 */

/**
 * Clear all form drafts for a specific user
 * @param userId - The user ID to clear drafts for
 */
export const clearUserFormDrafts = (userId: string): void => {
  if (!userId || userId === 'anonymous') return;

  const keysToRemove: string[] = [];
  
  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Check if key is a user-specific form draft
      if (
        key.includes(`_${userId}`) && 
        (key.includes('FormDraft') || key.includes('JustCreated') || key.includes('Route'))
      ) {
        keysToRemove.push(key);
      }
    }
  }
  
  // Remove all identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also clear sessionStorage
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      if (
        key.includes(`_${userId}`) && 
        (key.includes('FormDraft') || key.includes('JustCreated') || key.includes('Route'))
      ) {
        sessionKeysToRemove.push(key);
      }
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // Clear window backup objects
  Object.keys(window as any).forEach(key => {
    if (key.includes(`taskFormBackup_`) && key.includes(`_${userId}`)) {
      delete (window as any)[key];
    }
  });
};

/**
 * Clear all form drafts (for complete cleanup)
 */
export const clearAllFormDrafts = (): void => {
  const keysToRemove: string[] = [];
  
  // Clear localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (
        key.includes('FormDraft') || 
        key.includes('JustCreated') || 
        (key.includes('Route') && !key.includes('lastRoute'))
      ) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear sessionStorage
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      if (
        key.includes('FormDraft') || 
        key.includes('JustCreated') || 
        (key.includes('Route') && !key.includes('lastRoute'))
      ) {
        sessionKeysToRemove.push(key);
      }
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // Clear window backup objects
  Object.keys(window as any).forEach(key => {
    if (key.includes('taskFormBackup_')) {
      delete (window as any)[key];
    }
  });
};