import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronLeftIcon,
  Send,
  Paperclip,
  Smile
} from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { LoadingSkeleton } from '../common/LoadingSkeleton'
import { messagingService } from '../../services/messagingService'
import { useAuthStore } from '../../store/authStore'

export function ChatWindow({ thread, onNewMessage, onBack }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const otherParticipant = thread.participants.find(p => p.id !== user?.id)

  useEffect(() => {
    loadMessages()
  }, [thread.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const data = await messagingService.getMessages(thread.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      const message = await messagingService.sendMessage(thread.id, {
        content: messageContent,
        type: 'text'
      })

      setMessages(prev => [...prev, message])
      onNewMessage(thread.id, message)
    } catch (error) {
      console.error('Failed to send message:', error)
      setNewMessage(messageContent) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (file) => {
    try {
      setIsSending(true)
      const attachment = await messagingService.uploadAttachment(thread.id, file)
      
      const message = await messagingService.sendMessage(thread.id, {
        content: file.name,
        type: 'file',
        attachment
      })

      setMessages(prev => [...prev, message])
      onNewMessage(thread.id, message)
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Back to conversations"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-3 ml-2 lg:ml-0">
          <img
            src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=3b82f6&color=fff`}
            alt={otherParticipant?.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {otherParticipant?.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {otherParticipant?.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <LoadingSkeleton className={`max-w-xs p-3 rounded-lg ${
                  i % 2 === 0 ? 'h-12 w-32' : 'h-16 w-48'
                }`} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isFromCurrentUser={message.senderId === user?.id}
              />
            ))}
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message composer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messaging.typeMessage')}
                rows={1}
                className="input resize-none pr-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              
              {/* Attachment and emoji buttons */}
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="btn btn-primary p-2 disabled:opacity-50"
            aria-label={t('messaging.sendMessage')}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileUpload(file)
            }
          }}
          accept="image/*,application/pdf,.doc,.docx"
        />
      </div>
    </div>
  )
}
