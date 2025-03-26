// File: src/components/chat/ChatUI.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Square, RefreshCw, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Mic, Copy, Edit, Trash, Download, Camera, Image, Paperclip,
  Loader2, MessageSquare, Info, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceRecorder from '@/components/ui/VoiceRecorder';
import SuggestedQuestions from '@/components/ui/SuggestedQuestions';
import { parseMarkdown, parseUserMarkdown } from '@/lib/markdownParser';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthProvider';
import ChatExportImport from '@/components/ui/ChatExportImport';
import ThemeSelector from '@/components/ui/ThemeSelector';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import { enhancedApiRequest } from '@/lib/apiErrorHandler';
import { getThemeById } from '@/lib/themes';
import { announcePolite } from '@/components/ui/ScreenReaderAnnouncer';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

const ChatUI = ({ onSaveChat = null, initialMessages = [], chatId = null }) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [fullResponseText, setFullResponseText] = useState('');
  const [assistantMessageIndex, setAssistantMessageIndex] = useState(null);
  const [typingSpeed, setTypingSpeed] = useState(20);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(!!chatId);
  const [regeneratedResponses, setRegeneratedResponses] = useState({});
  const [currentRegenIndex, setCurrentRegenIndex] = useState({});
  const [responseBranches, setResponseBranches] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [fileToAttach, setFileToAttach] = useState(null);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // New states for branch navigation
  const [currentBranchIndex, setCurrentBranchIndex] = useState({});
  const [messageBranches, setMessageBranches] = useState({});
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  
  // Load chat if chatId is provided
  useEffect(() => {
    if (chatId && session?.access_token) {
      const loadChat = async () => {
        try {
          setLoadingInitial(true);
          const response = await fetch(`${API_URL}/chats/${chatId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to load chat');
          }
          
          const data = await response.json();
          if (data.success && data.data) {
            setMessages(data.data.messages || []);
            setCurrentChatId(chatId);
            announcePolite('Chat loaded successfully');
          }
        } catch (error) {
          console.error('Error loading chat:', error);
          setError('Failed to load chat. Please try again later.');
          toast.error('Failed to load chat');
        } finally {
          setLoadingInitial(false);
        }
      };
      
      loadChat();
    } else {
      setLoadingInitial(false);
    }
  }, [chatId, session]);
  
  // Effect for simulating typing animation
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
        
        // Track regenerated responses for this user message
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
          saveChat();
        }

        // Announce to screen readers that the response is complete
        announcePolite('Response complete');
      }
    }
  }, [isTyping, fullResponseText, currentTypingText, typingSpeed, assistantMessageIndex, messages, session]);
  
  // Auto-scroll to bottom when messages change or typing
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTypingText, shouldAutoScroll]);
  
  // Monitor scroll position to determine when to show scroll-to-bottom button
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Show scroll button if not at bottom
      setShowScrollToBottom(!isAtBottom);
      
      // Enable auto-scroll only if user is at the bottom
      setShouldAutoScroll(isAtBottom);
      
      // Save last scroll position
      lastScrollPositionRef.current = scrollTop;
    };
    
    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to auto-resize text area
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      const minHeight = 40;
      const maxHeight = 160;
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, []);
  
  // Adjust textarea height when input text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldAutoScroll(true);
    }
  };
  
  // Save chat to backend
  const saveChat = async () => {
    if (!session?.access_token || messages.length === 0) return;
    
    try {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.slice(0, 50) + '...' || 'New Chat';
      
      const chatData = {
        title,
        messages,
        category: 'General'
      };
      
      const method = currentChatId ? 'PUT' : 'POST';
      const url = currentChatId ? `/chats/${currentChatId}` : '/chats';
      
      const response = await fetch(`${API_URL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(chatData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save chat');
      }
      
      const data = await response.json();
      
      if (!currentChatId && data.data?.chat_id) {
        setCurrentChatId(data.data.chat_id);
      }
      
      // Notify parent component if callback is provided
      if (onSaveChat) {
        onSaveChat(currentChatId || data.data?.chat_id);
      }
      
    } catch (error) {
      console.error('Failed to save chat:', error);
      // No need to show toast for routine auto-saves
    }
  };
  
  // Navigate between message branches
  const navigateBranch = (index, direction) => {
    const branches = messageBranches[index] || [];
    const currentIndex = currentBranchIndex[index] || 0;
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < branches.length) {
      // Save current branch before switching
      const newBranches = [...branches];
      newBranches[currentIndex] = messages.slice(index);

      setMessageBranches(prev => ({
        ...prev,
        [index]: newBranches
      }));

      // Apply the branch messages
      setMessages(prev => [...prev.slice(0, index), ...branches[newIndex]]);
      
      // Update current branch index
      setCurrentBranchIndex(prev => ({
        ...prev,
        [index]: newIndex
      }));
      
      announcePolite('Navigated to different message branch');
    }
  };
  
  // Navigate between regenerated responses
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
      
      announcePolite('Navigated to different AI response');
    }
  };
  
  // Handle sending message
  const sendMessage = async (messageText = inputText, isEdited = false, editIndex = null) => {
    if (!messageText.trim() || isTyping || isSending) return;
    
    setIsSending(true);
    
    try {
      // If editing existing message, handle branch creation
      let updatedMessages;
      
      if (isEdited && editIndex !== null) {
        // This is an edited message, create a new branch
        const branchKey = editIndex;
        const newBranch = [...messages.slice(editIndex)];
        const currentIndex = currentBranchIndex[branchKey] || 0;

        // Store the branch
        setMessageBranches(prev => ({
          ...prev,
          [branchKey]: [
            ...(prev[branchKey] || []).slice(0, currentIndex + 1),
            newBranch,
            ...(prev[branchKey] || []).slice(currentIndex + 1)
          ]
        }));

        // Update the current branch index
        setCurrentBranchIndex(prev => ({
          ...prev,
          [branchKey]: currentIndex + 1
        }));

        // Replace the message content and mark as branch point
        updatedMessages = [...messages];
        updatedMessages[editIndex] = {
          ...updatedMessages[editIndex],
          content: messageText,
          isBranchPoint: true
        };

        // Truncate messages at this point
        updatedMessages = updatedMessages.slice(0, editIndex + 1);
      } else {
        // Handle regular message or continuation of a regenerated response branch
        const lastAssistantIndex = messages.length - 1;
        
        if (messages.length > 1 && messages[lastAssistantIndex]?.role === "assistant") {
          // Getting the branch key from the last user message and current response variation
          const userInput = messages[lastAssistantIndex - 1].content;
          const regenIndex = currentRegenIndex[userInput] || 0;
          const branchKey = `${userInput}-${regenIndex}`;
          
          updatedMessages = [...messages, { role: "user", content: messageText }];
          
          // Store this message as part of the current response branch
          setResponseBranches(prev => ({
            ...prev,
            [branchKey]: [...(prev[branchKey] || []), { role: "user", content: messageText }]
          }));
        } else {
          // Regular message (not part of a branch)
          updatedMessages = [...messages, { role: "user", content: messageText }];
        }
      }
      
      setMessages(updatedMessages);
      setInputText('');
      adjustTextareaHeight();
      
      // Add placeholder for assistant response
      const assistantPlaceholder = { role: 'assistant', content: '' };
      const newMessages = [...updatedMessages, assistantPlaceholder];
      const assistantIndex = newMessages.length - 1;
      
      setMessages(newMessages);
      setAssistantMessageIndex(assistantIndex);
      setIsTyping(true);
      
      // Prepare request data
      const requestData = {
        message: messageText,
        chat_id: currentChatId,
        regenerate: false
      };
      
      // Send API request
      const response = await fetch(`${API_URL}/chatbot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Get AI response
      const aiResponse = data.response || data.data?.response || 'No response received.';
      
      // Start typing animation
      setFullResponseText(aiResponse);
      setCurrentTypingText('');
      
      // Reset editing state
      setEditingMessage(null);
      setEditedText('');
      
      // Save the chat (if authenticated)
      if (session?.user) {
        saveChat();
      }
      
      announcePolite('Message sent');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Handle error response
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I couldn\'t process your request at the moment. Please try again.'
        };
        return updated;
      });
      
      setAssistantMessageIndex(null);
      toast.error('Failed to get response');
      setError('Failed to get response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle regenerating a response
  const regenerateResponse = async (index) => {
    if (isTyping) return;
    
    const userMessageIndex = index - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== 'user') return;
    
    const userMessage = messages[userMessageIndex].content;
    
    try {
      setIsTyping(true);
      setMessages(prev => {
        const updated = [...prev];
        updated[index] = { role: 'assistant', content: '' };
        return updated;
      });
      setAssistantMessageIndex(index);
      setCurrentTypingText('');
      
      // Prepare request data
      const requestData = {
        message: userMessage,
        chat_id: currentChatId,
        regenerate: true
      };
      
      // Send API request
      const response = await fetch(`${API_URL}/chatbot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }
      
      const data = await response.json();
      
      // Get AI response
      const aiResponse = data.response || data.data?.response || 'No response received.';
      
      // Start typing animation
      setFullResponseText(aiResponse);
      
      announcePolite('Regenerating response');
      
    } catch (error) {
      console.error('Error regenerating response:', error);
      setIsTyping(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[index] = {
          role: 'assistant',
          content: 'Sorry, I couldn\'t regenerate the response at the moment.'
        };
        return updated;
      });
      setAssistantMessageIndex(null);
      toast.error('Failed to regenerate response');
    }
  };
  
  // Stop response generation
  const stopResponseGeneration = () => {
    setIsTyping(false);
    if (currentTypingText && assistantMessageIndex !== null) {
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = { role: "assistant", content: currentTypingText };
        return updated;
      });
    }
    setFullResponseText('');
    setCurrentTypingText('');
    setAssistantMessageIndex(null);
    announcePolite('Response generation stopped');
  };
  
  // Start editing a message
  const startEditing = (index) => {
    if (messages[index].role !== 'user') return;
    
    setEditingMessage(index);
    setEditedText(messages[index].content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setEditedText('');
  };
  
  // Save edited message
  const saveEdit = () => {
    if (editingMessage === null || !editedText.trim()) return;
    
    // Send the edited message
    sendMessage(editedText, true, editingMessage);
  };
  
  // Copy message to clipboard
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success('Copied to clipboard!');
        announcePolite('Message copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy message');
      });
  };
  
  // Delete message and its response
  const deleteMessages = (index) => {
    // Only allow deleting user messages
    if (messages[index].role !== 'user') return;
    
    // Confirm deletion
    if (window.confirm('Delete this message and its response?')) {
      const newMessages = [...messages];
      
      // If this is followed by an assistant message, delete that too
      if (index < messages.length - 1 && messages[index + 1].role === 'assistant') {
        newMessages.splice(index, 2);  // Delete both messages
      } else {
        newMessages.splice(index, 1);  // Delete just the user message
      }
      
      setMessages(newMessages);
      
      // Save the updated chat
      if (session?.user) {
        setTimeout(() => saveChat(), 100);
      }
      
      announcePolite('Message deleted');
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && editingMessage !== null) {
      cancelEditing();
    }
  };
  
  // Handle attachment file selection
  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToAttach(file);
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  // Handle attachment upload
  const uploadAttachment = async () => {
    if (!fileToAttach || !session?.access_token) return;
    
    setAttaching(true);
    setAttachmentProgress(10);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', fileToAttach);
      
      // Set up XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 90);
          setAttachmentProgress(progress);
        }
      };
      
      // Handle response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network Error'));
      });
      
      // Wait for upload to complete
      const response = await uploadPromise;
      
      // Set attachment progress to 100%
      setAttachmentProgress(100);
      
      // If successful, add file reference to the chat
      if (response.success && response.data) {
        const fileData = response.data;
        
        // Create message with file attachment
        const fileMessage = {
          role: 'user',
          content: `[Attachment: ${fileData.original_filename}]`,
          attachment: {
            file_id: fileData.file_id,
            filename: fileData.original_filename,
            mime_type: fileData.mime_type,
            file_size: fileData.file_size,
            preview: fileData.preview
          }
        };
        
        // Add message to chat
        setMessages(prev => [...prev, fileMessage]);
        setFileToAttach(null);
        
        // Automatically send a message to get AI to analyze the file
        const analysisPrompt = `I've attached a file named ${fileData.original_filename}. Can you analyze it for me?`;
        setInputText(analysisPrompt);
        
        // Small delay before sending the message
        setTimeout(() => {
          sendMessage(analysisPrompt);
        }, 500);
        
        toast.success('File uploaded successfully!');
        announcePolite('File uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      setError('Failed to upload file. Please try again.');
    } finally {
      setAttaching(false);
    }
  };
  
  // Cancel file attachment
  const cancelAttachment = () => {
    setFileToAttach(null);
  };
  
  // Handle suggested question selection
  const handleSuggestedQuestion = (question) => {
    setInputText(question);
    setTimeout(() => {
      adjustTextareaHeight();
      inputRef.current?.focus();
    }, 0);
    
    announcePolite(`Selected question: ${question}`);
  };
  
  // Theme for chat messages
  const theme = getThemeById(currentTheme);
  
  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="ml-2">Loading conversation...</span>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col h-full ${theme.backgroundColor} rounded-lg overflow-hidden`}>
      {/* Error display */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-white hover:bg-red-600 p-1 rounded"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Chat Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  aria-label="Close settings"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Chat Theme</label>
                  <ThemeSelector onThemeChange={(themeId) => setCurrentTheme(themeId)} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Typing Speed</label>
                  <select
                    value={typingSpeed}
                    onChange={(e) => setTypingSpeed(Number(e.target.value))}
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  >
                    <option value={5}>Fast</option>
                    <option value={20}>Normal</option>
                    <option value={50}>Slow</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Export/Import</label>
                  <ChatExportImport
                    messages={messages}
                    onImport={(importedMessages) => {
                      setMessages(importedMessages);
                      setCurrentChatId(null);
                      toast.success('Chat imported successfully');
                      announcePolite('Chat imported successfully');
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="w-16 h-16 text-gray-400 mb-3" />
            <h3 className="text-xl font-bold mb-2">Start a New Conversation</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Type a message below to start chatting with LOBO AI, your smart assistant for data & automation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                "What can you help me with?",
                "Give me a brief introduction to Python for data science",
                "Explain the differences between SQL and NoSQL databases",
                "How can I analyze a CSV file with pandas?"
              ].map((question, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => {
                   setInputText(question);
                   setTimeout(() => {
                     adjustTextareaHeight();
                     inputRef.current?.focus();
                   }, 0);
                 }}
               >
                 {question}
               </motion.button>
             ))}
           </div>
         </div>
       ) : (
         messages.map((msg, index) => {
           const isUser = msg.role === 'user';
           const isEditing = editingMessage === index;
           const isAssistantTyping = !isUser && isTyping && assistantMessageIndex === index;
           const hasAttachment = !!msg.attachment;
           
           // Get branch and regenerated response info
           const userInput = !isUser ? messages[index - 1]?.content : null;
           const regenResponses = userInput ? (regeneratedResponses[userInput] || [msg.content]) : [msg.content];
           const regenIndex = userInput ? (currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : 0) : 0;
           const showRegenNav = regenResponses.length > 1;
           
           return (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3 }}
               className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
             >
               <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
                 {/* Message bubble */}
                 <div 
                   className={`inline-block rounded-lg p-3 ${
                     isUser ? theme.userBubble : theme.botBubble
                   }`}
                 >
                   {isEditing ? (
                     // Editing mode
                     <div className="flex flex-col space-y-2">
                       <textarea
                         value={editedText}
                         onChange={(e) => setEditedText(e.target.value)}
                         className="p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[100px] w-full"
                         autoFocus
                       />
                       <div className="flex justify-end space-x-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={cancelEditing}
                           aria-label="Cancel edit"
                         >
                           Cancel
                         </Button>
                         <Button
                           size="sm"
                           onClick={saveEdit}
                           aria-label="Save edit"
                         >
                           Save
                         </Button>
                       </div>
                     </div>
                   ) : (
                     // Regular message display
                     <div>
                       {/* If message has an attachment */}
                       {hasAttachment && (
                         <div className="border rounded-md p-3 mb-3 bg-gray-50 dark:bg-gray-800">
                           <div className="flex items-center">
                             <Paperclip size={18} className="mr-2 text-gray-500" />
                             <span className="font-medium">{msg.attachment.filename}</span>
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             {(msg.attachment.file_size / 1024).toFixed(1)} KB • {msg.attachment.mime_type}
                           </div>
                           {msg.attachment.preview && (
                             <div className="mt-2 text-sm truncate max-h-20 overflow-hidden text-gray-700 dark:text-gray-300">
                               <div className="italic">Preview:</div>
                               {msg.attachment.preview}
                             </div>
                           )}
                         </div>
                       )}
                       
                       {/* Message content */}
                       <div className="message-content">
                         {isUser 
                           ? parseUserMarkdown(msg.content)
                           : parseMarkdown(msg.content)}
                         {isAssistantTyping && (
                           <span className="inline-block w-2 h-4 bg-gray-500 dark:bg-gray-300 animate-pulse ml-1"></span>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Message actions */}
                 <div className={`flex mt-2 text-xs space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                   <button
                     onClick={() => copyMessage(msg.content)}
                     className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                     aria-label="Copy message"
                   >
                     <Copy size={14} />
                   </button>
                   
                   {isUser && (
                     <>
                       <button
                         onClick={() => startEditing(index)}
                         className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                         aria-label="Edit message"
                       >
                         <Edit size={14} />
                       </button>
                       <button
                         onClick={() => deleteMessages(index)}
                         className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                         aria-label="Delete message"
                       >
                         <Trash size={14} />
                       </button>
                       
                       {/* Message branch navigation */}
                       {messageBranches[index] && (
                         <div className="flex gap-1">
                           <button
                             onClick={() => navigateBranch(index, -1)}
                             disabled={(currentBranchIndex[index] || 0) === 0}
                             className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                             aria-label="Previous branch"
                           >
                             <ChevronLeft size={14} />
                           </button>
                           <button
                             onClick={() => navigateBranch(index, 1)}
                             disabled={(currentBranchIndex[index] || 0) === (messageBranches[index]?.length || 0) - 1}
                             className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                             aria-label="Next branch"
                           >
                             <ChevronRight size={14} />
                           </button>
                         </div>
                       )}
                     </>
                   )}
                   
                   {!isUser && (
                     <>
                       <button
                         onClick={() => regenerateResponse(index)}
                         className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                         aria-label="Regenerate response"
                       >
                         <RefreshCw size={14} />
                       </button>
                       
                       {/* Regenerated response navigation */}
                       {showRegenNav && (
                         <div className="flex gap-1 items-center">
                           <button
                             onClick={() => navigateRegeneratedResponse(index, -1)}
                             disabled={regenIndex === 0}
                             className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                             aria-label="Previous response"
                           >
                             <ChevronLeft size={14} />
                           </button>
                           <span className="text-xs text-gray-500">
                             {regenIndex + 1}/{regenResponses.length}
                           </span>
                           <button
                             onClick={() => navigateRegeneratedResponse(index, 1)}
                             disabled={regenIndex === regenResponses.length - 1}
                             className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                             aria-label="Next response"
                           >
                             <ChevronRight size={14} />
                           </button>
                         </div>
                       )}
                     </>
                   )}
                 </div>
               </div>
             </motion.div>
           );
         })
       )}
       
       {/* Scroll target ref */}
       <div ref={messagesEndRef} />
       
       {/* Scroll to bottom button */}
       <AnimatePresence>
         {showScrollToBottom && (
           <motion.button
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
             className="fixed bottom-20 right-4 bg-purple-600 text-white rounded-full p-2 shadow-lg z-10"
             onClick={scrollToBottom}
             aria-label="Scroll to bottom"
           >
             <ChevronDown size={24} />
           </motion.button>
         )}
       </AnimatePresence>
       
       {/* Only show suggestions when not typing and there are messages */}
       {!isTyping && messages.length > 0 && (
         <SuggestedQuestions
           messages={messages}
           onSelectQuestion={handleSuggestedQuestion}
         />
       )}
     </div>
     
     {/* File upload progress */}
     {attaching && (
       <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-100 dark:border-blue-800">
         <div className="flex items-center justify-between">
           <div className="flex items-center">
             <Paperclip size={16} className="mr-2 text-blue-500" />
             <span className="text-sm">{fileToAttach?.name}</span>
           </div>
           <span className="text-xs">{attachmentProgress}%</span>
         </div>
         <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 mt-1 rounded-full overflow-hidden">
           <div 
             className="h-full bg-blue-500 rounded-full transition-all duration-300"
             style={{ width: `${attachmentProgress}%` }}
           ></div>
         </div>
       </div>
     )}
     
     {/* File attachment preview */}
     {fileToAttach && !attaching && (
       <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
         <div className="flex items-center justify-between">
           <div className="flex items-center">
             <Paperclip size={16} className="mr-2 text-gray-500" />
             <span className="text-sm font-medium">{fileToAttach.name}</span>
             <span className="text-xs text-gray-500 ml-2">
               ({(fileToAttach.size / 1024).toFixed(1)} KB)
             </span>
           </div>
           <div className="flex space-x-2">
             <Button
               size="sm"
               variant="outline"
               onClick={cancelAttachment}
               aria-label="Cancel attachment"
             >
               Cancel
             </Button>
             <Button
               size="sm"
               onClick={uploadAttachment}
               aria-label="Upload attachment"
             >
               Upload
             </Button>
           </div>
         </div>
       </div>
     )}
     
     {/* Input area */}
     <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
       <div className="flex items-center">
         <div className="flex-1 relative">
           <textarea
             ref={inputRef}
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={handleKeyDown}
             className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-700 resize-none min-h-[40px] max-h-[160px]"
             placeholder="Type your message..."
             disabled={isTyping || isSending || attaching}
             aria-label="Type your message"
           />
           <div className="absolute right-2 bottom-2 flex items-center">
             <button
               onClick={openFileDialog}
               disabled={isTyping || isSending || attaching || fileToAttach}
               className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
               aria-label="Attach file"
             >
               <Paperclip size={18} />
             </button>
             <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileSelection}
               className="hidden"
               accept=".pdf,.txt,.csv,.xlsx,.jpg,.jpeg,.png,.svg"
             />
           </div>
         </div>
         
         <div className="flex items-center ml-2">
           <VoiceRecorder 
             onTranscription={(text) => {
               setInputText(text);
               adjustTextareaHeight();
             }}
             disabled={isTyping || isSending || attaching}
           />
           
           <button
             onClick={() => setShowSettings(!showSettings)}
             className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-1"
             aria-label="Settings"
           >
             <Settings size={20} />
           </button>
           
           {isTyping ? (
             <Button
               onClick={stopResponseGeneration}
               className="ml-2 bg-red-600 hover:bg-red-700"
               aria-label="Stop generating"
             >
               <Square size={18} />
             </Button>
           ) : (
             <Button
               onClick={() => sendMessage()}
               className="ml-2"
               disabled={!inputText.trim() || isSending || attaching}
               aria-label="Send message"
             >
               {isSending ? (
                 <Loader2 size={18} className="animate-spin" />
               ) : (
                 <Send size={18} />
               )}
             </Button>
           )}
         </div>
       </div>
       
       {/* Message status */}
       {isSending && (
         <div className="text-xs text-gray-500 mt-1 text-right">
           Sending message...
         </div>
       )}
     </div>
   </div>
 );
};

export default ChatUI;