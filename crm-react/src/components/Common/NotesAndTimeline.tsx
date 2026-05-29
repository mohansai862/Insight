import React, { useState } from 'react';
import { NotesSection } from './Notes/NotesSection';
import { Timeline } from './Timeline/Timeline';

interface NotesAndTimelineProps {
  entityType: string;
  entityId: number;
  readonly?: boolean;
}

export const NotesAndTimeline: React.FC<NotesAndTimelineProps> = ({ 
  entityType, 
  entityId, 
  readonly = false 
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'notes' | 'timeline'>('split');

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('split')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'split'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes & Activity
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes Only
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Timeline Only
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notes Section */}
            <div className="space-y-4">
              <NotesSection
                entityType={entityType}
                entityId={entityId}
                readonly={readonly}
              />
            </div>

            {/* Timeline Section */}
            <div className="space-y-4">
              <Timeline
                entityType={entityType}
                entityId={entityId}
              />
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="max-w-4xl">
            <NotesSection
              entityType={entityType}
              entityId={entityId}
              readonly={readonly}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl">
            <Timeline
              entityType={entityType}
              entityId={entityId}
            />
          </div>
        )}
      </div>
    </div>
  );
};