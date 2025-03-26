// File: src/components/ui/ChatMessage.jsx

import React, { useState } from 'react';
import { Edit, Copy, ChevronLeft, ChevronRight, RefreshCw, Trash, Paperclip } from 'lucide-react';
import { Button } from './button';
import { parseMarkdown, parseUserMarkdown } from '@/lib/markdownParser';
import { toast } from 'react-toastify';

const ChatMessage = ({
  message,
  index,
  isEditing,
  isTyping,
  theme,
  editedText,
  setEditedText,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onRegenerate,
  onDelete,
  onNavigateAlternative,
  messageBranches,
  currentBranchIndex,
  regeneratedResponses,
  currentRegenIndex,
  assistantMessageIndex
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const isUser = message.role === 'user';
  const isAssistantTyping = !isUser && isTyping && assistantMessageIndex === index;
  const hasAttachment = !!message.attachment;
  
  // Get branch and regeneration navigation data
  const userInput = !isUser ? message.userInput : null;
  const regenResponses = userInput ? (regeneratedResponses[userInput] || [message.content]) : [message.content];
  const regenIndex = userInput ? (currentRegenIndex[userInput] !== undefined ? currentRegenIndex[userInput] : 0) : 0;
  const showRegenNav = regenResponses.length > 1;
  
  return (
    <div 
      className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
                  onClick={() => onCancel(index)}
                  aria-label="Cancel edit"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave(index, editedText)}
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
                    <span className="font-medium">{message.attachment.filename}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(message.attachment.file_size / 1024).toFixed(1)} KB • {message.attachment.mime_type}
                  </div>
                  {message.attachment.preview && (
                    <div className="mt-2 text-sm truncate max-h-20 overflow-hidden text-gray-700 dark:text-gray-300">
                      <div className="italic">Preview:</div>
                      {message.attachment.preview}
                    </div>
                  )}
                </div>
              )}
              
              {/* Message content */}
              <div className="message-content">
                {isUser 
                  ? parseUserMarkdown(message.content)
                  : parseMarkdown(message.content)}
                {isAssistantTyping && (
                  <span className="inline-block w-2 h-4 bg-gray-500 dark:bg-gray-300 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Message actions */}
        {(showActions || isEditing) && (
          <div className={`flex mt-2 text-xs space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => onCopy(message.content)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Copy message"
            >
              <Copy size={14} />
            </button>
            
            {isUser && (
              <>
                <button
                  onClick={() => onEdit(index)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Edit message"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Delete message"
                >
                  <Trash size={14} />
                </button>
                
                {/* Message branch navigation */}
                {messageBranches[index] && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onNavigateAlternative(index, -1, 'branch')}
                      disabled={(currentBranchIndex[index] || 0) === 0}
                      className="p-1 bg-gray-300 dark:bg-gray-600 rounded-full disabled:opacity-50"
                      aria-label="Previous branch"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => onNavigateAlternative(index, 1, 'branch')}
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
                  onClick={() => onRegenerate(index)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Regenerate response"
                >
                  <RefreshCw size={14} />
                </button>
                
                {/* Regenerated response navigation */}
                {showRegenNav && (
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => onNavigateAlternative(index, -1, 'regenerated')}
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
                      onClick={() => onNavigateAlternative(index, 1, 'regenerated')}
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
        )}
      </div>
    </div>
  );
};

export default ChatMessage;