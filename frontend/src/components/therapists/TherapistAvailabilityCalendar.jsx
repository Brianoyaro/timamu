import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle } from 'lucide-react'
import { schedulingService } from '../../services/schedulingService'
import { LoadingSkeleton } from '../common/LoadingSkeleton'

export function TherapistAvailabilityCalendar({ therapistId, onSlotSelect, selectedSlot }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week, 1 = next week, etc.

  useEffect(() => {
    loadAvailability()
  }, [therapistId, selectedWeek])

  const loadAvailability = async () => {
    if (!therapistId) return
    
    try {
      setIsLoading(true)
      const startDate = getWeekStart(selectedWeek)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      
      const slots = await schedulingService.getTherapistAvailability(therapistId, startDate, endDate)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Failed to load availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekStart = (weekOffset = 0) => {
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7))
    startOfWeek.setHours(0, 0, 0, 0)
    return startOfWeek
  }

  const getWeekDays = () => {
    const start = getWeekStart(selectedWeek)
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const isSlotAvailable = (date, time) => {
    const slotDateTime = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    slotDateTime.setHours(hours, minutes, 0, 0)
    
    return availableSlots.some(slot => {
      const slotDate = new Date(slot.datetime)
      return slotDate.getTime() === slotDateTime.getTime() && slot.isAvailable
    })
  }

  const formatSlotDateTime = (date, time) => {
    const slotDate = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    slotDate.setHours(hours, minutes, 0, 0)
    return slotDate
  }

  const isSlotSelected = (date, time) => {
    if (!selectedSlot) return false
    const slotDateTime = formatSlotDateTime(date, time)
    return selectedSlot.getTime() === slotDateTime.getTime()
  }

  const handleSlotClick = (date, time) => {
    if (!isSlotAvailable(date, time)) return
    const slotDateTime = formatSlotDateTime(date, time)
    onSlotSelect(slotDateTime)
  }

  const navigateWeek = (direction) => {
    setSelectedWeek(prev => Math.max(0, prev + direction))
  }

  const weekDays = getWeekDays()
  const timeSlots = getTimeSlots()
  const currentWeekStart = getWeekStart(selectedWeek)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Available Times</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            disabled={selectedWeek === 0}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-medium text-gray-700 px-3">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-8 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-sm font-medium text-gray-500 p-2">Time</div>
              {weekDays.map(day => {
                const isToday = day.toDateString() === new Date().toDateString()
                const isPast = day < new Date().setHours(0, 0, 0, 0)
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`text-sm font-medium p-2 text-center rounded-lg ${
                      isToday
                        ? 'bg-blue-100 text-blue-800'
                        : isPast
                        ? 'text-gray-400'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="font-semibold">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs">
                      {day.toLocaleDateString('en-US', { day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-2">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-8 gap-2">
                  <div className="flex items-center text-sm text-gray-500 p-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </div>
                  
                  {weekDays.map(day => {
                    const isPast = day < new Date().setHours(0, 0, 0, 0) || 
                      (day.toDateString() === new Date().toDateString() && 
                       new Date().getHours() > parseInt(time.split(':')[0]))
                    const isAvailable = !isPast && isSlotAvailable(day, time)
                    const isSelected = isSlotSelected(day, time)
                    
                    return (
                      <motion.button
                        key={`${day.toISOString()}-${time}`}
                        onClick={() => handleSlotClick(day, time)}
                        disabled={!isAvailable}
                        whileHover={isAvailable ? { scale: 1.02 } : {}}
                        whileTap={isAvailable ? { scale: 0.98 } : {}}
                        className={`p-2 text-xs rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isAvailable
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : isPast
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {isSelected && <CheckCircle className="h-3 w-3 mx-auto" />}
                        {!isSelected && isAvailable && '✓'}
                        {!isSelected && !isAvailable && '—'}
                      </motion.button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-xs text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-xs text-gray-600">Unavailable</span>
        </div>
      </div>
    </div>
  )
}
