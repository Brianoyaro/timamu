import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  X,
  Calendar,
  Clock,
  User,
  Video
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'

export function AppointmentModal({ appointment, onClose, onUpdate }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleJoinSession = () => {
    navigate(`/t/${tenantId}/sessions/${appointment.sessionId}/video`)
  }

  const handleReschedule = async () => {
    setIsRescheduling(true)
    try {
      // Mock reschedule - replace with real API call
      const updatedAppointment = {
        ...appointment,
        status: 'rescheduled'
      }
      onUpdate(updatedAppointment)
    } catch (error) {
      console.error('Reschedule failed:', error)
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      // Mock cancel - replace with real API call
      const updatedAppointment = {
        ...appointment,
        status: 'cancelled'
      }
      onUpdate(updatedAppointment)
    } catch (error) {
      console.error('Cancel failed:', error)
    } finally {
      setIsCancelling(false)
    }
  }

  const canJoinSession = appointment.status === 'confirmed' && 
    new Date(appointment.datetime) <= new Date(Date.now() + 15 * 60 * 1000) // 15 minutes before

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        >
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:mx-0 sm:h-10 sm:w-10">
              <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Appointment Details
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Participant info */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {appointment.therapist?.name || appointment.patient?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {appointment.therapist ? 'Therapist' : 'Patient'}
                </p>
              </div>
            </div>

            {/* Date and time */}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(appointment.datetime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(appointment.datetime), 'h:mm a')} - {appointment.duration} minutes
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                appointment.status === 'confirmed' ? 'bg-green-500' :
                appointment.status === 'pending' ? 'bg-yellow-500' :
                appointment.status === 'cancelled' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                {appointment.status}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            {canJoinSession && (
              <button
                onClick={handleJoinSession}
                className="flex-1 btn btn-primary flex items-center justify-center"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Session
              </button>
            )}
            
            {appointment.status === 'confirmed' && (
              <>
                <button
                  onClick={handleReschedule}
                  disabled={isRescheduling}
                  className="flex-1 btn btn-secondary"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
                </button>
                
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 btn btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
