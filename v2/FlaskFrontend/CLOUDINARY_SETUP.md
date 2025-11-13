# Cloudinary Integration Setup Guide

This guide will help you set up Cloudinary for file uploads in the Timamu application.

## 1. Cloudinary Account Setup

1. **Create a Cloudinary Account**
   - Go to [Cloudinary](https://cloudinary.com)
   - Sign up for a free account
   - Note your dashboard details

2. **Get Your Credentials**
   From your Cloudinary Dashboard, copy:
   - **Cloud Name** (e.g., `timamu-app`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz1234567890`)

## 2. Create Upload Presets

Upload presets define how your files should be handled during upload.

1. **Go to Settings > Upload**
2. **Click "Add upload preset"**
3. **Configure the preset:**

### For General Uploads (timamu-uploads)
```
Preset name: timamu-uploads
Signing mode: Unsigned
Folder: auto (will be set by the application)
Access mode: Public
```

### For Therapist Documents (timamu-therapist-docs)
```
Preset name: timamu-therapist-docs
Signing mode: Unsigned
Folder: therapist-documents
Access mode: Public
Max file size: 10MB
Allowed formats: pdf,jpg,jpeg,png,doc,docx
```

### For Message Attachments (timamu-messages)
```
Preset name: timamu-messages
Signing mode: Unsigned
Folder: message-attachments
Access mode: Public
Max file size: 50MB
Allowed formats: jpg,jpeg,png,gif,pdf,doc,docx,mp4,mov,avi
```

## 3. Environment Configuration

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update your .env file with your Cloudinary credentials:**
   ```bash
   VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
   VITE_CLOUDINARY_API_KEY=your-actual-api-key
   VITE_CLOUDINARY_API_SECRET=your-actual-api-secret
   VITE_CLOUDINARY_UPLOAD_PRESET=timamu-uploads
   ```

## 4. Features Enabled

### ✅ Therapist Registration
- Therapists can upload professional documents (licenses, certifications, diplomas)
- Documents are stored in `therapist-documents/` folder
- Admins can view and verify documents before approving therapist applications

### ✅ Message Attachments
- Users can attach files to messages (images, documents, videos)
- Files are stored in `message-attachments/` folder
- Support for previews and downloads

### ✅ Profile Images (Future)
- Profile pictures will be stored in `profile-images/` folder
- Automatic optimization and resizing

## 5. Usage Examples

### Upload Documents During Therapist Registration
```jsx
<CloudinaryUpload
  uploadType="therapistDocuments"
  onUploadComplete={handleDocumentUpload}
  onUploadError={handleUploadError}
  multiple={true}
  maxFiles={10}
  buttonText="Upload Professional Documents"
  showPreview={true}
/>
```

### Message Attachments
```jsx
<CloudinaryUpload
  uploadType="messageAttachments"
  onUploadComplete={handleAttachmentUpload}
  onUploadError={handleUploadError}
  multiple={true}
  maxFiles={5}
  buttonText="Add Files"
  showPreview={false}
/>
```

## 6. File Type Support

### Images
- **Formats:** JPG, JPEG, PNG, GIF, WebP
- **Features:** Automatic optimization, resizing, format conversion
- **Preview:** Inline image preview with zoom functionality

### Documents
- **Formats:** PDF, DOC, DOCX
- **Features:** Document viewer for PDFs, download for Word docs
- **Preview:** PDF inline preview, document icon for others

### Videos
- **Formats:** MP4, MOV, AVI, WebM
- **Features:** Video player with controls, thumbnail generation
- **Preview:** Inline video player with controls

### Audio
- **Formats:** MP3, WAV, OGG, M4A
- **Features:** Audio player with controls
- **Preview:** Audio player widget

## 7. Security Features

- **File Type Validation:** Only allowed file types can be uploaded
- **File Size Limits:** Configurable per upload type
- **Virus Scanning:** Cloudinary provides automatic virus scanning
- **Access Control:** Public read access, but upload requires authentication

## 8. Admin Features

### Document Verification
- Admins can view all therapist documents
- Documents are displayed in a professional viewer
- Approve/reject functionality for individual documents
- Document status tracking

### File Management
- View all uploaded files by category
- File usage statistics
- Storage usage monitoring

## 9. Performance Features

- **CDN Delivery:** All files served via Cloudinary's global CDN
- **Automatic Optimization:** Images automatically optimized for web
- **Responsive Images:** Different sizes generated automatically
- **Progressive Loading:** Images load progressively for better UX

## 10. Troubleshooting

### Common Issues

**Upload Fails:**
- Check your Cloudinary credentials in .env
- Verify upload preset exists and is set to "Unsigned"
- Check file size and type restrictions

**Images Not Loading:**
- Verify CORS settings in Cloudinary
- Check if the cloud name is correct
- Ensure files are set to "Public" access

**Environment Variables Not Working:**
- Restart the development server after changing .env
- Verify the variable names start with `VITE_`
- Check for typos in variable names

### Getting Help

1. Check the [Cloudinary Documentation](https://cloudinary.com/documentation)
2. Verify your upload presets in the Cloudinary dashboard
3. Check the browser console for error messages
4. Test uploads directly in the Cloudinary dashboard

## 11. Next Steps

1. Set up your Cloudinary account and presets
2. Configure your environment variables
3. Test the upload functionality
4. Customize the upload components as needed
5. Monitor usage and optimize as necessary