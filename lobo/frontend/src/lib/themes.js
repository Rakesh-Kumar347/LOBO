// Chat UI theme presets
export const chatThemes = [
    {
      id: "default",
      name: "Default",
      userBubble: "bg-purple-700 text-white",
      botBubble: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
      backgroundColor: "bg-gray-100 dark:bg-gray-900",
      accentColor: "text-purple-700 dark:text-purple-400"
    },
    {
      id: "modern",
      name: "Modern",
      userBubble: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
      botBubble: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white",
      backgroundColor: "bg-white dark:bg-gray-900",
      accentColor: "text-blue-500 dark:text-blue-400"
    },
    {
      id: "minimal",
      name: "Minimal",
      userBubble: "bg-black dark:bg-white text-white dark:text-black border border-gray-200 dark:border-gray-700",
      botBubble: "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700",
      backgroundColor: "bg-white dark:bg-black",
      accentColor: "text-black dark:text-white"
    },
    {
      id: "retro",
      name: "Retro",
      userBubble: "bg-amber-500 text-black border-2 border-black dark:border-amber-400",
      botBubble: "bg-teal-100 dark:bg-teal-900 text-black dark:text-white border-2 border-black dark:border-teal-400",
      backgroundColor: "bg-amber-50 dark:bg-gray-900",
      accentColor: "text-amber-600 dark:text-amber-400"
    },
    {
      id: "nature",
      name: "Nature",
      userBubble: "bg-emerald-600 text-white",
      botBubble: "bg-amber-50 dark:bg-amber-900 text-emerald-900 dark:text-emerald-100",
      backgroundColor: "bg-green-50 dark:bg-gray-900",
      accentColor: "text-emerald-600 dark:text-emerald-400"
    }
  ];
  
  // Get default theme
  export const getDefaultTheme = () => chatThemes[0];
  
  // Find theme by ID
  export const getThemeById = (themeId) => {
    return chatThemes.find(theme => theme.id === themeId) || getDefaultTheme();
  };
  
  // Save theme preference to localStorage
  export const saveThemePreference = (themeId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatTheme', themeId);
    }
  };
  
  // Get theme preference from localStorage
  export const getThemePreference = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatTheme') || 'default';
    }
    return 'default';
  };