import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from './button';
import { chatThemes, saveThemePreference, getThemePreference } from '@/lib/themes';

const ThemeSelector = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(getThemePreference());

  useEffect(() => {
    const theme = getThemePreference();
    setSelectedTheme(theme);
    onThemeChange(theme);
  }, [onThemeChange]);

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    saveThemePreference(themeId);
    onThemeChange(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label="Change chat theme"
      >
        <Palette size={16} />
        <span>Theme</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
          <div className="p-2">
            <h3 className="text-sm font-medium px-2 py-1">Chat Themes</h3>
            <div className="mt-1 space-y-1">
              {chatThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedTheme === theme.id
                      ? 'bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className="flex-1">{theme.name}</div>
                  {selectedTheme === theme.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;