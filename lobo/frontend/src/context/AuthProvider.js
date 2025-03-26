"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { protectedApiRequest } from "@/lib/secureApi";
import { announcePolite } from '@/components/ui/ScreenReaderAnnouncer';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(0);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const currentSession = data?.session || null;
      setSession(currentSession);
      
      // Get user profile data if session exists
      if (currentSession?.user?.id) {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }
        
        setUserProfile(profileData || null);
        
        // Fetch subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .single();
          
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error("Error fetching subscription:", subscriptionError);
        }
        
        setSubscription(subscriptionData || { tier: 'free', status: 'active' });
      } else {
        setUserProfile(null);
        setSubscription(null);
      }
      
      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Error fetching session:", error.message);
      setSession(null);
      setUserProfile(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event);
      setSession(session);
      
      if (session?.user?.id) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setUserProfile(profileData || null);
        
        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .single();
          
        setSubscription(subscriptionData || { tier: 'free', status: 'active' });
        
        setLastRefresh(Date.now());
      } else {
        setUserProfile(null);
        setSubscription(null);
      }
      
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSession]);

  // Refresh session if it's older than 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const thirtyMinutesMs = 30 * 60 * 1000;
      
      if (session && (now - lastRefresh > thirtyMinutesMs)) {
        console.log("Refreshing session data...");
        fetchSession();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [session, lastRefresh, fetchSession]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await fetchSession();
      announcePolite("Signed in successfully");
      return true;
    } catch (error) {
      console.error("Login failed:", error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, fullName) => {
    setLoading(true);
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) throw error;
      
      announcePolite("Sign-up successful! Please check your email.");
      return { success: true, message: "Sign-up successful! Please check your email." };
    } catch (error) {
      console.error("Signup failed:", error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // For CSRF-protected endpoints, use the secured API request
      try {
        // Notify the backend about logout (optional)
        await protectedApiRequest("/auth/logout", {
          method: "POST"
        });
      } catch (e) {
        // Continue even if backend logout fails
        console.warn("Backend logout notification failed:", e);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setSession(null);
      setUserProfile(null);
      setSubscription(null);
      
      announcePolite("Signed out successfully");
      return true;
    } catch (error) {
      console.error("Logout failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!session?.user?.id) throw new Error("No authenticated user");
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      // Refresh profile data
      await fetchSession();
      announcePolite("Profile updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      announcePolite("Password reset instructions sent to your email");
      return { success: true, message: "Password reset instructions sent to your email" };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, message: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      announcePolite("Password updated successfully");
      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, message: error.message };
    }
  };

  const getUserTier = () => {
    return subscription?.tier || 'free';
  };

  const hasSubscription = () => {
    return subscription?.tier !== 'free' && subscription?.status === 'active';
  };

  const refreshSubscription = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Fetch subscription data
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error refreshing subscription:", error);
      }
      
      setSubscription(data || { tier: 'free', status: 'active' });
      return data;
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      return null;
    }
  };

  const value = {
    session,
    userProfile,
    subscription,
    login,
    logout,
    signup,
    loading,
    refreshSession: fetchSession,
    updateProfile,
    resetPassword,
    updatePassword,
    getUserTier,
    hasSubscription,
    refreshSubscription
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}