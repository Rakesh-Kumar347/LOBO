/**
 * CSRF token handler for secure API requests
 */
import { supabase } from './supabase';

// Request a CSRF token from the backend
export const getCsrfToken = async () => {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
};

// Create a fetch wrapper that includes the CSRF token
export const fetchWithCsrf = async (url, options = {}) => {
  // Get CSRF token
  const csrfToken = await getCsrfToken();
  
  // Set headers with CSRF token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Get auth token if available
  const { data } = await supabase.auth.getSession();
  if (data?.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`;
  }
  
  // Make request with headers
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

export default {
  getCsrfToken,
  fetchWithCsrf
};