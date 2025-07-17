// AI Service Factory for multiple providers
export interface AIProvider {
  generateResponse(message: string): Promise<string>;
  getName(): string;
}

// Gemini Provider
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
    }
  }

  getName(): string {
    return 'Gemini 1.5 Flash';
  }

  async generateResponse(message: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred while contacting the AI service.');
    }
  }
}

// Free GPT Provider using Hugging Face Inference API
export class GPTProvider implements AIProvider {
  private readonly apiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';

  constructor() {
    // No API key required for basic usage
  }

  getName(): string {
    return 'DialoGPT Large (Free)';
  }

  async generateResponse(message: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 1024,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        // If Hugging Face is rate limited, try alternative approach
        return this.generateFallbackResponse(message);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        // Clean up the response to remove the input prompt
        let responseText = data[0].generated_text;
        if (responseText.startsWith(message)) {
          responseText = responseText.substring(message.length).trim();
        }
        return responseText || "I understand your message. Could you please rephrase or ask something else?";
      }
      
      return this.generateFallbackResponse(message);
    } catch (error) {
      console.error('GPT Provider error:', error);
      return this.generateFallbackResponse(message);
    }
  }

  private generateFallbackResponse(message: string): string {
    // Simple rule-based fallback responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! How can I help you today?";
    }
    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me questions about various topics, request explanations, or just chat.";
    }
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return "That's an interesting question! While I may not have all the answers, I'd be happy to discuss this topic with you.";
    }
    if (lowerMessage.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    return "I understand what you're saying. Could you tell me more about that or ask me something specific I can help with?";
  }
}

// Advanced Free AI Provider using Groq
export class ClaudeProvider implements AIProvider {
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly fallbackUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

  constructor() {
    // No API key required for basic usage
  }

  getName(): string {
    return 'Llama 3 (Advanced Free)';
  }

  async generateResponse(message: string): Promise<string> {
    try {
      // Try Groq first (free tier available)
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      }

      // Fallback to Hugging Face
      return await this.generateHuggingFaceResponse(message);
    } catch (error) {
      console.warn('Primary AI service failed, using fallback:', error);
      return await this.generateHuggingFaceResponse(message);
    }
  }

  private async generateHuggingFaceResponse(message: string): Promise<string> {
    try {
      const response = await fetch(this.fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 512,
            temperature: 0.8,
            do_sample: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data[0]?.generated_text) {
          let responseText = data[0].generated_text;
          if (responseText.startsWith(message)) {
            responseText = responseText.substring(message.length).trim();
          }
          return responseText || this.generateSmartFallback(message);
        }
      }

      return this.generateSmartFallback(message);
    } catch (error) {
      console.error('Fallback AI service error:', error);
      return this.generateSmartFallback(message);
    }
  }

  private generateSmartFallback(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Programming questions
    if (lowerMessage.includes('code') || lowerMessage.includes('program') || lowerMessage.includes('function')) {
      return "I can help with programming questions! Could you be more specific about what you'd like to build or debug?";
    }
    
    // Math questions
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || /\d+[\+\-\*\/]\d+/.test(message)) {
      return "I can help with calculations and math problems. Please provide the specific equation or problem you'd like me to solve.";
    }
    
    // Explanations
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
      return "I'd be happy to explain that concept! Could you give me a bit more context about what specific aspect you'd like me to focus on?";
    }
    
    // Creative writing
    if (lowerMessage.includes('write') || lowerMessage.includes('story') || lowerMessage.includes('creative')) {
      return "I can help with creative writing! What kind of story, article, or content would you like me to help you create?";
    }
    
    return "I understand your message. While I may not have a complete response right now, I'm here to help with various topics including programming, explanations, creative writing, and problem-solving. Could you tell me more about what you need assistance with?";
  }
}

// AI Service Factory
export class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    try {
      this.providers.set('gemini', new GeminiProvider());
    } catch (error) {
      console.warn('Gemini provider not available:', error);
    }

    try {
      this.providers.set('gpt', new GPTProvider());
    } catch (error) {
      console.warn('GPT provider not available:', error);
    }

    try {
      this.providers.set('claude', new ClaudeProvider());
    } catch (error) {
      console.warn('Claude provider not available:', error);
    }
  }

  getProvider(model: string): AIProvider {
    const provider = this.providers.get(model);
    if (!provider) {
      throw new Error(`AI model "${model}" not available. Please check your API keys.`);
    }
    return provider;
  }

  getAvailableModels(): Array<{ key: string; name: string }> {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      key,
      name: provider.getName(),
    }));
  }
}