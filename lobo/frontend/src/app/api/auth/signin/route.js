import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign-in Error:", error.message);
      return Response.json({ error: error.message }, { status: 400 });
    }

    // ✅ Fetch session to store it in Supabase auth cookies
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session Error:", sessionError.message);
      return Response.json({ error: "Failed to retrieve session" }, { status: 500 });
    }

    return Response.json({ message: "Sign-in successful!", session: sessionData }, { status: 200 });

  } catch (err) {
    console.error("Server Error:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
