import React from 'react';
import {
  HiOutlineDocument,
  HiOutlinePhotograph,
  HiOutlinePlay,
  HiOutlineVolumeUp,
  HiDownload
} from 'react-icons/hi';

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) {
    return HiOutlinePhotograph;
  } else if (mimeType?.startsWith('video/')) {
    return HiOutlinePlay;
  } else if (mimeType?.startsWith('audio/')) {
    return HiOutlineVolumeUp;
  }
  return HiOutlineDocument;
};

const getFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

const MessageAttachment = ({ file }) => {
  const Icon = getFileIcon(file.type);
  const isImage = file.type?.startsWith('image/');
  
  return (
    <div className="mt-2">
      {isImage ? (
        // Image Preview
        <div className="relative group">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-[200px] rounded-lg"
          />
          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
          >
            <HiDownload className="h-6 w-6 text-white" />
          </a>
        </div>
      ) : (
        // Other File Types
        <a
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-3 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-75 transition-colors"
        >
          <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{getFileSize(file.size)}</p>
          </div>
          <HiDownload className="h-5 w-5 ml-3 flex-shrink-0" />
        </a>
      )}
    </div>
  );
};

const MessageAttachments = ({ attachments }) => {
  if (!attachments?.files?.length) return null;

  return (
    <div className="space-y-2">
      {attachments.files.map((file, index) => (
        <MessageAttachment key={index} file={file} />
      ))}
    </div>
  );
};

export default MessageAttachments;