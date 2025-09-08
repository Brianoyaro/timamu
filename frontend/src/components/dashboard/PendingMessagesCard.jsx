import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  MessageCircle,
  ArrowRightIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { messagingService } from '../../services/messagingService'
import { useAuthStore } from '../../store/authStore'

export function PendingMessagesCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user } = useAuthStore()
  const [pendingMessages, setPendingMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPendingMessages = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const threads = await messagingService.getThreads()
        
        // Filter threads with unread messages
        const unreadThreads = threads.filter(thread => 
          thread.unreadCount > 0 || !thread.lastReadAt || 
          (thread.lastMessage && new Date(thread.lastMessage.createdAt) > new Date(thread.lastReadAt))
        )
        
        setPendingMessages(unreadThreads.slice(0, 5)) // Show only first 5
      } catch (err) {
        console.error('Error fetching pending messages:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPendingMessages()
    }
  }, [user])

  const handleViewMessage = (threadId) => {
    navigate(`/t/${tenantId}/messages/${threadId}`)
  }

  const handleViewAllMessages = () => {
    navigate(`/t/${tenantId}/messages`)
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending Messages
        </h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
              <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending Messages
        </h2>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">
            Error loading messages: {error}
          </p>
        </div>
      </div>
    )
  }

  if (pendingMessages.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending Messages
        </h2>
        <div className="text-center py-8">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No pending messages
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pending Messages
        </h2>
        <button
          onClick={handleViewAllMessages}
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
        >
          View all
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="space-y-3">
        {pendingMessages.map((thread) => {
          // Get the other participant (not the current user)
          const otherParticipant = thread.participants?.find(p => p.id !== user?.id)
          
          return (
            <button
              key={thread.id}
              onClick={() => handleViewMessage(thread.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <img
                    src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'Unknown')}&background=3b82f6&color=fff`}
                    alt={otherParticipant?.name || 'Unknown'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {thread.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {otherParticipant?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {thread.lastMessage ? format(new Date(thread.lastMessage.createdAt), 'h:mm a') : ''}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                    {thread.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
