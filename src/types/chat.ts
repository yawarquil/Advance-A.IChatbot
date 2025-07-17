export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  model?: string;
  attachments?: Attachment[];
  imageUrl?: string; // For AI-generated images
  imagePrompt?: string; // Original prompt for image generation
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isGeneratingImage?: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'blue' | 'purple';
  aiModel: 'gemini' | 'gpt' | 'claude';
  voiceEnabled: boolean;
  selectedVoice: string;
  voiceSpeed: number;
  voicePitch: number;
  autoScroll: boolean;
  persistHistory: boolean;
  imageGeneration: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  attachments?: Attachment[];
  userId?: string; // For database storage
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string; // For text files or base64 for images
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  settings?: Settings;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}