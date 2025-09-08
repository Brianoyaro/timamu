import React from 'react'
import { useTranslation } from 'react-i18next'
import { format, isToday, isYesterday } from 'date-fns'
import { LoadingSkeleton } from '../common/LoadingSkeleton'
import { EmptyState } from '../common/EmptyState'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export function ChatList({ threads, selectedThread, onThreadSelect, isLoading }) {
  const { t } = useTranslation()

  const formatMessageTime = (date) => {
    const messageDate = new Date(date)
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a')
    } else if (isYesterday(messageDate)) {
      return 'Yesterday'
    } else {
      return format(messageDate, 'MMM d')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <LoadingSkeleton className="h-6 w-32" />
        </div>
        
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <LoadingSkeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <LoadingSkeleton className="h-4 w-24 mb-2" />
                <LoadingSkeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('navigation.messages')}
        </h2>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {threads.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ChatBubbleLeftRightIcon}
              title="No conversations"
              description="Start messaging with your therapist or patients"
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {threads.map((thread) => {
              const otherParticipant = thread.participants.find(p => p.id !== user?.id)
              const isSelected = selectedThread?.id === thread.id
              
              return (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread)}
                  className={clsx(
                    'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    isSelected && 'bg-primary-50 dark:bg-primary-900'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <img
                        src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=3b82f6&color=fff`}
                        alt={otherParticipant?.name}
                        className="h-12 w-12 rounded-full object-cover"
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
                          {otherParticipant?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {thread.lastMessage && formatMessageTime(thread.lastMessage.createdAt)}
                        </p>
                      </div>
                      
                      {thread.lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                          {thread.lastMessage.isFromCurrentUser && 'You: '}
                          {thread.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
