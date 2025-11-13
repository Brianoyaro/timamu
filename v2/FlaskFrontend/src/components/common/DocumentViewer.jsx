import { useState } from 'react';
import { 
  FaFilePdf, 
  FaFileWord, 
  FaImage, 
  FaVideo, 
  FaDownload, 
  FaEye, 
  FaExpand,
  FaTimes,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';
import { getFileCategory } from '../../config/cloudinary';

const DocumentViewer = ({ 
  documents = [], 
  onApprove, 
  onReject, 
  showActions = false,
  title = "Documents",
  className = ""
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (category, className = "w-5 h-5") => {
    switch (category) {
      case 'pdf':
        return <FaFilePdf className={`${className} text-red-500`} />;
      case 'document':
        return <FaFileWord className={`${className} text-blue-500`} />;
      case 'image':
        return <FaImage className={`${className} text-green-500`} />;
      case 'video':
        return <FaVideo className={`${className} text-purple-500`} />;
      default:
        return <FaFilePdf className={`${className} text-gray-500`} />;
    }
  };

  const openDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const downloadDocument = (document) => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.originalName || document.fileName || 'document';
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
  };

  const renderDocumentPreview = (document) => {
    const category = getFileCategory(document.originalName || document.fileName || '');
    
    if (category === 'image') {
      return (
        <img 
          src={document.url} 
          alt={document.originalName || 'Document'} 
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    } else if (category === 'pdf') {
      return (
        <iframe 
          src={`${document.url}#toolbar=0`}
          className="w-full h-full border-0"
          title={document.originalName || 'PDF Document'}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          {getFileIcon(category, "w-16 h-16")}
          <p className="mt-4 text-sm">Preview not available</p>
          <p className="text-xs">Click download to view this file</p>
        </div>
      );
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <FaExclamationTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No documents uploaded</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document, index) => {
          const category = getFileCategory(document.originalName || document.fileName || '');
          
          return (
            <div key={document.id || index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Document Preview */}
              <div className="h-32 bg-gray-50 flex items-center justify-center border-b">
                {category === 'image' ? (
                  <img 
                    src={document.url} 
                    alt={document.originalName || 'Document'} 
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() => openDocument(document)}
                  />
                ) : (
                  <div 
                    className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-gray-800"
                    onClick={() => openDocument(document)}
                  >
                    {getFileIcon(category, "w-8 h-8")}
                    <span className="text-xs mt-1 font-medium">
                      {document.format?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-800 truncate mb-1">
                  {document.originalName || document.fileName || 'Unnamed Document'}
                </h4>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(document.size)}</span>
                  <span>{formatDate(document.uploadedAt || document.createdAt)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openDocument(document)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <FaEye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => downloadDocument(document)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <FaDownload className="w-3 h-3 mr-1" />
                    Download
                  </button>
                </div>

                {/* Admin Actions */}
                {showActions && (onApprove || onReject) && (
                  <div className="flex space-x-2 mt-2">
                    {onApprove && (
                      <button
                        onClick={() => onApprove(document)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        <FaCheck className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(document)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <FaTimes className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Document Viewing */}
      {showModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedDocument.originalName || selectedDocument.fileName || 'Document'}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedDocument.size)} • {formatDate(selectedDocument.uploadedAt || selectedDocument.createdAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadDocument(selectedDocument)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Download"
                >
                  <FaDownload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open(selectedDocument.url, '_blank')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Open in new tab"
                >
                  <FaExpand className="w-4 h-4" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full h-full" style={{ minHeight: '60vh' }}>
                {renderDocumentPreview(selectedDocument)}
                {/* Fallback content for unsupported files */}
                <div 
                  className="hidden w-full h-full flex-col items-center justify-center text-gray-500"
                  style={{ display: 'none' }}
                >
                  {getFileIcon(getFileCategory(selectedDocument.originalName || selectedDocument.fileName || ''), "w-16 h-16")}
                  <p className="mt-4 text-lg font-medium">Preview not available</p>
                  <p className="text-sm mb-4">This file type cannot be previewed in the browser</p>
                  <button
                    onClick={() => downloadDocument(selectedDocument)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download to view
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            {showActions && (onApprove || onReject) && (
              <div className="flex justify-end space-x-3 p-4 border-t">
                {onReject && (
                  <button
                    onClick={() => {
                      onReject(selectedDocument);
                      closeModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Reject Document
                  </button>
                )}
                {onApprove && (
                  <button
                    onClick={() => {
                      onApprove(selectedDocument);
                      closeModal();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Approve Document
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;