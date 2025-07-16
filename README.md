# Advanced AI Chatbot - Multi-Model Chat Assistant

A comprehensive, production-ready React chatbot application with multi-AI model support, voice capabilities, themes, and persistent chat history.

## ✨ Features

### 🤖 **Multi-AI Model Support**
- **Google Gemini 1.5 Flash** - Fast, efficient responses
- **GPT-4** - Advanced reasoning (mock implementation - add OpenAI API)
- **Claude 3** - Thoughtful responses (mock implementation - add Anthropic API)
- Easy model switching in settings

### 🎨 **Multiple Themes**
- **Light Theme** - Clean, professional appearance
- **Dark Theme** - Easy on the eyes for night use
- **Ocean Blue** - Calming blue gradient theme
- **Royal Purple** - Elegant purple gradient theme
- Smooth theme transitions with system preference detection

### 🗣️ **Voice Features**
- **Text-to-Speech** - Listen to AI responses using Web Speech API
- **Voice Input** - Speak your messages instead of typing
- **Voice Controls** - Start/stop listening with visual feedback
- Cross-browser compatibility with fallback support

### 💬 **Advanced Chat Features**
- **Persistent History** - Save conversations locally with IndexedDB
- **Conversation Management** - Organize chats in sidebar with search
- **Message Regeneration** - Retry AI responses with one click
- **Real-time Typing Indicators** - See when AI is thinking
- **Auto-scroll** - Automatically scroll to new messages
- **Message Timestamps** - Track conversation timeline

### ⚙️ **Comprehensive Settings**
- **Theme Customization** - Choose from 4 beautiful themes
- **AI Model Selection** - Switch between different AI providers
- **Voice Toggle** - Enable/disable voice features
- **Auto-scroll Control** - Customize scrolling behavior
- **Data Management** - Export chat history, clear all data

### 📱 **Fully Responsive Design**
- **Mobile-First** - Optimized for all screen sizes
- **Touch-Friendly** - Large tap targets and smooth gestures
- **Adaptive Layout** - Sidebar collapses on mobile
- **Progressive Web App** - Install as native app
- **Accessibility** - WCAG compliant with keyboard navigation

### 🔧 **Developer Features**
- **TypeScript** - Full type safety and IntelliSense
- **Component Architecture** - Modular, reusable components
- **Service Layer** - Clean separation of concerns
- **Error Handling** - Comprehensive error management
- **Performance Optimized** - Lazy loading and efficient rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ai-chatbot
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Add your API keys to `.env`:
   ```env
   VITE_GEMINI_API_KEY=your-gemini-api-key-here
   # Optional: Add other AI provider keys
   VITE_OPENAI_API_KEY=your-openai-key
   VITE_ANTHROPIC_API_KEY=your-anthropic-key
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 🏗️ Architecture

### Component Structure
```
src/
├── components/           # React components
│   ├── Header.tsx       # App header with branding
│   ├── ChatMessage.tsx  # Individual message bubbles
│   ├── ChatInput.tsx    # Message input with voice
│   ├── SettingsPanel.tsx # Settings modal
│   ├── ConversationSidebar.tsx # Chat history
│   └── ThemeProvider.tsx # Theme context
├── services/            # Business logic
│   ├── aiService.ts     # AI provider factory
│   ├── voiceService.ts  # Speech recognition/synthesis
│   └── storageService.ts # Local data persistence
├── hooks/               # Custom React hooks
│   └── useTheme.ts      # Theme management
├── types/               # TypeScript definitions
│   └── chat.ts          # Type definitions
└── App.tsx              # Main application
```

### Service Layer
- **AIService**: Factory pattern for multiple AI providers
- **VoiceService**: Web Speech API wrapper with error handling
- **StorageService**: LocalStorage management with data validation

## 🎯 Usage Guide

### Basic Chat
1. Type your message in the input field
2. Press Enter or click Send
3. AI responds based on selected model
4. Use voice input button for speech-to-text

### Voice Features
1. Enable voice in Settings
2. Click microphone icon to start listening
3. Speak your message clearly
4. Click speaker icon on AI messages to hear responses

### Managing Conversations
1. Click menu button (mobile) or use sidebar (desktop)
2. View all past conversations
3. Click any conversation to resume
4. Delete conversations with trash icon
5. Start new conversation with + button

### Customization
1. Click Settings gear icon
2. Choose your preferred theme
3. Select AI model (Gemini, GPT, Claude)
4. Toggle voice features on/off
5. Adjust auto-scroll and history settings

## 🔌 API Integration

### Adding New AI Providers

1. **Create Provider Class**
   ```typescript
   export class NewAIProvider implements AIProvider {
     getName(): string {
       return 'New AI Model';
     }
     
     async generateResponse(message: string): Promise<string> {
       // Implement API call
     }
   }
   ```

2. **Register in AIService**
   ```typescript
   constructor() {
     this.providers.set('newai', new NewAIProvider());
   }
   ```

3. **Add to Settings**
   Update the aiModel type in `types/chat.ts`

### Current Integrations
- ✅ **Google Gemini** - Fully implemented
- 🔄 **OpenAI GPT** - Mock implementation (add API key)
- 🔄 **Anthropic Claude** - Mock implementation (add API key)

## 🎨 Theming

### Built-in Themes
- **Light**: Clean white background with blue accents
- **Dark**: Dark gray background with blue highlights  
- **Blue**: Ocean blue gradient with white text
- **Purple**: Royal purple gradient with white text

### Custom Themes
Add new themes in `src/index.css`:
```css
.theme-custom {
  --bg-primary: #your-color;
  --bg-secondary: #your-color;
  --text-primary: #your-color;
  --text-secondary: #your-color;
  --border-primary: #your-color;
}
```

## 📱 Mobile Experience

### Responsive Features
- Collapsible sidebar navigation
- Touch-optimized buttons and inputs
- Swipe gestures for navigation
- Adaptive text sizing
- Mobile-specific animations

### PWA Support
- Installable as native app
- Offline message viewing
- Push notification ready
- App-like navigation

## 🔒 Privacy & Security

### Data Handling
- All chat history stored locally
- No data sent to third parties (except AI APIs)
- Export/import functionality for data portability
- Clear all data option for privacy

### API Security
- Environment variables for API keys
- Error handling prevents key exposure
- Rate limiting awareness
- Secure HTTPS-only communication

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure mobile responsiveness
- Test across different browsers

## 📄 License

MIT License - feel free to use this project for personal or commercial applications!

## 🆘 Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 📖 Docs: [Full documentation](https://docs.example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/example/issues)

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**