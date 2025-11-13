import React from 'react';
import { 
  FaImage, 
  FaVideo, 
  FaFilePdf, 
  FaFileWord, 
  FaMusic, 
  FaFile, 
  FaDownload,
  FaEye,
  FaExpand
} from 'react-icons/fa';
import { getFileCategory } from '../../config/cloudinary';

const MessageAttachments = ({ attachments = [], compact = false }) => {
  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (category, className = "w-4 h-4") => {
    switch (category) {
      case 'pdf':
        return <FaFilePdf className={`${className} text-red-500`} />;
      case 'document':
        return <FaFileWord className={`${className} text-blue-500`} />;
      case 'image':
        return <FaImage className={`${className} text-green-500`} />;
      case 'video':
        return <FaVideo className={`${className} text-purple-500`} />;
      case 'audio':
        return <FaMusic className={`${className} text-orange-500`} />;
      default:
        return <FaFile className={`${className} text-gray-500`} />;
    }
  };

  const openFile = (attachment) => {
    window.open(attachment.url, '_blank');
  };

  const downloadFile = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName || attachment.fileName || 'file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderImagePreview = (attachment) => (
    <div className="relative group">
      <img
        src={attachment.url}
        alt={attachment.originalName || 'Image'}
        className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => openFile(attachment)}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button
          onClick={() => openFile(attachment)}
          className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
          title="View full size"
        >
          <FaExpand className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </div>
  );

  const renderVideoPreview = (attachment) => (
    <div className="relative max-w-xs">
      <video
        controls
        className="max-h-48 rounded-lg"
        preload="metadata"
      >
        <source src={attachment.url} />
        Your browser does not support the video tag.
      </video>
    </div>
  );

  const renderFilePreview = (attachment) => {
    const category = getFileCategory(attachment.originalName || attachment.fileName || '');
    
    return (
      <div className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 p-3 rounded-lg border max-w-xs transition-colors">
        {getFileIcon(category, "w-6 h-6")}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.originalName || attachment.fileName || 'Unknown file'}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(attachment.size)} • {attachment.format?.toUpperCase() || 'FILE'}
          </p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => openFile(attachment)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="View file"
          >
            <FaEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => downloadFile(attachment)}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="Download file"
          >
            <FaDownload className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderCompactAttachment = (attachment) => {
    const category = getFileCategory(attachment.originalName || attachment.fileName || '');
    
    return (
      <button
        onClick={() => openFile(attachment)}
        className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors"
        title={`${attachment.originalName} (${formatFileSize(attachment.size)})`}
      >
        {getFileIcon(category, "w-3 h-3")}
        <span className="truncate max-w-20">{attachment.originalName || 'File'}</span>
      </button>
    );
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((attachment, index) => (
          <div key={attachment.id || index}>
            {renderCompactAttachment(attachment)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {attachments.map((attachment, index) => {
        const category = getFileCategory(attachment.originalName || attachment.fileName || '');
        
        return (
          <div key={attachment.id || index}>
            {category === 'image' && renderImagePreview(attachment)}
            {category === 'video' && renderVideoPreview(attachment)}
            {!['image', 'video'].includes(category) && renderFilePreview(attachment)}
          </div>
        );
      })}
    </div>
  );
};

export default MessageAttachments;