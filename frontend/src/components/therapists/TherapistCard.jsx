import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Star,
  Calendar,
  MessageCircle,
  Globe,
  Clock,
  DollarSign
} from 'lucide-react'
import { Star as StarSolid } from 'lucide-react'
import { schedulingService } from '../../services/schedulingService'

export function TherapistCard({ therapist }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const [availabilityStatus, setAvailabilityStatus] = useState('checking')

  useEffect(() => {
    checkAvailability()
  }, [therapist.id])

  const checkAvailability = async () => {
    try {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const availability = await schedulingService.getAvailability(
        therapist.id,
        today.toISOString(),
        nextWeek.toISOString()
      )
      
      // Check if therapist has any availability in the next week
      const hasAvailability = availability.availability && availability.availability.length > 0
      setAvailabilityStatus(hasAvailability ? 'available' : 'busy')
    } catch (error) {
      console.error('Failed to check availability:', error)
      setAvailabilityStatus('unknown')
    }
  }

  const handleViewProfile = () => {
    navigate(`/t/${tenantId}/therapists/${therapist.id}`)
  }

  const handleBookSession = (e) => {
    e.stopPropagation()
    navigate(`/t/${tenantId}/schedule?therapist=${therapist.id}`)
  }

  const handleSendMessage = (e) => {
    e.stopPropagation()
    navigate(`/t/${tenantId}/messages`)
  }

  const getAvailabilityDisplay = () => {
    switch (availabilityStatus) {
      case 'available':
        return { text: 'Available this week', color: 'bg-green-500' }
      case 'busy':
        return { text: 'Next available: Ask therapist', color: 'bg-yellow-500' }
      case 'checking':
        return { text: 'Checking availability...', color: 'bg-gray-400' }
      default:
        return { text: 'Contact for availability', color: 'bg-gray-400' }
    }
  }

  const availabilityInfo = getAvailabilityDisplay()

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
                <StarSolid className="h-4 w-4 text-yellow-400" />
              ) : (
                <Star className="h-4 w-4 text-gray-300" />
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
          <Globe className="h-4 w-4" />
          <span>{therapist.languages.join(', ')}</span>
        </div>
      )}

      {/* Session Rate */}
      {therapist.sessionRate && (
        <div className="flex items-center justify-center space-x-1 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <DollarSign className="h-4 w-4" />
          <span>{therapist.sessionRate}</span>
        </div>
      )}

      {/* Experience */}
      {therapist.experience && (
        <div className="flex items-center justify-center space-x-1 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{therapist.experience}+ years experience</span>
        </div>
      )}

      {/* Availability indicator */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${availabilityInfo.color}`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {availabilityInfo.text}
        </span>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleBookSession}
          className="flex-1 btn btn-primary flex items-center justify-center"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book
        </button>
        
        <button
          onClick={handleSendMessage}
          className="btn btn-secondary flex items-center justify-center"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
