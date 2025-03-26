// File: src/app/aichatbot/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Menu } from "lucide-react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatMessage from "@/components/ui/ChatMessage";
import ChatUI from "@/components/chat/ChatUI";
import Navbar from "@/components/ui/Navbar";
import { Button } from "@/components/ui/button";
import ChatOrganizer from "@/components/ui/ChatOrganizer";


// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export default function AIChatbot() {
  const { session } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
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

  // Load saved chats if user is logged in
  useEffect(() => {
    if (session?.user) {
      loadSavedChats();
    }
  }, [session]);

  const loadSavedChats = async () => {
    try {
      const response = await fetch(`${API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedChats(data.data?.chats || []);
      }
    } catch (error) {
      console.error("Failed to load saved chats:", error);
    }
  };

  const loadChatById = async (chatId) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data?.messages || []);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
      toast.error("Failed to load chat");
    }
  };

  const handleSaveChat = async (chatId) => {
    setCurrentChatId(chatId);
    await loadSavedChats();
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navbar with title and user menu */}
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="flex flex-1 pt-16 relative">
        {/* Sidebar */}
        <aside
          className={`absolute md:relative top-0 left-0 h-full bg-white dark:bg-gray-800 w-64 p-5 transition-transform z-40 shadow-lg ${
            sidebarOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0 md:w-0 md:p-0"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Chat Options</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu size={18} />
            </Button>
          </div>

          <ChatOrganizer
            savedChats={savedChats}
            onChatSelect={loadChatById}
            onCreateNewChat={createNewChat}
            currentChatId={currentChatId}
            onSaveCategory={async (chatId, category) => {
              try {
                const response = await fetch(`${API_URL}/chats/${chatId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({ category }),
                  credentials: 'include',
                });
                
                if (response.ok) {
                  toast.success("Chat category updated!");
                  await loadSavedChats();
                }
              } catch (error) {
                console.error("Failed to update category:", error);
                toast.error("Failed to update category");
              }
            }}
          />
        </aside>

        {/* Show sidebar toggle button when sidebar is hidden */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 p-2 bg-purple-700 text-white rounded-md shadow-md z-30 md:hidden"
            title="Show sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Main chat area */}
        <div className="flex-1 h-full p-4">
          <ChatUI 
            initialMessages={messages}
            chatId={currentChatId}
            onSaveChat={handleSaveChat}
          />
        </div>
      </div>
    </div>
  );
}