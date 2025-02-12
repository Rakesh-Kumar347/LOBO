"use client";

import { useState, useEffect, useRef } from "react";

export default function Chatbot() {
    // State to store messages
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Function to send message
    const sendMessage = async () => {
        if (!input.trim()) return; // Prevent empty messages

        const newMessage = { text: input, sender: "user", timestamp: new Date().toLocaleTimeString() };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/api/chatbot/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();
            const aiMessage = { text: data.response, sender: "bot", timestamp: new Date().toLocaleTimeString() };

            setMessages((prevMessages) => [...prevMessages, aiMessage]);
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages((prevMessages) => [...prevMessages, { text: "Error: Unable to fetch response", sender: "bot" }]);
        } finally {
            setLoading(false);
        }
    };

    // Scroll to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Chat Header */}
            <div className="bg-blue-600 text-white text-center py-4 text-lg font-semibold">
                LOBO AI Chatbot
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                                msg.sender === "user"
                                    ? "bg-blue-500 text-white self-end"
                                    : "bg-gray-200 text-gray-800 self-start"
                            }`}
                        >
                            <p>{msg.text}</p>
                            <span className="text-xs text-gray-600 block text-right">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white flex items-center border-t">
                <input
                    type="text"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    disabled={loading}
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}
