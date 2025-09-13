import React, { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChatList } from '../components/messaging/ChatList'
import { ChatWindow } from '../components/messaging/ChatWindow'
import { EmptyState } from '../components/common/EmptyState'
import { MessageCircle } from 'lucide-react'
import { messagingService } from '../services/messagingService'
import { analyticsService } from '../services/analyticsService'

export function MessagesPage() {
  const { t } = useTranslation()
  const { peerId } = useParams()
  const location = useLocation()
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadThreads()
    analyticsService.page('Messages')
  }, [])

  useEffect(() => {
    if (threads.length > 0) {
      // Handle navigation from therapist detail page
      const threadIdFromState = location.state?.threadId
      if (threadIdFromState) {
        const thread = threads.find(t => t.id === threadIdFromState)
        if (thread) {
          setSelectedThread(thread)
          return
        }
      }
      
      // Handle URL parameter for backward compatibility
      if (peerId) {
        const thread = threads.find(t => 
          t.participants.some(p => p.id === peerId)
        )
        if (thread) {
          setSelectedThread(thread)
        }
      }
    }
  }, [peerId, threads, location.state])

  const loadThreads = async () => {
    try {
      const data = await messagingService.getThreads()
      setThreads(data)
    } catch (error) {
      console.error('Failed to load threads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread)
  }

  const handleNewMessage = (threadId, message) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId
          ? { ...thread, lastMessage: message, updatedAt: new Date() }
          : thread
      )
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row">
      {/* Chat list - Mobile: full screen when no selection, Desktop: sidebar */}
      <div className={`lg:w-80 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 ${
        selectedThread ? 'hidden lg:block' : 'flex-1'
      }`}>
        <ChatList
          threads={threads}
          selectedThread={selectedThread}
          onThreadSelect={handleThreadSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Chat window - Mobile: full screen when selected, Desktop: main area */}
      <div className={`flex-1 ${selectedThread ? 'flex' : 'hidden lg:flex'} flex-col`}>
        {selectedThread ? (
          <ChatWindow
            thread={selectedThread}
            onNewMessage={handleNewMessage}
            onBack={() => setSelectedThread(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Select a conversation"
              description="Choose a conversation from the list to start messaging"
            />
          </div>
        )}
      </div>
    </div>
  )
}
