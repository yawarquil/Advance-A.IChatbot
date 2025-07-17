import React from 'react';
import { Download, Eye } from 'lucide-react';

interface ImageMessageProps {
  imageUrl: string;
  imagePrompt?: string;
  onDownload?: () => void;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ 
  imageUrl, 
  imagePrompt, 
  onDownload 
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `ai-generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="mt-3 max-w-sm">
      <div className="relative group">
        <img
          src={imageUrl}
          alt={imagePrompt || 'AI generated image'}
          className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow"
          loading="lazy"
        />
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={handlePreview}
              className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="View full size"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownload}
              className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {imagePrompt && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          Generated from: "{imagePrompt}"
        </p>
      )}
    </div>
  );
};

export default ImageMessage;