"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  /**
   * Fetch the current user session from Supabase.
   */
  const fetchUserSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Error fetching session:", error.message);
    }
    setUser(data?.session?.user || null);
  }, []);

  /**
   * Listen for authentication state changes.
   */
  useEffect(() => {
    fetchUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserSession]);

  /**
   * Login function using Supabase.
   */
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("❌ Login failed:", error.message);
      return { success: false, message: error.message };
    }

    await fetchUserSession();
    router.push("/");
    return { success: true, message: "Login successful!" };
  };

  /**
   * Logout function.
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/signin");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
