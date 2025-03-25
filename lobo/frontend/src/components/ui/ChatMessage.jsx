import React, { useState } from 'react';
import { Edit2, Copy, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from './button';

const ChatMessage = ({
  message,
  index,
  isEditing,
  isTyping,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onRegenerate,
  onNavigate,
  hasAlternatives,
  currentAlternative,
  totalAlternatives,
  editedContent,
  setEditedContent,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const parseCodeBlocks = (content) => {
    if (typeof content !== 'string') return content;
    
    const regex = /(```([\w-]*)[\s\S]*?```|`[^`]+`)/g;
    const parts = content.split(regex);
    
    return parts
      .map((part, i) => {
        if (!part) return null;
        
        if (part.startsWith('```')) {
          const match = part.match(/```([\w-]*)/);
          const language = match ? match[1] || 'plaintext' : 'plaintext';
          const code = part.slice(part.indexOf('\n') + 1, -3).trim();
          
          return (
            <div key={i} className="my-4 rounded-md overflow-hidden">
              <div className="flex justify-between items-center bg-gray-700 text-white px-3 py-1">
                <span className="text-sm">{language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success('Code copied!');
                  }}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <pre className="bg-gray-800 text-white p-3 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1);
          return (
            <code key={i} className="bg-gray-200 dark:bg-gray-700 px-1 rounded mx-1">
              {code}
            </code>
          );
        } else {
          return part.split('\n').map((line, j) => (
            <React.Fragment key={`${i}-${j}`}>
              {line}
              {j < part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));
        }
      })
      .filter(Boolean);
  };
  
  return (
    <div 
      className={`my-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className={`inline-block max-w-[70%] ${
        message.role === 'user' 
          ? 'bg-purple-700 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
        } rounded-lg px-4 py-3 shadow`}
      >
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 focus:outline-none focus:ring-2"
            rows={4}
            autoFocus
          />
        ) : (
          <div className="prose dark:prose-invert break-words">
            {parseCodeBlocks(message.content)}
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-gray-500 animate-pulse ml-1"></span>
            )}
          </div>
        )}
      </div>
      
      {/* Message actions */}
      {(showOptions || isEditing) && (
        <div className={`flex mt-2 text-xs ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {isEditing ? (
            <>
              <Button variant="primary" size="sm" onClick={onSave}>Save</Button>
              <Button variant="secondary" size="sm" onClick={onCancel} className="ml-2">Cancel</Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onCopy(message.content)}
                title="Copy message"
              >
                <Copy size={14} />
              </Button>
              
              {message.role === 'user' && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onEdit(index)}
                  title="Edit message"
                  className="ml-1"
                >
                  <Edit2 size={14} />
                </Button>
              )}
              
              {message.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onRegenerate(index)}
                  title="Regenerate response"
                  className="ml-1"
                >
                  <RefreshCw size={14} />
                </Button>
              )}
              
              {hasAlternatives && (
                <div className="flex items-center ml-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={currentAlternative === 0}
                    onClick={() => onNavigate(index, -1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="mx-1 text-xs text-gray-500">
                    {currentAlternative + 1}/{totalAlternatives}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={currentAlternative === totalAlternatives - 1}
                    onClick={() => onNavigate(index, 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;