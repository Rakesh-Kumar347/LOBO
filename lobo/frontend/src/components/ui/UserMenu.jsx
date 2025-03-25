"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { LogOut, User, Settings } from "lucide-react";
import { toast } from "react-toastify";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { session, logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  
  // Handle escape key press to close menu
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // If no user is logged in, return nothing
  if (!session?.user) return null;
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };
  
  // Get first letter of email for avatar
  const userInitial = session.user.email ? session.user.email.charAt(0).toUpperCase() : "U";
  
  return (
    <div className="relative z-50" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 hover:bg-purple-700 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-controls="user-menu"
      >
        {userInitial}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="user-menu"
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {session.user.email}
            </p>
          </div>
          
          <ul>
            <li>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => router.push("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </button>
            </li>
            <li>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => router.push("/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
            </li>
            <li className="border-t border-gray-200 dark:border-gray-700">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}