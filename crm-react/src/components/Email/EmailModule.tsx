import React, { useState } from 'react';
import { EmailComposer } from './EmailComposer';
import { EmailList } from './EmailList';
import { EmailDetail } from './EmailDetail';
import { Email } from '../../api/emailApi';

export const EmailModule: React.FC = () => {
  const [activeView, setActiveView] = useState<'inbox' | 'sent' | 'drafts' | 'compose'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  const handleEmailSent = () => {
    setActiveView('sent');
    setSelectedEmail(null);
  };

  const handleCompose = () => {
    setActiveView('compose');
    setSelectedEmail(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Email</h1>
        <button
          onClick={handleCompose}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ✉️ Compose
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'inbox', label: 'Inbox', icon: '📥' },
            { key: 'sent', label: 'Sent', icon: '📤' },
            { key: 'drafts', label: 'Drafts', icon: '📝' },
            { key: 'compose', label: 'Compose', icon: '✉️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeView === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onBack={handleBackToList}
          />
        ) : activeView === 'compose' ? (
          <EmailComposer
            onSent={handleEmailSent}
            onCancel={() => setActiveView('inbox')}
          />
        ) : (
          <EmailList
            folder={activeView}
            onEmailSelect={handleEmailSelect}
          />
        )}
      </div>
    </div>
  );
};