import React from 'react';

interface TimelineFilterProps {
  filters: {
    eventType: string;
    dateRange: string;
    user: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const TimelineFilter: React.FC<TimelineFilterProps> = ({ filters, onFiltersChange }) => {
  const eventTypes = [
    { value: '', label: 'All Events' },
    { value: 'Note', label: 'Notes' },
    { value: 'Activity', label: 'Activities' },
    { value: 'StatusChange', label: 'Status Changes' },
    { value: 'Email', label: 'Emails' },
    { value: 'Call', label: 'Calls' },
    { value: 'Meeting', label: 'Meetings' },
    { value: 'SystemEvent', label: 'System Events' },
    { value: 'Assignment', label: 'Assignments' },
    { value: 'Creation', label: 'Created' },
    { value: 'Update', label: 'Updates' },
    { value: 'Deletion', label: 'Deletions' }
  ];

  const dateRanges = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      eventType: '',
      dateRange: '',
      user: ''
    });
  };

  const hasActiveFilters = filters.eventType || filters.dateRange || filters.user;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Event Type Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={filters.eventType}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">User:</label>
          <input
            type="text"
            placeholder="Filter by user..."
            value={filters.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.eventType && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Type: {eventTypes.find(t => t.value === filters.eventType)?.label}
              <button
                onClick={() => handleFilterChange('eventType', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Date: {dateRanges.find(d => d.value === filters.dateRange)?.label}
              <button
                onClick={() => handleFilterChange('dateRange', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.user && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              User: {filters.user}
              <button
                onClick={() => handleFilterChange('user', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};