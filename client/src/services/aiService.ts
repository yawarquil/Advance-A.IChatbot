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

// Claude Provider
export class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_CLAUDE_API_KEY environment variable is not set');
    }
  }

  getName(): string {
    return 'Claude 3';
  }

  async generateResponse(message: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          throw new Error('Invalid Claude API key. Please check your API key.');
        } else if (error.message.includes('rate_limit')) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred while contacting Claude.');
    }
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