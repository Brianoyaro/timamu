import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
         isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { LoadingSkeleton } from '../common/LoadingSkeleton'
import { EmptyState } from '../common/EmptyState'

export function CalendarView({ 
  appointments, 
  isLoading, 
  onAppointmentSelect,
  selectedTherapistId 
}) {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('month') // month, week, day

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => 
      format(new Date(apt.datetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <LoadingSkeleton className="h-8 w-32" />
          <LoadingSkeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn btn-secondary text-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] p-1 border border-gray-200 dark:border-gray-600 rounded-lg ${
                isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800' 
                  : 'bg-gray-50 dark:bg-gray-700'
              } ${
                isDayToday ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className={`text-sm font-medium text-center mb-1 ${
                isDayToday 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : isCurrentMonth 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => onAppointmentSelect(apt)}
                    className="w-full text-left p-1 rounded text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  >
                    <div className="truncate">
                      {format(new Date(apt.datetime), 'HH:mm')}
                    </div>
                    <div className="truncate">
                      {apt.therapist?.name || apt.patient?.name}
                    </div>
                  </button>
                ))}
                
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{dayAppointments.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state for no appointments */}
      {appointments.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={CalendarIcon}
            title="No appointments scheduled"
            description="Your calendar is empty. Book your first session to get started."
          />
        </div>
      )}
    </div>
  )
}
