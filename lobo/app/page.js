"use client";

// app/page.js
import React, { useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // Importing icons for theme toggle

const HomePage = () => {
  // State to manage the theme (light or dark)
  const [darkMode, setDarkMode] = useState(false);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300 flex items-center justify-between px-8 relative transition-all ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300'
      }`}
    >
      <div className="flex-1 flex items-center justify-center relative">
        {/* LOBO with gradient color */}
        <h1 className="text-[15rem] absolute bottom-[20%] font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-purple-600 mb-4 text-center">
          LOBO
        </h1>
        
        {/* Descriptive text */}
        <p className="text-xl text-gray-700 absolute bottom-[10%] text-center">
          Your AI-powered assistant for tasks, insights, and more.
        </p>
      </div>

      {/* Icon for Theme Change and Contact Us button */}
      <div className="absolute right-8 top-8 flex flex-col items-end space-y-4">
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Icon */}
          <button onClick={toggleTheme} className="text-2xl p-2 rounded-full transition duration-300 hover:bg-gray-200">
            {darkMode ? (
              <FaSun className="text-yellow-500" />
            ) : (
              <FaMoon className="text-gray-800" />
            )}
          </button>
          
          {/* Contact Us Button */}
          <div>
            <a
              href="#contact"
              className="px-6 py-3 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition duration-300"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
