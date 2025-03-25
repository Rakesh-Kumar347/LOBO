"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Loader2, MessageSquare, Calendar, Clock, Award, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function AnalyticsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session && !loading) {
      router.push("/signin?redirect=/account/analytics");
    }
  }, [session, router, loading]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/user?days=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        
        const data = await response.json();
        setAnalytics(data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session, timeRange]);

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

  // Prepare chart data
  const messageDistributionData = analytics ? [
    { name: "Your Messages", value: analytics.user_messages },
    { name: "AI Responses", value: analytics.assistant_messages },
  ] : [];

  const COLORS = ["#8884d8", "#82ca9d"];

  const activityData = analytics?.active_days
    ? Array.from({ length: timeRange }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (timeRange - 1) + i);
        const dateString = date.toISOString().split("T")[0];
        
        // Check if this date is in the active_days list
        const isActive = analytics.active_days.includes(dateString);
        
        return {
          date: dateString,
          activity: isActive ? 1 : 0,
        };
      })
    : [];

  // Stat cards data
  const statCards = [
    {
      title: "Total Chats",
      value: analytics?.chat_count || 0,
      icon: MessageSquare,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      title: "Active Days",
      value: analytics?.active_days?.length || 0,
      icon: Calendar,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    {
      title: "Total Messages",
      value: analytics?.total_messages || 0,
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    {
      title: "Daily Average",
      value: analytics?.avg_chats_per_active_day?.toFixed(1) || 0,
      suffix: "chats",
      icon: Activity,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            View insights about your chat usage and activity
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                onClick={() => setTimeRange(days)}
                className={
                  timeRange === days
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "hover:border-purple-500 hover:text-purple-500"
                }
              >
                {days} Days
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">
                  {stat.value}
                  {stat.suffix && <span className="text-sm font-normal ml-1">{stat.suffix}</span>}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis hide domain={[0, 1]} />
              <Tooltip 
                formatter={(value) => ["Active", value > 0 ? "Yes" : "No"]}
                labelFormatter={(date) => new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#8884d8"
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Message Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Message Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={messageDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {messageDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} messages`, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chat Activity by Day */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Chat Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData.filter(day => day.activity > 0)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  formatter={(value) => ["Activity", value > 0 ? "Active" : "Inactive"]}
                />
                <Bar dataKey="activity" fill="#82ca9d" name="Activity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Usage Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">First Activity</p>
            <p className="text-lg font-medium">
              {analytics?.first_active_date
                ? new Date(analytics.first_active_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activity Rate</p>
            <p className="text-lg font-medium">
              {analytics
                ? `${((analytics.active_days?.length / timeRange) * 100).toFixed(1)}%`
                : "0%"}
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Messages per Chat</p>
            <p className="text-lg font-medium">
              {analytics && analytics.chat_count > 0
                ? (analytics.total_messages / analytics.chat_count).toFixed(1)
                : "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}