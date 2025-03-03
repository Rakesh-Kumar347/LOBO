"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import React from "react";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-6 max-w-md mx-auto mt-10 bg-red-100 text-red-700 rounded-lg">
      <h2 className="text-lg font-semibold">Oops! Something went wrong</h2>
      <pre className="mt-2 text-sm">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Try Again
      </button>
    </div>
  );
}

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = useCallback(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    setIsLoading(false);
  }, [darkMode]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newMode = !prev;
      return newMode;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background w-full">
        <span className="text-xl animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>LOBO Project</title>
        <meta
          name="description"
          content="A modern web application built with Next.js and Tailwind CSS."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-background text-foreground transition-colors duration-200 flex flex-col min-h-screen w-full overflow-x-hidden">
        <AuthProvider>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
          >
            <main className="flex-1 w-full">
              {React.cloneElement(children, { darkMode })}
            </main>
          </ErrorBoundary>
          <Footer darkMode={darkMode} />
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
            role="alert"
          />
        </AuthProvider>
      </body>
    </html>
  );
}