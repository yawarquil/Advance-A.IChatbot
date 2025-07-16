export class VoiceService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }

    // Load voices when they become available
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.availableVoices = this.synthesis.getVoices();
  }

  getAvailableVoices(): Array<{ name: string; lang: string; gender: string }> {
    // Ensure voices are loaded
    if (this.availableVoices.length === 0) {
      this.availableVoices = this.synthesis.getVoices();
    }

    // Curated list of high-quality voices with gender detection
    const voiceList = this.availableVoices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: this.detectGender(voice.name),
      voice: voice
    }));

    // Sort by quality and popularity
    return voiceList
      .filter(v => v.lang.startsWith('en')) // English voices only
      .sort((a, b) => {
        // Prioritize certain high-quality voices
        const priority = ['Google', 'Microsoft', 'Apple', 'Amazon'];
        const aPriority = priority.findIndex(p => a.name.includes(p));
        const bPriority = priority.findIndex(p => b.name.includes(p));
        
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        
        return a.name.localeCompare(b.name);
      })
      .slice(0, 15) // Limit to 15 best voices
      .map(v => ({ name: v.name, lang: v.lang, gender: v.gender }));
  }

  private detectGender(voiceName: string): string {
    const name = voiceName.toLowerCase();
    const femaleIndicators = ['female', 'woman', 'girl', 'samantha', 'alex', 'victoria', 'zira', 'susan', 'karen', 'hazel'];
    const maleIndicators = ['male', 'man', 'boy', 'david', 'mark', 'daniel', 'george', 'james'];
    
    if (femaleIndicators.some(indicator => name.includes(indicator))) return 'Female';
    if (maleIndicators.some(indicator => name.includes(indicator))) return 'Male';
    return 'Neutral';
  }

  // Text-to-Speech
  speak(text: string, options: { 
    rate?: number; 
    pitch?: number; 
    volume?: number; 
    voiceName?: string;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Set specific voice if requested
      if (options.voiceName) {
        const voice = this.availableVoices.find(v => v.name === options.voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  // Stop current speech
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Speech-to-Text
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Voice input is already active'));
        return;
      }

      // Check for microphone permissions
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
          if (result.state === 'denied') {
            reject(new Error('Microphone access denied. Please enable microphone permissions.'));
            return;
          }
        }).catch(() => {
          // Permissions API not supported, continue anyway
        });
      }

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        
        let errorMessage = 'Voice input failed';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found. Please check your microphone connection.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not available.';
            break;
          default:
            errorMessage = `Voice input error: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(new Error('Failed to start voice recognition. Please try again.'));
      }
    });
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Check if currently listening
  getIsListening(): boolean {
    return this.isListening;
  }

  // Check if speech synthesis is supported
  isSpeechSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Check if speech recognition is supported
  isRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}