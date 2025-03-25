"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await fetchSession();
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUserProfile(null);
      setSubscription(null);
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

  const value = {
    session,
    userProfile,
    subscription,
    login,
    logout,
    signup,
    loading,
    refreshProfile: fetchSession,
    updateProfile,
    resetPassword,
    updatePassword,
    getUserTier,
    hasSubscription
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