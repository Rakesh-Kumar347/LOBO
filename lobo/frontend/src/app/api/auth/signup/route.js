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

    // Sign up the user using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // Check if the user was created successfully
    if (data.user) {
      return NextResponse.json(
        { success: true, message: "Sign-up successful! Please check your email to verify your account." },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to create user." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}