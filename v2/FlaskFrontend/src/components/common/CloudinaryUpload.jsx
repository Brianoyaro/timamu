import { useState, useRef } from 'react';
import { 
  FaUpload, 
  FaImage, 
  FaVideo, 
  FaFilePdf, 
  FaFileWord, 
  FaMusic, 
  FaFile, 
  FaTimes, 
  FaCheck,
  FaSpinner,
  FaEye
} from 'react-icons/fa';
import { cloudinaryConfig, uploadOptions, validateFile, getFileCategory, getFileIcon } from '../../config/cloudinary';

const CloudinaryUpload = ({ 
  uploadType = 'messageAttachments', 
  onUploadComplete, 
  onUploadError,
  multiple = false,
  acceptedTypes,
  maxFiles = 5,
  showPreview = true,
  className = '',
  buttonText = 'Upload Files',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Get upload options for the specified type
  const options = uploadOptions[uploadType] || uploadOptions.messageAttachments;
  
  // Create accepted types string for input
  const acceptString = acceptedTypes || options.allowed_formats.map(f => `.${f}`).join(',');

  const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      formData.append('folder', options.folder);
      
      // Add transformation parameters if specified
      if (options.transformation) {
        formData.append('transformation', JSON.stringify(options.transformation));
      }

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: percentComplete
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`);
      xhr.send(formData);
    });
  };

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    
    // Check file count limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newUploadedFiles = [];

    try {
      for (const file of fileArray) {
        // Validate file
        const validation = validateFile(file, uploadType);
        if (!validation.isValid) {
          onUploadError?.(validation.error);
          continue;
        }

        try {
          // Upload to Cloudinary
          const result = await uploadToCloudinary(file);
          
          const fileData = {
            id: result.public_id,
            url: result.secure_url,
            originalName: file.name,
            size: file.size,
            format: result.format,
            resourceType: result.resource_type,
            category: getFileCategory(file.name),
            uploadedAt: new Date().toISOString()
          };

          newUploadedFiles.push(fileData);
          
          // Remove from progress tracking
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });

        } catch (error) {
          console.error('Upload error for', file.name, error);
          onUploadError?.(`Failed to upload ${file.name}`);
        }
      }

      // Update uploaded files state
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      // Call success callback
      if (newUploadedFiles.length > 0) {
        onUploadComplete?.(multiple ? newUploadedFiles : newUploadedFiles[0]);
      }

    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const renderFileIcon = (category) => {
    const iconClass = "w-4 h-4";
    switch (category) {
      case 'image': return <FaImage className={iconClass} />;
      case 'video': return <FaVideo className={iconClass} />;
      case 'pdf': return <FaFilePdf className={iconClass} />;
      case 'document': return <FaFileWord className={iconClass} />;
      case 'audio': return <FaMusic className={iconClass} />;
      default: return <FaFile className={iconClass} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openPreview = (fileUrl, fileName) => {
    window.open(fileUrl, '_blank', `toolbar=no,scrollbars=yes,resizable=yes,width=800,height=600`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || uploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptString}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center space-y-2">
          <FaUpload className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : buttonText}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Accepted: {options.allowed_formats.join(', ').toUpperCase()} 
              (Max: {Math.round(options.max_file_size / 1000000)}MB each)
            </p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <FaSpinner className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate">{fileName}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-center space-x-3">
                  {renderFileIcon(file.category)}
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.format.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(file.url, file.originalName);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Preview file"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove file"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;