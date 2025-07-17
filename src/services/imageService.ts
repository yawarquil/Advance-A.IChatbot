export class ImageService {
  private readonly PERCHANCE_API_URL = 'https://image-generation.perchance.org/api/generate';

  async generateImage(prompt: string): Promise<string> {
    try {
      // Using Perchance.org free AI image generation
      const response = await fetch(this.PERCHANCE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          width: 512,
          height: 512,
          guidance_scale: 7.5,
          num_inference_steps: 20,
        }),
      });

      if (!response.ok) {
        // Fallback to a mock image service if Perchance is unavailable
        return this.generateMockImage(prompt);
      }

      const data = await response.json();
      
      if (data.image_url) {
        return data.image_url;
      } else {
        throw new Error('No image URL returned from service');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      // Fallback to mock image generation
      return this.generateMockImage(prompt);
    }
  }

  private generateMockImage(prompt: string): string {
    // Generate a placeholder image using a free service
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 100));
    return `https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=${encodedPrompt}`;
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
}