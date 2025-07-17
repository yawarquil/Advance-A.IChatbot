export class ImageService {
  private readonly POLLINATIONS_API_URL = 'https://image.pollinations.ai/prompt';

  async generateImage(prompt: string): Promise<string> {
    try {
      // Using multiple free image generation services with fallbacks
      const services = [
        // Pollinations.ai
        () => {
          const encodedPrompt = encodeURIComponent(prompt);
          return `${this.POLLINATIONS_API_URL}/${encodedPrompt}?width=512&height=512&model=flux&enhance=true&nologo=true`;
        },
        // Alternative service
        () => {
          const encodedPrompt = encodeURIComponent(prompt.substring(0, 100));
          return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}`;
        },
        // Fallback to placeholder service
        () => this.generateFallbackImage(prompt)
      ];

      for (const getUrl of services) {
        try {
          const imageUrl = getUrl();
          await this.testImageLoad(imageUrl);
          return imageUrl;
        } catch (error) {
          console.warn('Image service failed, trying next...', error);
          continue;
        }
      }
      
      // If all services fail, return a placeholder
      return this.generateFallbackImage(prompt);
    } catch (error) {
      console.error('Image generation error:', error);
      return this.generateFallbackImage(prompt);
    }
  }

  private async testImageLoad(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
      
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
    });
  }

  private generateFallbackImage(prompt: string): string {
    // Fallback to another free service
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 100));
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodedPrompt}&backgroundColor=4F46E5,7C3AED,EC4899&size=512`;
  }

  isImageGenerationPrompt(text: string): boolean {
    const imageKeywords = [
      'generate image', 'create image', 'draw', 'paint', 'sketch',
      'make a picture', 'show me', 'visualize', 'illustrate',
      'generate a photo', 'create artwork', 'design'
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
  }

  extractImagePrompt(text: string): string {
    // Remove common prefixes to get the actual image description
    const prefixes = [
      'generate image of', 'create image of', 'draw', 'paint',
      'make a picture of', 'show me', 'visualize', 'illustrate',
      'generate a photo of', 'create artwork of', 'design'
    ];
    
    let cleanPrompt = text.toLowerCase();
    
    for (const prefix of prefixes) {
      if (cleanPrompt.startsWith(prefix)) {
        cleanPrompt = cleanPrompt.substring(prefix.length).trim();
        break;
      }
    }
    
    return cleanPrompt || text;
  }

  // Alternative image generation services for fallback
  async generateWithAlternativeService(prompt: string): Promise<string> {
    try {
      // Try Hugging Face Inference API (free tier)
      const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 512,
            height: 512,
          }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error('Alternative service error:', error);
    }
    
    return this.generateFallbackImage(prompt);
  }
}