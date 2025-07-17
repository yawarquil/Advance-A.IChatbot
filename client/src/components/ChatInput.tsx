import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Paperclip, X, Image } from 'lucide-react';
import { VoiceService } from '../services/voiceService';
import { FileService } from '../services/fileService';
import { ImageService } from '../services/imageService';
import { Attachment } from '../types/chat';
import AttachmentPreview from './AttachmentPreview';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: Attachment[], generateImage?: boolean) => void;
  isLoading: boolean;
  isGeneratingImage?: boolean;
  voiceEnabled: boolean;
  imageGeneration: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  isGeneratingImage = false,
  voiceEnabled, 
  imageGeneration 
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceService = useRef(new VoiceService());
  const fileService = useRef(new FileService());
  const imageService = useRef(new ImageService());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isLoading) {
      const shouldGenerateImage = imageGeneration && imageService.current.isImageGenerationPrompt(message.trim());
      onSendMessage(message.trim(), attachments, shouldGenerateImage);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleImageGeneration = () => {
    if (message.trim() && !isLoading) {
      // Add visual feedback
      const button = document.querySelector('[title="Generate image"]') as HTMLButtonElement;
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 1000);
      }
      
      onSendMessage(message.trim(), attachments, true);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
      return;
    }

    // Check if speech recognition is supported
    if (!voiceService.current.isRecognitionSupported()) {
      alert('Voice input is not supported in this browser. Please try Chrome or Edge.');
      return;
    }

    try {
      setIsListening(true);
      const transcript = await voiceService.current.startListening();
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    } catch (error) {
      console.error('Voice input error:', error);
      alert((error as Error).message);
      setIsListening(false);
    }
  };

  const handleFileSelect = async (files: FileList) => {
    const newAttachments: Attachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const attachment = await fileService.current.processFile(files[i]);
        newAttachments.push(attachment);
      } catch (error) {
        alert(`Error processing ${files[i].name}: ${(error as Error).message}`);
      }
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div 
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors ${
        isDragOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => removeAttachment(attachment.id)}
                  showRemove={true}
                />
              ))}
            </div>
          </div>
        )}

        {isDragOver && (
          <div className="mb-4 p-8 border-2 border-dashed border-blue-400 rounded-lg text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-blue-600 dark:text-blue-400">Drop files here to attach</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={attachments.length > 0 ? "Add a message (optional)..." : "Type your message here..."}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-32 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          {voiceEnabled && voiceService.current.isRecognitionSupported() && (
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors duration-200 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          )}
          
          {imageGeneration && (
            <button
              type="button"
              onClick={handleImageGeneration}
              disabled={!message.trim() || isLoading || isGeneratingImage}
              className={`text-white p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 ${
                isGeneratingImage 
                  ? 'bg-purple-400 animate-pulse' 
                  : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
              }`}
              title="Generate image"
            >
              {isGeneratingImage ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Image className="h-5 w-5" />
              )}
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept="image/*,text/*,.pdf,.doc,.docx,.json,.csv,.md"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-gray-500 text-white p-3 rounded-2xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <button
            type="submit"
            disabled={(!message.trim() && attachments.length === 0) || isLoading}
            className="bg-blue-500 text-white p-3 rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;