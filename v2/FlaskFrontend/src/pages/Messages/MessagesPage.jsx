import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { format, formatDistance } from 'date-fns';
import { 
  HiOutlinePaperClip as AttachmentIcon,
  HiOutlineUpload as SendIcon,
  HiChevronRight as ArrowIcon
} from 'react-icons/hi';

export default function MessagesPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await api.get('/messages/conversations');
        const data = response.data;
        const convs = Array.isArray(data)
          ? data
          : data?.messages || data?.conversations || data?.items || data?.data || [];
        setConversations(convs);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConversation?.id) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation]);

    const fetchMessages = async (threadId) => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/conversations/${threadId}/messages`);
      // Map and sort messages chronologically
      const msgs = (response.data.messages || [])
        .map(msg => ({
          ...msg,
          isSentByMe: msg.sender_id === user?.id
        }))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Oldest to newest
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    if (conversation?.id) {
      await fetchMessages(conversation.id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentConversation?.id || (!newMessage.trim() && !fileInputRef.current?.files?.length)) return;
    try {
      let attachments = null;
      if (fileInputRef.current?.files?.length) {
        attachments = {
          files: Array.from(fileInputRef.current.files).map(file => ({
            name: file.name || 'Unknown file',
            type: file.type || 'application/octet-stream',
            size: file.size || 0
          }))
        };
      }
      const response = await api.post(`/messages/conversations/${currentConversation.id}/messages`, {
        content: newMessage,
        attachments,
        message_type: attachments ? 'file' : 'text'
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm');
    }
    
    if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistance(messageDate, now, { addSuffix: true });
    }
    
    return format(messageDate, 'MMM d, yyyy');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Conversations List */}
      <div className={`${
        currentConversation ? 'hidden md:block' : 'block'
      } md:w-1/3 border-r border-gray-200 bg-white overflow-y-auto`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => {
              // Skip if conversation is invalid or missing required properties
              if (!conversation?.id || !conversation?.participant) return null;
              const otherParticipant = conversation.participant;
              const isSelected = currentConversation?.id === conversation.id;
              
              return (
                <button
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`w-full p-4 hover:bg-gray-50 flex items-start transition-colors ${
                isSelected ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {otherParticipant?.name?.charAt(0) || '?'}
                </div>
                {conversation.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{conversation.unread_count}</span>
                  </div>
                )}
              </div>                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant?.name || 'Unknown'}
                      </p>
                      {conversation.last_message_at && (
                        <p className="text-xs text-gray-500">
                          {formatMessageTime(conversation.last_message_at)}
                        </p>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.last_message.content || ''}
                      </p>
                    )}
                  </div>
                  <ArrowIcon className="ml-2 h-5 w-5 text-gray-400" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`${
        !currentConversation ? 'hidden md:flex' : 'flex'
      } flex-1 flex-col bg-gray-50`}>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentConversation(null)} 
                  className="md:hidden mr-2 p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {currentConversation.participant?.name?.charAt(0) || '?'}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentConversation.participant?.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentConversation.participant?.role?.toLowerCase() || 'user'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4">
              <div className="space-y-1">
                {messages?.map((message) => {
                  if (!message?.id) return null;
                  
                  const isSentByMe = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`relative max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                          isSentByMe
                            ? 'bg-[#dcf8c6] text-black rounded-tr-none'
                            : 'bg-white text-black rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content || ''}</p>
                        {message.attachments?.files?.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {message.attachments.files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center text-xs text-gray-600"
                              >
                                <AttachmentIcon className="h-4 w-4 mr-1" />
                                <span>{file?.name || 'File'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] mt-1 text-right text-gray-500">
                          {message.created_at ? formatMessageTime(message.created_at) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message Input */}
            <div className="px-4 py-2 bg-[#f0f0f0]">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={() => {}}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <AttachmentIcon className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 px-4 py-2 bg-white rounded-full focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !fileInputRef.current?.files?.length}
                  className="p-2 text-white bg-[#25D366] rounded-full hover:bg-[#1fa855] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}