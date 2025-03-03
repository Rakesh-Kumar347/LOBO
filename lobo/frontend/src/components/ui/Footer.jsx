// src/components/ui/Footer.jsx
import React from "react";

export default function Footer({ darkMode }) {
  return (
    <footer
      className={`py-8 mt-auto transition-colors duration-200 ${
        darkMode ? "bg-[#1A1A1A] text-white" : "bg-[#F5F5F5] text-[#333]"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">LOBO</h3>
            <p className="text-sm">
              Your Smart Local AI Assistant for Data & Automation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/#features"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="Features"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="About"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="Contact"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@lobo.ai"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="Email support"
                >
                  support@lobo.ai
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/lobo"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="Twitter"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/lobo"
                  className={`hover:text-yellow-400 transition ${
                    darkMode ? "text-white" : "text-[#333]"
                  }`}
                  aria-label="GitHub"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} LOBO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}