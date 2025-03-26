"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { features } from "@/lib/features";
import dynamic from "next/dynamic";
import { loadSlim } from "tsparticles-slim";
import throttle from "lodash.throttle";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

const Particles = dynamic(() => import("react-particles"), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const featuresRef = useRef(null);
  const titleRef = useRef(null);
  const loboSvgRef = useRef(null);
  const isFeaturesInView = useInView(featuresRef, { once: true });
  const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
  const [hoveredLetter, setHoveredLetter] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  }, [darkMode]);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions = {
    particles: {
      number: { value: 30, density: { enable: true, value_area: 1000 } },
      color: { value: darkMode ? "#FFFFFF" : "#A78BFA" },
      size: { value: 2, random: true },
      move: { speed: 0.3, direction: "none", random: true },
      opacity: { value: 0.4 },
    },
    interactivity: {
      detect_on: "window",
      events: { onHover: { enable: true, mode: "repulse" } },
      modes: { repulse: { distance: 80 } },
    },
    retina_detect: true,
    fpsLimit: 60,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const getColorFromPosition = (x) => {
    const colors = [
      "#FF9F0A", // Orange
      "#00C4B4", // Teal
      "#9333EA", // Purple
      "#FF3A30", // Red
      "#FFD700", // Gold
      "#40C4FF", // Light Blue
      "#E91E63", // Pink
      "#4CAF50", // Green
    ];
    const segment = Math.min(Math.floor(x * (colors.length - 1)), colors.length - 1);
    return colors[segment];
  };

  const handleMouseMove = throttle((e) => {
    if (loboSvgRef.current) {
      const rect = loboSvgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setCursorPos({ x, y });

      // Determine which letter is under the cursor
      const letterWidth = 1 / loboLetters.length;
      const hoveredIndex = Math.floor(x / letterWidth);
      setHoveredLetter(hoveredIndex >= 0 && hoveredIndex < loboLetters.length ? hoveredIndex : null);
    }
  }, 16);

  const handleMouseLeave = () => {
    setHoveredLetter(null);
  };

  // NEW ANIMATION: 3D rotation with fade-in effect
  const letterVariants = {
    hidden: { opacity: 0, rotateY: 90, scale: 0.5 },
    visible: (i) => ({
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: i * 0.2,
        ease: [0.6, 0.01, -0.05, 0.95], // Custom easing function
        type: "tween",
      },
    }),
  };

  // Glow pulse animation for individual letter
  const glowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const loboLetters = "LOBO".split("");
  const letterSpacing = 160;

  return (
    <>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div className="w-full bg-background text-foreground relative overflow-hidden min-h-screen">
        {/* Particles Background */}
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particleOptions}
          className="absolute inset-0 z-0 pointer-events-none"
        />

        {/* Hero Section */}
        <section className="pt-20 pb-16 text-center relative z-10">
          <div
            ref={titleRef}
            className="h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center max-w-[90vw] mx-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <svg
              ref={loboSvgRef}
              className="w-full h-full"
              viewBox="0 0 800 200"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="LOBO - Smart Local AI Assistant"
            >
              <defs>
                <linearGradient id="outlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#888888" />
                  <stop offset="100%" stopColor="#666666" />
                </linearGradient>
                <radialGradient
                  id="glowGradient"
                  cx={`${cursorPos.x * 100}%`}
                  cy={`${cursorPos.y * 100}%`}
                  r="25%"
                  fx={`${cursorPos.x * 100}%`}
                  fy={`${cursorPos.y * 100}%`}
                >
                  <stop offset="0%" stopColor={getColorFromPosition(cursorPos.x)} />
                  <stop offset="50%" stopColor={getColorFromPosition(cursorPos.x)} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={getColorFromPosition(cursorPos.x)} stopOpacity="0" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <g transform="translate(400, 100)" textAnchor="middle" style={{ transformStyle: "preserve-3d" }}>
                {loboLetters.map((letter, index) => (
                  <motion.text
                    key={index}
                    x={index * letterSpacing - ((loboLetters.length - 1) * letterSpacing) / 2}
                    y="0"
                    fontWeight="900"
                    fontSize="180"
                    fill="none"
                    stroke="url(#outlineGradient)"
                    strokeWidth="0.5"
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={letterVariants}
                    style={{ transformOrigin: "center", perspective: "1000px" }}
                  >
                    {letter}
                  </motion.text>
                ))}
                {hoveredLetter !== null && (
                  <motion.text
                    x={hoveredLetter * letterSpacing - ((loboLetters.length - 1) * letterSpacing) / 2}
                    y="0"
                    fontWeight="900"
                    fontSize="180"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="1.5"
                    filter="url(#glow)"
                    initial="hidden"
                    animate="visible"
                    variants={glowVariants}
                  >
                    {loboLetters[hoveredLetter]}
                  </motion.text>
                )}
              </g>
            </svg>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: loboLetters.length * 0.2 + 0.2 }}
            className="text-xl md:text-2xl mt-4 max-w-2xl mx-auto"
          >
            Your Smart Local AI Assistant for Data & Automation
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: loboLetters.length * 0.2 + 0.4 }}
            className="mt-8"
          >
            <Button
              variant="gradient"
              size="lg"
              onClick={() => router.push("/aichatbot")}
              aria-label="Get Started"
            >
              Get Started
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          initial="hidden"
          animate={isFeaturesInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 py-16 relative z-10"
        >
          {features.map(({ title, icon: Icon, link }) => (
            <motion.div
              key={title}
              variants={itemVariants}
              className="p-6 rounded-xl bg-card hover:bg-accent/80 cursor-pointer shadow-md transition-all"
              onClick={() => router.push(link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push(link)}
              aria-label={`Navigate to ${title}`}
            >
              <Icon size={40} className="mb-4 text-primary mx-auto" />
              <h3 className="text-lg font-semibold text-center">{title}</h3>
            </motion.div>
          ))}
        </motion.section>

        {/* Media Query for Adjustments */}
        <style jsx global>{`
          @media (prefers-reduced-motion: reduce) {
            svg text {
              transition: none !important;
            }
            .motion-div {
              transition: none !important;
            }
          }
          @media (max-width: 768px) {
            svg text {
              font-size: 120px !important;
            }
          }
          @media (max-width: 480px) {
            svg text {
              font-size: 80px !important;
            }
          }
        `}</style>
      </div>
      <Footer darkMode={darkMode} />
    </>
  );
}