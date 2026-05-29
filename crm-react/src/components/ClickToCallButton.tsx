import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, Clock, AlertCircle } from 'lucide-react';
import { callService } from '../services/callService';

interface ClickToCallButtonProps {
  phoneNumber: string;
  contactName?: string;
  contactId?: number;
  agentExtension: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';

const ClickToCallButton: React.FC<ClickToCallButtonProps> = ({
  phoneNumber,
  contactName,
  contactId,
  agentExtension,
  size = 'md',
  variant = 'primary'
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300'
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'initiating': return 'bg-yellow-500';
      case 'ringing': return 'bg-orange-500';
      case 'connected': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return variantClasses[variant];
    }
  };

  const getStatusIcon = () => {
    switch (callStatus) {
      case 'initiating': return <Clock className="w-4 h-4" />;
      case 'ringing': return <PhoneCall className="w-4 h-4 animate-pulse" />;
      case 'connected': return <PhoneCall className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'initiating': return 'Initiating...';
      case 'ringing': return 'Ringing...';
      case 'connected': return 'Connected';
      case 'ended': return 'Call Ended';
      case 'failed': return 'Failed';
      default: return 'Call';
    }
  };

  const initiateCall = async () => {
    if (!agentExtension) {
      setError('Agent extension not configured');
      return;
    }

    try {
      setCallStatus('initiating');
      setError(null);

      const response = await callService.initiateCall({
        agentExtension,
        customerNumber: phoneNumber,
        contactId,
        contactName
      });

      setCallId(response.callId);
      setCallStatus('ringing');

      // Poll for call status updates
      pollCallStatus(response.callId);

    } catch (err: any) {
      logger.error('Call initiation failed:', err);
      setError(err.message || 'Failed to initiate call');
      setCallStatus('failed');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setCallStatus('idle');
        setError(null);
      }, 3000);
    }
  };

  const pollCallStatus = async (callId: string) => {
    const maxAttempts = 30; // Poll for 30 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await callService.getCallStatus(callId);
        
        switch (status.status) {
          case 'CONNECTED':
            setCallStatus('connected');
            break;
          case 'ENDED':
            setCallStatus('ended');
            setTimeout(() => setCallStatus('idle'), 2000);
            return; // Stop polling
          case 'FAILED':
          case 'TIMEOUT':
            setCallStatus('failed');
            setError(status.failureReason || 'Call failed');
            setTimeout(() => {
              setCallStatus('idle');
              setError(null);
            }, 3000);
            return; // Stop polling
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          // Timeout
          setCallStatus('failed');
          setError('Call status timeout');
          setTimeout(() => {
            setCallStatus('idle');
            setError(null);
          }, 3000);
        }
      } catch (err) {
        logger.error('Error polling call status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        }
      }
    };

    poll();
  };

  const isDisabled = callStatus !== 'idle';

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={initiateCall}
        disabled={isDisabled}
        className={`
          ${sizeClasses[size]}
          ${getStatusColor()}
          rounded-lg font-medium transition-all duration-200
          flex items-center gap-2
          disabled:opacity-70 disabled:cursor-not-allowed
          hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={`Call ${phoneNumber}${contactName ? ` (${contactName})` : ''}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
      
      {callStatus === 'connected' && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
          Call in progress...
        </div>
      )}
    </div>
  );
};

export default ClickToCallButton;
