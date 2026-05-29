import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Call Logs
 * Call history and management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Filter,
  Play,
  Download,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Plus,
  Mic,
  MicOff,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime, formatDate } from '@/utils';
import { Call, CallRecording, getCallsForExecutive, getCallsForManager, startRecording, stopRecording, getRecordings } from '@/api/callsApi';

const CallLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing' | 'missed'>('all');
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<{[key: number]: CallRecording[]}>({});
  const [recordingStates, setRecordingStates] = useState<{[key: number]: boolean}>({});
  
  const userRole = localStorage.getItem('userRole') || '';
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const isManager = ['Sales Manager', 'Sales VP', 'IT Admin'].includes(userRole);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      let callData: Call[];
      
      if (isManager) {
        callData = await getCallsForManager(userId);
      } else {
        callData = await getCallsForExecutive(userId);
      }
      
      setCalls(callData);
      
      // Load recordings for managers
      if (isManager) {
        const recordingPromises = callData.map(async (call) => {
          if (call.callId) {
            try {
              const callRecordings = await getRecordings(call.callId);
              return { callId: call.callId, recordings: callRecordings };
            } catch (error) {
              return { callId: call.callId, recordings: [] };
            }
          }
          return { callId: 0, recordings: [] };
        });
        
        const recordingResults = await Promise.all(recordingPromises);
        const recordingMap: {[key: number]: CallRecording[]} = {};
        recordingResults.forEach(result => {
          if (result.callId) {
            recordingMap[result.callId] = result.recordings;
          }
        });
        setRecordings(recordingMap);
      }
    } catch (error) {
      logger.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async (callId: number) => {
    try {
      const filePath = `/recordings/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}/call_${callId}_${Date.now()}.wav`;
      await startRecording(callId, filePath);
      setRecordingStates(prev => ({ ...prev, [callId]: true }));
    } catch (error) {
      logger.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async (callId: number) => {
    try {
      // Mock file size and duration for demo
      await stopRecording(callId, 1024000, 300);
      setRecordingStates(prev => ({ ...prev, [callId]: false }));
      loadCalls(); // Reload to get updated recordings
    } catch (error) {
      logger.error('Failed to stop recording:', error);
    }
  };

  // Convert API calls to display format
  const callLogs = calls.map(call => ({
    id: call.callId?.toString() || '',
    type: call.callStatus === 'COMPLETED' ? 'outgoing' : 'missed',
    contact: {
      name: call.contactName || 'Unknown',
      company: 'N/A',
      phone: call.contactPhone,
      avatar: '',
    },
    duration: call.callDurationSeconds ? `${Math.floor(call.callDurationSeconds / 60)}:${String(call.callDurationSeconds % 60).padStart(2, '0')}` : '0:00',
    timestamp: call.callStartTime,
    status: call.callStatus.toLowerCase(),
    notes: call.callNotes || '',
    hasRecording: call.callId ? (recordings[call.callId]?.length > 0) : false,
    tags: [],
    callId: call.callId,
  }));

  // Keep the existing mock data as fallback
  const mockCallLogs = [
    {
      id: '1',
      type: 'outgoing',
      contact: {
        name: 'John Smith',
        company: 'Acme Corp',
        phone: '+1 (555) 123-4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      duration: '15:32',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      notes: 'Discussed product demo and pricing. Follow-up scheduled for next week.',
      hasRecording: true,
      tags: ['demo', 'pricing'],
    },
    {
      id: '2',
      type: 'incoming',
      contact: {
        name: 'Sarah Johnson',
        company: 'Tech Solutions',
        phone: '+1 (555) 987-6543',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      },
      duration: '8:45',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'completed',
      notes: 'Customer support inquiry about API integration.',
      hasRecording: false,
      tags: ['support', 'api'],
    },
    {
      id: '3',
      type: 'missed',
      contact: {
        name: 'Mike Davis',
        company: 'StartupXYZ',
        phone: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      duration: '0:00',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'missed',
      notes: '',
      hasRecording: false,
      tags: [],
    },
    {
      id: '4',
      type: 'outgoing',
      contact: {
        name: 'Emily Wilson',
        company: 'Enterprise Inc',
        phone: '+1 (555) 321-0987',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      duration: '22:15',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      notes: 'Contract negotiation call. Discussed terms and conditions.',
      hasRecording: true,
      tags: ['contract', 'negotiation'],
    },
    {
      id: '5',
      type: 'incoming',
      contact: {
        name: 'Robert Brown',
        company: 'Global Corp',
        phone: '+1 (555) 654-3210',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
      duration: '12:30',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'completed',
      notes: 'Initial consultation call. Very interested in our services.',
      hasRecording: true,
      tags: ['consultation', 'interested'],
    },
  ];

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      default:
        return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCallTypeColor = (type: string, status: string) => {
    if (status === 'missed') return 'bg-red-100 text-red-800';
    switch (type) {
      case 'incoming':
        return 'bg-green-100 text-green-800';
      case 'outgoing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const allCallLogs = calls.length > 0 ? callLogs : mockCallLogs;
  
  const filteredCalls = React.useMemo(() => {
    const normalized = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized && !/\S/.test(searchQuery)) return allCallLogs;

    return allCallLogs.filter(call => {
      const matchesFilter = filterType === 'all' || call.type === filterType || 
        (filterType === 'missed' && call.status === 'missed');
      if (!matchesFilter) return false;
      if (!normalized) return true;

      const tokens = normalized.split(' ');
      const nameLower = call.contact.name.toLowerCase();
      const companyLower = call.contact.company.toLowerCase();
      const phone = call.contact.phone;

      if (tokens.length === 1) {
        return nameLower.includes(tokens[0]) || companyLower.includes(tokens[0]) || phone.includes(searchQuery.trim());
      }

      const nameParts = nameLower.split(/\s+/);
      if (tokens.length > nameParts.length) return false;
      return tokens.every((token, i) => nameParts[i]?.startsWith(token));
    });
  }, [allCallLogs, searchQuery, filterType]);

  const callStats = {
    total: allCallLogs.length,
    incoming: allCallLogs.filter(c => c.type === 'incoming').length,
    outgoing: allCallLogs.filter(c => c.type === 'outgoing').length,
    missed: allCallLogs.filter(c => c.status === 'missed').length,
    totalDuration: allCallLogs.reduce((acc, call) => {
      const [minutes, seconds] = call.duration.split(':').map(Number);
      return acc + minutes * 60 + seconds;
    }, 0),
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Call Logs</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isManager ? 'Track and manage team phone conversations' : 'Track and manage your phone conversations'}
          </p>
          {isManager && (
            <Badge variant="default" className="mt-2">
              Manager View - Full Team Access
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Log Call
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{callStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <PhoneIncoming className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Incoming</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{callStats.incoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <PhoneOutgoing className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outgoing</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{callStats.outgoing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <PhoneMissed className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Missed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{callStats.missed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(callStats.totalDuration)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Call History</CardTitle>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-64"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Calls</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getCallIcon(call.type, call.status)}
                </div>

                <Avatar
                  src={call.contact.avatar}
                  name={call.contact.name}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{call.contact.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getCallTypeColor(call.type, call.status)} flex items-center gap-1.5`} size="sm">
                        {getCallIcon(call.type, call.status)}
                        {call.status === 'missed' ? 'Missed' : call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                      </Badge>
                      {call.hasRecording && (
                        <Badge variant="default" size="sm">
                          Recorded
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {call.contact.company} • {call.contact.phone}
                  </p>
                  
                  {call.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{call.notes}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{call.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatRelativeTime(call.timestamp)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isManager && call.callId && (
                        <>
                          {recordingStates[call.callId] ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              leftIcon={<MicOff className="w-4 h-4" />}
                              onClick={() => handleStopRecording(call.callId!)}
                            >
                              Stop Recording
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              leftIcon={<Mic className="w-4 h-4" />}
                              onClick={() => handleStartRecording(call.callId!)}
                            >
                              Start Recording
                            </Button>
                          )}
                        </>
                      )}
                      {call.hasRecording && isManager && (
                        <>
                          <Button variant="ghost" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                            Play
                          </Button>
                          <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                            Download
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                        Note
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<PhoneCall className="w-4 h-4" />}>
                        Call Back
                      </Button>
                    </div>
                  </div>
                  
                  {call.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      {call.tags.map((tag, index) => (
                        <Badge key={index} variant="default" size="xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredCalls.length === 0 && (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No calls found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start making calls to see your call history here'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CallLogs;
