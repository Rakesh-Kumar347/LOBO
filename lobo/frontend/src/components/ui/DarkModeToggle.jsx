"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { getDarkModePreference, setDarkModePreference } from "@/lib/darkMode";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    setDarkMode(getDarkModePreference());
  }, []);
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModePreference(newMode);
  };
  
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-white text-gray-900 dark:bg-gray-700 dark:text-white transition-colors"
      aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}