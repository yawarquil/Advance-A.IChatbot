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
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

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

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="mt-3 max-w-sm animate-fade-in">
      <div className="relative group">
        {!imageLoaded && !imageError && (
          <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating image...</p>
            </div>
          </div>
        )}
        
        {imageError && (
          <div className="w-full h-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-red-500 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={imagePrompt || 'AI generated image'}
          className={`w-full rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        
        {/* Overlay with actions */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 ${
          imageLoaded ? '' : 'pointer-events-none'
        }`}>
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
          🎨 Generated from: "{imagePrompt}"
        </p>
      )}
    </div>
  );
};

export default ImageMessage;