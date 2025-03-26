// File: src/app/sql-generator/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Database, Send, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ErrorBoundary } from "@/components/ui/ErrorHandler";
import FeatureGated from "@/components/ui/FeatureGated";

export default function SQLGeneratorPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast.error("Please enter a SQL request");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a simple SQL statement based on the query
      let sqlResult = "";
      
      if (query.toLowerCase().includes("select") || query.toLowerCase().includes("get")) {
        sqlResult = `SELECT * FROM customers\nWHERE status = 'active'\nORDER BY last_purchase_date DESC\nLIMIT 10;`;
      } else if (query.toLowerCase().includes("update")) {
        sqlResult = `UPDATE products\nSET inventory_count = inventory_count - 1\nWHERE product_id = 12345\nAND inventory_count > 0;`;
      } else if (query.toLowerCase().includes("join") || query.toLowerCase().includes("combine")) {
        sqlResult = `SELECT c.customer_name, o.order_date, p.product_name\nFROM customers c\nJOIN orders o ON c.customer_id = o.customer_id\nJOIN order_items oi ON o.order_id = oi.order_id\nJOIN products p ON oi.product_id = p.product_id\nWHERE o.order_date > '2023-01-01'\nORDER BY o.order_date DESC;`;
      } else {
        sqlResult = `-- Here's a query based on your request:\n\nSELECT \n  product_id,\n  product_name,\n  category,\n  price,\n  (SELECT AVG(price) FROM products) as avg_price\nFROM \n  products\nWHERE \n  price > (SELECT AVG(price) FROM products)\nORDER BY\n  price DESC;`;
      }
      
      setResult(sqlResult);
    } catch (error) {
      console.error("Error generating SQL:", error);
      toast.error("Failed to generate SQL query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 mt-16">
          <div className="flex items-center gap-3 mb-6">
            <Database size={28} className="text-purple-600" />
            <h1 className="text-3xl font-bold">SQL Generator</h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Describe what SQL query you need, and our AI will generate it for you.
            </p>
            
            <div className="mb-4">
              <label htmlFor="query" className="block mb-2 font-medium">
                Your SQL Request
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 border rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 min-h-32"
                placeholder="Example: Get all active customers who made a purchase in the last 30 days"
                rows={4}
              />
            </div>
            
            <FeatureGated featureName="sqlGenerator">
              <Button
                onClick={handleGenerate}
                className="flex items-center gap-2"
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Generate SQL
                  </>
                )}
              </Button>
            </FeatureGated>
            
            {result && (
              <div className="mt-6">
                <h2 className="font-medium mb-2">Generated SQL:</h2>
                <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{result}</pre>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      toast.success("SQL copied to clipboard!");
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
        
        <Footer darkMode={darkMode} />
      </div>
    </ErrorBoundary>
  );
}