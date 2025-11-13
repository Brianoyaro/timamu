// Cloudinary configuration for file uploads
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || 'your-api-key',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'your-api-secret',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'timamu-uploads',
};

// Upload options for different file types
export const uploadOptions = {
  // Therapist documents (PDFs, images)
  therapistDocuments: {
    folder: 'therapist-documents',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    max_file_size: 10000000, // 10MB
    quality: 'auto',
    fetch_format: 'auto'
  },
  
  // Message attachments
  messageAttachments: {
    folder: 'message-attachments',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi'],
    max_file_size: 50000000, // 50MB
    quality: 'auto',
    fetch_format: 'auto'
  },
  
  // Profile images
  profileImages: {
    folder: 'profile-images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    max_file_size: 5000000, // 5MB
    transformation: [
      { width: 500, height: 500, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
    ]
  },
  
  // Video calls/sessions (if needed)
  sessionMedia: {
    folder: 'session-media',
    resource_type: 'auto',
    allowed_formats: ['mp4', 'webm', 'mov'],
    max_file_size: 100000000, // 100MB
    quality: 'auto'
  }
};

// Validation functions
export const validateFile = (file, type = 'messageAttachments') => {
  const options = uploadOptions[type];
  
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Check file size
  if (file.size > options.max_file_size) {
    const maxSizeMB = Math.round(options.max_file_size / 1000000);
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!options.allowed_formats.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `File type .${fileExtension} is not allowed. Allowed types: ${options.allowed_formats.join(', ')}` 
    };
  }
  
  return { isValid: true };
};

// Get file type category
export const getFileCategory = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(extension)) {
    return 'video';
  } else if (['pdf'].includes(extension)) {
    return 'pdf';
  } else if (['doc', 'docx'].includes(extension)) {
    return 'document';
  } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
    return 'audio';
  } else {
    return 'file';
  }
};

// Get appropriate icon for file type
export const getFileIcon = (fileName) => {
  const category = getFileCategory(fileName);
  
  switch (category) {
    case 'image':
      return 'FaImage';
    case 'video':
      return 'FaVideo';
    case 'pdf':
      return 'FaFilePdf';
    case 'document':
      return 'FaFileWord';
    case 'audio':
      return 'FaMusic';
    default:
      return 'FaFile';
  }
};
