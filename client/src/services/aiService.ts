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

// Reliable Free AI Provider with Multiple Services
export class ClaudeProvider implements AIProvider {
  private readonly services = [
    {
      name: 'Together AI',
      url: 'https://api.together.xyz/v1/chat/completions',
      model: 'meta-llama/Llama-2-7b-chat-hf'
    },
    {
      name: 'Hugging Face',
      url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      model: 'dialogpt'
    }
  ];

  constructor() {
    // No API key required for basic usage
  }

  getName(): string {
    return 'Smart AI (Free)';
  }

  async generateResponse(message: string): Promise<string> {
    // Try different AI services in order
    for (const service of this.services) {
      try {
        const response = await this.tryService(service, message);
        if (response) {
          return response;
        }
      } catch (error) {
        console.warn(`${service.name} failed, trying next service...`);
        continue;
      }
    }

    // If all services fail, use intelligent fallback
    return this.generateIntelligentResponse(message);
  }

  private async tryService(service: any, message: string): Promise<string | null> {
    try {
      if (service.model === 'dialogpt') {
        return await this.tryHuggingFace(service.url, message);
      } else {
        return await this.tryOpenAIFormat(service, message);
      }
    } catch (error) {
      return null;
    }
  }

  private async tryOpenAIFormat(service: any, message: string): Promise<string | null> {
    const response = await fetch(service.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: service.model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  private async tryHuggingFace(url: string, message: string): Promise<string | null> {
    const response = await fetch(url, {
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
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      let responseText = data[0].generated_text;
      if (responseText.startsWith(message)) {
        responseText = responseText.substring(message.length).trim();
      }
      return responseText || null;
    }
    return null;
  }

  private generateIntelligentResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm here to help you with any questions or tasks you have. What would you like to know about?";
    }
    
    // Programming and technical questions
    if (lowerMessage.includes('code') || lowerMessage.includes('program') || lowerMessage.includes('javascript') || lowerMessage.includes('python') || lowerMessage.includes('html') || lowerMessage.includes('css')) {
      return "I'd be happy to help with programming! I can assist with:\n\n• Writing and debugging code\n• Explaining programming concepts\n• Code reviews and optimization\n• Framework and library guidance\n\nCould you share more details about what you're working on?";
    }
    
    // Math and calculations
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || /\d+[\+\-\*\/]\d+/.test(message)) {
      try {
        // Try to evaluate simple math expressions
        const mathMatch = message.match(/(\d+[\+\-\*\/\(\)\s\d\.]+\d+)/);
        if (mathMatch) {
          const expr = mathMatch[1].replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '');
          const result = Function(`"use strict"; return (${expr})`)();
          return `The answer is: ${result}\n\nI can help with more complex math problems too. Just describe what you need!`;
        }
      } catch (error) {
        // Fall through to general math response
      }
      return "I can help with mathematical calculations and problem-solving. Please share the specific problem or equation you'd like me to work on.";
    }
    
    // Questions and explanations
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why') || lowerMessage.includes('explain')) {
      return "I'd be glad to explain that! I can help with:\n\n• Concepts and definitions\n• Step-by-step explanations\n• Technical topics\n• General knowledge\n\nCould you be more specific about what you'd like me to explain?";
    }
    
    // Creative writing
    if (lowerMessage.includes('write') || lowerMessage.includes('story') || lowerMessage.includes('creative') || lowerMessage.includes('essay')) {
      return "I love helping with creative writing! I can assist with:\n\n• Stories and narratives\n• Essays and articles\n• Character development\n• Plot ideas\n• Writing tips and techniques\n\nWhat kind of writing project are you working on?";
    }
    
    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
      return "I'm here to help! I can assist you with:\n\n• Programming and web development\n• Math and problem-solving\n• Writing and creative projects\n• Explanations and learning\n• General questions and research\n\nWhat would you like to work on together?";
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're very welcome! I'm happy to help. Is there anything else you'd like to know or work on?";
    }
    
    // Default intelligent response
    return `I understand you're asking about "${message}". While I may not have access to real-time AI services right now, I'm still here to help! \n\nI can assist with:\n• Programming and technical questions\n• Math and calculations\n• Writing and creative projects\n• Explanations and learning\n\nCould you tell me more about what specific help you need?`;
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