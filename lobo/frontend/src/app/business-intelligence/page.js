// File: lobo/frontend/src/app/business-intelligence/page.js

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";

/**
 * Business Intelligence Feature Page
 * 
 * NOTE: This feature is currently under development and will be implemented in a future release.
 * This placeholder shows a coming soon message with basic information about the feature.
 */
export default function BusinessIntelligencePage() {
  const router = useRouter();
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <BarChart size={48} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Business Intelligence</h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Advanced analytics and business intelligence features are coming soon.
            This feature will help you visualize data, create dashboards, and gain insights.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              Return Home
            </Button>
            
            {!session && (
              <Button
                onClick={() => router.push("/signup")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Up for Updates
              </Button>
            )}
          </div>
        </div>
        
        {/* Feature Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Planned Features</h2>
          
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Interactive dashboards</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Customizable reports</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Data visualization tools</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Integration with your data sources</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}