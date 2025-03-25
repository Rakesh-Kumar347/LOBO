import React from 'react';
import { useFeatures } from '@/context/FeaturesContext';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';

/**
 * Component that conditionally renders children based on feature flag
 * If the feature is not enabled, shows a login prompt
 */
const FeatureGated = ({ 
  featureName, 
  children, 
  fallback = null,
  showLoginPrompt = true,
  className = ""
}) => {
  const { isFeatureEnabled, isAuthenticated } = useFeatures();
  const isEnabled = isFeatureEnabled(featureName);
  
  // If feature is enabled, render children normally
  if (isEnabled) {
    return <>{children}</>;
  }
  
  // If a custom fallback is provided, use that
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // If no login prompt needed, render nothing
  if (!showLoginPrompt) {
    return null;
  }
  
  // If not enabled and logged in, show "not available"
  if (isAuthenticated) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This feature is not available on your current plan.
        </p>
      </div>
    );
  }
  
  // Otherwise show login prompt
  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Lock className="w-8 h-8 text-purple-600" />
        <h3 className="font-medium">Sign in to unlock this feature</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          This feature is only available to logged-in users.
        </p>
        <div className="flex gap-2 mt-2">
          <Link href="/signin">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Component that shows a login prompt when a locked feature is clicked
 */
export const LockedFeature = ({ 
  featureName, 
  children, 
  onClick,
  className = "",
  buttonClassName = ""
}) => {
  const { isFeatureEnabled, isAuthenticated } = useFeatures();
  const isEnabled = isFeatureEnabled(featureName);
  
  // If the feature is enabled, pass through the onClick normally
  if (isEnabled) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }
  
  // Handle click for locked feature
  const handleLockedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a centered overlay div to display the login prompt
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
    overlay.style.zIndex = '9999';
    
    const prompt = document.createElement('div');
    prompt.className = 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-lg';
    
    prompt.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h3 class="text-lg font-bold">Feature Locked</h3>
        <p class="text-center text-gray-600 dark:text-gray-300">This feature is only available to logged-in users.</p>
        <div class="flex gap-3 mt-2">
          <a href="/signin" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Sign In</a>
          <a href="/signup" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Create Account</a>
          <button class="px-4 py-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" id="cancel-prompt">Cancel</button>
        </div>
      </div>
    `;
    
    overlay.appendChild(prompt);
    document.body.appendChild(overlay);
    
    // Add event listener to close the overlay
    document.getElementById('cancel-prompt').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Close on click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  };
  
  return (
    <div 
      className={`${className} ${buttonClassName} relative cursor-pointer group`}
      onClick={handleLockedClick}
    >
      <div className="opacity-60 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-0 group-hover:bg-opacity-30 transition-opacity">
        <Lock className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default FeatureGated;