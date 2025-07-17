import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ message = "Thinking..." }) => {
  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start space-x-3 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600">
          <Bot className="h-4 w-4" />
        </div>
        <div className="ml-3">
          <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{message}</span>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;