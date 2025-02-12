"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bot, Database, BarChart, Image, Activity } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const features = [
    { title: "AI Chatbot", icon: Bot, link: "/aichatbot" },
    { title: "SQL Generator", icon: Database, link: "/sql-generator" },
    { title: "Business Intelligence", icon: BarChart, link: "/business-intelligence" },
    { title: "Time Series Analysis", icon: Activity, link: "/time-series-analysis" },
    { title: "Data Governance", icon: Database, link: "/data-governance" },
    { title: "Text-to-Image AI", icon: Image, link: "/text-to-image" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#F8E8EE] to-[#E6E6FA] dark:from-gray-900 dark:to-gray-800">
      <main className="pt-24 flex-grow">
        {/* Animated LOBO Title */}
        <motion.h1
          className="text-[8rem] md:text-[12rem] font-extrabold text-center mt-6 text-[#5A189A] dark:text-white"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          LOBO
        </motion.h1>

        {/* Animated Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-center mt-2 font-medium text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          🚀 Your Smart Local AI Assistant for Data & Automation
        </motion.p>

        {/* Features Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-6 pb-16 mt-12">
          {features.map(({ title, icon: Icon, link }, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center justify-center p-8 rounded-lg shadow-lg transition-all cursor-pointer group bg-[#FDE2E4] text-gray-900 hover:bg-[#D8BFD8] dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(link)}
            >
              <Icon size={50} className="mb-4 text-purple-600 dark:text-yellow-400" />
              <h3 className="text-xl font-semibold text-center">{title}</h3>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
