import React from 'react';
import { toast } from 'react-toastify';

// Error severity levels
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Common error codes and messages
const ERROR_MESSAGES = {
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This user account has been disabled.',
  'auth/user-not-found': 'No user found with this email address.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'This email address is already in use.',
  'auth/weak-password': 'The password is too weak.',
  'network-error': 'A network error occurred. Please check your connection.',
  'server-error': 'A server error occurred. Please try again later.',
  'unknown-error': 'An unknown error occurred. Please try again.'
};

// Format error message based on error code
export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Handle Supabase errors
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  // Handle API errors
  if (error.message) {
    return error.message;
  }
  
  // Default error message
  return 'An error occurred. Please try again.';
};

// Display toast notification for errors
export const showError = (error, level = ErrorLevel.ERROR) => {
  const message = formatErrorMessage(error);
  
  switch (level) {
    case ErrorLevel.INFO:
      toast.info(message);
      break;
    case ErrorLevel.WARNING:
      toast.warning(message);
      break;
    case ErrorLevel.ERROR:
      toast.error(message);
      break;
    case ErrorLevel.CRITICAL:
      toast.error(`Critical Error: ${message}`);
      console.error('Critical Error:', error);
      break;
    default:
      toast.error(message);
  }
  
  // Log all errors to console
  if (level !== ErrorLevel.INFO) {
    console.error('Error details:', error);
  }
};

// Create a higher-order component for error boundary
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto mt-10 bg-red-100 text-red-700 rounded-lg">
          <h2 className="text-lg font-semibold">Oops! Something went wrong</h2>
          <p className="mt-2 text-sm">{formatErrorMessage(this.state.error)}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  ErrorLevel,
  formatErrorMessage,
  showError,
  ErrorBoundary
};