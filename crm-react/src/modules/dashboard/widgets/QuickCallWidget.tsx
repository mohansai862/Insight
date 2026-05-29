/**
 * Tech Tammina CRM - Quick Call Widget
 * Dashboard widget for quick calling functionality
 */

import React, { useState } from 'react';
import { Phone, PhoneCall, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { useCallsForExecutive } from '@/hooks/useApi';
import { getCallAnalytics, CallAnalytics } from '@/api/callsApi';
import { useQuery } from '@tanstack/react-query';

const QuickCallWidget: React.FC = () => {

  const [quickNumber, setQuickNumber] = useState('');
  
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const { data: callsData } = useCallsForExecutive(userId);
  const calls = callsData || [];
  
  const { data: analytics } = useQuery<CallAnalytics>({
    queryKey: ['callAnalytics', userId, 'today'],
    queryFn: () => getCallAnalytics(userId, 'today'),
    enabled: userId > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const todayCalls = calls.filter(call => {
    const today = new Date().toDateString();
    return new Date(call.callStartTime).toDateString() === today;
  });

  const totalDuration = todayCalls.reduce((sum, call) => 
    sum + (call.callDurationSeconds || 0), 0
  );

  const quickCall = () => {
    if (quickNumber.trim()) {
      window.open(`tel:${quickNumber}`, '_self');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="w-5 h-5" />
          <span>Quick Call</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400 mb-1">
              <PhoneCall className="w-4 h-4" />
              <span className="text-sm font-medium">Calls Today</span>
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{analytics?.totalCalls || todayCalls.length}</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-green-600 dark:text-green-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Total Time</span>
            </div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {Math.floor((analytics?.totalDuration || totalDuration) / 60)}m
            </div>
          </div>
        </div>
        
        {/* Success Rate */}
        {analytics && analytics.totalCalls > 0 && (
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {Math.round((analytics.completedCalls / analytics.totalCalls) * 100)}%
            </div>
          </div>
        )}

        {/* Quick Call Input */}
        <div className="space-y-2">
          <Input
            label="Phone Number"
            value={quickNumber}
            onChange={(e) => setQuickNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            type="tel"
          />
          <Button
            variant="primary"
            onClick={quickCall}
            disabled={!quickNumber.trim()}
            leftIcon={<PhoneCall className="w-4 h-4" />}
            className="w-full"
          >
            Quick Call
          </Button>
        </div>
        


        {/* Recent Calls */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Calls</h4>
          <div className="space-y-2">
            {calls.slice(0, 3).map((call, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{call.contactName || call.contactPhone}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {call.callDurationSeconds ? `${Math.floor(call.callDurationSeconds / 60)}:${String(call.callDurationSeconds % 60).padStart(2, '0')}` : '0:00'}
                  </div>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  {new Date(call.callStartTime).toLocaleDateString()}
                </div>
              </div>
            ))}
            {calls.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No calls yet today
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickCallWidget;
