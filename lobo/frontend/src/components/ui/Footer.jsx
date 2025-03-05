// src/components/ui/Footer.jsx
import React from "react";
import { Github, Twitter, Mail } from "lucide-react";
import { Button } from "./button";

export default function Footer({ darkMode }) {
  const socialLinks = [
    { icon: Github, href: "https://github.com/lobo", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/lobo", label: "Twitter" },
    { icon: Mail, href: "mailto:support@lobo.ai", label: "Email" },
  ];

  return (
    <footer
      className={`py-8 mt-auto transition-colors duration-200 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-lg font-semibold mb-4">LOBO</h3>
            <p className="text-sm">
              Your Smart Local AI Assistant for Data & Automation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/#features", label: "Features" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    className={`hover:text-primary transition ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                    aria-label={label}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex justify-center md:justify-start gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label={label}
                >
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon size={20} />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} LOBO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}