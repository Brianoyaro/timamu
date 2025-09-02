import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const daysOfWeek = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

export function AvailabilityManager() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  
  // Mock availability data - replace with real API call
  const [availability, setAvailability] = useState({
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: []
  })

  const addTimeSlot = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '17:00' }]
    }))
  }

  const removeTimeSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }))
  }

  const updateTimeSlot = (day, index, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }))
  }

  const handleSave = async () => {
    try {
      // Mock API call - replace with real implementation
      console.log('Saving availability:', availability)
      // await schedulingService.setAvailability(user.id, availability)
    } catch (error) {
      console.error('Failed to save availability:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weekly Availability
          </h2>
          
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          {daysOfWeek.map((day) => (
            <div key={day} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {day}
                </h3>
                
                <button
                  onClick={() => addTimeSlot(day)}
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add slot
                </button>
              </div>

              {availability[day].length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Not available
                </p>
              ) : (
                <div className="space-y-2">
                  {availability[day].map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                        className="input text-sm flex-1"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      
                      <span className="text-gray-500 dark:text-gray-400">to</span>
                      
                      <select
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                        className="input text-sm flex-1"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => removeTimeSlot(day, index)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                        aria-label="Remove time slot"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timezone info */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
          <br />
          All times are shown in your local timezone. Patients will see times converted to their timezone.
        </p>
      </div>
    </div>
  )
}
