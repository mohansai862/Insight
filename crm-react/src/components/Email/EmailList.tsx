import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { emailApi, Email, EmailPage, formatEmailDate, getStatusColor } from '../../api/emailApi';

interface EmailListProps {
  folder: 'inbox' | 'sent' | 'drafts';
  onEmailSelect?: (email: Email) => void;
}

export const EmailList: React.FC<EmailListProps> = ({ folder, onEmailSelect }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadEmails();
  }, [folder, page]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      let emailData: EmailPage | Email[];

      switch (folder) {
        case 'inbox':
          const userEmail = localStorage.getItem('userEmail') || 'user@techtammina.com';
          emailData = await emailApi.getInboxEmails(userEmail, page, 20);
          break;
        case 'sent':
          emailData = await emailApi.getSentEmails(page, 20);
          break;
        case 'drafts':
          emailData = await emailApi.getDraftEmails();
          break;
        default:
          emailData = await emailApi.getEmails(page, 20);
      }

      if (Array.isArray(emailData)) {
        setEmails(emailData);
        setTotalPages(1);
      } else {
        setEmails(emailData.content);
        setTotalPages(emailData.totalPages);
      }
    } catch (error) {
      logger.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = (email: Email) => {
    if (onEmailSelect) {
      onEmailSelect(email);
    }
  };

  const handleSelectEmail = (emailId: number, selected: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (selected) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEmails(new Set(emails.map(e => e.emailId!)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) return;
    
    if (window.confirm(`Delete ${selectedEmails.size} selected emails?`)) {
      try {
        await Promise.all(
          Array.from(selectedEmails).map(id => emailApi.deleteEmail(id))
        );
        setSelectedEmails(new Set());
        loadEmails();
      } catch (error) {
        logger.error('Failed to delete emails:', error);
      }
    }
  };

  const getEmailPreview = (body: string): string => {
    // Strip HTML tags and get first 100 characters
    const text = body.replace(/<[^>]*>/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const getFolderTitle = (): string => {
    switch (folder) {
      case 'inbox': return 'Inbox';
      case 'sent': return 'Sent';
      case 'drafts': return 'Drafts';
      default: return 'Emails';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {getFolderTitle()} ({emails.length})
          </h2>
          
          {selectedEmails.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedEmails.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {emails.length > 0 && (
        <div className="border-b border-gray-200 px-6 py-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedEmails.size === emails.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Select all</span>
          </label>
        </div>
      )}

      {/* Email List */}
      <div className="divide-y divide-gray-200">
        {emails.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📧</div>
            <div className="text-lg font-medium">No emails in {folder}</div>
            <div className="text-sm">Emails will appear here when available</div>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.emailId}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedEmails.has(email.emailId!) ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleEmailClick(email)}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedEmails.has(email.emailId!)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectEmail(email.emailId!, e.target.checked);
                  }}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                {/* Email Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {folder === 'sent' ? email.toAddresses : email.fromAddress}
                      </span>
                      {email.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      )}
                      {email.openCount && email.openCount > 0 && (
                        <span className="text-xs text-green-600">
                          👁 {email.openCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatEmailDate(email.sentDate || email.createdDate || '')}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {email.subject || '(No Subject)'}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {getEmailPreview(email.body)}
                  </div>
                  
                  {email.hasAttachments && (
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs text-gray-500">
                        📎 Attachments
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
