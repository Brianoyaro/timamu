import React, { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'appointment',
      title: 'Session reminder',
      message: 'Your session with Dr. Johnson starts in 15 minutes',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false
    },
    {
      id: '2',
      type: 'message',
      title: 'New message',
      message: 'Dr. Johnson sent you a follow-up resource',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false
    },
    {
      id: '3',
      type: 'system',
      title: 'Assessment available',
      message: 'Your weekly PHQ-9 assessment is ready',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={clsx(
                          'w-full p-4 text-left transition-colors',
                          active && 'bg-gray-50 dark:bg-gray-700',
                          !notification.isRead && 'bg-blue-50 dark:bg-blue-900'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.isRead ? 'bg-gray-300' : 'bg-primary-500'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {format(notification.timestamp, 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
