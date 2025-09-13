import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Star,
  Calendar,
  MessageCircle,
  Globe,
  GraduationCap,
  Clock,
  ArrowLeft,
  Video,
  MapPin,
  Shield,
  Award
} from 'lucide-react'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { TherapistAvailabilityCalendar } from '../components/therapists/TherapistAvailabilityCalendar'
import { userService } from '../services/userService'
import { schedulingService } from '../services/schedulingService'
import { messagingService } from '../services/messagingService'
import { analyticsService } from '../services/analyticsService'
import { useToastStore } from '../store/toastStore'

export function TherapistDetailPage() {
  const { therapistId, tenantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const [therapist, setTherapist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState(null)

  console.log('TherapistDetailPage rendered with params:', { therapistId, tenantId })

  useEffect(() => {
    if (therapistId && tenantId) {
      loadTherapist()
      analyticsService.page('Therapist Detail', { therapistId })
    } else {
      console.error('Missing required parameters:', { therapistId, tenantId })
      setIsLoading(false)
    }
  }, [therapistId, tenantId])

  const loadTherapist = async () => {
    if (!therapistId) {
      console.error('No therapistId provided')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log('Loading therapist with ID:', therapistId)
      const therapistData = await userService.getTherapist(therapistId)
      console.log('Loaded therapist data:', therapistData)
      setTherapist(therapistData)
    } catch (error) {
      console.error('Failed to load therapist:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      })
      
      // Check if it's a 404 error (therapist not found)
      if (error.status === 404 || error.response?.status === 404) {
        console.log('Therapist not found (404), showing not found page')
        setTherapist(null) // This will trigger the "not found" UI
        setError('not_found')
      } else {
        // For other errors, show the toast and set error state
        setError('load_failed')
        addToast({
          type: 'error',
          title: 'Error',
          message: error.response?.data?.message || 'Failed to load therapist details'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookSession = async (bookingNotes = '') => {
    if (!selectedSlot) {
      addToast({
        type: 'warning',
        title: 'Select Time Slot',
        message: 'Please select an available time slot to book your session.'
      })
      return
    }

    try {
      setIsBooking(true)
      await schedulingService.bookAppointment({
        therapistId,
        datetime: selectedSlot,
        type: 'therapy',
        notes: bookingNotes
      })
      
      addToast({
        type: 'success',
        title: 'Session Booked Successfully!',
        message: `Your session with ${therapist.name} has been scheduled for ${selectedSlot.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })}`
      })
      analyticsService.track('appointment_booked', { 
        therapistId, 
        datetime: selectedSlot,
        source: 'therapist_detail' 
      })
      
      // Reset selection after successful booking
      setSelectedSlot(null)
      
      // Optional: Navigate to schedule page to show the booked appointment
      // navigate(`/t/${tenantId}/schedule`)
    } catch (error) {
      console.error('Failed to book session:', error)
      addToast({
        type: 'error',
        title: 'Booking Failed',
        message: error.response?.data?.message || 'Failed to book session. Please try again.'
      })
    } finally {
      setIsBooking(false)
    }
  }

  const handleSendMessage = async () => {
    try {
      // Check if a thread already exists with this therapist
      const threads = await messagingService.getThreads()
      const existingThread = threads.find(thread => 
        thread.participants.some(p => p.id === therapistId)
      )
      
      if (existingThread) {
        // Navigate to existing thread
        navigate(`/t/${tenantId}/messages`, { 
          state: { threadId: existingThread.id } 
        })
      } else {
        // Create new thread and navigate
        const newThread = await messagingService.createThread([therapistId])
        navigate(`/t/${tenantId}/messages`, { 
          state: { threadId: newThread.id } 
        })
      }
      
      analyticsService.track('therapist_message_initiated', { 
        therapistId,
        hasExistingThread: !!existingThread 
      })
    } catch (error) {
      console.error('Failed to initialize messaging:', error)
      addToast({
        type: 'error',
        title: 'Message Failed',
        message: 'Failed to start messaging. Please try again.'
      })
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton className="h-8 w-48 mb-6" />
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <LoadingSkeleton className="h-32 w-32 rounded-full mx-auto lg:mx-0" />
            <div className="flex-1 space-y-3">
              <LoadingSkeleton className="h-8 w-64" />
              <LoadingSkeleton className="h-6 w-48" />
              <LoadingSkeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[...Array(4)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-12" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-12 w-32" />
              <LoadingSkeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-40" />
            <LoadingSkeleton className="h-32" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!isLoading && !therapist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('pages.therapistDetail.notFound', 'Therapist not found')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('pages.therapistDetail.notFoundDescription', 'The therapist you are looking for could not be found.')}
          </p>
          <button
            onClick={() => navigate(`/t/${tenantId}/therapists`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.backToTherapists', 'Back to Therapists')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(`/t/${tenantId}/therapists`)}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.backToTherapists', 'Back to Therapists')}
      </motion.button>

      {/* Therapist Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar and Status */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative">
              <img
                src={therapist.avatar || '/api/placeholder/128/128'}
                alt={therapist.name}
                className="h-32 w-32 rounded-full object-cover mx-auto lg:mx-0 border-4 border-white shadow-lg"
              />
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${
                therapist.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            
            <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
              <div className={`w-2 h-2 rounded-full ${
                therapist.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {therapist.isOnline ? t('common.online', 'Online') : t('common.offline', 'Offline')}
              </span>
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-1">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {therapist.name}
              </h1>
              
              <p className="text-xl text-gray-600 mb-3">
                {therapist.title || therapist.specializations?.[0]}
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="flex items-center">
                  {renderStars(therapist.rating || 0)}
                </div>
                <span className="text-sm text-gray-600">
                  {therapist.rating?.toFixed(1) || '0.0'} ({therapist.reviewCount || 0} reviews)
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-500">{t('therapist.experience', 'Experience')}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{therapist.yearsExperience || 0}+ years</p>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-500">{t('therapist.sessions', 'Sessions')}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{therapist.totalSessions || 0}+</p>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-500">{t('therapist.responseTime', 'Response')}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{therapist.avgResponseTime || '< 1 hour'}</p>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <Video className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-500">{t('therapist.rate', 'Rate')}</span>
                  </div>
                  <p className="font-semibold text-gray-900">${therapist.sessionRate || 120}/session</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:w-48">
            <button
              onClick={() => handleBookSession()}
              disabled={isBooking || !selectedSlot}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                selectedSlot
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calendar className="h-5 w-5" />
              {isBooking 
                ? 'Booking...' 
                : selectedSlot 
                  ? 'Confirm Booking' 
                  : 'Select Time Slot'
              }
            </button>
            
            <button
              onClick={handleSendMessage}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <MessageCircle className="h-5 w-5" />
              {t('common.sendMessage', 'Send Message')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('therapist.about', 'About')} {therapist.name.split(' ')[0]}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {therapist.bio || t('therapist.noBio', 'No biography available yet.')}
            </p>
          </motion.div>

          {/* Specializations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('therapist.specializations', 'Specializations')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations?.map((spec, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {spec}
                </span>
              )) || (
                <p className="text-gray-500">{t('therapist.noSpecializations', 'No specializations listed.')}</p>
              )}
            </div>
          </motion.div>

          {/* Languages & Approach */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                {t('therapist.languages', 'Languages')}
              </h3>
              <div className="space-y-2">
                {therapist.languages?.map((lang, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2"
                  >
                    {lang}
                  </span>
                )) || (
                  <p className="text-gray-500">{t('therapist.noLanguages', 'English')}</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                {t('therapist.credentials', 'Credentials')}
              </h3>
              <div className="space-y-2">
                {therapist.credentials?.map((cred, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    • {cred}
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">
                    {t('therapist.noCredentials', 'Licensed Professional Counselor')}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Booking */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TherapistAvailabilityCalendar
              therapistId={therapistId}
              onSlotSelect={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
          </motion.div>

          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h4 className="font-semibold text-gray-900">
                  {t('booking.selectedTime', 'Selected Time Slot')}
                </h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {selectedSlot.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {selectedSlot.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Session with {therapist.name}</span>
                    <span className="font-semibold text-gray-900">${therapist.sessionRate || 120}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleBookSession()}
                  disabled={isBooking}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </button>
                
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
