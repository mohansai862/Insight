import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { callService } from '../services/callService';

interface CallHistoryProps {
  contactId?: number;
  userId?: number;
  maxItems?: number;
}

interface CallRecord {
  callId: string;
  status: string;
  agentExtension: string;
  customerNumber: string;
  callStartTime?: string;
  callEndTime?: string;
  durationSeconds?: number;
  contactId?: number;
  contactName?: string;
  failureReason?: string;
  createdAt: string;
}

const CallHistoryList: React.FC<CallHistoryProps> = ({
  contactId,
  userId,
  maxItems = 10
}) => {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCallHistory();
  }, [contactId, userId]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const history = await callService.getCallHistory(contactId);
      setCallHistory(history.slice(0, maxItems));
    } catch (err: any) {
      logger.error('Failed to load call history:', err);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
      case 'ENDED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
      case 'TIMEOUT':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'RINGING':
      case 'INITIATED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'INITIATED': return 'Initiated';
      case 'RINGING': return 'Ringing';
      case 'CONNECTED': return 'Connected';
      case 'ENDED': return 'Completed';
      case 'FAILED': return 'Failed';
      case 'TIMEOUT': return 'Timeout';
      default: return status;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading call history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Phone className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No call history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Call History</h3>
      
      <div className="space-y-2">
        {callHistory.map((call) => (
          <div
            key={call.callId}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(call.status)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {call.customerNumber}
                    </span>
                    {call.contactName && (
                      <span className="text-sm text-gray-500">
                        ({call.contactName})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Ext: {call.agentExtension} • {getStatusText(call.status)}
                  </div>
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-500">
                <div>{formatDateTime(call.createdAt)}</div>
                {call.durationSeconds && (
                  <div className="font-medium text-gray-700">
                    {formatDuration(call.durationSeconds)}
                  </div>
                )}
              </div>
            </div>
            
            {call.failureReason && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                {call.failureReason}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {callHistory.length === maxItems && (
        <div className="text-center pt-2">
          <button
            onClick={() => setCallHistory([])} // Could implement "load more" functionality
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh History
          </button>
        </div>
      )}
    </div>
  );
};

export default CallHistoryList;
