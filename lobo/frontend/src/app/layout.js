// File: src/app/layout.js
// Update to include FeaturesProvider

"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { FeaturesProvider } from "@/context/FeaturesContext"; // Add this import
import { ErrorBoundary } from "@/components/ui/ErrorHandler";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { Loader2 } from "lucide-react";

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme based on darkMode state
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    setIsLoading(false);
  }, [darkMode]);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== "undefined") {
      const isDark = localStorage.getItem("theme") === "dark";
      setDarkMode(isDark);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <html lang="en">
      <body className="bg-background text-foreground transition-colors duration-200 flex flex-col min-h-screen w-full overflow-x-hidden">
        <AuthProvider>
          <FeaturesProvider> {/* Add this wrapper */}
            <ErrorBoundary>
              <main className="flex-1 w-full">{children}</main>
            </ErrorBoundary>
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
              style={{ top: "80px" }}
              aria-live="polite"
            />
          </FeaturesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}