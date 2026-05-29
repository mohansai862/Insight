import React, { useState } from 'react';
import { TimelineEvent, formatRelativeTime, getEventIcon } from '../../../api/notesApi';

interface TimelineItemProps {
  event: TimelineEvent;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast = false }) => {
  const [expanded, setExpanded] = useState(false);

  const getEventTypeColor = (eventType: string): string => {
    const colors: Record<string, string> = {
      'Note': 'bg-blue-100 text-blue-800',
      'Activity': 'bg-green-100 text-green-800',
      'StatusChange': 'bg-yellow-100 text-yellow-800',
      'Email': 'bg-purple-100 text-purple-800',
      'Call': 'bg-indigo-100 text-indigo-800',
      'Meeting': 'bg-pink-100 text-pink-800',
      'SystemEvent': 'bg-gray-100 text-gray-800',
      'Assignment': 'bg-orange-100 text-orange-800',
      'Creation': 'bg-emerald-100 text-emerald-800',
      'Update': 'bg-amber-100 text-amber-800',
      'Deletion': 'bg-red-100 text-red-800'
    };
    return colors[event.eventType] || 'bg-gray-100 text-gray-800';
  };

  const parseEventData = (eventData?: string) => {
    if (!eventData) return null;
    try {
      return JSON.parse(eventData);
    } catch (e) {
      return null;
    }
  };

  const eventData = parseEventData(event.eventData);
  const hasDetails = eventData && Object.keys(eventData).length > 0;
  const shouldTruncate = event.eventDescription.length > 100;

  return (
    <div className="flex items-start space-x-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        {/* Event Icon */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ backgroundColor: event.color }}
        >
          {getEventIcon(event.eventType)}
        </div>
        
        {/* Connecting Line */}
        {!isLast && (
          <div className="w-0.5 h-6 bg-gray-200 mt-1"></div>
        )}
      </div>

      {/* Event Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          {/* Event Header */}
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
              {event.eventType}
            </span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(event.performedDate)}
            </span>
          </div>

          {/* Event Description */}
          <div className="text-sm text-gray-900 mb-2">
            {shouldTruncate && !expanded ? (
              <>
                {event.eventDescription.substring(0, 100)}...
                <button
                  onClick={() => setExpanded(true)}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  Show more
                </button>
              </>
            ) : (
              <>
                {event.eventDescription}
                {shouldTruncate && expanded && (
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>

          {/* Event Details */}
          {hasDetails && expanded && (
            <div className="mt-2 p-2 bg-gray-50 rounded border">
              <div className="text-xs font-medium text-gray-700 mb-1">Details:</div>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(eventData).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="font-medium capitalize mr-2">{key.replace(/_/g, ' ')}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show Details Button */}
          {hasDetails && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};