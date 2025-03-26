// File: lobo/frontend/src/lib/secureApi.js
import { fetchWithCsrf } from './csrf';

/**
 * Make a secure API request with CSRF protection
 * @param {string} endpoint - API endpoint (will be appended to base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const secureApiRequest = async (endpoint, options = {}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    return await fetchWithCsrf(url, options);
  } catch (error) {
    console.error(`Secure API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Higher-order function that adds CSRF protection to any API function
 * @param {Function} apiFunction - Original API function
 * @returns {Function} - Protected API function
 */
export const withCsrfProtection = (apiFunction) => {
  return async (...args) => {
    // Add CSRF token to the request
    const originalOptions = args[1] || {};
    const options = { ...originalOptions };
    
    // Get CSRF token
    const { getCsrfToken } = await import('./csrf');
    const csrfToken = await getCsrfToken();
    
    // Add to headers if available
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken
      };
    }
    
    // Call original function with enhanced options
    args[1] = options;
    return apiFunction(...args);
  };
};

// Create a CSRF-protected version of the standard API request function
import { apiRequest } from './api';
export const protectedApiRequest = withCsrfProtection(apiRequest);