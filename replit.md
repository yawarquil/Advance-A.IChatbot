# Overview

This is a modern full-stack AI chat application built with React, Express, and TypeScript. The application provides a conversational AI interface with support for multiple AI providers (Gemini, Claude, DialoGPT), voice interaction, image generation, file attachments, and persistent conversation history. The system features user authentication, real-time chat functionality, and comprehensive settings management.

**Migration Status**: Successfully migrated from Bolt to Replit environment (January 2025)
- Replaced Supabase with PostgreSQL/Drizzle ORM
- Implemented JWT-based authentication
- Replaced non-working OpenAI API with DialoGPT alternative
- All core features functional and tested

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks and context for local state
- **Routing**: Single-page application (SPA) structure

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Middleware**: Custom authentication, logging, and error handling

# Key Components

## Authentication System
- JWT-based authentication with bcrypt for password hashing
- Protected routes using middleware verification
- Local storage for token persistence
- Registration and login functionality

## AI Integration
- **Primary Provider**: Google Gemini 1.5 Flash API
- **Secondary Providers**: Smart AI (multi-service free alternative), DialoGPT Large
- Extensible provider pattern for multiple AI services
- Support for text generation and conversation management
- Environment variable configuration for API keys
- Intelligent fallback responses with context-aware suggestions
- Multi-tier fallback system for maximum reliability

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL
- **Hosting**: Neon serverless PostgreSQL
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema**: Structured tables for users, conversations, settings, and current conversations

## Frontend Services
- **AI Service**: Handles communication with AI providers
- **Auth Service**: Manages user authentication and token handling
- **Database Service**: Client-side API communication
- **Voice Service**: Speech synthesis and recognition using Web Speech API
- **Image Service**: AI image generation using Pollinations.ai
- **File Service**: File upload and processing with type validation
- **Storage Service**: Local storage management for offline functionality

## UI Components
- Modern chat interface with message bubbles
- Voice interaction controls with speech-to-text
- File attachment preview and management
- Image generation and display
- Settings panel with theme customization
- Conversation sidebar with history management
- Authentication modals

# Data Flow

## Message Flow
1. User inputs message through ChatInput component
2. Message processed by AIService for response generation
3. Response displayed in ChatMessage components
4. Conversation automatically saved to database (if authenticated)
5. Local storage backup for offline access

## Authentication Flow
1. User credentials submitted through AuthModal
2. Server validates and creates JWT token
3. Token stored in localStorage and used for API requests
4. Protected routes verify token middleware
5. User data persisted across sessions

## File Handling
1. Files processed through FileService with type/size validation
2. File content extracted for text files
3. Files attached to messages as metadata
4. Previews generated for supported file types

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection and querying
- **drizzle-orm**: Type-safe database queries and migrations
- **@supabase/supabase-js**: Additional backend services
- **@tanstack/react-query**: Data fetching and caching
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token creation and verification

## UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-syntax-highlighter**: Code block syntax highlighting

## Development Dependencies
- **typescript**: Type checking and compilation
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development

# Deployment Strategy

## Build Process
1. Frontend built with Vite to `dist/public`
2. Backend compiled with esbuild to `dist/index.js`
3. Static files served by Express in production
4. Environment variables required for database and API keys

## Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `NODE_ENV`: Environment mode (development/production)

## Database Setup
- Schema defined in `shared/schema.ts`
- Migrations generated with `drizzle-kit`
- Database push command: `npm run db:push`

## Production Considerations
- Express serves static files in production mode
- Development includes Vite middleware for HMR
- Error handling with structured error responses
- Request logging for API endpoints
- CORS and security headers should be configured