import { Conversation, Settings, Message } from '../types/chat';

export class DatabaseService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response;
  }

  // Update token when it changes
  updateToken(token: string | null): void {
    this.token = token;
  }

  // Conversations
  async saveConversation(conversation: Conversation, userId: string): Promise<void> {
    const response = await this.makeRequest('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        title: conversation.title,
        messages: conversation.messages,
        user_id: userId,
      }),
    });

    await response.json();
  }

  async loadConversations(userId: string): Promise<Conversation[]> {
    const response = await this.makeRequest('/api/conversations');
    const data = await response.json();

    return data.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      userId: conv.user_id,
    }));
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    await this.makeRequest(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // User Settings
  async saveUserSettings(userId: string, settings: Settings): Promise<void> {
    await this.makeRequest('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  async loadUserSettings(userId: string): Promise<Settings | null> {
    try {
      const response = await this.makeRequest('/api/settings');
      const data = await response.json();
      return data;
    } catch (error) {
      // No settings found
      return null;
    }
  }

  // Current conversation for quick access
  async saveCurrentConversation(userId: string, messages: Message[]): Promise<void> {
    await this.makeRequest('/api/current-conversation', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  async loadCurrentConversation(userId: string): Promise<Message[]> {
    try {
      const response = await this.makeRequest('/api/current-conversation');
      const data = await response.json();

      return data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      return [];
    }
  }

  async clearCurrentConversation(userId: string): Promise<void> {
    await this.makeRequest('/api/current-conversation', {
      method: 'DELETE',
    });
  }
}