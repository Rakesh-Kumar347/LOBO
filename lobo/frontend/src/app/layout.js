"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthProvider"; // ✅ Only import AuthProvider
import Navbar from "@/components/ui/Navbar"; // ✅ Import the Navbar
import "./globals.css"; // ✅ Import global styles

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Load theme preference from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    setDarkMode(storedTheme === "dark");
  }, []);

  // ✅ Toggle Dark Mode and Save to Local Storage
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  return (
    <html lang="en">
      <body className={darkMode ? "dark bg-gray-900 text-white" : "bg-white text-gray-900"}>
        <AuthProvider>
          {/* ✅ Navbar with dark mode toggle */}
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          
          {/* ✅ Main Application Content */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
