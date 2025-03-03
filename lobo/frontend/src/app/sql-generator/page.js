// "use client";

// import { useState } from "react";
// import ProtectedRoute from "@/components/ProtectedRoute";
// import { Button } from "@/components/ui/button";
// import { Toast } from "@/components/ui/Toast";

// export default function SQLGeneratorPage() {
//   const [query, setQuery] = useState("");
//   const [result, setResult] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleGenerate = async () => {
//     setError("");
//     setLoading(true);

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sql/generate`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${document.cookie.split("access_token=")[1]?.split(";")[0]}`,
//         },
//         body: JSON.stringify({ prompt: query }),
//         credentials: "include",
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || "Error generating query");
//       setResult(data.query);
//     } catch (err) {
//       setError(err.message || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ProtectedRoute>
//       <div className="min-h-screen p-8">
//         <h1 className="text-3xl font-bold mb-6">SQL Generator</h1>
//         <div className="max-w-2xl mx-auto">
//           <textarea
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className="w-full p-4 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary"
//             placeholder="Enter your SQL request..."
//             rows={4}
//           />
//           <Button onClick={handleGenerate} className="mt-4" disabled={loading}>
//             {loading ? "Generating..." : "Generate SQL"}
//           </Button>
//           {result && <pre className="mt-4 p-4 bg-gray-100 rounded">{result}</pre>}
//           <Toast message={error} />
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// }