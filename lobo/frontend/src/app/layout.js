// src/app/layout.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Head from "next/head";
import { Loader2 } from "lucide-react";

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
    setDarkMode((prev) => !prev);
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
      <Head>
        <title>LOBO - Your AI Assistant</title>
        <meta
          name="description"
          content="LOBO is a generative AI-powered web application for data automation, chatbot interactions, and more."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="AI, chatbot, data automation, web development" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="LOBO - Your AI Assistant" />
        <meta property="og:description" content="Discover LOBO, your smart local AI for data and automation tasks." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" /> {/* Replace with your domain */}
        <meta property="og:image" content="/og-image.jpg" /> {/* Add an OG image in /public */}
      </Head>
      <body className="bg-background text-foreground transition-colors duration-200 flex flex-col min-h-screen w-full overflow-x-hidden">
        <AuthProvider>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
          >
            <main className="flex-1 w-full">{children}</main>
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
          />
        </AuthProvider>
      </body>
    </html>
  );
}