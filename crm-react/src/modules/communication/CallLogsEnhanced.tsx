import { logger } from '@/utils/logger';
/**
 * Enhanced Call Logs Component
 * Advanced call management with analytics and filtering
 */

import React, { useState, useMemo } from 'react';
import { Phone, Clock, User, Filter, Download, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCallsForExecutive, useCallsForManager, useCallAnalytics } from '@/hooks/useApi';
import { Call, CallAnalytics } from '@/api/callsApi';

interface CallLogsEnhancedProps {
  userId: number;
  userRole: string;
}

const CallLogsEnhanced: React.FC<CallLogsEnhancedProps> = ({ userId, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('today');
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);

  const isManager = ['Sales Manager', 'Sales VP', 'IT Admin'].includes(userRole);
  
  // Fetch calls based on role
  const { data: executiveCalls } = useCallsForExecutive(userId);
  const { data: managerCalls } = useCallsForManager(isManager ? userId : 0);
  const { data: analytics } = useCallAnalytics(userId, periodFilter);

  const calls = isManager ? managerCalls || [] : executiveCalls || [];

  // Filter calls based on search and status
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchesSearch = !searchTerm || 
        call.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.contactPhone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || call.callStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [calls, searchTerm, statusFilter]);

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'MISSED': return 'text-red-600 bg-red-50';
      case 'BUSY': return 'text-yellow-600 bg-yellow-50';
      case 'NO_ANSWER': return 'text-gray-600 bg-gray-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handlePlayRecording = (callId: number) => {
    if (playingRecording === callId) {
      setPlayingRecording(null);
    } else {
      setPlayingRecording(callId);
      // In a real implementation, you would fetch and play the recording
      logger.info(`Playing recording for call ${callId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold">{analytics.totalCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold">{Math.floor(analytics.totalDuration / 60)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{analytics.completedCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalCalls > 0 ? Math.round((analytics.completedCalls / analytics.totalCalls) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
              <option value="BUSY">Busy</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="FAILED">Failed</option>
            </select>
            
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'today' | 'week' | 'month')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Call List */}
          <div className="space-y-3">
            {filteredCalls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No calls found matching your criteria</p>
              </div>
            ) : (
              filteredCalls.map((call) => (
                <div key={call.callId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {call.contactName || 'Unknown Contact'}
                          </h4>
                          <p className="text-sm text-gray-600">{call.contactPhone}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.callStatus)}`}>
                          {call.callStatus}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(call.callDurationSeconds)}</span>
                        </span>
                        <span>{formatDate(call.callStartTime)}</span>
                      </div>
                      
                      {call.callNotes && (
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {call.callNotes}
                        </p>
                      )}
                    </div>
                    
                    {/* Manager Controls */}
                    {isManager && call.callId && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayRecording(call.callId!)}
                          leftIcon={playingRecording === call.callId ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        >
                          {playingRecording === call.callId ? 'Pause' : 'Play'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Download className="w-4 h-4" />}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallLogsEnhanced;
