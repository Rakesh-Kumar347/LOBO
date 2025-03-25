import React from 'react';
import { toast } from 'react-toastify';

/**
 * Parse markdown-like formatting in chat messages
 * Handles:
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Bold text (**bold**)
 * - Italic text (*italic*)
 * - Links ([text](url))
 * - Lists (- item or * item)
 */
export const parseMarkdown = (content) => {
  if (typeof content !== 'string') return content;

  // First extract code blocks to prevent other formatting from affecting them
  const codeBlockRegex = /(```([a-zA-Z0-9]*)\n?([\s\S]*?)```)/g;
  const inlineCodeRegex = /(`[^`]+`)/g;
  
  // Split by code blocks and inline code
  const parts = content.split(new RegExp(`${codeBlockRegex.source}|${inlineCodeRegex.source}`, 'g'));
  
  return parts
    .map((part, index) => {
      // Skip empty parts
      if (!part) return null;
      
      // Handle code blocks
      if (part.startsWith('```')) {
        const match = part.match(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/);
        if (match) {
          const language = match[1] || 'plaintext';
          const code = match[2]?.trim() || '';
          
          const copyToClipboard = () => {
            navigator.clipboard.writeText(code)
              .then(() => toast.success('Code copied to clipboard!'))
              .catch(() => toast.error('Failed to copy code'));
          };
          
          return (
            <div key={index} className="my-4 rounded-md overflow-hidden w-full">
              <div className="flex justify-between items-center bg-gray-700 text-white px-3 py-1">
                <span className="text-sm font-mono">{language}</span>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-300 hover:text-white"
                  aria-label="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <pre className="bg-gray-800 text-white p-3 overflow-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      
      // Handle inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={index} className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-mono text-sm">
            {code}
          </code>
        );
      }
      
      // For regular text, apply the remaining formatting
      const formattedText = part
        // Handle bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Handle italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Handle links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>')
        // Handle lists (convert to HTML lists)
        .replace(/^[\s]*[-*+][\s]+(.*?)(?=\n|$)/gm, '<li>$1</li>')
        // Handle headers
        .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold my-2">$1</h1>')
        .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold my-2">$1</h2>')
        .replace(/^### (.*?)$/gm, '<h3 class="text-md font-bold my-1">$1</h3>');
      
      // Check if we have list items and wrap them in <ul>
      if (formattedText.includes('<li>')) {
        const withLists = formattedText.replace(
          /(<li>.*?<\/li>[\n]*)+/g, 
          match => `<ul class="list-disc pl-5 my-2">${match}</ul>`
        );
        return <div key={index} dangerouslySetInnerHTML={{ __html: withLists }} />;
      }
      
      return <div key={index} dangerouslySetInnerHTML={{ __html: formattedText }} />;
    })
    .filter(Boolean);
};

/**
 * Simplified version of markdown parsing that's safe to use for user input
 */
export const parseUserMarkdown = (content) => {
  if (typeof content !== 'string') return content;
  
  // Only handle code blocks and inline code for user input
  const codeBlockRegex = /(```([a-zA-Z0-9]*)\n?([\s\S]*?)```)/g;
  const inlineCodeRegex = /(`[^`]+`)/g;
  
  const parts = content.split(new RegExp(`${codeBlockRegex.source}|${inlineCodeRegex.source}`, 'g'));
  
  return parts
    .map((part, index) => {
      if (!part) return null;
      
      if (part.startsWith('```')) {
        const match = part.match(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/);
        if (match) {
          const language = match[1] || 'plaintext';
          const code = match[2]?.trim() || '';
          
          return (
            <div key={index} className="my-2 rounded-md overflow-hidden text-left">
              <div className="bg-gray-600 text-white px-2 py-0.5 text-xs">
                {language}
              </div>
              <pre className="bg-gray-700 text-white p-2 overflow-auto text-sm">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={index} className="bg-gray-600 text-white px-1 py-0.5 rounded text-sm">
            {code}
          </code>
        );
      }
      
      return <span key={index}>{part}</span>;
    })
    .filter(Boolean);
};