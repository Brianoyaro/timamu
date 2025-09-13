import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { schedulingService } from '../../services/schedulingService'

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
]

export function TimeSlotPicker({ 
  therapistId, 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  duration = 60,
  disabled = false 
}) {
  const { t } = useTranslation()
  const [availability, setAvailability] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (therapistId && selectedDate) {
      checkAvailability()
    }
  }, [therapistId, selectedDate, duration])

  const checkAvailability = async () => {
    try {
      setLoading(true)
      const dateObj = new Date(selectedDate)
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0))
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999))

      const response = await schedulingService.getTherapistAvailability(
        therapistId,
        startOfDay,
        endOfDay
      )

      setAvailability(response.availability || [])
      setBookedSlots(response.existingAppointments || [])
    } catch (error) {
      console.error('Failed to check availability:', error)
      setAvailability([])
      setBookedSlots([])
    } finally {
      setLoading(false)
    }
  }

  const isSlotAvailable = (timeSlot) => {
    if (!selectedDate || !therapistId) return false

    const slotDate = new Date(`${selectedDate}T${timeSlot}`)
    const slotEnd = new Date(slotDate.getTime() + duration * 60 * 1000)

    // Check if slot conflicts with existing appointments
    const hasConflict = bookedSlots.some(appointment => {
      const aptStart = new Date(appointment.datetime)
      const aptEnd = new Date(aptStart.getTime() + appointment.duration * 60 * 1000)
      
      return (slotDate < aptEnd && slotEnd > aptStart)
    })

    if (hasConflict) return false

    // Check against therapist availability (day of week and time ranges)
    const dayOfWeek = slotDate.getDay()
    const slotMinutes = slotDate.getHours() * 60 + slotDate.getMinutes()

    const isWithinAvailability = availability.some(avail => {
      if (avail.dayOfWeek !== dayOfWeek) return false
      
      const startMinutes = parseInt(avail.startTime.split(':')[0]) * 60 + 
                          parseInt(avail.startTime.split(':')[1])
      const endMinutes = parseInt(avail.endTime.split(':')[0]) * 60 + 
                        parseInt(avail.endTime.split(':')[1])
      
      return slotMinutes >= startMinutes && slotMinutes + duration <= endMinutes
    })

    return isWithinAvailability
  }

  const getSlotStatus = (timeSlot) => {
    if (loading) return 'loading'
    if (!therapistId || !selectedDate) return 'disabled'
    
    const available = isSlotAvailable(timeSlot)
    const isSelected = selectedTime === timeSlot
    
    if (isSelected) return 'selected'
    if (available) return 'available'
    return 'unavailable'
  }

  const getSlotClassName = (status) => {
    const baseClasses = 'px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all'
    
    switch (status) {
      case 'selected':
        return `${baseClasses} bg-blue-600 text-white border-blue-600`
      case 'available':
        return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer`
      case 'unavailable':
        return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`
      case 'loading':
        return `${baseClasses} bg-gray-50 text-gray-400 border-gray-200 animate-pulse`
      default:
        return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`
    }
  }

  const getSlotIcon = (status) => {
    switch (status) {
      case 'selected':
        return <CheckCircle className="h-4 w-4" />
      case 'available':
        return <Clock className="h-4 w-4" />
      case 'unavailable':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleSlotClick = (timeSlot) => {
    const status = getSlotStatus(timeSlot)
    if (status === 'available' || status === 'selected') {
      onTimeSelect(timeSlot === selectedTime ? '' : timeSlot)
    }
  }

  if (!therapistId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a therapist first
      </div>
    )
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a date first
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Available Time Slots
        </h3>
        {loading && (
          <div className="text-xs text-gray-500">
            Checking availability...
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {TIME_SLOTS.map(timeSlot => {
          const status = getSlotStatus(timeSlot)
          const icon = getSlotIcon(status)
          const className = getSlotClassName(status)

          return (
            <button
              key={timeSlot}
              type="button"
              onClick={() => handleSlotClick(timeSlot)}
              disabled={disabled || status === 'unavailable' || status === 'disabled' || loading}
              className={className}
              title={
                status === 'unavailable' 
                  ? 'This time slot is not available'
                  : status === 'available'
                  ? 'Click to select this time slot'
                  : ''
              }
            >
              <div className="flex items-center justify-center space-x-1">
                {icon}
                <span>{timeSlot}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 pt-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3 text-blue-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-700" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="h-3 w-3 text-gray-400" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  )
}
