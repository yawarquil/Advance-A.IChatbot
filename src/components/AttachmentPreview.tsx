import React from 'react';
import { X, Download, Eye } from 'lucide-react';
import { Attachment } from '../types/chat';
import { FileService } from '../services/fileService';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  showRemove?: boolean;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ 
  attachment, 
  onRemove, 
  showRemove = false 
}) => {
  const fileService = new FileService();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    window.open(attachment.url, '_blank');
  };

  return (
    <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 max-w-xs">
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-start space-x-3">
        <div className="text-2xl">
          {fileService.getFileIcon(attachment.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {attachment.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fileService.formatFileSize(attachment.size)}
          </p>
          
          {fileService.isImageFile(attachment.type) && attachment.content && (
            <div className="mt-2">
              <img
                src={attachment.content}
                alt={attachment.name}
                className="max-w-full h-20 object-cover rounded border"
              />
            </div>
          )}
          
          {attachment.type.startsWith('text/') && attachment.content && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs max-h-16 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {attachment.content.substring(0, 200)}
                {attachment.content.length > 200 && '...'}
              </pre>
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={handlePreview}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleDownload}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xs flex items-center space-x-1"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreview;