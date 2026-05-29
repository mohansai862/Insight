import axios from 'axios';

const API_BASE_URL = 'http://30.0.1.159:8081/api';

export interface Note {
  noteId?: number;
  relatedEntityType: string;
  relatedEntityId: number;
  noteTitle?: string;
  noteContent: string;
  createdBy: number;
  createdDate?: string;
  modifiedBy?: number;
  modifiedDate?: string;
  isPinned?: boolean;
  isPrivate?: boolean;
  mentions?: string;
}

export const notesApi = {
  createNote: async (note: Note): Promise<Note> => {
    const response = await axios.post(`${API_BASE_URL}/notes`, note, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  getNotesForEntity: async (entityType: string, entityId: number): Promise<Note[]> => {
    const response = await axios.get(`${API_BASE_URL}/notes/entity/${entityType}/${entityId}`, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  updateNote: async (id: number, note: Note): Promise<Note> => {
    const response = await axios.put(`${API_BASE_URL}/notes/${id}`, note, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  deleteNote: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notes/${id}`, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
  },

  togglePin: async (id: number): Promise<Note> => {
    const response = await axios.post(`${API_BASE_URL}/notes/${id}/pin`, {}, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  },

  getMyNotes: async (): Promise<Note[]> => {
    const response = await axios.get(`${API_BASE_URL}/notes/my-notes`, {
      headers: { 'User-Id': localStorage.getItem('userId') || '1' }
    });
    return response.data;
  }
};