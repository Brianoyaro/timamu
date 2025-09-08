import React, { useState } from 'react'
import { 
  PlayIcon,
  BookOpenIcon,
  DocumentTextIcon,
  SpeakerWaveIcon,
  HeartIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import clsx from 'clsx'

const typeIcons = {
  video: PlayIcon,
  article: DocumentTextIcon,
  audio: SpeakerWaveIcon,
  workbook: BookOpenIcon,
  tool: DocumentTextIcon
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

export function ResourceCard({ resource }) {
  const [isFavorited, setIsFavorited] = useState(resource.isFavorited)
  const TypeIcon = typeIcons[resource.type]

  const handleFavoriteToggle = (e) => {
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    // Mock API call - replace with real implementation
    console.log('Toggle favorite:', resource.id, !isFavorited)
  }

  const handleResourceClick = () => {
    // Track resource access
    console.log('Resource accessed:', resource.id)
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      onClick={handleResourceClick}
      className="card p-0 cursor-pointer hover:shadow-md transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className="w-full h-48 object-cover rounded-t-xl"
        />
        
        {/* Type indicator */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-75 text-white p-2 rounded-lg">
          <TypeIcon className="h-4 w-4" />
        </div>
        
        {/* Favorite button */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-3 right-3 p-2 rounded-lg bg-black bg-opacity-75 text-white hover:bg-opacity-90 transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? (
            <HeartIconSolid className="h-4 w-4 text-red-500" />
          ) : (
            <HeartIcon className="h-4 w-4" />
          )}
        </button>

        {/* Play overlay for videos */}
        {resource.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 group-hover:bg-opacity-40 transition-colors rounded-t-xl">
            <div className="bg-white bg-opacity-90 p-3 rounded-full">
              <PlayIcon className="h-6 w-6 text-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {resource.title}
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {resource.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-3 w-3" />
            <span>{resource.duration}</span>
          </div>
          
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            difficultyColors[resource.difficulty]
          )}>
            {resource.difficulty}
          </span>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Author and date */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <UserIcon className="h-3 w-3" />
            <span>{resource.author}</span>
          </div>
          
          <span>
            {format(new Date(resource.publishedAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </div>
  )
}
