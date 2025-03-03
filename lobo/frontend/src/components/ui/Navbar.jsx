"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { features } from "@/lib/features";
import { UserCircle, Sun, Moon, ChevronDown, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

function useClickOutside(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export default function Navbar({ darkMode, toggleDarkMode }) {
  const { session, logout, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const menuRef = useRef(null);
  const solutionsDropdownRef = useRef(null);
  const router = useRouter();

  useClickOutside(menuRef, () => setShowMenu(false));
  useClickOutside(solutionsDropdownRef, () => setShowSolutionsDropdown(false));

  const handleLogout = useCallback(async () => {
    try {
      setLogoutError(null);
      const success = await logout();
      if (success) {
        toast.success("Logged out successfully!", { position: "top-center" });
        router.push("/");
      }
      setShowMenu(false);
    } catch (error) {
      setLogoutError("Failed to log out. Please try again.");
      toast.error("Logout failed. Please try again.", { position: "top-center" });
      console.error("Logout error:", error);
    }
  }, [logout, router]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowMenu(false);
        setShowSolutionsDropdown(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = session
    ? []
    : [
        { label: "Features", path: "/#features" },
        { label: "About", path: "/about" },
      ];

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 z-50 transition-all bg-transparent"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.h1
        className="text-3xl font-bold cursor-pointer tracking-wide"
        style={{ color: darkMode ? "#FFFFFF" : "#1A1A1A" }}
        onClick={() => router.push("/")}
        role="button"
        tabIndex={0}
        aria-label="Go to Home"
        whileHover={{ scale: 1.05, color: darkMode ? "#D8BFD8" : "#6A0DAD" }}
        whileTap={{ scale: 0.95 }}
      >
        LOBO 🚀
      </motion.h1>

      <div className="flex items-center gap-4">
        {/* Desktop Navigation */}
        <motion.div className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <motion.a
              key={link.label}
              href={link.path}
              className={`hover:text-yellow-400 ${darkMode ? "text-white" : "text-gray-900"}`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>

        {/* Solutions Dropdown */}
        <div className="relative" ref={solutionsDropdownRef}>
          <motion.button
            onClick={() => setShowSolutionsDropdown((prev) => !prev)}
            className={`flex items-center gap-2 hover:text-yellow-400 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            aria-expanded={showSolutionsDropdown}
            aria-controls="solutions-dropdown"
          >
            Solutions <ChevronDown size={16} />
          </motion.button>
          {showSolutionsDropdown && (
            <motion.div
              id="solutions-dropdown"
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 z-50"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {features.map((feature, index) => (
                <motion.a
                  key={index}
                  href={feature.link}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                  whileHover={{ x: 5 }}
                >
                  <feature.icon size={16} />
                  <span>{feature.title}</span>
                </motion.a>
              ))}
            </motion.div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <motion.button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Menu size={24} />
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          whileHover={{ scale: 1.1, rotate: 360 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        {/* User/Auth Section */}
        {!session && !loading ? (
          <>
            <motion.button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md shadow-md"
              aria-label="Sign Up"
              whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up
            </motion.button>
            <motion.button
              onClick={() => router.push("/signin")}
              className="px-4 py-2 bg-purple-700 text-white rounded-md shadow-md"
              aria-label="Sign In"
              whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(147, 51, 234, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </>
        ) : (
          session && (
            <div className="relative" ref={menuRef}>
              <motion.button
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="User Menu"
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div
                  className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold"
                  aria-label={`User: ${session?.user?.email}`}
                >
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
              </motion.button>
              {showMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 z-50"
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <p
                    className={`px-4 py-2 font-semibold break-words ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {session.user?.email}
                  </p>
                  <hr className="border-gray-300 dark:border-gray-600" />
                  <motion.button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    {loading ? "Logging Out..." : "Log Out"}
                  </motion.button>
                </motion.div>
              )}
            </div>
          )
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="absolute top-16 left-0 w-full bg-white dark:bg-gray-800 shadow-lg md:hidden z-50"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {navLinks.map((link) => (
            <motion.a
              key={link.label}
              href={link.path}
              className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
              whileHover={{ x: 5 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
}