import React from 'react'

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
