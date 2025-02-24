"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // useEffect(() => {
  //   async function fetchUser() {
  //     const { data, error } = await supabase.auth.getUser();
  //     if (error || !data?.user) {
  //       router.push("/signin"); // Redirect to sign-in if not logged in
  //     } else {
  //       setUser(data.user);
  //     }
  //   }
  //   fetchUser();
  // }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold">Welcome to LOBO Dashboard</h1>
      {user && (
        <p className="mt-4 text-lg">Hello, {user.email}</p>
      )}
    </div>
  );
}
