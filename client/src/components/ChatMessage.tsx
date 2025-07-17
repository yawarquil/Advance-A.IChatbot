import React, { useState } from 'react';
import { Bot, User, Volume2, VolumeX, RotateCcw, Image } from 'lucide-react';
import { Message } from '../types/chat';
import { VoiceService } from '../services/voiceService';
import AttachmentPreview from './AttachmentPreview';
import ImageMessage from './ImageMessage';
import MessageContent from './MessageContent';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  voiceEnabled: boolean;
  voiceSettings?: {
    selectedVoice: string;
    voiceSpeed: number;
    voicePitch: number;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRegenerate, 
  voiceEnabled, 
  voiceSettings 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceService = new VoiceService();
  const isUser = message.type === 'user';
  
  const handleSpeak = async () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await voiceService.speak(message.text, {
        voiceName: voiceSettings?.selectedVoice,
        rate: voiceSettings?.voiceSpeed || 1,
        pitch: voiceSettings?.voicePitch || 1,
      });
      setIsSpeaking(false);
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in group`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        
        <div className={`${isUser ? 'mr-3' : 'ml-3'} flex-1`}>
          <div className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-800 rounded-bl-md dark:bg-gray-800 dark:text-gray-200'
          } shadow-sm relative`}>
            <div className="text-sm leading-relaxed">
              <MessageContent text={message.text} />
            </div>
            
            {/* AI Generated Image */}
            {message.imageUrl && (
              <ImageMessage
                imageUrl={message.imageUrl}
                imagePrompt={message.imagePrompt}
              />
            )}
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    showRemove={false}
                  />
                ))}
              </div>
            )}
            
            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex items-center justify-end space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {voiceEnabled && voiceService.isSpeechSupported() && (
                  <button
                    onClick={handleSpeak}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mt-1`}>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.model && (
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {message.model}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;