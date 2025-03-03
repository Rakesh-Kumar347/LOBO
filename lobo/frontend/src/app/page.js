"use client";

import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { features } from "@/lib/features";
import dynamic from "next/dynamic";
import { loadSlim } from "tsparticles-slim";
import { useCallback, useRef, useState } from "react";
import throttle from "lodash.throttle";

const Particles = dynamic(() => import("react-particles"), { ssr: false });

export default function HomePage({ darkMode }) {
  const router = useRouter();
  const statsRef = useRef(null);
  const titleRef = useRef(null);
  const loboSvgRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const getColorFromPosition = (x) => {
    const colors = ["#FF9F0A", "#00C4B4", "#9333EA", "#FF3A30", "#FF9F0A"];
    const segmentCount = colors.length - 1;
    const segment = Math.floor(x * segmentCount);
    return colors[segment + 1];
  };

  const handleMouseMove = throttle((e) => {
    if (loboSvgRef.current) {
      const rect = loboSvgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setCursorPos({ x, y });
      setIsHovered(true);
    }
  }, 16);

  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div className="w-full bg-[#d3fce8] dark:bg-[#1A1A1A] text-[#333] dark:text-white relative overflow-hidden">
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          particles: {
            number: { value: 20, density: { enable: true, value_area: 800 } },
            color: { value: darkMode ? "#FFFFFF" : "#00C4B4" },
            size: { value: 3, random: true },
            move: { speed: 0.5, direction: "none", random: true },
            opacity: { value: 0.3 },
          },
          interactivity: {
            events: { onHover: { enable: true, mode: "repulse" } },
            modes: { repulse: { distance: 100 } },
          },
        }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative z-10 w-full flex flex-col items-center">
        <div
          className="text-center h-64 md:h-80 lg:h-96 flex items-center justify-center w-full max-w-4xl mx-auto"
          ref={titleRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            ref={loboSvgRef}
            className="w-full h-full max-w-full"
            viewBox="0 0 400 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="LOBO - Smart Local AI Assistant"
          >
            <defs>
              <linearGradient id="outlineGradient">
                <stop offset="0%" stopColor="#888888" />
                <stop offset="100%" stopColor="#666666" />
              </linearGradient>
              <radialGradient
                id="glowGradient"
                cx={`${cursorPos.x * 100}%`}
                cy={`${cursorPos.y * 100}%`}
                r="10%"
                fx={`${cursorPos.x * 100}%`}
                fy={`${cursorPos.y * 100}%`}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={getColorFromPosition(cursorPos.x)} />
                <stop offset="40%" stopColor={getColorFromPosition(cursorPos.x)} stopOpacity="0.6" />
                <stop offset="100%" stopColor={getColorFromPosition(cursorPos.x)} stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontWeight="900"
              fontSize="150"
              fill="none"
              stroke="url(#outlineGradient)"
              strokeWidth="0.2"
            >
              LOBO
            </text>
            {isHovered && (
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontWeight="900"
                fontSize="150"
                fill="none"
                stroke="url(#glowGradient)"
                strokeWidth="1.5"
                filter="url(#glow)"
              >
                LOBO
              </text>
            )}
          </svg>
        </div>
        <motion.p
          className="text-xl md:text-2xl text-center mt-4 max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          Your Smart Local AI Assistant for Data & Automation
        </motion.p>
      </section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 py-16 relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {features.map(({ title, icon: Icon, link }, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#00C4B4] dark:bg-[#2A2A2A] shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            whileHover={{ scale: 1.03 }}
            onClick={() => router.push(link)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push(link)}
            aria-label={`Navigate to ${title}`}
          >
            <Icon size={40} className="mb-4 text-[#80e9b5]" />
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}