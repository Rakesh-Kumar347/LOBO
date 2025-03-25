// Utility for managing dark mode across the application
export const getDarkModePreference = () => {
    if (typeof window === 'undefined') return false;
    
    // Check local storage first
    const storedPreference = localStorage.getItem('theme');
    if (storedPreference) {
      return storedPreference === 'dark';
    }
    
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  
  export const setDarkModePreference = (isDark) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Apply to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };