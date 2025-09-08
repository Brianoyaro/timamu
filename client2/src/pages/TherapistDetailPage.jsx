import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  StarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { userService } from '../services/userService'
import { analyticsService } from '../services/analyticsService'

export function TherapistDetailPage() {
  const { therapistId, tenantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [therapist, setTherapist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTherapist()
    analyticsService.page('Therapist Detail', { therapistId })
  }, [therapistId])

  const loadTherapist = async () => {
    try {
      // Mock therapist data - replace with real API call
      const mockTherapist = {
        id: therapistId,
        name: 'Dr. Sarah Johnson',
        title: 'Licensed Clinical Social Worker',
        avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=300',
        rating: 4.8,
        reviewCount: 127,
        specializations: ['Anxiety', 'Depression', 'PTSD', 'Cognitive Behavioral Therapy'],
        languages: ['English', 'Spanish'],
        bio: 'Dr. Johnson is a licensed clinical social worker with over 10 years of experience in mental health treatment. She specializes in evidence-based therapies for anxiety, depression, and trauma. Her approach combines cognitive-behavioral techniques with mindfulness practices to help clients develop effective coping strategies.',
        education: [
          'Ph.D. in Clinical Psychology, University of California',
          'M.S.W. in Clinical Social Work, Columbia University',
          'B.A. in Psychology, Stanford University'
        ],
        licenses: [
          'Licensed Clinical Social Worker (LCSW) - California',
          'Licensed Professional Counselor (LPC) - New York'
        ],
        experience: '10+ years',
        sessionRate: '$120/session',
        nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isAvailable: true,
        responseTime: '< 2 hours',
        sessionCount: 1250
      }
      
      setTherapist(mockTherapist)
    } catch (error) {
      console.error('Failed to load therapist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookSession = () => {
    navigate(`/t/${tenantId}/schedule?therapist=${therapistId}`)
    analyticsService.trackAppointmentBooked(null, therapistId)
  }

  const handleSendMessage = () => {
    navigate(`/t/${tenantId}/messages/${therapistId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:space-x-6">
            <LoadingSkeleton className="h-32 w-32 rounded-full mx-auto md:mx-0" />
            <div className="flex-1 mt-4 md:mt-0 space-y-3">
              <LoadingSkeleton className="h-6 w-48" />
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-4 w-64" />
              <LoadingSkeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!therapist) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Therapist not found
        </h1>
        <button
          onClick={() => navigate(`/t/${tenantId}/therapists`)}
          className="mt-4 btn btn-primary"
        >
          Back to Therapists
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(`/t/${tenantId}/therapists`)}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Therapists
      </button>

      {/* Therapist header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div className="flex-shrink-0 text-center md:text-left">
            <img
              src={therapist.avatar}
              alt={therapist.name}
              className="h-32 w-32 rounded-full object-cover mx-auto md:mx-0"
            />
            
            <div className="mt-4 flex items-center justify-center md:justify-start space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                therapist.isAvailable ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {therapist.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>

          <div className="flex-1 mt-6 md:mt-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center md:text-left">
              {therapist.name}
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center md:text-left">
              {therapist.title}
            </p>

            {/* Rating */}
            <div className="flex items-center justify-center md:justify-start space-x-2 mt-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < Math.floor(therapist.rating) ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-300" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {therapist.rating} ({therapist.reviewCount} reviews)
              </span>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                <p className="font-medium text-gray-900 dark:text-white">{therapist.experience}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
                <p className="font-medium text-gray-900 dark:text-white">{therapist.sessionCount}+</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                <p className="font-medium text-gray-900 dark:text-white">{therapist.responseTime}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Rate</p>
                <p className="font-medium text-gray-900 dark:text-white">{therapist.sessionRate}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0 md:ml-6 flex flex-col space-y-3">
            <button
              onClick={handleBookSession}
              className="btn btn-primary flex items-center justify-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Book Session
            </button>
            
            <button
              onClick={handleSendMessage}
              className="btn btn-secondary flex items-center justify-center"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Send Message
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          About Dr. Johnson
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {therapist.bio}
        </p>
      </div>

      {/* Specializations */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Specializations
        </h2>
        <div className="flex flex-wrap gap-2">
          {therapist.specializations.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <GlobeAltIcon className="h-5 w-5 mr-2" />
          Languages
        </h2>
        <div className="flex flex-wrap gap-2">
          {therapist.languages.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-therapeutic-100 text-therapeutic-800 dark:bg-therapeutic-900 dark:text-therapeutic-200"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Education & Credentials */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AcademicCapIcon className="h-5 w-5 mr-2" />
          Education & Credentials
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Education
            </h3>
            <ul className="space-y-1">
              {therapist.education.map((edu, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {edu}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Licenses
            </h3>
            <ul className="space-y-1">
              {therapist.licenses.map((license, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {license}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Availability preview */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Availability
        </h2>
        
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">
            <strong>Next available:</strong> {therapist.nextAvailable.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>

        <button
          onClick={handleBookSession}
          className="w-full mt-4 btn btn-primary"
        >
          View Available Times
        </button>
      </div>
    </motion.div>
  )
}
