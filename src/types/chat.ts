export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  model?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
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
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string; // For text files or base64 for images
}