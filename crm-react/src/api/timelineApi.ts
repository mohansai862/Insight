import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/timeline`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const timelineApi = {
  getTimeline: async (entityType: string, entityId: number) => {
    const response = await fetch(`${API_BASE_URL}/entity/${entityType}/${entityId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to get timeline: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  createTimelineEvent: async (data: {
    relatedEntityType: string;
    relatedEntityId: number;
    eventType: 'Email' | 'Call' | 'Meeting' | 'Note' | 'Activity' | 'StatusChange' | 'SystemEvent' | 'Assignment' | 'Creation' | 'Update' | 'Deletion';
    eventDescription: string;
    eventData?: string;
    performedBy: number;
    icon?: string;
    color?: string;
  }) => {
    console.log('Sending timeline event:', data);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    console.log('Timeline API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Timeline API error:', errorText);
      throw new Error(`Failed to create timeline event: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Timeline event created:', result);
    return result;
  }
};

export interface TimelineEvent {
  relatedEntityType: string;
  relatedEntityId: number;
  eventType: 'Email' | 'Call' | 'Meeting' | 'Note' | 'Activity' | 'StatusChange' | 'SystemEvent' | 'Assignment' | 'Creation' | 'Update' | 'Deletion';
  eventDescription: string;
  eventData?: string;
  performedBy: number;
  icon?: string;
  color?: string;
}