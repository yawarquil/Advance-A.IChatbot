import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 font-medium">Error</span>
        </div>
        <p className="text-red-600 text-sm mb-3">{message}</p>
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;