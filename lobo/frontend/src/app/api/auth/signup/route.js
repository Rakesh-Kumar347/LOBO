import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { email, password, full_name } = await request.json();

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Sign up with Supabase directly
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });

    // Handle signup error
    if (error) {
      console.error("Signup error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: "Sign-up successful! Please check your email to confirm.", 
        user: data.user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign-up server error:", error);
    return NextResponse.json(
      { success: false, message: "An internal error occurred." },
      { status: 500 }
    );
  }
}