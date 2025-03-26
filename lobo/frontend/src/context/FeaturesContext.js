// File: src/context/FeaturesContext.js

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";

const FeaturesContext = createContext({
  isFeatureEnabled: () => false,
  isAuthenticated: false,
  userTier: "free"
});

export function FeaturesProvider({ children }) {
  const { session, subscription } = useAuth();
  const [userTier, setUserTier] = useState("free");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Define feature tiers - which features are available at which tiers
  const featureTiers = {
    // Basic features available to everyone
    "chatbot": ["free", "standard", "premium", "enterprise"],
    "basicAnalytics": ["free", "standard", "premium", "enterprise"],
    
    // Standard tier features
    "savedChats": ["standard", "premium", "enterprise"],
    "exportImport": ["standard", "premium", "enterprise"],
    
    // Premium tier features
    "voiceInput": ["premium", "enterprise"],
    "customThemes": ["premium", "enterprise"],
    "messageBranching": ["premium", "enterprise"],
    
    // Enterprise tier features
    "apiAccess": ["enterprise"],
    "teamAccess": ["enterprise"],
    "advancedAnalytics": ["enterprise"]
  };
  
  // Update state when auth changes
  useEffect(() => {
    setIsAuthenticated(!!session?.user);
    
    // Set user tier based on subscription
    if (subscription?.tier) {
      setUserTier(subscription.tier);
    } else if (session?.user) {
      setUserTier("free"); // Default tier for logged in users
    } else {
      setUserTier("guest"); // Not logged in
    }
  }, [session, subscription]);
  
  /**
   * Check if a specific feature is enabled for the current user
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - Whether the feature is enabled
   */
  const isFeatureEnabled = (featureName) => {
    // Some features require authentication
    if (!isAuthenticated) {
      return false;
    }
    
    // Check if feature exists and user's tier is in the allowed tiers
    const allowedTiers = featureTiers[featureName] || [];
    return allowedTiers.includes(userTier);
  };
  
  return (
    <FeaturesContext.Provider
      value={{
        isFeatureEnabled,
        isAuthenticated,
        userTier
      }}
    >
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error("useFeatures must be used within a FeaturesProvider");
  }
  return context;
}