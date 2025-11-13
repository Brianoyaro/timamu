import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import useMessageStore from '../../stores/messageStore';
import MessageInput from '../../components/Messages/MessageInput';
import MessageAttachments from '../../components/Messages/MessageAttachments';
import { format, formatDistance } from 'date-fns';
import { 
  HiChevronRight as ArrowIcon
} from 'react-icons/hi';

export default function MessagesPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const messageStore = useMessageStore();
  const messagesEndRef = useRef(null);

  const { 
    conversations, 
    currentConversation, 
    messages, 
    isLoading: loading,
    fetchConversations,
    fetchMessages,
    setCurrentConversation,
    fetchUnreadCount
  } = messageStore;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConversation?.id) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleSendMessage = async (messageData) => {
    if (!currentConversation?.id) return;
    
    try {
      await messageStore.sendMessage(
        currentConversation.id, 
        messageData.text, 
        messageData.attachments ? { files: messageData.attachments } : null
      );
      
      // Refresh messages to ensure correct order
      await messageStore.fetchMessages(currentConversation.id);
      // Update conversations list to show latest message
      await messageStore.fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error; // Let MessageInput handle the error display
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
                    {conversation.recent_message && (
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {user.id === conversation.recent_message.sender_id ? 'You: ' : ''}
                        {conversation.recent_message.content || 
                         (conversation.recent_message.attachments?.files?.length ? 
                          '📎 Attachment' : '')}
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
              <div className="space-y-1 flex flex-col-reverse">
                {messages?.slice().reverse().map((message) => {
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
                          <MessageAttachments 
                            attachments={message.attachments.files} 
                            compact={true}
                          />
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
            
            {/* Enhanced Message Input */}
            <MessageInput 
              onSendMessage={handleSendMessage}
              placeholder="Type a message..."
              disabled={loading}
            />
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