import { toast } from 'react-toastify';

// Default toast configuration
const defaultConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Notification types
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {object} config - Optional toast configuration overrides
 */
export const showSuccess = (message, config = {}) => {
  toast.success(message, { ...defaultConfig, ...config });
};

/**
 * Show an error notification
 * @param {string} message - The message to display
 * @param {object} config - Optional toast configuration overrides
 */
export const showError = (message, config = {}) => {
  toast.error(message, { 
    ...defaultConfig, 
    autoClose: 4000, // Keep errors visible a bit longer
    ...config 
  });
};

/**
 * Show an information notification
 * @param {string} message - The message to display
 * @param {object} config - Optional toast configuration overrides
 */
export const showInfo = (message, config = {}) => {
  toast.info(message, { ...defaultConfig, ...config });
};

/**
 * Show a warning notification
 * @param {string} message - The message to display
 * @param {object} config - Optional toast configuration overrides
 */
export const showWarning = (message, config = {}) => {
  toast.warning(message, { ...defaultConfig, ...config });
};

/**
 * Show a notification with loading state that can be updated
 * @param {string} message - Initial loading message
 * @returns {object} - Toast ID and update functions
 */
export const showLoading = (message = 'Loading...') => {
  const toastId = toast.loading(message, {
    ...defaultConfig,
    autoClose: false,
  });
  
  return {
    toastId,
    updateToSuccess: (successMessage) => {
      toast.update(toastId, {
        render: successMessage,
        type: toast.TYPE.SUCCESS,
        isLoading: false,
        autoClose: 3000,
      });
    },
    updateToError: (errorMessage) => {
      toast.update(toastId, {
        render: errorMessage,
        type: toast.TYPE.ERROR,
        isLoading: false,
        autoClose: 4000,
      });
    },
    dismiss: () => {
      toast.dismiss(toastId);
    },
  };
};

/**
 * Show a confirmation notification with action buttons
 * @param {string} message - The message to display
 * @param {function} onConfirm - Callback when confirmed
 * @param {function} onCancel - Callback when canceled
 */
export const showConfirmation = (message, onConfirm, onCancel = () => {}) => {
  toast.info(
    <div>
      <p>{message}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => {
            toast.dismiss();
            onCancel();
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
        >
          Confirm
        </button>
      </div>
    </div>,
    {
      ...defaultConfig,
      autoClose: false,
      closeOnClick: false,
    }
  );
};

// Export a default object with all methods
export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  showConfirmation,
  NotificationType,
};