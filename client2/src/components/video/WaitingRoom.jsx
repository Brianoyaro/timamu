import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export function WaitingRoom({ session, userRole, onAdmitPatient, onCancel }) {
  const { t } = useTranslation()

  const otherParticipant = userRole === 'therapist' ? session?.patient : session?.therapist

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center text-white"
      >
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            {otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar}
                alt={otherParticipant.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <h1 className="text-2xl font-semibold mb-2">
            {t('video.waitingRoom')}
          </h1>
          
          <p className="text-gray-300">
            {userRole === 'therapist' 
              ? `Patient ${session?.patient?.name} is waiting`
              : t('video.waitingForTherapist')
            }
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-gray-400 mb-8">
          <ClockIcon className="h-5 w-5" />
          <span>Session scheduled for {session?.startTime?.toLocaleTimeString()}</span>
        </div>

        <div className="space-y-3">
          {userRole === 'therapist' ? (
            <>
              <button
                onClick={onAdmitPatient}
                className="w-full btn btn-primary bg-primary-600 hover:bg-primary-700"
              >
                {t('video.admitPatient')}
              </button>
              <button
                onClick={onCancel}
                className="w-full btn btn-secondary bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Cancel Session
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="animate-pulse-gentle">
                <div className="w-3 h-3 bg-primary-500 rounded-full mx-auto"></div>
                <p className="text-sm text-gray-400 mt-2">
                  Waiting for therapist...
                </p>
              </div>
              
              <button
                onClick={onCancel}
                className="btn btn-secondary bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Leave Waiting Room
              </button>
            </div>
          )}
        </div>

        {/* Privacy notice */}
        {session?.isRecording && (
          <div className="mt-8 p-4 bg-red-900 rounded-lg border border-red-700">
            <p className="text-sm text-red-200">
              <strong>Notice:</strong> This session is being recorded for quality assurance.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
