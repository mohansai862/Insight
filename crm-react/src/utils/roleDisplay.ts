/**
 * Role Display Utility
 * Maps internal role values to user-friendly display names
 */

export const getRoleDisplayName = (role?: string): string => {
  if (!role) return 'User';
  
  const normalizedRole = role.toLowerCase().trim();
  
  if (normalizedRole === 'it_admin' || normalizedRole === 'it admin') {
    return 'Application Admin';
  }
  
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};