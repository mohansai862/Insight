/**
 * Tech Tammina CRM - Contact Form API Service
 * API service for contact form submissions
 */

import { environment } from '@/lib/environment';

const API_BASE_URL = `${environment.apiURL}/contact-form`;

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export const contactFormApi = {
  submit: async (data: ContactFormData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact form');
    }

    return response.json();
  },
};