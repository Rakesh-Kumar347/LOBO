"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Create authentication context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // ✅ Get the active session when the app loads
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Error fetching session:", error);
      setSession(data?.session || null);
    };

    fetchSession();

    // ✅ Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

// ✅ Custom hook to use authentication
export function useAuth() {
  return useContext(AuthContext);
}
