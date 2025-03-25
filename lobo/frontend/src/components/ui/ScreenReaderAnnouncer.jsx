import React, { useState, useEffect, useCallback } from 'react';

/**
 * A component that announces messages to screen readers using ARIA live regions
 */
const ScreenReaderAnnouncer = () => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  
  // Create a function to announce messages
  const announce = useCallback((message, priority = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage(message);
    } else {
      setPoliteMessage(message);
    }
    
    // Clear the message after some time to prepare for the next announcement
    setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage('');
      } else {
        setPoliteMessage('');
      }
    }, 3000);
  }, []);
  
  // Expose the announce function globally
  useEffect(() => {
    // Create a global announcer object if it doesn't exist
    if (!window.screenReaderAnnouncer) {
      window.screenReaderAnnouncer = {
        announce,
        
        // Convenience methods
        polite: (message) => announce(message, 'polite'),
        assertive: (message) => announce(message, 'assertive'),
        
        // Announce status messages
        status: (message) => announce(message, 'polite'),
        
        // Announce error messages
        error: (message) => announce(message, 'assertive'),
      };
    }
    
    // Cleanup
    return () => {
      delete window.screenReaderAnnouncer;
    };
  }, [announce]);
  
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="polite-announcer"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="assertive-announcer"
      >
        {assertiveMessage}
      </div>
    </>
  );
};

export default ScreenReaderAnnouncer;

/**
 * Helper function to announce messages to screen readers
 * This can be imported and used directly in components
 */
export const announce = (message, priority = 'polite') => {
  if (typeof window !== 'undefined' && window.screenReaderAnnouncer) {
    window.screenReaderAnnouncer.announce(message, priority);
  }
};

/**
 * Convenience function to announce polite messages
 */
export const announcePolite = (message) => {
  announce(message, 'polite');
};

/**
 * Convenience function to announce assertive messages
 */
export const announceAssertive = (message) => {
  announce(message, 'assertive');
};