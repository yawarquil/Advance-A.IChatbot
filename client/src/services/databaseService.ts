import { createClient } from '@supabase/supabase-js';
import { Conversation, Settings, Message } from '../types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class DatabaseService {
  private supabase;

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set up Supabase connection.');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Conversations
  async saveConversation(conversation: Conversation, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .upsert({
        id: conversation.id,
        user_id: userId,
        title: conversation.title,
        messages: conversation.messages,
        created_at: conversation.createdAt.toISOString(),
        updated_at: conversation.updatedAt.toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
  }

  async loadConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load conversations: ${error.message}`);
    }

    return (data || []).map(conv => ({
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
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // User Settings
  async saveUserSettings(userId: string, settings: Settings): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save settings: ${error.message}`);
    }
  }

  async loadUserSettings(userId: string): Promise<Settings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to load settings: ${error.message}`);
    }

    return data?.settings || null;
  }

  // Current conversation for quick access
  async saveCurrentConversation(userId: string, messages: Message[]): Promise<void> {
    const { error } = await this.supabase
      .from('current_conversations')
      .upsert({
        user_id: userId,
        messages: messages,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save current conversation: ${error.message}`);
    }
  }

  async loadCurrentConversation(userId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('current_conversations')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to load current conversation: ${error.message}`);
    }

    if (!data?.messages) {
      return [];
    }

    return data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  }

  async clearCurrentConversation(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('current_conversations')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to clear current conversation: ${error.message}`);
    }
  }
}