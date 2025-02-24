"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserCircle } from "lucide-react";

export default function UserMenu({ user }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // ✅ Optimized Logout Function
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push("/signin");
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
    <div className="relative" ref={menuRef}>
      {/* ✅ User Icon (Only toggles menu, does not redirect) */}
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        aria-label="User Menu"
        className="focus:outline-none"
      >
        <UserCircle size={32} className="text-foreground hover:text-gray-300 transition" />
      </button>

      {/* ✅ Dropdown Menu with better UX */}
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-md py-2 z-50"
          role="menu"
        >
          <p className="px-4 py-2 font-semibold break-words">{user?.email}</p>
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
  );
}
