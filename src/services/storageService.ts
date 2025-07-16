import { Message, Conversation, Settings } from '../types/chat';

export class StorageService {
  private readonly SETTINGS_KEY = 'ai-chat-settings';
  private readonly CONVERSATIONS_KEY = 'ai-chat-conversations';
  private readonly CURRENT_CONVERSATION_KEY = 'ai-chat-current';

  // Settings Management
  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadSettings(): Settings {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // Return default settings
    return {
      theme: 'light',
      aiModel: 'gemini',
      voiceEnabled: false,
      selectedVoice: '',
      voiceSpeed: 1,
      voicePitch: 1,
      autoScroll: true,
      persistHistory: true,
    };
  }

  // Conversation Management
  saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.loadConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      // Keep only last 50 conversations
      const trimmed = conversations.slice(0, 50);
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  loadConversations(): Conversation[] {
    try {
      const saved = localStorage.getItem(this.CONVERSATIONS_KEY);
      if (saved) {
        const conversations = JSON.parse(saved);
        // Convert date strings back to Date objects
        return conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
    return [];
  }

  deleteConversation(conversationId: string): void {
    try {
      const conversations = this.loadConversations();
      const filtered = conversations.filter(c => c.id !== conversationId);
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  // Current Conversation
  saveCurrentConversation(messages: Message[]): void {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
        return;
      }
      localStorage.setItem(this.CURRENT_CONVERSATION_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save current conversation:', error);
    }
  }

  loadCurrentConversation(): Message[] {
    try {
      const saved = localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
      if (saved) {
        const messages = JSON.parse(saved);
        // Convert date strings back to Date objects
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load current conversation:', error);
    }
    return [];
  }

  clearCurrentConversation(): void {
    try {
      localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
    } catch (error) {
      console.error('Failed to clear current conversation:', error);
    }
  }

  // Utility
  clearAllData(): void {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.CONVERSATIONS_KEY);
      localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}