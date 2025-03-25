"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  CreditCard, 
  BarChart2, 
  MessageSquare, 
  Shield, 
  LogOut,
  Loader2,
  ChevronRight,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function AccountDashboard() {
  const { session, logout, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session && !loading) {
      router.push("/signin?redirect=/account");
    }
  }, [session, router, loading]);

  // Fetch subscription and usage data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      try {
        // Fetch subscription data
        const subResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/user`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );
        
        if (subResponse.ok) {
          const subData = await subResponse.json();
          setSubscription(subData.data);
        }
        
        // Fetch usage analytics
        const analyticsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/user`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setUsageStats(analyticsData.data);
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  const accountMenuItems = [
    {
      title: "Profile",
      description: "View and update your personal information",
      icon: User,
      href: "/account/profile",
      color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Subscription",
      description: "Manage your subscription plan",
      icon: CreditCard,
      href: "/account/subscription",
      color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
      badge: subscription?.tier !== "free" ? subscription?.tier : null,
      badgeColor: subscription?.tier === "premium" ? "bg-yellow-400 text-yellow-900" : "bg-purple-600 text-white",
    },
    {
      title: "Analytics",
      description: "View your usage statistics and insights",
      icon: BarChart2,
      href: "/account/analytics",
      color: "text-green-500 bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Saved Chats",
      description: "Manage your saved conversations",
      icon: MessageSquare,
      href: "/aichatbot",
      color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      title: "Security",
      description: "Manage your password and security settings",
      icon: Shield,
      href: "/account/security",
      color: "text-red-500 bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Settings",
      description: "Configure app preferences and notifications",
      icon: Settings,
      href: "/account/settings",
      color: "text-gray-500 bg-gray-100 dark:bg-gray-700",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your account, subscription, and preferences
        </p>
      </div>

      {/* User Profile Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-200 dark:bg-purple-900 flex items-center justify-center text-2xl font-bold text-purple-700 dark:text-purple-300">
                {session.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              {subscription?.tier === "premium" && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-1 rounded-full">
                  <Award size={20} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-semibold">
              {userProfile?.full_name || "User"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{session.user?.email}</p>
            <div className="flex flex-wrap items-center mt-2">
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-2 mb-2">
                {subscription?.tier_info?.name || "Free"} Plan
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 mr-2 mb-2">
                Member since {new Date(userProfile?.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="outline" onClick={handleLogout} className="w-full md:w-auto">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">{subscription.tier_info?.name || "Free"} Plan</h2>
              <p className="text-white/80 mt-1">
                {subscription.tier === "free" ? (
                  "Upgrade to unlock premium features"
                ) : subscription.status === "active" ? (
                  <>
                    Your subscription is active{" "}
                    {subscription.expiry_date && (
                      <>
                        until{" "}
                        <span className="font-medium">
                          {new Date(subscription.expiry_date).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  "Your subscription is inactive"
                )}
              </p>
            </div>
            <Link href="/account/subscription" className="mt-4 md:mt-0">
              <Button className="bg-white text-purple-700 hover:bg-gray-100">
                {subscription.tier === "free" ? "Upgrade Now" : "Manage Subscription"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usageStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Chats</p>
                <p className="text-2xl font-bold">{usageStats.chat_count || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <MessageSquare size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold">{usageStats.total_messages || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                <MessageSquare size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Days</p>
                <p className="text-2xl font-bold">{usageStats.active_days || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                <BarChart2 size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Active</p>
                <p className="text-2xl font-bold">
                  {usageStats.last_active_date
                    ? new Date(usageStats.last_active_date).toLocaleDateString()
                    : "Today"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                <Award size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accountMenuItems.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ translateY: -5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
          >
            <Link href={item.href} className="block p-6">
              <div className="flex items-start">
                <div className={`p-3 rounded-full ${item.color} mr-4`}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{item.title}</h3>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 self-center ml-2 flex-shrink-0"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}