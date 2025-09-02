import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ChatBubbleLeftRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export function PendingMessagesCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  // Mock pending messages - replace with real API call
  const pendingMessages = [
    {
      id: '1',
      patient: {
        id: 'patient-1',
        name: 'John Doe',
        avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      lastMessage: 'Thank you for the session today. I have a question about the homework.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 2
    },
    {
      id: '2',
      patient: {
        id: 'patient-2',
        name: 'Jane Smith',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      lastMessage: 'I\'ve been practicing the breathing exercises and they\'re really helping.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 1
    }
  ]

  const handleViewMessage = (patientId) => {
    navigate(`/t/${tenantId}/messages/${patientId}`)
  }

  const handleViewAllMessages = () => {
    navigate(`/t/${tenantId}/messages`)
  }

  if (pendingMessages.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending Messages
        </h2>
        <div className="text-center py-8">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
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
        {pendingMessages.map((message) => (
          <button
            key={message.id}
            onClick={() => handleViewMessage(message.patient.id)}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="relative">
                <img
                  src={message.patient.avatar}
                  alt={message.patient.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                {message.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {message.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {message.patient.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                  {message.lastMessage}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
