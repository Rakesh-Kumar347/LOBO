"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { motion } from "framer-motion";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import Link from "next/link";

export default function SubscriptionPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState({});
  const [userSubscription, setUserSubscription] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session && !loading) {
      router.push("/signin?redirect=/account/subscription");
    }
  }, [session, router, loading]);

  // Fetch subscription data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      try {
        // Fetch subscription tiers
        const tiersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/tiers`);
        
        if (!tiersResponse.ok) {
          throw new Error("Failed to fetch subscription tiers");
        }
        
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.data?.tiers || {});
        
        // Fetch user's current subscription
        const userSubResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/user`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );
        
        if (userSubResponse.ok) {
          const userSubData = await userSubResponse.json();
          setUserSubscription(userSubData.data);
          setSelectedTier(userSubData.data?.tier || "free");
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
        toast.error("Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Handle subscription purchase/upgrade
  const handleSubscribe = async () => {
    if (!selectedTier || !session?.user) return;
    
    // Skip if selecting current tier
    if (userSubscription?.tier === selectedTier && userSubscription?.status === "active") {
      toast.info("You are already subscribed to this tier");
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // In a real app, you would integrate with a payment processor here
      // For this example, we'll simulate a successful payment
      
      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tier: selectedTier,
            duration_months: 1,
            payment_id: `sim_${Date.now()}`, // Simulated payment ID
          }),
          credentials: "include",
        }
      );
      
      if (!paymentResponse.ok) {
        throw new Error("Failed to process subscription");
      }
      
      const subscriptionData = await paymentResponse.json();
      setUserSubscription(subscriptionData.data);
      
      toast.success(`Successfully subscribed to ${tiers[selectedTier]?.name || selectedTier} plan!`);
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to process subscription. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!userSubscription?.id || !session?.user) return;
    
    if (confirm("Are you sure you want to cancel your subscription?")) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${userSubscription.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to cancel subscription");
        }
        
        // Update local state
        setUserSubscription({
          ...userSubscription,
          status: "cancelled",
        });
        
        toast.success("Your subscription has been cancelled");
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        toast.error("Failed to cancel subscription");
      }
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your LOBO subscription and unlock premium features
        </p>
      </div>

      {/* Current Subscription Summary */}
      <div className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        
        {userSubscription?.status === "active" && userSubscription?.tier !== "free" ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center">
                <span className="text-lg font-medium mr-2">
                  {tiers[userSubscription.tier]?.name || userSubscription.tier}
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Active
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                ${tiers[userSubscription.tier]?.monthly_price.toFixed(2)}/month
              </p>
              {userSubscription.expiry_date && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Next billing date: {new Date(userSubscription.expiry_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4 md:mt-0 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleCancelSubscription}
            >
              <X size={16} className="mr-2" />
              Cancel Subscription
            </Button>
          </div>
        ) : userSubscription?.status === "cancelled" ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Subscription Cancelled
                </h3>
                <p className="mt-1 text-sm">
                  Your {tiers[userSubscription.tier]?.name || userSubscription.tier} subscription has been cancelled
                  {userSubscription.expiry_date && (
                    <>
                      {" "}
                      and will end on{" "}
                      <span className="font-medium">
                        {new Date(userSubscription.expiry_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  .
                </p>
                <p className="mt-3 text-sm">
                  You can resubscribe or choose a different plan below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-lg font-medium mr-2">Free Plan</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
              Current
            </span>
          </div>
        )}
      </div>

      {/* Subscription Plans */}
      <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Object.entries(tiers).map(([tierId, tierInfo]) => (
          <motion.div
            key={tierId}
            whileHover={{ y: -5 }}
            className={`border rounded-xl overflow-hidden transition-shadow duration-300 ${
              selectedTier === tierId
                ? "border-purple-500 ring-2 ring-purple-500 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:shadow-md"
            }`}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{tierInfo.name}</h3>
              <p className="text-2xl font-bold mb-4">
                ${tierInfo.monthly_price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
              </p>
              
              <ul className="space-y-3 mb-6">
                {tierInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                variant={selectedTier === tierId ? "default" : "outline"}
                className={`w-full ${
                  selectedTier === tierId
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "hover:border-purple-500 hover:text-purple-500"
                }`}
                onClick={() => setSelectedTier(tierId)}
                disabled={processingPayment}
              >
                {userSubscription?.tier === tierId && userSubscription?.status === "active"
                  ? "Current Plan"
                  : "Select"}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Link href="/account">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubscribe}
          disabled={
            processingPayment ||
            (userSubscription?.tier === selectedTier && userSubscription?.status === "active") ||
            !selectedTier
          }
        >
          {processingPayment ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing...
            </>
          ) : userSubscription?.tier === selectedTier && userSubscription?.status === "active" ? (
            "Current Plan"
          ) : selectedTier === "free" ? (
            "Continue with Free Plan"
          ) : (
            `Subscribe to ${tiers[selectedTier]?.name || selectedTier}`
          )}
        </Button>
      </div>
    </div>
  );
}