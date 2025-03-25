import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from './button';

/**
 * Keyboard shortcuts component that shows available shortcuts and handles key events
 */
const KeyboardShortcuts = ({ shortcuts }) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle global keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        // Only trigger if we're not in an input or textarea
        if (
          !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || 
          e.key === '/'  // Allow Ctrl+/ even in inputs
        ) {
          const shortcut = shortcuts.find(
            (s) => s.key === e.key && s.ctrl === (e.metaKey || e.ctrlKey)
          );

          if (shortcut && shortcut.action) {
            e.preventDefault();
            shortcut.action();
          }
        }
      }

      // Handle Shift+? to show shortcuts dialog
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Handle Escape to close shortcuts dialog
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, showShortcuts]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShortcuts(true)}
        className="flex items-center gap-1"
        aria-label="Keyboard Shortcuts"
      >
        <Keyboard size={16} />
      </Button>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.ctrl && (
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                      </kbd>
                    )}
                    {shortcut.shift && (
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        Shift
                      </kbd>
                    )}
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {shortcut.key === '/' ? '/' : shortcut.key.toUpperCase()}
                    </kbd>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between col-span-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm">Show this dialog</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    Shift
                  </kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    ?
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts;