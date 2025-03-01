"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, Send, Edit2, ChevronLeft, ChevronRight, X, Copy, Square, RefreshCw } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AIChatbot() {
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
  const [regeneratedResponses, setRegeneratedResponses] = useState({}); // { userInputContent: [response1, response2, ...] }
  const [currentRegenIndex, setCurrentRegenIndex] = useState({}); // { userInputContent: currentIndex }
  const [responseBranches, setResponseBranches] = useState({}); // { userInputContent-responseIndex: [subsequentMessages] }

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

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
        const userInput = messages[assistantMessageIndex - 1]?.content;
        if (userInput) {
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

      const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      setFullResponseText(data.response);
      setCurrentTypingText("");
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

      const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          regenerate: true 
        }),
      });
      
      if (!response.ok) throw new Error("Failed to regenerate response");
      const data = await response.json();
      
      setFullResponseText(data.response);
      
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
    const userInput = messages[index - 1]?.content;
    if (!userInput) return;

    const responses = regeneratedResponses[userInput] || [messages[index].content];
    const currentIndex = currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : responses.length - 1;
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

  const parseResponse = (response) => {
    if (typeof response !== "string") return null;

    const regex = /(```([\w-]*)[\s\S]*?```|`[^`]+`)/g;
    const parts = response.split(regex);

    return parts
      .map((part, i) => {
        if (!part) return null;

        if (part.startsWith("```")) {
          const match = part.match(/```([\w-]*)/);
          const language = match ? match[1] || "plaintext" : "plaintext";
          const codeContent = part.slice(part.indexOf("\n") + 1, -3).trim();

          const copyToClipboard = () => {
            navigator.clipboard.writeText(codeContent)
              .then(() => {
                toast.success("Code copied to clipboard!", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true
                });
              })
              .catch(() => {
                toast.error("Failed to copy code.", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true
                });
              });
          };

          return (
            <div key={i} className="relative w-full mt-4">
              <div className="flex justify-between items-center bg-gray-700 text-white text-sm font-mono px-3 py-1 rounded-t-md">
                <span>{language}</span>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-gray-200 transition"
                >
                  <Copy size={16} />
                </button>
              </div>
              <pre className="bg-gray-800 text-white p-3 rounded-b-md overflow-auto">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        } else if (part.startsWith("`") && part.endsWith("`")) {
          const codeContent = part.slice(1, -1).trim();
          return (
            <code key={i} className="bg-gray-700 text-white px-1 py-0.5 rounded">
              {codeContent}
            </code>
          );
        } else {
          return <p key={i} className="mb-4">{part}</p>;
        }
      })
      .filter(Boolean);
  };

  const renderMessages = () => {
    return messages.map((msg, index) => {
      const displayContent =
        msg.role === "assistant" && isTyping && assistantMessageIndex === index
          ? currentTypingText
          : msg.content;

      const userInput = msg.role === "assistant" ? messages[index - 1]?.content : null;
      const regenResponses = userInput ? (regeneratedResponses[userInput] || [msg.content]) : [msg.content];
      const regenIndex = userInput ? (currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : 0) : 0;

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
                  <div className="bg-purple-700 text-white rounded-lg p-2 max-w-[700px] inline-block">
                    {parseResponse(msg.content)}
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className="text-gray-900 dark:text-white max-w-[700px] inline-block">
                    {parseResponse(displayContent)}
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
                <Edit2 size={18} />
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
                <Copy size={18} />
              </button>
              {messageBranches[index] && (
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateBranch(index, -1)}
                    disabled={(currentBranchIndex[index] || 0) === 0}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => navigateBranch(index, 1)}
                    disabled={(currentBranchIndex[index] || 0) === (messageBranches[index]?.length || 0) - 1}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
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
                <Copy size={18} />
              </button>
              <button
                onClick={() => regenerateResponse(index)}
                className="text-green-500 hover:text-green-700 transition"
                title="Regenerate response"
              >
                <RefreshCw size={18} />
              </button>
              {regenResponses.length > 1 && (
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateRegeneratedResponse(index, -1)}
                    disabled={regenIndex === 0}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => navigateRegeneratedResponse(index, 1)}
                    disabled={regenIndex === regenResponses.length - 1}
                    className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 justify-center">
      <ToastContainer />
      <aside
        className={`fixed top-[72px] left-0 h-[calc(100vh-72px)] bg-white dark:bg-gray-800 w-64 p-5 pt-8 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        <h2 className="text-xl font-bold mb-4 mt-4">Chat Options</h2>
        <ul className="mt-4 space-y-3">
          <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded cursor-pointer">
            New Chat
          </li>
          <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded cursor-pointer">
            Saved Chats
          </li>
          <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded cursor-pointer">
            Settings
          </li>
        </ul>
      </aside>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[80px] left-4 p-2 bg-purple-700 text-white rounded-md shadow-md"
      >
        <Menu size={20} />
      </button>

      <div className="flex flex-col flex-1 h-full max-w-[800px] mx-auto">
        <div className="flex-1 overflow-y-auto p-5 pt-[80px]">
          {renderMessages()}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 flex items-center gap-2">
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
  );
}