import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import ErrorMessage from './components/ErrorMessage';
import SettingsPanel from './components/SettingsPanel';
import ConversationSidebar from './components/ConversationSidebar';
import { ThemeProvider } from './components/ThemeProvider';
import { AIService } from './services/aiService';
import { StorageService } from './services/storageService';
import { Message, ChatState, Settings, Conversation } from './types/chat';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    aiModel: 'gemini',
    voiceEnabled: false,
    selectedVoice: '',
    voiceSpeed: 1,
    voicePitch: 1,
    autoScroll: true,
    persistHistory: true,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = useRef(new AIService());
  const storageService = useRef(new StorageService());

  // Apply theme
  useTheme(settings);

  // Load initial data
  useEffect(() => {
    const loadedSettings = storageService.current.loadSettings();
    setSettings(loadedSettings);

    const loadedConversations = storageService.current.loadConversations();
    setConversations(loadedConversations);

    if (loadedSettings.persistHistory) {
      const currentMessages = storageService.current.loadCurrentConversation();
      if (currentMessages.length > 0) {
        setChatState(prev => ({ ...prev, messages: currentMessages }));
      } else {
        // Add welcome message if no history
        addWelcomeMessage();
      }
    } else {
      addWelcomeMessage();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatState.messages, chatState.isLoading, settings.autoScroll]);

  // Save current conversation when messages change
  useEffect(() => {
    if (settings.persistHistory && chatState.messages.length > 0) {
      storageService.current.saveCurrentConversation(chatState.messages);
    }
  }, [chatState.messages, settings.persistHistory]);

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      type: 'ai',
      text: "Hello! I'm your AI assistant with multi-model support. I can help you with questions, creative tasks, problem-solving, and much more. You can switch between different AI models in settings, use voice input/output, and even attach files to our conversation. How can I assist you today?",
      timestamp: new Date(),
      model: settings.aiModel,
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  };

  const handleSendMessage = async (messageText: string, attachments?: Attachment[]) => {
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      text: messageText,
      timestamp: new Date(),
      attachments,
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const provider = aiService.current.getProvider(settings.aiModel);
      
      // Include attachment context in the message
      let contextualMessage = messageText;
      if (attachments && attachments.length > 0) {
        const attachmentContext = attachments.map(att => {
          if (att.content && att.type.startsWith('text/')) {
            return `File "${att.name}" content:\n${att.content}`;
          }
          return `File attached: ${att.name} (${att.type})`;
        }).join('\n\n');
        
        contextualMessage = `${messageText}\n\nAttached files:\n${attachmentContext}`;
      }
      
      const response = await provider.generateResponse(contextualMessage);
      
      const aiMessage: Message = {
        id: uuidv4(),
        type: 'ai',
        text: response,
        timestamp: new Date(),
        model: provider.getName(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get AI response',
      }));
    }
  };

  const handleRegenerate = async () => {
    const lastUserMessage = chatState.messages
      .slice()
      .reverse()
      .find(msg => msg.type === 'user');
    
    if (lastUserMessage) {
      // Remove the last AI response
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
        error: null,
      }));
      
      // Regenerate response
      await handleSendMessage(lastUserMessage.text);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = chatState.messages
      .slice()
      .reverse()
      .find(msg => msg.type === 'user');
    
    if (lastUserMessage) {
      setChatState(prev => ({
        ...prev,
        error: null,
      }));
      handleSendMessage(lastUserMessage.text);
    }
  };

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    storageService.current.saveSettings(updatedSettings);
  };

  const handleNewConversation = () => {
    // Save current conversation if it has messages
    if (chatState.messages.length > 0) {
      const conversation: Conversation = {
        id: currentConversationId || uuidv4(),
        title: generateConversationTitle(chatState.messages),
        messages: chatState.messages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      storageService.current.saveConversation(conversation);
      setConversations(prev => {
        const existing = prev.find(c => c.id === conversation.id);
        if (existing) {
          return prev.map(c => c.id === conversation.id ? conversation : c);
        }
        return [conversation, ...prev];
      });
    }

    // Start new conversation
    setChatState({ messages: [], isLoading: false, error: null });
    setCurrentConversationId(null);
    storageService.current.clearCurrentConversation();
    addWelcomeMessage();
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setChatState({
      messages: conversation.messages,
      isLoading: false,
      error: null,
    });
    setCurrentConversationId(conversation.id);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    storageService.current.deleteConversation(conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      handleNewConversation();
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      storageService.current.clearAllData();
      setConversations([]);
      setChatState({ messages: [], isLoading: false, error: null });
      setCurrentConversationId(null);
      addWelcomeMessage();
      setIsSettingsOpen(false);
    }
  };

  const handleExportData = () => {
    const data = {
      conversations,
      settings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateConversationTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.length > 30 
        ? firstUserMessage.text.substring(0, 30) + '...'
        : firstUserMessage.text;
    }
    return 'New Conversation';
  };

  return (
    <ThemeProvider settings={settings} updateSettings={handleSettingsChange}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Sidebar */}
        <ConversationSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Header 
            onSettingsClick={() => setIsSettingsOpen(true)}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full max-w-4xl mx-auto flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatState.messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRegenerate={
                      message.type === 'ai' && index === chatState.messages.length - 1
                        ? handleRegenerate
                        : undefined
                    }
                    voiceEnabled={settings.voiceEnabled}
                    voiceSettings={{
                      selectedVoice: settings.selectedVoice,
                      voiceSpeed: settings.voiceSpeed,
                      voicePitch: settings.voicePitch,
                    }}
                  />
                ))}
                
                {chatState.isLoading && <TypingIndicator />}
                
                {chatState.error && (
                  <ErrorMessage 
                    message={chatState.error} 
                    onRetry={handleRetry}
                  />
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          
          <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={chatState.isLoading}
            voiceEnabled={settings.voiceEnabled}
          />
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClearHistory={handleClearHistory}
          onExportData={handleExportData}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;