import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, ArrowRight, AlertTriangle, ChevronDown, X } from 'lucide-react';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  managerId?: number;
  isActive: boolean;
}

const DataReassignmentPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [toUsers, setToUsers] = useState<User[]>([]);
  const [fromUser, setFromUser] = useState<number | null>(null);
  const [toUser, setToUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [fromSearchMode, setFromSearchMode] = useState(false);
  const [toSearchMode, setToSearchMode] = useState(false);
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [highlightedFromIndex, setHighlightedFromIndex] = useState(-1);
  const [highlightedToIndex, setHighlightedToIndex] = useState(-1);
  const fromItemRefs = useRef<{[key: number]: HTMLButtonElement | null}>({});
  const toItemRefs = useRef<{[key: number]: HTMLButtonElement | null}>({});
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchToUsers();
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setIsFromDropdownOpen(false);
        setFromSearchMode(false);
        setFromSearchQuery('');
        setHighlightedFromIndex(-1);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setIsToDropdownOpen(false);
        setToSearchMode(false);
        setToSearchQuery('');
        setHighlightedToIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/reassignment/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-User-Id': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').id,
          'X-User-Role': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role,
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchToUsers = async () => {
    try {
      const response = await fetch('/api/reassignment/to-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-User-Id': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').id,
          'X-User-Role': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role,
        }
      });
      const data = await response.json();
      setToUsers(data);
    } catch (error) {
      console.error('Error fetching to users:', error);
    }
  };

  const handleTransfer = async () => {
    if (!fromUser || !toUser) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reassignment/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-User-Id': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').id,
          'X-User-Role': JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role,
        },
        body: JSON.stringify({ fromUserId: fromUser, toUserId: toUser })
      });
      
      if (response.ok) {
        alert('Data transferred successfully');
        setFromUser(null);
        setToUser(null);
        fetchUsers();
        fetchToUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Transfer failed'}`);
      }
    } catch (error) {
      alert('Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFromUserChange = (userId: number | null) => {
    setFromUser(userId);
    if (userId === toUser) {
      setToUser(null);
      setValidationError('');
    }
  };

  const handleToUserChange = (userId: number | null) => {
    if (userId === fromUser) {
      setValidationError('From and To users cannot be the same.');
      return;
    }
    setToUser(userId);
    setValidationError('');
  };

  const currentUserRole = JSON.parse(localStorage.getItem('tech_tammina_session') || '{}').role?.toLowerCase();
  const activeUsers = users.filter(u => u.isActive !== false);
  const activeToUsers = toUsers.filter(u => u.isActive !== false);
  const fromUserData = users.find(u => u.userId === fromUser);
  const toUserData = toUsers.find(u => u.userId === toUser);

  return (
    <div className="p-6 space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center space-x-3">
        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Reassignment</h1>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Transfer User Data</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentUserRole === 'sales_manager' 
              ? 'When a sales executive resigns or is terminated, transfer their leads, deals, accounts, contacts, and tasks to another executive.'
              : currentUserRole === 'sales_vp'
              ? 'When a sales manager resigns or is terminated, transfer their team data to another manager.'
              : currentUserRole === 'it_admin'
              ? 'When a sales VP resigns or is terminated, transfer their organization data to another VP.'
              : 'When an employee resigns or is terminated, transfer their leads, deals, accounts, contacts, and tasks to another team member.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {currentUserRole === 'sales_manager' 
                  ? 'From Executive (Leaving)'
                  : currentUserRole === 'sales_vp'
                  ? 'From Manager (Leaving)'
                  : currentUserRole === 'it_admin'
                  ? 'From VP (Leaving)'
                  : 'From Employee (Leaving)'}
              </label>
              <div className="relative" ref={fromDropdownRef}>
                <input
                  type="text"
                  value={fromSearchMode ? fromSearchQuery : (fromUser ? `${users.find(u => u.userId === fromUser)?.firstName} ${users.find(u => u.userId === fromUser)?.lastName} (${users.find(u => u.userId === fromUser)?.role})` : (currentUserRole === 'sales_manager' ? 'Select executive' : currentUserRole === 'sales_vp' ? 'Select manager...' : currentUserRole === 'it_admin' ? 'Select VP' : 'Select employee...'))}
                  onChange={(e) => {
                    setFromSearchQuery(e.target.value);
                    setIsFromDropdownOpen(true);
                    setHighlightedFromIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const filteredUsers = activeUsers.filter(user => 
                      `${user.firstName} ${user.lastName} (${user.role})`.toLowerCase().includes(fromSearchQuery.toLowerCase())
                    );
                    
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsFromDropdownOpen(false);
                      setFromSearchMode(false);
                      setFromSearchQuery('');
                      setHighlightedFromIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedFromIndex(prev => {
                        const newIndex = prev < filteredUsers.length - 1 ? prev + 1 : prev;
                        setTimeout(() => fromItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedFromIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : 0;
                        setTimeout(() => fromItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'Enter' && highlightedFromIndex >= 0) {
                      e.preventDefault();
                      const user = filteredUsers[highlightedFromIndex];
                      if (user) {
                        handleFromUserChange(user.userId);
                        setIsFromDropdownOpen(false);
                        setHighlightedFromIndex(-1);
                        setFromSearchMode(false);
                        setFromSearchQuery('');
                      }
                    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                      setFromSearchMode(true);
                    }
                  }}
                  onClick={() => {
                    setIsFromDropdownOpen(!isFromDropdownOpen);
                    if (!isFromDropdownOpen) {
                      setFromSearchMode(false);
                      setFromSearchQuery('');
                      setHighlightedFromIndex(-1);
                    }
                  }}
                  readOnly={!fromSearchMode}
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus:border-gray-400 active:border-gray-400"
                />
                {(fromSearchQuery && fromSearchMode) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFromSearchQuery('');
                      setFromSearchMode(false);
                    }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isFromDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                
                {isFromDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                    <div className="p-2">
                      {(() => {
                        const filteredUsers = activeUsers.filter(user => 
                          `${user.firstName} ${user.lastName} (${user.role})`.toLowerCase().includes(fromSearchQuery.toLowerCase())
                        );
                        
                        if (filteredUsers.length === 0) {
                          return (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              {currentUserRole === 'it_admin' ? 'No sales VPs found' : currentUserRole === 'sales_vp' ? 'No managers found' : 'No executives found'}
                            </div>
                          );
                        }
                        
                        return filteredUsers.map((user, index) => {
                          const query = fromSearchQuery.toLowerCase();
                          const label = `${user.firstName} ${user.lastName} (${user.role})`;
                          const lowerLabel = label.toLowerCase();
                          const matchIndex = lowerLabel.indexOf(query);
                          
                          let displayLabel;
                          if (query && matchIndex !== -1) {
                            const before = label.slice(0, matchIndex);
                            const match = label.slice(matchIndex, matchIndex + query.length);
                            const after = label.slice(matchIndex + query.length);
                            displayLabel = (
                              <>
                                {before}<strong>{match}</strong>{after}
                              </>
                            );
                          } else {
                            displayLabel = label;
                          }
                          
                          return (
                            <button
                              key={user.userId}
                              ref={el => fromItemRefs.current[index] = el}
                              onClick={() => {
                                handleFromUserChange(user.userId);
                                setFromSearchQuery('');
                                setIsFromDropdownOpen(false);
                                setHighlightedFromIndex(-1);
                                setFromSearchMode(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                highlightedFromIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                fromUser === user.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {displayLabel}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {currentUserRole === 'sales_manager' 
                  ? 'To Executive (Receiving)'
                  : currentUserRole === 'sales_vp'
                  ? 'To Manager (Receiving)'
                  : currentUserRole === 'it_admin'
                  ? 'To VP (Receiving)'
                  : 'To Employee (Receiving)'}
              </label>
              <div className="relative" ref={toDropdownRef}>
                <input
                  type="text"
                  value={toSearchMode ? toSearchQuery : (toUser ? `${toUsers.find(u => u.userId === toUser)?.firstName} ${toUsers.find(u => u.userId === toUser)?.lastName} (${toUsers.find(u => u.userId === toUser)?.role})` : (currentUserRole === 'sales_manager' ? 'Select executive' : currentUserRole === 'sales_vp' ? 'Select manager...' : currentUserRole === 'it_admin' ? 'Select VP' : 'Select employee...'))}
                  onChange={(e) => {
                    setToSearchQuery(e.target.value);
                    setIsToDropdownOpen(true);
                    setHighlightedToIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const filteredUsers = activeToUsers.filter(user => 
                      user.userId !== fromUser && `${user.firstName} ${user.lastName} (${user.role})`.toLowerCase().includes(toSearchQuery.toLowerCase())
                    );
                    
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsToDropdownOpen(false);
                      setToSearchMode(false);
                      setToSearchQuery('');
                      setHighlightedToIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedToIndex(prev => {
                        const newIndex = prev < filteredUsers.length - 1 ? prev + 1 : prev;
                        setTimeout(() => toItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedToIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : 0;
                        setTimeout(() => toItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
                        return newIndex;
                      });
                    } else if (e.key === 'Enter' && highlightedToIndex >= 0) {
                      e.preventDefault();
                      const user = filteredUsers[highlightedToIndex];
                      if (user) {
                        handleToUserChange(user.userId);
                        setIsToDropdownOpen(false);
                        setHighlightedToIndex(-1);
                        setToSearchMode(false);
                        setToSearchQuery('');
                      }
                    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                      setToSearchMode(true);
                    }
                  }}
                  onClick={() => {
                    if (fromUser) {
                      setIsToDropdownOpen(!isToDropdownOpen);
                      if (!isToDropdownOpen) {
                        setToSearchMode(false);
                        setToSearchQuery('');
                        setHighlightedToIndex(-1);
                      }
                    }
                  }}
                  disabled={!fromUser}
                  readOnly={!toSearchMode}
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className={`h-10 w-full px-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-200 text-sm font-medium focus:outline-none ${
                    !fromUser 
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:border-gray-400 active:border-gray-400'
                  }`}
                />
                {(toSearchQuery && toSearchMode) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToSearchQuery('');
                      setToSearchMode(false);
                    }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isToDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                
                {isToDropdownOpen && fromUser && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent'}}>
                    <div className="p-2">
                      {(() => {
                        const filteredUsers = activeToUsers.filter(user => 
                          user.userId !== fromUser && `${user.firstName} ${user.lastName} (${user.role})`.toLowerCase().includes(toSearchQuery.toLowerCase())
                        );
                        
                        if (filteredUsers.length === 0) {
                          return (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              {currentUserRole === 'it_admin' ? 'No sales VPs found' : currentUserRole === 'sales_vp' ? 'No managers found' : 'No executives found'}
                            </div>
                          );
                        }
                        
                        return filteredUsers.map((user, index) => {
                          const query = toSearchQuery.toLowerCase();
                          const label = `${user.firstName} ${user.lastName} (${user.role})`;
                          const lowerLabel = label.toLowerCase();
                          const matchIndex = lowerLabel.indexOf(query);
                          
                          let displayLabel;
                          if (query && matchIndex !== -1) {
                            const before = label.slice(0, matchIndex);
                            const match = label.slice(matchIndex, matchIndex + query.length);
                            const after = label.slice(matchIndex + query.length);
                            displayLabel = (
                              <>
                                {before}<strong>{match}</strong>{after}
                              </>
                            );
                          } else {
                            displayLabel = label;
                          }
                          
                          return (
                            <button
                              key={user.userId}
                              ref={el => toItemRefs.current[index] = el}
                              onClick={() => {
                                handleToUserChange(user.userId);
                                setToSearchQuery('');
                                setIsToDropdownOpen(false);
                                setHighlightedToIndex(-1);
                                setToSearchMode(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                highlightedToIndex === index ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' :
                                toUser === user.userId ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {displayLabel}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">{validationError}</span>
              </div>
            </div>
          )}

          {fromUser && toUser && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Transfer Summary</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">{fromUserData?.firstName} {fromUserData?.lastName}</strong>
                  <div className="text-gray-600 dark:text-gray-400">{fromUserData?.email}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">{toUserData?.firstName} {toUserData?.lastName}</strong>
                  <div className="text-gray-600 dark:text-gray-400">{toUserData?.email}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
                {currentUserRole === 'sales_manager' 
                  ? 'This will transfer all leads, deals, accounts, contacts, and tasks from the leaving executive to the receiving executive. The leaving executive\'s account will be deactivated.'
                  : currentUserRole === 'sales_vp'
                  ? 'This will transfer all team data from the leaving manager to the receiving manager. The leaving manager\'s account will be deactivated.'
                  : currentUserRole === 'it_admin'
                  ? 'This will transfer all organization data from the leaving VP to the receiving VP. The leaving VP\'s account will be deactivated.'
                  : 'This will transfer all leads, deals, accounts, contacts, and tasks from the leaving employee to the receiving employee. The leaving employee\'s account will be deactivated.'}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleTransfer}
              disabled={!fromUser || !toUser || loading || fromUser === toUser}
              variant="primary"
            >
              {loading ? 'Transferring...' : 'Transfer Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataReassignmentPage;
