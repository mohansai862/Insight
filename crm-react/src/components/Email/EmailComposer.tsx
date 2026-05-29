import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { emailApi, emailTemplateApi, Email, EmailTemplate } from '../../api/emailApi';

interface EmailComposerProps {
  initialEmail?: Partial<Email>;
  onSent?: (email: Email) => void;
  onCancel?: () => void;
  entityType?: string;
  entityId?: number;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  initialEmail,
  onSent,
  onCancel,
  entityType,
  entityId
}) => {
  const [email, setEmail] = useState<Partial<Email>>({
    subject: '',
    body: '',
    fromAddress: localStorage.getItem('userEmail') || 'user@techtammina.com',
    toAddresses: '',
    ccAddresses: '',
    bccAddresses: '',
    relatedEntityType: entityType,
    relatedEntityId: entityId,
    ...initialEmail
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesData = await emailTemplateApi.getAllTemplates();
      setTemplates(templatesData);
    } catch (error) {
      logger.error('Failed to load templates:', error);
    }
  };

  const handleInputChange = (field: keyof Email, value: string) => {
    setEmail(prev => ({ ...prev, [field]: value }));
  };

  const handleSend = async () => {
    if (!email.toAddresses || !email.subject) {
      alert('Please fill in recipient and subject');
      return;
    }

    setSending(true);
    try {
      const sentEmail = await emailApi.sendEmail({
        ...email,
        direction: 'Outbound'
      } as Email);
      
      if (onSent) {
        onSent(sentEmail);
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await emailApi.saveDraft({
        ...email,
        direction: 'Outbound'
      } as Email);
      alert('Draft saved');
    } catch (error) {
      logger.error('Failed to save draft:', error);
      alert('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleUseTemplate = async (template: EmailTemplate) => {
    try {
      let mergeFields = {};
      if (entityType && entityId) {
        mergeFields = await emailTemplateApi.getMergeFields(entityType, entityId);
      }

      const renderedTemplate = await emailTemplateApi.useTemplate(template.templateId!, mergeFields);
      
      setEmail(prev => ({
        ...prev,
        subject: renderedTemplate.subject,
        body: renderedTemplate.body
      }));
      
      setShowTemplates(false);
    } catch (error) {
      logger.error('Failed to use template:', error);
    }
  };

  const insertMergeField = (field: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = email.body || '';
      const newText = text.substring(0, start) + `{{${field}}}` + text.substring(end);
      
      setEmail(prev => ({ ...prev, body: newText }));
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + field.length + 4, start + field.length + 4);
      }, 0);
    }
  };

  const commonMergeFields = [
    'contact.firstName', 'contact.lastName', 'contact.email',
    'account.name', 'deal.name', 'deal.value',
    'user.firstName', 'user.lastName', 'company.name'
  ];

  return (
    <div className="bg-white rounded-lg shadow border max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📝 Templates
            </button>
            <button
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Cc/Bcc
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {templates.slice(0, 6).map(template => (
              <button
                key={template.templateId}
                onClick={() => handleUseTemplate(template)}
                className="text-left p-2 border border-gray-200 rounded hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="font-medium text-sm">{template.templateName}</div>
                <div className="text-xs text-gray-500">{template.templateCategory}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email Form */}
      <div className="p-6 space-y-4">
        {/* From */}
        <div className="flex items-center space-x-2">
          <label className="w-16 text-sm font-medium text-gray-700">From:</label>
          <input
            type="email"
            value={email.fromAddress}
            onChange={(e) => handleInputChange('fromAddress', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* To */}
        <div className="flex items-center space-x-2">
          <label className="w-16 text-sm font-medium text-gray-700">To:</label>
          <input
            type="text"
            placeholder="recipient@example.com, another@example.com"
            value={email.toAddresses}
            onChange={(e) => handleInputChange('toAddresses', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cc/Bcc */}
        {showCcBcc && (
          <>
            <div className="flex items-center space-x-2">
              <label className="w-16 text-sm font-medium text-gray-700">Cc:</label>
              <input
                type="text"
                placeholder="cc@example.com"
                value={email.ccAddresses}
                onChange={(e) => handleInputChange('ccAddresses', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-16 text-sm font-medium text-gray-700">Bcc:</label>
              <input
                type="text"
                placeholder="bcc@example.com"
                value={email.bccAddresses}
                onChange={(e) => handleInputChange('bccAddresses', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Subject */}
        <div className="flex items-center space-x-2">
          <label className="w-16 text-sm font-medium text-gray-700">Subject:</label>
          <input
            type="text"
            placeholder="Email subject"
            value={email.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Merge Fields */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Insert:</span>
          {commonMergeFields.slice(0, 4).map(field => (
            <button
              key={field}
              onClick={() => insertMergeField(field)}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {field}
            </button>
          ))}
        </div>

        {/* Body */}
        <div>
          <textarea
            id="email-body"
            placeholder="Write your email here..."
            value={email.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex space-x-2">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={sending || !email.toAddresses || !email.subject}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};
