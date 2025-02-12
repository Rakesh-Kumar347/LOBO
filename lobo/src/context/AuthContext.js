"use client";

import { createContext, useContext } from "react";

// ✅ Create Auth Context
export const AuthContext = createContext(null);

// ✅ Custom Hook to Access Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
