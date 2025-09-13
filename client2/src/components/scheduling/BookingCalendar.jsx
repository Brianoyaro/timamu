import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * BookingCalendar component for selecting appointment slots
 * Used in the therapist detail page for booking appointments
 */
export function BookingCalendar({ 
  therapistId, 
  availableSlots = [], 
  selectedSlot, 
  onSlotSelect, 
  onBook, 
  isBooking 
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekDays, setWeekDays] = useState([])
  const [timeSlots, setTimeSlots] = useState({})

  useEffect(() => {
    generateWeekDays()
    organizeTimeSlots()
  }, [currentDate, availableSlots])

  /**
   * Generate the days for the current week
   */
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    setWeekDays(days)
  }

  /**
   * Organize available slots by date and time
   */
  const organizeTimeSlots = () => {
    const organized = {}
    
    availableSlots.forEach(slot => {
      const date = new Date(slot.datetime).toDateString()
      if (!organized[date]) {
        organized[date] = []
      }
      organized[date].push(slot)
    })

    // Sort slots by time for each date
    Object.keys(organized).forEach(date => {
      organized[date].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    })

    setTimeSlots(organized)
  }

  /**
   * Navigate to previous week
   */
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  /**
   * Navigate to next week
   */
  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  /**
   * Check if a date is today
   */
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  /**
   * Check if a date is in the past
   */
  const isPastDate = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  /**
   * Format time for display
   */
  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  /**
   * Format date for display
   */
  const formatDate = (date, options = {}) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...options,
    })
  }

  /**
   * Get the month/year display for the current week
   */
  const getWeekDisplayText = () => {
    const firstDay = weekDays[0]
    const lastDay = weekDays[6]
    
    if (!firstDay || !lastDay) return ''
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return firstDay.toLocaleDateString([], { month: 'long', year: 'numeric' })
    } else {
      return `${firstDay.toLocaleDateString([], { month: 'short' })} - ${lastDay.toLocaleDateString([], { month: 'short', year: 'numeric' })}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Select a Date & Time</h3>
          <p className="text-sm text-muted-foreground">{getWeekDisplayText()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const daySlots = timeSlots[day.toDateString()] || []
          const isDisabled = isPastDate(day)
          
          return (
            <motion.div
              key={day.toDateString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "transition-all duration-200",
                isDisabled && "opacity-50"
              )}>
                <CardContent className="p-3">
                  {/* Day Header */}
                  <div className="text-center mb-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {formatDate(day, { weekday: 'short' })}
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-primary"
                    )}>
                      {day.getDate()}
                    </div>
                    {isToday(day) && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Today
                      </Badge>
                    )}
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-1">
                    {daySlots.length > 0 ? (
                      daySlots.slice(0, 4).map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs py-1 h-auto"
                          onClick={() => onSlotSelect(slot)}
                          disabled={isDisabled}
                        >
                          {formatTime(slot.datetime)}
                        </Button>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        {isDisabled ? 'Past' : 'No slots'}
                      </div>
                    )}
                    
                    {daySlots.length > 4 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{daySlots.length - 4} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Selected Appointment</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>
                    {formatDate(new Date(selectedSlot.datetime), {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(selectedSlot.datetime)}
                  </span>
                  <span>{selectedSlot.duration || 60} minutes</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onBook} 
              disabled={isBooking}
              className="min-w-[120px]"
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      {availableSlots.length === 0 && (
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No available slots</h3>
          <p className="text-muted-foreground">
            This therapist doesn't have any available time slots at the moment.
            Please check back later or contact them directly.
          </p>
        </div>
      )}

      {selectedSlot === null && availableSlots.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Click on an available time slot to book your appointment
          </p>
        </div>
      )}
    </div>
  )
}
