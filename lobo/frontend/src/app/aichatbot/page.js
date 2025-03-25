"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, Send, Square, RefreshCw, Settings, LogIn, ChevronRight } from "lucide-react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import Link from "next/link";
import UserMenu from "@/components/ui/UserMenu";
import ChatOrganizer from "@/components/ui/ChatOrganizer";
import ChatExportImport from "@/components/ui/ChatExportImport";
import ThemeSelector from "@/components/ui/ThemeSelector";
import VoiceRecorder from "@/components/ui/VoiceRecorder";
import KeyboardShortcuts from "@/components/ui/KeyboardShortcuts";
import SuggestedQuestions from "@/components/ui/SuggestedQuestions";
import { parseMarkdown, parseUserMarkdown } from "@/lib/markdownParser";
import { getThemeById } from "@/lib/themes";
import { enhancedApiRequest } from "@/lib/apiErrorHandler";

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export default function AIChatbot() {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [inputText, setInputText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [fullResponseText, setFullResponseText] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(20);
  const [assistantMessageIndex, setAssistantMessageIndex] = useState(null);
  const [currentBranchIndex, setCurrentBranchIndex] = useState({});
  const [messageBranches, setMessageBranches] = useState({});
  const [regeneratedResponses, setRegeneratedResponses] = useState({});
  const [currentRegenIndex, setCurrentRegenIndex] = useState({});
  const [responseBranches, setResponseBranches] = useState({});
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("default");

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // API request function with authentication
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const url = `${API_URL}${endpoint}`;
      
      // Add authentication if user is logged in
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
      
      return response;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    // Load saved chats if user is logged in
    if (session?.user) {
      loadSavedChats();
    }
  }, [session]);

  const loadSavedChats = async () => {
    try {
      const response = await apiRequest("/chats", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setSavedChats(data.data?.chats || []);
      }
    } catch (error) {
      console.error("Failed to load saved chats:", error);
    }
  };

  const saveCurrentChat = async (category = "General") => {
    if (!session?.user || messages.length === 0) return;
    
    try {
      const title = messages.find(m => m.role === "user")?.content.slice(0, 50) + "...";
      const chatData = {
        id: currentChatId,
        title,
        messages,
        category, // Add category
        updated_at: new Date().toISOString()
      };
      
      const method = currentChatId ? "PUT" : "POST";
      const url = currentChatId ? `/chats/${currentChatId}` : "/chats";
      
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(chatData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!currentChatId && data.data?.chat_id) {
          setCurrentChatId(data.data.chat_id);
        }
        await loadSavedChats();
        toast.success("Chat saved successfully!");
        window.screenReaderAnnouncer?.polite("Chat saved successfully");
      }
    } catch (error) {
      console.error("Failed to save chat:", error);
      toast.error("Failed to save chat.");
    }
  };

  const loadChatById = async (chatId) => {
    try {
      const response = await apiRequest(`/chats/${chatId}`, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data?.messages || []);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
      toast.error("Failed to load chat.");
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setMessageBranches({});
    setRegeneratedResponses({});
    setCurrentRegenIndex({});
    setResponseBranches({});
    window.screenReaderAnnouncer?.polite("New chat created");
  };
  
  const handleImportChat = (importedMessages) => {
    setMessages(importedMessages);
    setCurrentChatId(null);
    setMessageBranches({});
    setRegeneratedResponses({});
    setCurrentRegenIndex({});
    setResponseBranches({});
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      const minHeight = 40;
      const maxHeight = 160;
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTypingText]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  useEffect(() => {
    if (isTyping && fullResponseText && assistantMessageIndex !== null) {
      if (currentTypingText.length < fullResponseText.length) {
        const timeout = setTimeout(() => {
          const nextText = fullResponseText.slice(0, currentTypingText.length + 1);
          setCurrentTypingText(nextText);
          setMessages(prev => {
            const updated = [...prev];
            updated[assistantMessageIndex] = { role: "assistant", content: nextText };
            return updated;
          });
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantMessageIndex] = { role: "assistant", content: fullResponseText };
          return updated;
        });
        
        // Use previous index to track which user message this is responding to
        const userMessageIndex = assistantMessageIndex - 1;
        if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === "user") {
          const userInput = messages[userMessageIndex].content;
          
          setRegeneratedResponses(prev => {
            const existingResponses = prev[userInput] || [];
            const newResponses = [...existingResponses, fullResponseText];
            return {
              ...prev,
              [userInput]: newResponses
            };
          });
          
          setCurrentRegenIndex(prev => ({
            ...prev,
            [userInput]: (prev[userInput] !== undefined ? prev[userInput] : -1) + 1
          }));
        }
        
        setFullResponseText("");
        setCurrentTypingText("");
        setAssistantMessageIndex(null);
        
        // Auto-save chat after response is complete (if user is logged in)
        if (session?.user) {
          saveCurrentChat();
        }
      }
    }
  }, [isTyping, fullResponseText, currentTypingText, typingSpeed, assistantMessageIndex, messages]);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedText(messages[index]?.content || "");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedText("");
  };

  const stopResponseGeneration = () => {
    setIsTyping(false);
    if (currentTypingText && assistantMessageIndex !== null) {
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = { role: "assistant", content: currentTypingText };
        return updated;
      });
    }
    setFullResponseText("");
    setCurrentTypingText("");
    setAssistantMessageIndex(null);
    window.screenReaderAnnouncer?.polite("Response generation stopped");
  };

  const navigateBranch = (index, direction) => {
    const branches = messageBranches[index] || [];
    const currentIndex = currentBranchIndex[index] || 0;
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < branches.length) {
      const newBranches = [...branches];
      newBranches[currentIndex] = messages.slice(index);

      setMessageBranches(prev => ({
        ...prev,
        [index]: newBranches
      }));

      setMessages(prev => [...prev.slice(0, index), ...branches[newIndex]]);
      setCurrentBranchIndex(prev => ({
        ...prev,
        [index]: newIndex
      }));
    }
  };
  
  const handleSuggestedQuestion = (question) => {
    setInputText(question);
    setTimeout(() => {
      adjustTextareaHeight();
      inputRef.current?.focus();
    }, 0);
    
    // Announce to screen readers
    window.screenReaderAnnouncer?.polite("Selected question: " + question);
  };

  const sendMessage = async (messageText, isEdited = false, index = null) => {
    if (!messageText.trim()) return;
    if (isTyping) return;

    let updatedMessages = [...messages];
    let branchIndex = index;

    if (isEdited && index !== null) {
      const branchKey = index;
      const newBranch = updatedMessages.slice(index);
      const currentIndex = currentBranchIndex[branchKey] || 0;

      setMessageBranches(prev => ({
        ...prev,
        [branchKey]: [
          ...(prev[branchKey] || []).slice(0, currentIndex + 1),
          newBranch,
          ...(prev[branchKey] || []).slice(currentIndex + 1)
        ]
      }));

      setCurrentBranchIndex(prev => ({
        ...prev,
        [branchKey]: currentIndex + 1
      }));

      updatedMessages[index] = {
        ...updatedMessages[index],
        content: messageText,
        isBranchPoint: true
      };

      updatedMessages = updatedMessages.slice(0, index + 1);
      branchIndex = index;
    } else {
      const lastAssistantIndex = updatedMessages.length - 1;
      if (updatedMessages.length > 1 && updatedMessages[lastAssistantIndex]?.role === "assistant") {
        const userInput = updatedMessages[lastAssistantIndex - 1].content;
        const regenIndex = currentRegenIndex[userInput] || 0;
        const branchKey = `${userInput}-${regenIndex}`;
        
        updatedMessages.push({ role: "user", content: messageText });
        setResponseBranches(prev => ({
          ...prev,
          [branchKey]: [...(prev[branchKey] || []), { role: "user", content: messageText }]
        }));
      } else {
        updatedMessages.push({ role: "user", content: messageText });
      }
      branchIndex = updatedMessages.length - 1;
    }

    setMessages(updatedMessages);

    try {
      setIsTyping(true);
      setInputText("");
      setTimeout(() => adjustTextareaHeight(), 0);

      const assistantMessage = { role: "assistant", content: "" };
      const newMessages = [...updatedMessages, assistantMessage];
      setAssistantMessageIndex(newMessages.length - 1);
      setMessages(newMessages);

      const response = await apiRequest("/chatbot/", {
        method: "POST",
        body: JSON.stringify({ 
          message: messageText,
          chat_id: currentChatId
        })
      });
      
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      setFullResponseText(data.response || data.data?.response || "No response received.");
      setCurrentTypingText("");
      
      if (isEdited) {
        window.screenReaderAnnouncer?.polite("Message edited and sent");
      } else {
        window.screenReaderAnnouncer?.polite("Message sent");
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't process your request at the moment."
        };
        return updated;
      });
      setAssistantMessageIndex(null);
    }

    setEditingIndex(null);
    setEditedText("");
  };

  const regenerateResponse = async (index) => {
    if (isTyping) return;

    const userMessageIndex = index - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== "user") return;

    const userMessage = messages[userMessageIndex].content;

    try {
      setIsTyping(true);
      setMessages(prev => {
        const updated = [...prev];
        updated[index] = { role: "assistant", content: "" };
        return updated;
      });
      setAssistantMessageIndex(index);
      setCurrentTypingText("");

      const response = await apiRequest("/chatbot/", {
        method: "POST",
        body: JSON.stringify({ 
          message: userMessage,
          regenerate: true,
          chat_id: currentChatId
        })
      });
      
      if (!response.ok) throw new Error("Failed to regenerate response");
      const data = await response.json();
      
      setFullResponseText(data.response || data.data?.response || "No response received.");
      window.screenReaderAnnouncer?.polite("Regenerating response");
      
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[index] = {
          role: "assistant",
          content: "Sorry, I couldn't regenerate the response at the moment."
        };
        return updated;
      });
      setAssistantMessageIndex(null);
    }
  };

  const navigateRegeneratedResponse = (index, direction) => {
    const userMessageIndex = index - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== "user") return;

    const userInput = messages[userMessageIndex].content;
    if (!userInput) return;

    const responses = regeneratedResponses[userInput] || [messages[index].content];
    const currentIndex = currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : 0;
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < responses.length) {
      // Save the current branch before switching
      const currentBranchKey = `${userInput}-${currentIndex}`;
      const subsequentMessages = messages.slice(index + 1);
      if (subsequentMessages.length > 0) {
        setResponseBranches(prev => ({
          ...prev,
          [currentBranchKey]: subsequentMessages
        }));
      }

      // Restore the new branch
      const newBranchKey = `${userInput}-${newIndex}`;
      const newBranchMessages = responseBranches[newBranchKey] || [];

      setMessages(prev => {
        const updated = [...prev];
        updated[index] = { role: "assistant", content: responses[newIndex] };
        return [...updated.slice(0, index + 1), ...newBranchMessages];
      });

      setCurrentRegenIndex(prev => ({
        ...prev,
        [userInput]: newIndex
      }));
    }
  };

  // Define keyboard shortcuts
  const keyboardShortcuts = [
    {
      key: 'n',
      ctrl: true,
      description: 'New chat',
      action: createNewChat
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save chat',
      action: saveCurrentChat
    },
    {
      key: '/',
      ctrl: true,
      description: 'Focus chat input',
      action: () => inputRef.current?.focus()
    },
    {
      key: 'Escape',
      description: 'Stop generating',
      action: () => {
        if (isTyping) {
          stopResponseGeneration();
        }
      }
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Toggle sidebar',
      action: () => setSidebarOpen(prev => !prev)
    },
    {
      key: 't',
      ctrl: true,
      description: 'Toggle dark mode',
      action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', !isDark);
        localStorage.setItem("theme", isDark ? "light" : "dark");
      }
    }
  ];

  const renderMessages = () => {
    // Get current theme styles
    const theme = getThemeById(currentTheme);
    
    return messages.map((msg, index) => {
      const displayContent =
        msg.role === "assistant" && isTyping && assistantMessageIndex === index
          ? currentTypingText
          : msg.content;

      // For assistant messages, check if they have regenerated alternatives
      let showRegenNav = false;
      let regenResponses = [];
      let regenIndex = 0;

      if (msg.role === "assistant" && index > 0 && messages[index - 1]?.role === "user") {
        const userInput = messages[index - 1].content;
        regenResponses = regeneratedResponses[userInput] || [];
        regenIndex = currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : 0;
        showRegenNav = regenResponses.length > 1;
      }

      return (
        <div key={index} className={`flex flex-col mb-6 ${msg.role === "user" ? "items-end" : "items-start"}`}>
          <div className={`w-full ${msg.role === "user" ? "text-right" : "text-left"}`}>
            {editingIndex === index ? (
              <div className="flex flex-col items-end gap-2">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="p-3 rounded-md border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none w-full"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => sendMessage(editedText, true, index)}
                    className="px-4 py-2 bg-purple-700 text-white rounded-md"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {msg.role === "user" && (
                  <div className={`${theme.userBubble} rounded-lg p-2 max-w-[700px] inline-block`}>
                    {parseUserMarkdown(msg.content)}
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className={`${theme.botBubble} rounded-lg p-2 max-w-[700px] inline-block`}>
                    {parseMarkdown(displayContent)}
                    {msg.role === "assistant" && isTyping && assistantMessageIndex === index && (
                      <span className="inline-block w-2 h-4 bg-gray-500 animate-blink ml-1"></span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {msg.role === "user" && !editingIndex && (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => handleEdit(index)}
                className="text-yellow-500 hover:text-yellow-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content)
                    .then(() => {
                      toast.success("Message copied to clipboard!", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    })
                    .catch(() => {
                      toast.error("Failed to copy message.", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    });
                }}
                className="text-blue-500 hover:text-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              {messageBranches[index] && (
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateBranch(index, -1)}
                    disabled={(currentBranchIndex[index] || 0) === 0}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateBranch(index, 1)}
                    disabled={(currentBranchIndex[index] || 0) === (messageBranches[index]?.length || 0) - 1}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {msg.role === "assistant" && !(isTyping && assistantMessageIndex === index) && (
            <div className="flex justify-start gap-2 mt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content)
                    .then(() => {
                      toast.success("Message copied to clipboard!", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    })
                    .catch(() => {
                      toast.error("Failed to copy message.", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    });
                }}
                className="text-blue-500 hover:text-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button
                onClick={() => regenerateResponse(index)}
                className="text-green-500 hover:text-green-700 transition"
                title="Regenerate response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
              {showRegenNav && (
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateRegeneratedResponse(index, -1)}
                    disabled={regenIndex === 0}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateRegeneratedResponse(index, 1)}
                    disabled={regenIndex === regenResponses.length - 1}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Custom Navbar */}
      <div className="w-full h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50">
        <div className="flex items-center">
          <h1 className="font-bold text-xl ml-2">LOBO Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <KeyboardShortcuts shortcuts={keyboardShortcuts} />
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings size={20} />
          </button>
          <DarkModeToggle />
          {session?.user ? (
            <UserMenu />
          ) : (
            <Link href="/signin">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className={`absolute top-0 left-0 h-full bg-white dark:bg-gray-800 w-64 p-5 transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-64"
          } z-40 shadow-lg`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Chat Options</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-purple-700 text-white rounded-md"
              >
                <Menu size={18} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {showSettings ? (
            <div className="space-y-4 my-4">
              <h3 className="font-medium text-lg">Settings</h3>
              <div className="p-2">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dark Mode</span>
                    <DarkModeToggle />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">Chat Theme</span>
                    <ThemeSelector onThemeChange={(themeId) => setCurrentTheme(themeId)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm mb-1">Typing Speed</label>
                    <select
                      value={typingSpeed}
                      onChange={(e) => setTypingSpeed(Number(e.target.value))}
                      className="p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    >
                      <option value={5}>Fast</option>
                      <option value={20}>Normal</option>
                      <option value={50}>Slow</option>
                    </select>
                  </div>
                  
                  {/* Chat Export/Import */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Chat Data</h4>
                    <ChatExportImport
                      messages={messages}
                      onImport={handleImportChat}
                    />
                  </div>
                  
                  {!session?.user && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="block text-sm mb-2">Sign in to save chats</span>
                      <Link href="/signin">
                        <Button 
                          className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                        >
                          <LogIn size={16} className="mr-2" />
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ChatOrganizer
              savedChats={savedChats}
              onChatSelect={loadChatById}
              onCreateNewChat={createNewChat}
              currentChatId={currentChatId}
              onSaveCategory={async (chatId, category) => {
                try {
                  const response = await apiRequest(`/chats/${chatId}`, {
                    method: "PUT",
                    body: JSON.stringify({ category })
                  });
                  
                  if (response.ok) {
                    toast.success("Chat category updated!");
                    await loadSavedChats(); // Refresh chat list
                  }
                } catch (error) {
                  console.error("Failed to update category:", error);
                  toast.error("Failed to update category");
                }
              }}
            />
          )}
        </aside>

        {/* Show sidebar button when sidebar is hidden */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 p-2 bg-purple-700 text-white rounded-md shadow-md z-30"
            title="Show sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className={`flex flex-col flex-1 h-full max-w-[800px] mx-auto ${getThemeById(currentTheme).backgroundColor}`}>
          <div className="flex-1 overflow-y-auto p-5 pt-5">
            {renderMessages()}
            
            {/* Only show suggestions when not typing and there are messages */}
            {!isTyping && messages.length > 0 && (
              <SuggestedQuestions
                messages={messages}
                onSelectQuestion={handleSuggestedQuestion}
              />
            )}
            
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white resize-none min-h-[40px] max-h-[160px]"
              placeholder="Type your message..."
              disabled={isTyping}
            />
            <VoiceRecorder 
              onTranscription={(text) => {
                setInputText(text);
                adjustTextareaHeight();
              }}
              disabled={isTyping}
            />
            {isTyping ? (
              <button
                onClick={stopResponseGeneration}
                className="p-3 bg-red-600 text-white rounded-full"
                title="Stop generating"
              >
                <Square size={20} />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(inputText)}
                className="p-3 bg-purple-700 text-white rounded-full"
                disabled={!inputText.trim()}
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}