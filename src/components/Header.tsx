import React from 'react';
import { Bot, MessageCircle, Settings, Menu } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';

interface HeaderProps {
  onSettingsClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onMenuClick }) => {
  const { settings } = useThemeContext();

  const getGradientClass = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-gradient-to-r from-gray-800 to-gray-900';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-blue-800';
      case 'purple':
        return 'bg-gradient-to-r from-purple-600 to-purple-800';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
  };

  return (
    <header className={`${getGradientClass()} text-white p-4 shadow-lg transition-all duration-300`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            title="Toggle chat history"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="bg-white/20 p-2 rounded-full">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Chat Assistant</h1>
            <p className="text-blue-100 text-sm">Multi-Model AI Chatbot</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-200" />
            <span className="text-sm text-blue-100">Always here to help</span>
          </div>
          <button
            onClick={onSettingsClick}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;