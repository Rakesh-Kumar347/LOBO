"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserCircle } from "lucide-react";

export default function UserMenu({ user }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  // Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push("/signin");
  };

  return (
    <div className="relative">
      {/* User Icon (Only toggles menu, does not redirect) */}
      <button onClick={() => setShowMenu(!showMenu)}>
        <UserCircle size={32} className="text-foreground hover:text-gray-300 transition" />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-md py-2 z-50"
          onMouseLeave={() => setShowMenu(false)}
        >
          <p className="px-4 py-2 font-semibold break-words">{user?.email}</p>
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
  );
}
