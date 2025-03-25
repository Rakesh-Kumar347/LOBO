import React, { useState, useEffect } from "react";
import { Search, Tag, Folder, Plus, X } from "lucide-react";
import { Button } from "./button";
import { toast } from "react-toastify";
import { apiRequest } from "@/lib/api";

const ChatOrganizer = ({ 
  savedChats, 
  onChatSelect, 
  onCreateNewChat, 
  currentChatId,
  onSaveCategory
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(["General"]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter chats when search query, category, or savedChats changes
  useEffect(() => {
    if (!savedChats || savedChats.length === 0) {
      setFilteredChats([]);
      return;
    }

    let filtered = [...savedChats];

    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(chat => 
        chat.category === selectedCategory
      );
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.title.toLowerCase().includes(query)
      );
    }

    setFilteredChats(filtered);
  }, [searchQuery, selectedCategory, savedChats]);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest("/chats/search/categories", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const handleAddCategory = () => {
    setIsAddingCategory(true);
  };

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Add to local categories
    if (!categories.includes(newCategoryName)) {
      setCategories([...categories, newCategoryName]);
    }
    
    setIsAddingCategory(false);
    setNewCategoryName("");
    
    // If there's a current chat, offer to categorize it
    if (currentChatId && onSaveCategory) {
      onSaveCategory(currentChatId, newCategoryName);
    }
  };

  const handleChatSearch = async () => {
    setIsLoading(true);
    try {
      let endpoint = `/chats/search?query=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) {
        endpoint += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      const response = await apiRequest(endpoint, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.chats) {
          setFilteredChats(data.data.chats);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search chats");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Box */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === "Enter" && handleChatSearch()}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleChatSearch}
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Categories</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddCategory}
            className={isAddingCategory ? "hidden" : ""}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        {isAddingCategory ? (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSaveCategory}
            >
              Save
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCancelAddCategory}
            >
              <X size={16} />
            </Button>
          </div>
        ) : null}
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <Tag size={12} className="mr-1" />
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Chats */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Saved Chats</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateNewChat}
          >
            New Chat
          </Button>
        </div>
        
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? "bg-purple-100 dark:bg-purple-900"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="truncate">
                    <p className="font-medium truncate">{chat.title}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(chat.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {chat.category && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                      {chat.category}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              {searchQuery || selectedCategory
                ? "No matching chats found"
                : "No saved chats yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatOrganizer;