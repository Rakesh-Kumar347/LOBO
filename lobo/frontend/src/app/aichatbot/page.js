"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, Send, Edit2, ChevronLeft, ChevronRight, X, Copy } from "lucide-react";

export default function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [inputText, setInputText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [responseHistory, setResponseHistory] = useState({});
  const [responseIndex, setResponseIndex] = useState({});
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      const minHeight = 40;
      const maxHeight = 160;
      inputRef.current.style.height = `${minHeight}px`;
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [inputText]);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedText(messages[index]?.content || "");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedText("");
  };

  const sendMessage = async (messageText, isEdited = false, index = null) => {
    if (!messageText.trim()) return;
    let updatedMessages = [...messages];
    if (isEdited && index !== null) {
      updatedMessages[index] = { role: "user", content: messageText };
      setMessages(updatedMessages);
      try {
        const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText }),
        });
        if (!response.ok) throw new Error("Failed to get response");
        const data = await response.json();
        const previousResponse = updatedMessages[index + 1]?.content;
        if (previousResponse) {
          setResponseHistory((prev) => ({
            ...prev,
            [index]: [...(prev[index] || []), previousResponse],
          }));
        }
        setMessages((prev) => [
          ...prev.slice(0, index + 1),
          { role: "assistant", content: data.response },
          ...prev.slice(index + 2),
        ]);
        setResponseIndex((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
      } catch (error) {
        console.error(error);
      }
    } else {
      updatedMessages.push({ role: "user", content: messageText });
      setMessages(updatedMessages);
      try {
        const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText }),
        });
        if (!response.ok) throw new Error("Failed to get response");
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } catch (error) {
        console.error(error);
      }
    }
    setInputText("");
    setEditingIndex(null);
    setEditedText("");
  };

  const handlePreviousResponse = (index) => {
    setResponseIndex((prev) => ({
      ...prev,
      [index]: Math.max(0, (prev[index] || 0) - 1),
    }));
  };

  const handleNextResponse = (index) => {
    const historyLength = responseHistory[index]?.length || 0;
    setResponseIndex((prev) => ({
      ...prev,
      [index]: Math.min(historyLength, (prev[index] || 0) + 1),
    }));
  };

  const parseResponse = (response) => {
    const regex = /(```([\w-]*)[\s\S]*?```|`[^`]+`)/g;
    const parts = response.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith("```")) {
        const match = part.match(/```([\w-]*)/);
        const language = match ? match[1] || "plaintext" : "plaintext";
        const codeContent = part.slice(part.indexOf("\n") + 1, -3).trim();

        const copyToClipboard = () => {
          navigator.clipboard.writeText(codeContent).then(
            () => alert("Code copied to clipboard!"),
            () => alert("Failed to copy code.")
          );
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
    }).filter(Boolean);
  };

  const renderMessages = () => {
    return messages.map((msg, index) => {
      const currentResponseIndex = responseIndex[index - 1] || 0;
      const historyLength = responseHistory[index - 1]?.length || 0;

      const assistantResponse =
        msg.role === "assistant" && responseHistory[index - 1]
          ? currentResponseIndex === historyLength
            ? msg.content
            : responseHistory[index - 1][currentResponseIndex]
          : msg.content;

      return (
        <div key={index} className={`flex flex-col mb-6 ${msg.role === "user" ? "items-end" : "items-start"}`}>
          <div className="flex items-center w-full justify-end">
            {msg.role === "user" && (
              <button
                onClick={() => handleEdit(index)}
                className="mr-2 text-yellow-500 hover:text-yellow-700 transition"
              >
                <Edit2 size={18} />
              </button>
            )}
            {editingIndex === index ? (
              <div className="flex items-center gap-2">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="p-3 rounded-md border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none min-h-[40px] max-h-[160px]"
                  style={{ width: '300px' }}
                  autoFocus
                />
                <button
                  onClick={() => sendMessage(editedText, true, index)}
                  className="p-3 bg-purple-700 text-white rounded-full"
                >
                  <Send size={20} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-3 bg-gray-500 text-white rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {msg.role === "user" && (
                  <div
                    className="bg-purple-700 text-white rounded-lg p-2 max-w-[700px]"
                    style={{ minHeight: '40px' }}
                  >
                    {parseResponse(assistantResponse)}
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className="text-gray-900 dark:text-white w-full">
                    {parseResponse(assistantResponse)}
                  </div>
                )}
              </div>
            )}
          </div>
          {msg.role === "assistant" && responseHistory[index - 1]?.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handlePreviousResponse(index - 1)}
                disabled={currentResponseIndex === 0}
                className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-500">
                {currentResponseIndex + 1}/{historyLength + 1}
              </span>
              <button
                onClick={() => handleNextResponse(index - 1)}
                disabled={currentResponseIndex === historyLength}
                className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 justify-center">
      {/* Sidebar */}
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

      {/* Main Chat Window */}
      <div className="flex flex-col flex-1 h-full max-w-[800px] mx-auto">
        <div className="flex-1 overflow-y-auto p-5 pt-[80px]">
          {renderMessages()}
          <div ref={chatEndRef} />
        </div>
        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputText)}
            className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white resize-none min-h-[40px] max-h-[160px]"
            placeholder="Type your message..."
          />
          <button
            onClick={() => sendMessage(inputText)}
            className="p-3 bg-purple-700 text-white rounded-full"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}