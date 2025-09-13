import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Clock,
  Plus
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isSameDay,
  parseISO,
  isValid
} from 'date-fns'
import { LoadingSkeleton } from '../common/LoadingSkeleton'
import { EmptyState } from '../common/EmptyState'

export function CalendarView({ 
  appointments = [], 
  isLoading, 
  onAppointmentSelect,
  selectedTherapistId 
}) {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('month') // month, week, day

  // Generate calendar grid with proper week layout
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart) // Start from Sunday of the first week
  const calendarEnd = endOfWeek(monthEnd) // End on Saturday of the last week
  
  // Get all days to display (including days from previous/next month to fill the grid)
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  const getAppointmentsForDay = (day) => {
    if (!Array.isArray(appointments)) {
      console.warn('Appointments is not an array:', appointments)
      return []
    }
    
    return appointments.filter(apt => {
      if (!apt?.datetime) return false
      
      try {
        // Handle both string and Date objects
        const aptDate = typeof apt.datetime === 'string' ? parseISO(apt.datetime) : apt.datetime
        if (!isValid(aptDate)) return false
        
        return isSameDay(aptDate, day)
      } catch (error) {
        console.warn('Invalid appointment date:', apt.datetime)
        return false
      }
    })
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <LoadingSkeleton className="h-8 w-40" />
          <LoadingSkeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <LoadingSkeleton key={i} className="h-8" />
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {[...Array(42)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
          {/* View toggle for mobile */}
          <div className="flex rounded-lg border border-gray-200 p-1 sm:hidden">
            <button
              onClick={() => setViewType('month')}
              className={`px-2 py-1 text-xs rounded ${
                viewType === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-2 py-1 text-xs rounded ${
                viewType === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 sm:px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          
          <button 
            onClick={() => onAppointmentSelect({ type: 'new' })}
            className="px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
          <div
            key={day}
            className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide"
          >
            <span className="hidden sm:inline">{day.slice(0, 3)}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)
          const isPastDay = day < new Date().setHours(0, 0, 0, 0)

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 rounded-lg transition-all hover:shadow-sm ${
                isCurrentMonth 
                  ? 'bg-white' 
                  : 'bg-gray-50'
              } ${
                isDayToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${
                isPastDay && !isDayToday ? 'opacity-60' : ''
              }`}
            >
              {/* Day number */}
              <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                isDayToday 
                  ? 'text-blue-600 bg-blue-100 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mx-auto' 
                  : isCurrentMonth 
                    ? 'text-gray-900' 
                    : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* Appointments */}
              <div className="space-y-0.5 sm:space-y-1">
                {dayAppointments.slice(0, 2).map((apt, index) => {
                  const aptTime = typeof apt.datetime === 'string' ? parseISO(apt.datetime) : apt.datetime
                  const timeStr = isValid(aptTime) ? format(aptTime, 'HH:mm') : 'Invalid time'
                  
                  return (
                    <button
                      key={apt.id || index}
                      onClick={() => onAppointmentSelect(apt)}
                      className="w-full text-left p-1 sm:p-1.5 rounded-md text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors border border-blue-200"
                    >
                      <div className="font-medium truncate">
                        {timeStr}
                      </div>
                      <div className="truncate text-blue-600 hidden sm:block">
                        {apt.therapist?.name || apt.patient?.name || 'Appointment'}
                      </div>
                    </button>
                  )
                })}
                
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-0.5 sm:py-1">
                    +{dayAppointments.length - 2} more
                  </div>
                )}
                
                {/* Add appointment button for current/future days */}
                {!isPastDay && isCurrentMonth && dayAppointments.length === 0 && (
                  <button 
                    onClick={() => onAppointmentSelect({ type: 'new', date: day })}
                    className="w-full text-center p-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Plus className="h-3 w-3 mx-auto" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-sm text-gray-600">Scheduled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Today</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
      </div>

      {/* Empty state for no appointments */}
      {appointments.length === 0 && (
        <div className="mt-8 py-12">
          <EmptyState
            icon={Calendar}
            title="No appointments scheduled"
            description="Your calendar is empty. Book your first session to get started."
            action={{
              label: "Schedule Appointment",
              onClick: () => console.log("Schedule new appointment")
            }}
          />
        </div>
      )}
    </div>
  )
}
