import { createClient } from "@supabase/supabase-js";
import { debugLog } from "./debug";

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Supabase URL or anon key is missing from environment variables!");
  
  // Log helpful debugging information in development
  if (process.env.NODE_ENV === 'development') {
    console.warn("Environment variables available:", {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "[SET]" : "[MISSING]",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "[SET]" : "[MISSING]"
    });
    console.info("Check your .env.local file and ensure these variables are set correctly.");
  }
}

// Enhanced Supabase client with debug options
export const supabase = createClient(
  supabaseUrl || "",
  supabaseKey || "",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
    global: {
      fetch: (...args) => {
        // Log request details in development
        if (process.env.NODE_ENV === 'development') {
          const [url, options] = args;
          debugLog("Supabase", `Fetch: ${options?.method || 'GET'}`, url);
        }
        return fetch(...args);
      }
    }
  }
);

// Debug helper for auth events
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    debugLog("Supabase Auth", "State Change", { event, user: session?.user?.email });
    console.log("Auth state changed:", event, session?.user?.email);
  });
}

export default supabase;