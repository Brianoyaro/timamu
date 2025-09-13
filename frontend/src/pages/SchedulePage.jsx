import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarView } from '../components/scheduling/CalendarView'
import { AppointmentModal } from '../components/scheduling/AppointmentModal'
import { AvailabilityManager } from '../components/scheduling/AvailabilityManager'
import { useAuthStore } from '../store/authStore'
import { useTenantStore } from '../store/tenantStore'
import { schedulingService } from '../services/schedulingService'
import { analyticsService } from '../services/analyticsService'

export function SchedulePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { hasRole } = useAuthStore()
  const { currentTenant } = useTenantStore()
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState('calendar') // calendar, availability

  const selectedTherapistId = searchParams.get('therapist')

  useEffect(() => {
    if (currentTenant) {
      loadAppointments()
      analyticsService.page('Schedule')
    }
  }, [currentTenant])

  const loadAppointments = async () => {
    if (!currentTenant) return
    
    try {
      setIsLoading(true)
      const response = await schedulingService.getAppointments()
      // Handle both direct array and wrapped response formats
      const appointmentsData = Array.isArray(response) ? response : (response?.appointments || [])
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Failed to load appointments:', error)
      setAppointments([]) // Ensure appointments is always an array
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment)
  }

  const handleAppointmentClose = () => {
    setSelectedAppointment(null)
  }

  const handleAppointmentUpdate = (updatedAppointment) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    )
    setSelectedAppointment(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.schedule')}
        </h1>
        
        {hasRole('therapist') && (
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => setView('calendar')}
              className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('availability')}
              className={`btn ${view === 'availability' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Availability
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div
        key={view}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            isLoading={isLoading}
            onAppointmentSelect={handleAppointmentSelect}
            selectedTherapistId={selectedTherapistId}
          />
        ) : (
          <AvailabilityManager />
        )}
      </motion.div>

      {/* Appointment modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={handleAppointmentClose}
          onUpdate={handleAppointmentUpdate}
        />
      )}
    </div>
  )
}
