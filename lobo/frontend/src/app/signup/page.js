"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
      } else {
        router.push("/signin");
      }
    } catch (err) {
      setError("An error occurred during sign-up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8E8EE] to-[#E6E6FA] dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#5A189A] dark:text-white">
          Sign Up
        </h1>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
              required
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#5A189A] hover:bg-[#7B2CBF] text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[#5A189A] dark:focus:ring-yellow-400"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-[#5A189A] dark:text-yellow-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}