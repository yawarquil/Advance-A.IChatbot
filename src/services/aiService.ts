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

// Mock GPT Provider (you can implement with OpenAI API)
export class GPTProvider implements AIProvider {
  getName(): string {
    return 'GPT-4';
  }

  async generateResponse(message: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `GPT-4 Response: This is a simulated response to "${message}". To use real GPT-4, implement OpenAI API integration.`;
  }
}

// Mock Claude Provider (you can implement with Anthropic API)
export class ClaudeProvider implements AIProvider {
  getName(): string {
    return 'Claude 3';
  }

  async generateResponse(message: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    return `Claude 3 Response: This is a simulated response to "${message}". To use real Claude, implement Anthropic API integration.`;
  }
}

// AI Service Factory
export class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('gpt', new GPTProvider());
    this.providers.set('claude', new ClaudeProvider());
  }

  getProvider(model: string): AIProvider {
    const provider = this.providers.get(model);
    if (!provider) {
      throw new Error(`AI model "${model}" not supported`);
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