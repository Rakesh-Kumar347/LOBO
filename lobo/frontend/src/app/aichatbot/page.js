"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Send, Edit2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [inputText, setInputText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [responseHistory, setResponseHistory] = useState({});
  const [responseIndex, setResponseIndex] = useState({});
  const [responseToEditedMessage, setResponseToEditedMessage] = useState({});
  const [subsequentMessages, setSubsequentMessages] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText, isEdited = false, index = null) => {
    if (!messageText.trim()) return;
    let updatedMessages = [...messages];

    if (isEdited && index !== null) {
      // Save the current response and subsequent messages
      const currentResponse = updatedMessages[index + 1]?.content;
      const afterResponse = updatedMessages.slice(index + 2);
      
      if (currentResponse) {
        // Save current response to history
        const newHistory = [...(responseHistory[index] || []), currentResponse];
        setResponseHistory((prev) => ({
          ...prev,
          [index]: newHistory
        }));
        
        // Save subsequent messages for this response version
        setSubsequentMessages((prev) => ({
          ...prev,
          [`${index}-${newHistory.length - 1}`]: afterResponse
        }));
      }

      const beforeEdit = updatedMessages.slice(0, index);
      updatedMessages = [
        ...beforeEdit,
        { role: "user", content: messageText },
        ...afterResponse
      ];
    } else {
      updatedMessages.push({ role: "user", content: messageText });
    }

    setMessages(updatedMessages);
    setInputText("");
    setEditingIndex(null);
    setEditedText("");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      if (isEdited && index !== null) {
        setMessages((prevMessages) => {
          const beforeEdit = prevMessages.slice(0, index + 1);
          const afterEdit = prevMessages.slice(index + 1);
          return [
            ...beforeEdit,
            { role: "assistant", content: data.response },
            ...afterEdit
          ];
        });
        setResponseToEditedMessage((prev) => ({
          ...prev,
          [index + 1]: true,
        }));
        setResponseIndex((prev) => ({
          ...prev,
          [index]: 0,
        }));
        // Initialize subsequent messages for the new response
        setSubsequentMessages((prev) => ({
          ...prev,
          [`${index}-0`]: []
        }));
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedText(messages[index]?.content || "");
  };

  const handleCancelEdit = () => {
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
    setResponseIndex((prev) => ({
      ...prev,
      [index]: Math.min(
        (responseHistory[index]?.length || 0),
        (prev[index] || 0) + 1
      ),
    }));
  };

  const renderMessages = () => {
    let renderedMessages = [];
    let skipUntilIndex = -1;

    messages.forEach((msg, index) => {
      // Skip messages that should be hidden
      if (index <= skipUntilIndex) return;

      const isEditedResponse = responseToEditedMessage[index];
      const currentResponseIndex = responseIndex[index - 1] || 0;
      
      // Get the appropriate response content
      const assistantResponse =
        msg.role === "assistant" && isEditedResponse
          ? responseHistory[index - 1]
            ? responseHistory[index - 1][currentResponseIndex] || msg.content
            : msg.content
          : msg.content;

      // Render the message
      renderedMessages.push(
        <div key={index}>
          <div
            className={`flex mb-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
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
                <input
                  type="text"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="p-3 rounded-lg border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  autoFocus
                />
                <button
                  onClick={() => sendMessage(editedText, true, index)}
                  className="p-3 bg-purple-700 text-white rounded-lg"
                >
                  <Send size={20} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-3 bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                className={`p-3 rounded-lg max-w-lg ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-900"
                }`}
              >
                {assistantResponse}
              </div>
            )}
          </div>
          {msg.role === "assistant" &&
            isEditedResponse &&
            responseHistory[index - 1]?.length > 0 && (
              <div className="flex items-center gap-2 mt-2 justify-start">
                <button
                  onClick={() => handlePreviousResponse(index - 1)}
                  disabled={responseIndex[index - 1] === 0}
                  className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-500">
                  {(responseIndex[index - 1] || 0) + 1}/
                  {(responseHistory[index - 1]?.length || 0) + 1}
                </span>
                <button
                  onClick={() => handleNextResponse(index - 1)}
                  disabled={
                    responseIndex[index - 1] === responseHistory[index - 1]?.length
                  }
                  className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
        </div>
      );

      // If this is an edited response, render the appropriate subsequent messages
      if (msg.role === "assistant" && isEditedResponse) {
        const subsequentKey = `${index - 1}-${currentResponseIndex}`;
        const subsequentMsgs = subsequentMessages[subsequentKey] || [];
        
        if (subsequentMsgs.length > 0) {
          subsequentMsgs.forEach((subMsg, subIndex) => {
            renderedMessages.push(
              <div key={`${index}-${subIndex}`}>
                <div
                  className={`flex mb-3 ${
                    subMsg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {subMsg.role === "user" && (
                    <button className="mr-2 text-yellow-500 hover:text-yellow-700 transition">
                      <Edit2 size={18} />
                    </button>
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-lg ${
                      subMsg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-300 text-gray-900"
                    }`}
                  >
                    {subMsg.content}
                  </div>
                </div>
              </div>
            );
          });
          // Skip these messages in the main loop
          skipUntilIndex = index + subsequentMsgs.length;
        }
      }
    });

    return renderedMessages;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-[72px] left-0 h-[calc(100vh-72px)] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-64 p-5 pt-8 transition-transform z-50 ${
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
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[80px] left-4 p-2 bg-purple-700 text-white rounded-md shadow-md z-50"
      >
        <Menu size={20} />
      </button>
      {/* Main Chat Window */}
      <div className="flex flex-col flex-1 h-full ml-[16rem]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 pt-[80px] relative z-10">
          {renderMessages()}
          <div ref={chatEndRef} />
        </div>
        {/* Message Input Box */}
        <div className="p-4 bg-white dark:bg-gray-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
            className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Type your message..."
          />
          <button
            onClick={() => sendMessage(inputText)}
            className="p-3 bg-purple-700 text-white rounded-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}