import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { emailApi, Email, formatEmailDate, getStatusColor } from '../../api/emailApi';
import { EmailComposer } from './EmailComposer';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({ email, onBack }) => {
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);

  const handleReply = () => {
    setShowReply(true);
  };

  const handleForward = () => {
    setShowForward(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await emailApi.deleteEmail(email.emailId!);
        onBack();
      } catch (error) {
        logger.error('Failed to delete email:', error);
      }
    }
  };

  const handleReplySent = () => {
    setShowReply(false);
    onBack();
  };

  const renderEmailBody = (body: string) => {
    // Sanitize HTML to prevent XSS attacks
    const sanitizeHtml = (html: string) => {
      // Remove script tags and event handlers
      return html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '');
    };
    
    return { __html: sanitizeHtml(body) };
  };

  if (showReply) {
    return (
      <EmailComposer
        initialEmail={{
          subject: email.subject?.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          toAddresses: email.fromAddress,
          body: `\n\n--- Original Message ---\nFrom: ${email.fromAddress || ''}\nDate: ${formatEmailDate(email.sentDate || '')}\nSubject: ${email.subject || ''}\n\n${email.body || ''}`
        }}
        onSent={handleReplySent}
        onCancel={() => setShowReply(false)}
      />
    );
  }

  if (showForward) {
    return (
      <EmailComposer
        initialEmail={{
          subject: email.subject?.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`,
          body: `\n\n--- Forwarded Message ---\nFrom: ${email.fromAddress || ''}\nTo: ${email.toAddresses || ''}\nDate: ${formatEmailDate(email.sentDate || '')}\nSubject: ${email.subject || ''}\n\n${email.body || ''}`
        }}
        onSent={() => {
          setShowForward(false);
          onBack();
        }}
        onCancel={() => setShowForward(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span>←</span>
            <span>Back to list</span>
          </button>
          
          <div className="flex items-center space-x-2">
            {email.status && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                {email.status}
              </span>
            )}
            
            <div className="flex space-x-1">
              <button
                onClick={handleReply}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded"
                title="Reply"
              >
                ↩️
              </button>
              <button
                onClick={handleForward}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded"
                title="Forward"
              >
                ➡️
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="p-6">
        {/* Subject */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {email.subject || '(No Subject)'}
        </h1>

        {/* Email Header Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">From:</span>
                <span className="text-gray-900">{email.fromAddress}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">To:</span>
                <span className="text-gray-900">{email.toAddresses}</span>
              </div>
              
              {email.ccAddresses && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Cc:</span>
                  <span className="text-gray-900">{email.ccAddresses}</span>
                </div>
              )}
            </div>
            
            <div className="text-right text-sm text-gray-500">
              <div>{formatEmailDate(email.sentDate || email.createdDate || '')}</div>
              {email.openCount && email.openCount > 0 && (
                <div className="text-green-600 mt-1">
                  👁 Opened {email.openCount} times
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={renderEmailBody(email.body)}
        />

        {/* Attachments */}
        {email.hasAttachments && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span>📎</span>
              <span>This email has attachments</span>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {email.openCount && email.openCount > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Email Tracking</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Opens: {email.openCount}</div>
              {email.lastOpenedDate && (
                <div>Last opened: {formatEmailDate(email.lastOpenedDate)}</div>
              )}
              {email.clickCount && email.clickCount > 0 && (
                <div>Link clicks: {email.clickCount}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <button
            onClick={handleReply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reply
          </button>
          <button
            onClick={handleForward}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};
