import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

/**
 * Component to display suggested follow-up questions based on conversation context
 */
const SuggestedQuestions = ({ messages, onSelectQuestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate suggestions based on conversation context
  useEffect(() => {
    if (!messages || messages.length < 2) {
      setSuggestions([]);
      return;
    }

    // Only generate suggestions after an AI response
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') {
      setSuggestions([]);
      return;
    }

    // Function to generate suggestions
    const generateSuggestions = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, you would call an API endpoint
        // to generate contextual suggestions based on the conversation.
        // For this example, we'll use static suggestions based on simple pattern matching.
        
        // Get last few messages for context
        const recentMessages = messages.slice(-4);
        const context = recentMessages
          .map(msg => msg.content)
          .join(' ')
          .toLowerCase();
        
        // Generate topic-based suggestions
        let newSuggestions = [];
        
        // This is a simplified implementation - in reality you would use NLP
        // or call the AI model to generate contextually relevant suggestions
        if (context.includes('python') || context.includes('code')) {
          newSuggestions = [
            'Can you explain how this code works?',
            'How would I optimize this code?',
            'What are some best practices for Python?'
          ];
        } else if (context.includes('data') || context.includes('analysis')) {
          newSuggestions = [
            'What visualization would work best for this data?',
            'How can I clean this dataset?',
            'Can you suggest statistical methods for this analysis?'
          ];
        } else if (context.includes('machine learning') || context.includes('ai')) {
          newSuggestions = [
            'What algorithm would be best for this problem?',
            'How can I improve model accuracy?',
            'Can you explain overfitting vs underfitting?'
          ];
        } else {
          // Default suggestions
          newSuggestions = [
            'Can you elaborate on that?',
            'What are the alternatives?',
            'Can you provide an example?'
          ];
        }
        
        // Shuffle and limit to 3 suggestions
        newSuggestions = newSuggestions
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
          
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent generating suggestions too frequently
    const timeoutId = setTimeout(generateSuggestions, 800);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-6 mx-auto max-w-[700px]">
      <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
        <Lightbulb size={16} />
        <span className="text-sm">Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            <span>{question}</span>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;