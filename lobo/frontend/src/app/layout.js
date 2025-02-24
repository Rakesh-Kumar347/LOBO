"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthProvider"; // Authentication provider
import Navbar from "@/components/ui/Navbar"; // Navbar component
import { ErrorBoundary } from "react-error-boundary"; // Error boundary
import Head from "next/head"; // Metadata
import "./globals.css"; // Import global styles

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 bg-red-100 text-red-700">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
        Try again
      </button>
    </div>
  );
}

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Load theme preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
      }
      setIsLoading(false);
    }
  }, []);

  // ✅ Toggle Dark Mode and Save to Local Storage
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newTheme;
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>LOBO Project</title>
        <meta name="description" content="A modern web application built with Next.js and Tailwind CSS." />
      </Head>
      <body className="bg-background text-foreground transition-colors duration-200">
        <AuthProvider>
          {/* ✅ Navbar with dark mode toggle */}
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

          {/* ✅ Main Application Content */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <main className="container mx-auto px-4">{children}</main>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}