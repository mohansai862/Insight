import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Email Compose Component
 * Outlook integration with communication tracking
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  X,
  Paperclip,
  Save,
  Mail,
  User,
  Building,
  ExternalLink
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSendEmail, useSaveDraftEmail } from '@/hooks/useApi';
import { getCurrentUserId } from '@/utils/rbac';

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
  entityType?: 'lead' | 'contact';
  entityId?: string;
  subject?: string;
  prefilledBody?: string;
}

const EmailCompose: React.FC<EmailComposeProps> = ({
  isOpen,
  onClose,
  recipientEmail = '',
  recipientName = '',
  entityType,
  entityId,
  subject = '',
  prefilledBody = ''
}) => {
  const [emailData, setEmailData] = useState({
    to: recipientEmail,
    subject: subject || `Follow-up: ${recipientName}`,
    body: prefilledBody || `Dear ${recipientName},\n\nI hope this email finds you well.\n\nBest regards,`
  });

  const sendEmailMutation = useSendEmail();
  const saveDraftMutation = useSaveDraftEmail();
  const queryClient = useQueryClient();

  const handleSendEmail = async () => {
    try {
      // Create Outlook compose URL
      const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(emailData.to)}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      
      // Open Outlook directly
      window.open(outlookUrl, '_blank');
      
      // Save email record to backend immediately
      const emailRecord = {
        subject: emailData.subject,
        body: emailData.body,
        fromAddress: 'current_user@techtammina.com',
        toAddresses: emailData.to,
        direction: 'Outbound' as const,
        status: 'Sent' as const,
        relatedEntityType: entityType,
        relatedEntityId: entityId ? parseInt(entityId) : undefined,
        createdBy: getCurrentUserId()
      };

      await sendEmailMutation.mutateAsync(emailRecord);
      
      // Show success notification
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(
          `Outlook opened for ${recipientName}! Email draft ready to send.`,
          {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#0078D4',
              color: 'white',
              fontWeight: '500',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 120, 212, 0.3)'
            },
            icon: '✉️'
          }
        );
      });

      // Refresh data
      if (entityType === 'contact') {
        queryClient.invalidateQueries({ queryKey: ['contacts', entityId] });
      } else if (entityType === 'lead') {
        queryClient.invalidateQueries({ queryKey: ['leads', entityId] });
      }

      // Close the compose dialog
      onClose();
      
    } catch (error) {
      logger.error('Failed to open Outlook:', error);
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Failed to open Outlook. Please try again.');
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftRecord = {
        subject: emailData.subject,
        body: emailData.body,
        fromAddress: 'current_user@techtammina.com',
        toAddresses: emailData.to,
        direction: 'Outbound' as const,
        status: 'Draft' as const,
        relatedEntityType: entityType,
        relatedEntityId: entityId ? parseInt(entityId) : undefined,
        createdBy: getCurrentUserId()
      };

      await saveDraftMutation.mutateAsync(draftRecord);
    } catch (error) {
      logger.error('Failed to save draft:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] p-4 overflow-y-auto"
      style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-2xl my-auto"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <span>Compose Email</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
            {/* Recipient Info */}
            {recipientName && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {entityType === 'contact' ? (
                  <User className="w-5 h-5 text-gray-400" />
                ) : (
                  <Building className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{recipientName}</p>
                  <p className="text-sm text-gray-600">{emailData.to}</p>
                </div>
              </div>
            )}

            {/* Email Form */}
            <div className="space-y-4">
              <Input
                label="To"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="recipient@example.com"
                required
              />

              <Input
                label="Subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Type your message here..."
                  required
                />
              </div>
            </div>



            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t bg-gray-50 -mx-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Paperclip className="w-4 h-4" />}
                  disabled
                  className="text-gray-400"
                >
                  Attach File
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  className="hover:bg-gray-200"
                >
                  {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="hover:bg-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleSendEmail}
                  disabled={!emailData.to || !emailData.subject || sendEmailMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  {sendEmailMutation.isPending ? 'Opening Outlook...' : 'Send via Outlook'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default EmailCompose;