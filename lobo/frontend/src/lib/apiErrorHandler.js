import { toast } from 'react-toastify';

/**
 * Standard error types for API requests
 */
export const ErrorTypes = {
  NETWORK: 'network_error',
  AUTHENTICATION: 'auth_error',
  VALIDATION: 'validation_error',
  RATE_LIMIT: 'rate_limit_error',
  SERVER: 'server_error',
  UNKNOWN: 'unknown_error',
};

/**
 * Determines the type of error based on status code and error message
 */
export const getErrorType = (status, message) => {
  if (!status || status === 0) return ErrorTypes.NETWORK;
  
  if (status === 401 || status === 403) return ErrorTypes.AUTHENTICATION;
  if (status === 400 || status === 422) return ErrorTypes.VALIDATION;
  if (status === 429) return ErrorTypes.RATE_LIMIT;
  if (status >= 500) return ErrorTypes.SERVER;
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Gets a user-friendly error message based on error type and original message
 */
export const getErrorMessage = (errorType, originalMessage) => {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return 'Network error. Please check your internet connection.';
    case ErrorTypes.AUTHENTICATION:
      return 'Authentication error. Please sign in again.';
    case ErrorTypes.VALIDATION:
      return originalMessage || 'Invalid input. Please check your data.';
    case ErrorTypes.RATE_LIMIT:
      return 'Too many requests. Please try again later.';
    case ErrorTypes.SERVER:
      return 'Server error. Our team has been notified.';
    default:
      return originalMessage || 'An unexpected error occurred.';
  }
};

/**
 * Handle API error and show appropriate toast notification
 */
export const handleApiError = async (error, customErrorHandler) => {
  console.error('API Error:', error);
  
  let errorType = ErrorTypes.UNKNOWN;
  let errorMessage = 'An unexpected error occurred';
  
  try {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      let message = 'Unknown error';
      
      // Try to extract error message from response
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          message = error.response.data;
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else if (error.response.data.error) {
          message = error.response.data.error;
        }
      }
      
      errorType = getErrorType(status, message);
      errorMessage = getErrorMessage(errorType, message);
      
      // Handle authentication errors specially
      if (errorType === ErrorTypes.AUTHENTICATION) {
        // Force refresh of authentication state if needed
        // You may want to redirect to login page or refresh token here
      }
    } else if (error.request) {
      // Request was made but no response received
      errorType = ErrorTypes.NETWORK;
      errorMessage = getErrorMessage(errorType);
    } else {
      // Error in setting up the request
      errorMessage = error.message || 'Failed to make request';
    }
    
    // Show error toast unless suppressed by custom handler
    const shouldShowToast = customErrorHandler 
      ? customErrorHandler(errorType, errorMessage) 
      : true;
    
    if (shouldShowToast) {
      toast.error(errorMessage);
    }
    
    return { errorType, errorMessage };
  } catch (e) {
    // Error in error handling (meta-error)
    console.error('Error while handling API error:', e);
    toast.error('An unexpected error occurred');
    return { errorType: ErrorTypes.UNKNOWN, errorMessage: 'An unexpected error occurred' };
  }
};

/**
 * Enhanced API request function with built-in error handling
 * @param {string} endpoint - API endpoint (will be appended to base URL)
 * @param {object} options - Fetch options
 * @param {function} customErrorHandler - Optional custom error handler
 * @returns {Promise<Response>} - Fetch response if successful
 */
export const enhancedApiRequest = async (endpoint, options = {}, customErrorHandler = null) => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
    const url = `${API_URL}${endpoint}`;
    
    // Set up headers with authentication if session is available
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Get auth token from storage or context
    const authToken = localStorage.getItem('authToken'); // Or use auth context
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
        };
      }
      
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw {
          request: true,
          message: 'Request timed out. Please try again.',
        };
      }
      throw error;
    }
  } catch (error) {
    // Handle errors and show appropriate notifications
    const { errorType, errorMessage } = await handleApiError(error, customErrorHandler);
    throw { errorType, errorMessage };
  }
}
/**
 * Wrap component with error boundary
 * @param {Component} Component - React component to wrap
 * @returns {Component} - Wrapped component with error boundary
 */
export const withErrorBoundary = (Component) => {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Export ErrorBoundary from component
import { ErrorBoundary } from '@/components/ui/ErrorHandler';