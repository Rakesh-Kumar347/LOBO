/**
 * API utilities for making requests to the backend
 */
import { supabase } from './supabase';

// Base URL for backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

// Get auth token from Supabase
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
};

// Make API request with authentication
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Ensure endpoint starts with a slash if needed
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;
    
    // Set up headers with authentication token
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log("Adding auth token to request:", endpoint);
    } else {
      console.log("No auth token available for request:", endpoint);
    }
    
    // Print request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
    }
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    // Log response status
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${url}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export default {
  apiRequest,
};