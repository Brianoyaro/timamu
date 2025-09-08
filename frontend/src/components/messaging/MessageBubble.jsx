import React from 'react'
import { format } from 'date-fns'
import { File, Image } from 'lucide-react'
import clsx from 'clsx'

export function MessageBubble({ message, isFromCurrentUser }) {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'file':
        return (
          <div className="flex items-center space-x-2">
            {message.attachment?.type?.startsWith('image/') ? (
              <Image className="h-5 w-5" />
            ) : (
              <File className="h-5 w-5" />
            )}
            <span className="text-sm">{message.content}</span>
          </div>
        )
      case 'text':
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    }
  }

  return (
    <div className={clsx(
      'flex mb-4',
      isFromCurrentUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
        isFromCurrentUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
      )}>
        {renderMessageContent()}
        
        <div className={clsx(
          'text-xs mt-1',
          isFromCurrentUser 
            ? 'text-primary-100' 
            : 'text-gray-500 dark:text-gray-400'
        )}>
          {format(new Date(message.createdAt), 'h:mm a')}
          {message.readAt && isFromCurrentUser && (
            <span className="ml-2">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}
