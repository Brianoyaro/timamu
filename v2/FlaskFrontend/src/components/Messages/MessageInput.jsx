import { useState } from 'react';
import { FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import CloudinaryUpload from '../common/CloudinaryUpload';

const MessageInput = ({ onSendMessage, disabled = false, placeholder = "Type your message..." }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    
    setSending(true);
    try {
      await onSendMessage({
        text: message.trim(),
        attachments: attachments
      });
      
      // Clear form after successful send
      setMessage('');
      setAttachments([]);
      setShowAttachmentUpload(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentUpload = (uploadedFiles) => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    setAttachments(prev => [...prev, ...files]);
  };

  const handleAttachmentError = (error) => {
    console.error('Attachment upload error:', error);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(file => file.id !== attachmentId));
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Attachment Upload Section */}
      {showAttachmentUpload && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Add Attachments</h4>
            <button
              onClick={() => setShowAttachmentUpload(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <CloudinaryUpload
            uploadType="messageAttachments"
            onUploadComplete={handleAttachmentUpload}
            onUploadError={handleAttachmentError}
            multiple={true}
            maxFiles={5}
            buttonText="Choose Files"
            showPreview={false}
            className="w-full"
          />
        </div>
      )}

      {/* Show Current Attachments */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span className="truncate max-w-32">{attachment.originalName}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="1"
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              height: 'auto',
              overflowY: message.split('\n').length > 3 ? 'scroll' : 'hidden'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>
        
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachmentUpload(!showAttachmentUpload)}
          disabled={disabled || sending}
          className={`p-3 rounded-lg transition-colors ${
            showAttachmentUpload
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Add attachments"
        >
          <FaPaperclip className="w-4 h-4" />
        </button>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaPaperPlane className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;