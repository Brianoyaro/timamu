import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { assessmentService } from '../../services/assessmentService'
import { useToastStore } from '../../store/toastStore'

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very sad', color: 'text-red-500' },
  { value: 2, emoji: '😟', label: 'Sad', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'text-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'text-green-500' },
  { value: 5, emoji: '😊', label: 'Great', color: 'text-green-600' }
]

export function MoodCheckInCard() {
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const [selectedMood, setSelectedMood] = useState(null)
  const [notes, setNotes] = useState('')
  const [hasCheckedIn, setHasCheckedIn] = useState(false)

  const handleSubmit = async () => {
    if (!selectedMood) return

    try {
      console.log('Submitting mood check-in:', { mood: selectedMood, notes })
      
      // Submit mood check-in using the service
      await assessmentService.submitMoodCheckin({ 
        mood: selectedMood, 
        notes: notes,
        timestamp: new Date().toISOString()
      })
      
      setHasCheckedIn(true)
      
      // Reset after success
      setTimeout(() => {
        setSelectedMood(null)
        setNotes('')
        setHasCheckedIn(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to submit mood check-in:', error)
      addToast({
        type: 'error',
        title: 'Failed to submit mood check-in',
        message: 'Please try again or contact support if the problem persists.',
        duration: 5000
      })
    }
  }

  if (hasCheckedIn) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="card p-6 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
      >
        <div className="text-center">
          <Heart className="mx-auto h-8 w-8 text-green-600 dark:text-green-400" />
          <h3 className="mt-2 text-lg font-medium text-green-900 dark:text-green-100">
            Thank you!
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            Your mood has been recorded
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('assessments.moodCheckin')}
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('assessments.howFeeling')}
      </p>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedMood === mood.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            aria-label={mood.label}
          >
            <div className="text-2xl">{mood.emoji}</div>
            <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
              {mood.label}
            </div>
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any notes about how you're feeling? (optional)"
        className="w-full input text-sm"
        rows={3}
      />

      <button
        onClick={handleSubmit}
        disabled={!selectedMood}
        className="w-full mt-4 btn btn-therapeutic disabled:opacity-50"
      >
        Submit Check-in
      </button>
    </div>
)}
