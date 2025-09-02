import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  StarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export function TherapistCard({ therapist }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  const handleViewProfile = () => {
    navigate(`/t/${tenantId}/therapists/${therapist.id}`)
  }

  const handleBookSession = () => {
    navigate(`/t/${tenantId}/schedule?therapist=${therapist.id}`)
  }

  const handleSendMessage = (e) => {
    e.stopPropagation()
    navigate(`/t/${tenantId}/messages/${therapist.id}`)
  }

  return (
    <div 
      onClick={handleViewProfile}
      className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Avatar and basic info */}
      <div className="text-center mb-4">
        <img
          src={therapist.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=3b82f6&color=fff`}
          alt={therapist.name}
          className="w-16 h-16 rounded-full mx-auto object-cover"
        />
        
        <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">
          {therapist.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {therapist.title || 'Licensed Therapist'}
        </p>
      </div>

      {/* Rating */}
      {therapist.rating && (
        <div className="flex items-center justify-center space-x-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <span key={i}>
              {i < Math.floor(therapist.rating) ? (
                <StarIconSolid className="h-4 w-4 text-yellow-400" />
              ) : (
                <StarIcon className="h-4 w-4 text-gray-300" />
              )}
            </span>
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            ({therapist.reviewCount || 0})
          </span>
        </div>
      )}

      {/* Specializations */}
      {therapist.specializations && therapist.specializations.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 justify-center">
            {therapist.specializations.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
              >
                {spec}
              </span>
            ))}
            {therapist.specializations.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{therapist.specializations.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Languages */}
      {therapist.languages && therapist.languages.length > 0 && (
        <div className="flex items-center justify-center space-x-1 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <GlobeAltIcon className="h-4 w-4" />
          <span>{therapist.languages.join(', ')}</span>
        </div>
      )}

      {/* Availability indicator */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          therapist.isAvailable ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {therapist.isAvailable ? 'Available today' : 'Next available tomorrow'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleBookSession}
          className="flex-1 btn btn-primary flex items-center justify-center"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Book
        </button>
        
        <button
          onClick={handleSendMessage}
          className="btn btn-secondary flex items-center justify-center"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
