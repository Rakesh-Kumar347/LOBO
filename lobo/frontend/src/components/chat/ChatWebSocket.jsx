// File: lobo/frontend/src/components/chat/ChatWebSocket.jsx
// Converted from TypeScript to JavaScript

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthProvider';
import { toast } from 'react-toastify';

const ChatWebSocket = ({ chatId, onNewMessage, onUserTyping, onConnectionChange }) => {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  // Set up WebSocket connection
  useEffect(() => {
    if (!session?.access_token) {
      return;
    }
    
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socket = io(SOCKET_URL, {
      extraHeaders: {
        Authorization: `Bearer ${session.access_token}`
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    
    // Set up event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      if (onConnectionChange) onConnectionChange(true);
      console.log('WebSocket connected');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      if (onConnectionChange) onConnectionChange(false);
      console.log('WebSocket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat server');
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'Chat server error');
    });
    
    socket.on('new_message', (data) => {
      if (onNewMessage && data.chat_id === chatId) {
        onNewMessage(data.message);
      }
    });
    
    socket.on('user_typing', (data) => {
      if (onUserTyping && data.chat_id === chatId) {
        onUserTyping(data.user_id, data.is_typing);
      }
    });
    
    // Store socket reference
    socketRef.current = socket;
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [session?.access_token, onNewMessage, onUserTyping, onConnectionChange]);
  
  // Join chat room when chatId changes
  useEffect(() => {
    const socket = socketRef.current;
    
    if (socket && isConnected && chatId) {
      // Leave previous chat room if any
      socket.emit('leave_chat', { chat_id: chatId });
      
      // Join new chat room
      socket.emit('join_chat', { chat_id: chatId });
    }
    
    return () => {
      if (socket && isConnected && chatId) {
        socket.emit('leave_chat', { chat_id: chatId });
      }
    };
  }, [chatId, isConnected]);
  
  // Function to send a message
  const sendMessage = useCallback((message) => {
    const socket = socketRef.current;
    
    if (!socket || !isConnected || !chatId) {
      return false;
    }
    
    socket.emit('send_message', {
      chat_id: chatId,
      message
    });
    
    return true;
  }, [chatId, isConnected]);
  
  // Function to send typing status
  const sendTypingStatus = useCallback((isTyping) => {
    const socket = socketRef.current;
    
    if (!socket || !isConnected || !chatId) {
      return;
    }
    
    socket.emit('typing', {
      chat_id: chatId,
      is_typing: isTyping
    });
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // If typing, set timeout to automatically set typing to false after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        socket.emit('typing', {
          chat_id: chatId,
          is_typing: false
        });
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  }, [chatId, isConnected, typingTimeout]);
  
  return { isConnected, sendMessage, sendTypingStatus };
};

export default ChatWebSocket;