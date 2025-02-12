"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/ui/Navbar"; // ✅ Import Navbar
import "./globals.css";

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
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> {/* ✅ Pass theme props */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
