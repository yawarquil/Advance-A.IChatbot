import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import ErrorMessage from './components/ErrorMessage';
import SettingsPanel from './components/SettingsPanel';
import ConversationSidebar from './components/ConversationSidebar';
import AuthModal from './components/AuthModal';
import { ThemeProvider } from './components/ThemeProvider';
import { AIService } from './services/aiService';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { DatabaseService } from './services/databaseService';
import { ImageService } from './services/imageService';
import { Message, ChatState, Settings, Conversation, User, AuthState } from './types/chat';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isGeneratingImage: false,
  });

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
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
    imageGeneration: true,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = useRef(new AIService());
  const storageService = useRef(new StorageService());
  const authService = useRef<AuthService | null>(null);
  const databaseService = useRef<DatabaseService | null>(null);
  const imageService = useRef(new ImageService());

  // Initialize services
  useEffect(() => {
    try {
      authService.current = new AuthService();
      databaseService.current = new DatabaseService();
    } catch (error) {
      console.warn('Database services not available:', error);
      // Fall back to local storage
    }
  }, []);

  // Apply theme
  useTheme(settings);

  // Auth state management
  useEffect(() => {
    if (!authService.current) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const checkAuth = async () => {
      try {
        const user = await authService.current!.getCurrentUser();
        setAuthState({ user, isLoading: false, error: null });
        
        // Update database service token when user is authenticated
        if (user && databaseService.current) {
          const token = localStorage.getItem('auth_token');
          databaseService.current.updateToken(token);
        }
      } catch (error) {
        setAuthState({ user: null, isLoading: false, error: null });
      }
    };

    checkAuth();

    const { data: { subscription } } = authService.current.onAuthStateChange((user) => {
      setAuthState(prev => ({ ...prev, user }));
      
      // Update database service token when auth state changes
      if (databaseService.current) {
        const token = user ? localStorage.getItem('auth_token') : null;
        databaseService.current.updateToken(token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (authState.user && databaseService.current) {
        try {
          // Load from database
          const userSettings = await databaseService.current.loadUserSettings(authState.user.id);
          if (userSettings) {
            setSettings(userSettings);
          }

          const userConversations = await databaseService.current.loadConversations(authState.user.id);
          setConversations(userConversations);

          const currentMessages = await databaseService.current.loadCurrentConversation(authState.user.id);
          if (currentMessages.length > 0) {
            setChatState(prev => ({ ...prev, messages: currentMessages }));
          } else {
            addWelcomeMessage();
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    };

    const loadLocalData = () => {
      const loadedSettings = storageService.current.loadSettings();
      setSettings(loadedSettings);

      const loadedConversations = storageService.current.loadConversations();
      setConversations(loadedConversations);

      if (loadedSettings.persistHistory) {
        const currentMessages = storageService.current.loadCurrentConversation();
        if (currentMessages.length > 0) {
          setChatState(prev => ({ ...prev, messages: currentMessages }));
        } else {
          addWelcomeMessage();
        }
      } else {
        // Add welcome message if no history
        addWelcomeMessage();
      }
    };

    if (!authState.isLoading) {
      loadData();
    }
  }, [authState.user, authState.isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatState.messages, chatState.isLoading, chatState.isGeneratingImage, settings.autoScroll]);

  // Save current conversation when messages change
  useEffect(() => {
    const saveCurrentConversation = async () => {
      if (settings.persistHistory && chatState.messages.length > 0) {
        if (authState.user && databaseService.current) {
          try {
            await databaseService.current.saveCurrentConversation(authState.user.id, chatState.messages);
          } catch (error) {
            console.error('Failed to save to database, using local storage:', error);
            storageService.current.saveCurrentConversation(chatState.messages);
          }
        } else {
          storageService.current.saveCurrentConversation(chatState.messages);
        }
      }
    };

    saveCurrentConversation();
  }, [chatState.messages, settings.persistHistory, authState.user]);

  // Auth functions
  const handleSignIn = async (email: string, password: string) => {
    if (!authService.current) {
      throw new Error('Authentication service not available');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.current.signIn(email, password);
      setAuthState({ user, isLoading: false, error: null });
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }));
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    if (!authService.current) {
      throw new Error('Authentication service not available');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.current.signUp(email, password);
      setAuthState({ user, isLoading: false, error: null });
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      }));
      throw error;
    }
  };

  const handleSignOut = async () => {
    if (!authService.current) return;

    try {
      await authService.current.signOut();
      setAuthState({ user: null, isLoading: false, error: null });
      // Clear local data
      setChatState({ messages: [], isLoading: false, error: null });
      setConversations([]);
      setCurrentConversationId(null);
      addWelcomeMessage();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      type: 'ai',
      text: "Hello! I'm your AI assistant with multi-model support. I can help you with questions, creative tasks, problem-solving, generate images, and much more. You can switch between different AI models in settings, use voice input/output, attach files, and generate images. How can I assist you today?",
      timestamp: new Date(),
      model: settings.aiModel,
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  };

  const handleSendMessage = async (messageText: string, attachments?: Attachment[], generateImage?: boolean) => {
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
      isLoading: !generateImage,
      isGeneratingImage: generateImage || false,
      error: null,
    }));

    try {
      if (generateImage) {
        // Generate image
        const imagePrompt = imageService.current.extractImagePrompt(messageText);
        
        try {
          const imageUrl = await imageService.current.generateImage(imagePrompt);
          
          const aiMessage: Message = {
            id: uuidv4(),
            type: 'ai',
            text: `I've generated an image based on your request: "${imagePrompt}"`,
            timestamp: new Date(),
            model: 'AI Image Generator',
            imageUrl,
            imagePrompt,
          };

          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
            isGeneratingImage: false,
          }));
        } catch (error) {
          console.error('Image generation failed:', error);
          
          const errorMessage: Message = {
            id: uuidv4(),
            type: 'ai',
            text: `Sorry, I couldn't generate an image for "${imagePrompt}". The image generation service might be temporarily unavailable. Please try again later.`,
            timestamp: new Date(),
            model: 'AI Image Generator',
          };

          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, errorMessage],
            isGeneratingImage: false,
          }));
        }
      } else {
        // Generate text response
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
      }
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        isGeneratingImage: false,
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
    const saveSettings = async (updatedSettings: Settings) => {
      if (authState.user && databaseService.current) {
        try {
          await databaseService.current.saveUserSettings(authState.user.id, updatedSettings);
        } catch (error) {
          console.error('Failed to save settings to database:', error);
          storageService.current.saveSettings(updatedSettings);
        }
      } else {
        storageService.current.saveSettings(updatedSettings);
      }
    };

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleNewConversation = () => {
    const saveAndStartNew = async () => {
      // Save current conversation if it has messages
      if (chatState.messages.length > 0) {
        const conversation: Conversation = {
          id: currentConversationId || uuidv4(),
          title: generateConversationTitle(chatState.messages),
          messages: chatState.messages,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: authState.user?.id,
        };
        
        if (authState.user && databaseService.current) {
          try {
            await databaseService.current.saveConversation(conversation, authState.user.id);
          } catch (error) {
            console.error('Failed to save conversation to database:', error);
            storageService.current.saveConversation(conversation);
          }
        } else {
          storageService.current.saveConversation(conversation);
        }
        
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
      
      if (authState.user && databaseService.current) {
        try {
          await databaseService.current.clearCurrentConversation(authState.user.id);
        } catch (error) {
          console.error('Failed to clear current conversation in database:', error);
        }
      }
      storageService.current.clearCurrentConversation();
      
      addWelcomeMessage();
      setIsSidebarOpen(false);
    };

    saveAndStartNew();
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
    const deleteConversation = async () => {
      if (authState.user && databaseService.current) {
        try {
          await databaseService.current.deleteConversation(conversationId, authState.user.id);
        } catch (error) {
          console.error('Failed to delete conversation from database:', error);
        }
      }
      
      storageService.current.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    };

    deleteConversation();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      storageService.current.clearAllData();
      setConversations([]);
      setChatState({ messages: [], isLoading: false, error: null, isGeneratingImage: false });
      setCurrentConversationId(null);
      addWelcomeMessage();
      setIsSettingsOpen(false);
    }
  };

  const handleExportData = () => {
    const data = {
      conversations,
      settings,
      user: authState.user,
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

  // Show auth modal if database is available but user is not signed in
  const shouldShowAuth = !authState.isLoading && !authState.user && authService.current;

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider settings={settings} updateSettings={handleSettingsChange}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isLoading={authState.isLoading}
          error={authState.error}
        />

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
            user={authState.user}
            onSignIn={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
          />
          
          {shouldShowAuth && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Sign in to save your conversations and sync across devices
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full max-w-4xl mx-auto flex flex-col">
              <div className="flex-1 chat-container p-4 space-y-4">
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
                
                {(chatState.isLoading || chatState.isGeneratingImage) && (
                  <TypingIndicator 
                    message={chatState.isGeneratingImage ? "Generating image..." : "Thinking..."}
                  />
                )}
                
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
            isLoading={chatState.isLoading || chatState.isGeneratingImage}
            isGeneratingImage={chatState.isGeneratingImage}
            voiceEnabled={settings.voiceEnabled}
            imageGeneration={settings.imageGeneration}
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