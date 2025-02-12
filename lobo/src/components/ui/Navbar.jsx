"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import { UserCircle, Sun, Moon } from "lucide-react";

export default function Navbar({ darkMode, toggleDarkMode }) {
  const { session } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 shadow-md z-50 transition-all ${
        darkMode ? "bg-[#2E1065] text-white" : "bg-[#6A0DAD] text-white"
      }`}
    >
      {/* Logo */}
      <h1
        className="text-3xl font-bold cursor-pointer tracking-wide hover:text-gray-200 transition"
        onClick={() => router.push("/")}
      >
        LOBO 🚀
      </h1>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white transition"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Auth Actions */}
        {!session ? (
          <>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md shadow-md hover:bg-yellow-500 transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => router.push("/signin")}
              className="px-4 py-2 bg-purple-700 text-white rounded-md shadow-md hover:bg-purple-800 transition"
            >
              Sign In
            </button>
          </>
        ) : (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}>
              <UserCircle size={32} className="text-white hover:text-gray-300 transition" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-md py-2 z-50">
                <p className="px-4 py-2 font-semibold break-words">{session.user?.email}</p>
                <hr className="border-gray-300 dark:border-gray-600" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
