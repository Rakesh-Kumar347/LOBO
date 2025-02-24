"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider"; // ✅ Import useAuth
import { supabase } from "@/lib/supabase";
import { UserCircle, Sun, Moon } from "lucide-react";

export default function Navbar({ darkMode, toggleDarkMode }) {
  const { session } = useAuth(); // ✅ Get session state
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // ✅ Optimized Logout Function
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push("/");
  }, [router]);

  // ✅ Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close menu with "Esc" key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowMenu(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 shadow-md z-50 transition-all ${
        darkMode ? "bg-[#2E1065] text-white" : "bg-[#6A0DAD] text-white"
      }`}
    >
      {/* ✅ Logo with better accessibility */}
      <h1
        className="text-3xl font-bold cursor-pointer tracking-wide hover:text-gray-200 transition"
        onClick={() => router.push("/")}
        role="button"
        tabIndex={0}
        aria-label="Go to Home"
      >
        LOBO 🚀
      </h1>

      <div className="flex items-center gap-4">
        {/* ✅ Theme Toggle Button with accessible label */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white transition"
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* ✅ User Authentication Buttons */}
        {!session ? (
          <>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md shadow-md hover:bg-yellow-500 transition"
              aria-label="Sign Up"
            >
              Sign Up
            </button>
            <button
              onClick={() => router.push("/signin")}
              className="px-4 py-2 bg-purple-700 text-white rounded-md shadow-md hover:bg-purple-800 transition"
              aria-label="Sign In"
            >
              Sign In
            </button>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            {/* ✅ User Profile Button */}
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="User Menu"
            >
              <UserCircle size={32} className="text-white hover:text-gray-300 transition" />
            </button>

            {/* ✅ Dropdown Menu with better UX */}
            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-md py-2 z-50"
                role="menu"
              >
                <p className="px-4 py-2 font-semibold break-words">
                  {session.user?.email}
                </p>
                <hr className="border-gray-300 dark:border-gray-600" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
