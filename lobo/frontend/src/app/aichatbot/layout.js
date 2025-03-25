"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "lucide-react";
import ScreenReaderAnnouncer from "@/components/ui/ScreenReaderAnnouncer";

export default function AIChatbotLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== "undefined") {
      const isDark = localStorage.getItem("theme") === "dark";
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
    
    // Finish loading
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <html lang="en">
        <body className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="w-12 h-12 animate-spin text-purple-700" aria-label="Loading" />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={darkMode ? "dark" : ""}>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <AuthProvider>
          {/* Screen reader announcer for accessibility */}
          <ScreenReaderAnnouncer />
          
          {children}
          
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={darkMode ? "dark" : "light"}
          />
        </AuthProvider>
      </body>
    </html>
  );
}