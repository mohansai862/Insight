import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { TimelineItem } from './TimelineItem';
import { TimelineFilter } from './TimelineFilter';
import { timelineApi, TimelineEvent, TimelinePage } from '../../../api/notesApi';

interface TimelineProps {
  entityType: string;
  entityId: number;
}

export const Timeline: React.FC<TimelineProps> = ({ entityType, entityId }) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    eventType: '',
    dateRange: '',
    user: ''
  });

  useEffect(() => {
    loadTimeline(true);
  }, [entityType, entityId, filters]);

  const loadTimeline = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      
      let timelineData: TimelinePage;
      
      if (filters.eventType) {
        const filteredEvents = await timelineApi.getFilteredTimeline(entityType, entityId, filters.eventType);
        timelineData = {
          content: filteredEvents,
          totalElements: filteredEvents.length,
          totalPages: 1,
          size: filteredEvents.length,
          number: 0
        };
      } else {
        timelineData = await timelineApi.getEntityTimeline(entityType, entityId, currentPage, 20);
      }

      if (reset) {
        setTimeline(timelineData.content);
        setPage(0);
      } else {
        setTimeline(prev => [...prev, ...timelineData.content]);
      }
      
      setHasMore(currentPage < timelineData.totalPages - 1);
      setPage(currentPage + 1);
    } catch (error) {
      logger.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadTimeline(false);
    }
  };

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    events.forEach(event => {
      const date = new Date(event.performedDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });
    
    return groups;
  };

  const groupedEvents = groupEventsByDate(timeline);

  if (loading && timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Activity Timeline
        </h3>
      </div>

      {/* Filters */}
      <TimelineFilter
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <div>No activity yet</div>
            <div className="text-sm">Activity will appear here as actions are taken</div>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateGroup, events]) => (
            <div key={dateGroup} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center">
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {dateGroup}
                </div>
                <div className="flex-1 h-px bg-gray-200 ml-4"></div>
              </div>
              
              {/* Events for this date */}
              <div className="space-y-2 ml-4">
                {events.map((event, index) => (
                  <TimelineItem
                    key={event.timelineId}
                    event={event}
                    isLast={index === events.length - 1}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};
