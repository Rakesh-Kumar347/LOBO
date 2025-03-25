import React, { useState } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { toast } from 'react-toastify';

const ChatExportImport = ({ messages, onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleExport = () => {
    try {
      if (!messages || messages.length === 0) {
        toast.error('No messages to export');
        return;
      }

      // Create a downloadable object with messages
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        messages: messages,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Chat exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chat');
    }
  };

  const handleImportClick = () => {
    // Create and click a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleFileSelection;
    input.click();
  };

  const handleFileSelection = (event) => {
    setFileError('');
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/json') {
      setFileError('Please select a JSON file');
      toast.error('Please select a JSON file');
      return;
    }
    
    // Read the file
    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        
        // Validate the imported data
        if (!content.messages || !Array.isArray(content.messages)) {
          throw new Error('Invalid chat format');
        }
        
        // Validate message structure
        const isValidFormat = content.messages.every(msg => 
          msg.role && ['user', 'assistant'].includes(msg.role) && 
          typeof msg.content === 'string'
        );
        
        if (!isValidFormat) {
          throw new Error('Invalid message format');
        }
        
        // Call the import handler
        onImport(content.messages);
        toast.success('Chat imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        setFileError(error.message || 'Failed to parse the imported file');
        toast.error('Failed to import chat: ' + (error.message || 'Invalid format'));
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.onerror = () => {
      setFileError('Failed to read the file');
      toast.error('Failed to read the file');
      setIsImporting(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-1"
          disabled={!messages?.length}
        >
          <Download size={16} />
          Export Chat
        </Button>
        
        <Button
          onClick={handleImportClick}
          variant="outline"
          className="flex items-center gap-1"
          disabled={isImporting}
        >
          <Upload size={16} />
          {isImporting ? 'Importing...' : 'Import Chat'}
        </Button>
      </div>
      
      {fileError && (
        <div className="text-red-500 text-sm flex items-center gap-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          <AlertCircle size={14} />
          {fileError}
        </div>
      )}
    </div>
  );
};

export default ChatExportImport;