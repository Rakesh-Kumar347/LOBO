/**
 * Debug utilities to help with troubleshooting
 */

// Enable this in development only
const DEBUG_MODE = process.env.NODE_ENV === 'development';

/**
 * Enhanced console logging for debugging
 * @param {string} source - Source of the log (component/function name)
 * @param {string} action - Action being performed
 * @param {any} data - Data to log
 */
export const debugLog = (source, action, data) => {
  if (!DEBUG_MODE) return;
  
  console.group(`🔍 ${source}: ${action}`);
  if (data !== undefined) {
    console.log(data);
  }
  console.groupEnd();
};

/**
 * Log API request details
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} body - Request body (optional)
 */
export const logApiRequest = (method, url, body) => {
  if (!DEBUG_MODE) return;
  
  console.group(`🌐 API Request: ${method} ${url}`);
  console.log('Headers: ', {
    'Content-Type': 'application/json',
    // Add other headers for visibility
  });
  if (body) {
    console.log('Body: ', body);
  }
  console.groupEnd();
};

/**
 * Log API response details
 * @param {string} url - Request URL
 * @param {Response} response - Fetch response object
 * @param {any} data - Response data if available
 */
export const logApiResponse = async (url, response, data) => {
  if (!DEBUG_MODE) return;
  
  console.group(`✅ API Response: ${response.status} ${url}`);
  console.log('Status: ', response.status);
  console.log('OK: ', response.ok);
  if (data) {
    console.log('Data: ', data);
  }
  console.groupEnd();
};

/**
 * Log API errors
 * @param {string} url - Request URL
 * @param {Error} error - Error object
 */
export const logApiError = (url, error) => {
  if (!DEBUG_MODE) return;
  
  console.group(`❌ API Error: ${url}`);
  console.error('Error: ', error);
  console.trace('Stack trace:');
  console.groupEnd();
};

export default {
  debugLog,
  logApiRequest,
  logApiResponse,
  logApiError
};