"use client";

import React from "react";

import Link from "next/link";
import { ThemeSwitch } from "../theme/theme-switch";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-white dark:bg-gray-900 shadow-md z-50">
      {/* LOBO Logo */}
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        LOBO
      </div>

      {/* Right Section: Theme Switch & Contact Us */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <ThemeSwitch/>

        {/* Contact Us Button */}
        <Link
          href="#contact"
          className="px-6 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition duration-300"
        >
          Contact Us
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
