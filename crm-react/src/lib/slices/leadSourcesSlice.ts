/**
 * Tech Tammina CRM - Lead Sources Slice
 * Manage CRUD for lead sources used by Leads module
 */

import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';

export interface LeadSource {
  id: string;
  name: string; // e.g., Website, Campaign, Cold Call
}

export interface LeadSourcesState {
  items: LeadSource[];
}

const initialState: LeadSourcesState = {
  items: [
    { id: 'src_website', name: 'Website' },
    { id: 'src_email', name: 'Email' },
    { id: 'src_campaign', name: 'Campaign' },
    { id: 'src_cold_call', name: 'Cold Call' },
    { id: 'src_referral', name: 'Referral' },
    { id: 'src_event', name: 'Event' },
    { id: 'src_other', name: 'Other' },
  ],
};

const leadSourcesSlice = createSlice({
  name: 'leadSources',
  initialState,
  reducers: {
    addSource: {
      reducer: (state, action: PayloadAction<LeadSource>) => {
        state.items.unshift(action.payload);
      },
      prepare: (name: string) => ({ payload: { id: nanoid(), name } }),
    },
    updateSource: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const i = state.items.findIndex((s) => s.id === action.payload.id);
      if (i !== -1) state.items[i].name = action.payload.name;
    },
    deleteSource: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    setSources: (state, action: PayloadAction<LeadSource[]>) => {
      state.items = action.payload;
    },
  },
});

export const { addSource, updateSource, deleteSource, setSources } = leadSourcesSlice.actions;
export default leadSourcesSlice.reducer;