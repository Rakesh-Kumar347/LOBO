"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "react-toastify"; // Import toast

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email.includes("@") || password.length < 6) {
      toast.error("Please enter a valid email and a password with at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const successLogin = await login(email, password);
      if (!successLogin) {
        toast.error("Invalid email or password.");
      } else {
        toast.success("Sign-in successful!");
        setTimeout(() => {
          router.push("/");
        }, 1000); // Short delay to show success
      }
    } catch (err) {
      toast.error("An unexpected error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8E8EE] to-[#E6E6FA] dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#5A189A] dark:text-white">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
              required
              aria-required="true"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
              required
              aria-required="true"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#5A189A] hover:bg-[#7B2CBF] text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400"
            disabled={loading}
            aria-label="Sign In"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#5A189A] dark:text-yellow-400 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}