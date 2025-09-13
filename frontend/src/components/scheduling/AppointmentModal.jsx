import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  Calendar,
  Clock,
  User,
  Video,
  MessageSquare,
  Phone,
  MapPin,
  Save,
  Trash2,
  Edit3,
  AlertCircle,
  Plus
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { schedulingService } from '../../services/schedulingService'
import { userService } from '../../services/userService'

const SESSION_TYPES = {
  video: { label: 'Video Call', icon: Video, color: 'blue' },
  phone: { label: 'Phone Call', icon: Phone, color: 'green' },
  inPerson: { label: 'In Person', icon: MapPin, color: 'purple' },
  chat: { label: 'Chat Session', icon: MessageSquare, color: 'orange' }
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
]

export function AppointmentModal({ appointment, onClose, onUpdate, onSave, onDelete, selectedDate }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user, hasRole } = useAuthStore()
  const { addToast } = useToastStore()
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    sessionType: 'video',
    therapistId: '',
    patientId: '',
    notes: '',
    title: ''
  })
  const [therapists, setTherapists] = useState([])
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const isNewAppointment = !appointment || appointment.type === 'new'
  const canEdit = hasRole('admin') || hasRole('therapist') || (hasRole('patient') && appointment?.patient?.id === user.id)

  useEffect(() => {
    if (isNewAppointment || isEditing) {
      loadUsers()
      initializeForm()
    }
  }, [isNewAppointment, isEditing, appointment, selectedDate])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const [therapistsRes, patientsRes] = await Promise.all([
        userService.getTherapists(),
        hasRole('admin') || hasRole('therapist') ? userService.getPatients() : Promise.resolve([])
      ])
      
      setTherapists(therapistsRes || [])
      setPatients(patientsRes || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      addToast({ 
        type: 'error', 
        message: 'Failed to load therapists and patients' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeForm = () => {
    if (isNewAppointment) {
      const defaultDate = selectedDate || appointment?.date || new Date()
      setFormData({
        date: format(defaultDate, 'yyyy-MM-dd'),
        time: '09:00',
        duration: 60,
        sessionType: 'video',
        therapistId: hasRole('therapist') ? user.id : '',
        patientId: hasRole('patient') ? user.id : '',
        notes: '',
        title: ''
      })
    } else if (appointment) {
      const aptDate = typeof appointment.datetime === 'string' ? parseISO(appointment.datetime) : appointment.datetime
      setFormData({
        date: isValid(aptDate) ? format(aptDate, 'yyyy-MM-dd') : '',
        time: isValid(aptDate) ? format(aptDate, 'HH:mm') : '',
        duration: appointment.duration || 60,
        sessionType: appointment.sessionType || 'video',
        therapistId: appointment.therapist?.id || appointment.therapistId || '',
        patientId: appointment.patient?.id || appointment.patientId || '',
        notes: appointment.notes || '',
        title: appointment.title || 'Therapy Session'
      })
    }
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time) newErrors.time = 'Time is required'
    if (!formData.therapistId) newErrors.therapistId = 'Therapist is required'
    if (!formData.patientId) newErrors.patientId = 'Patient is required'
    if (!formData.title.trim()) newErrors.title = 'Title is required'

    // Check if appointment is in the past
    const appointmentDate = new Date(`${formData.date}T${formData.time}`)
    if (appointmentDate < new Date()) {
      newErrors.date = 'Cannot schedule appointments in the past'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAppointment = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setIsSaving(true)
      
      const appointmentData = {
        ...formData,
        datetime: new Date(`${formData.date}T${formData.time}`).toISOString(),
        status: 'scheduled'
      }

      let result
      if (isNewAppointment) {
        result = await schedulingService.createAppointment(appointmentData)
        addToast({ 
          type: 'success', 
          message: 'Appointment scheduled successfully' 
        })
      } else {
        result = await schedulingService.updateAppointment(appointment.id, appointmentData)
        addToast({ 
          type: 'success', 
          message: 'Appointment updated successfully' 
        })
      }

      onSave?.(result)
      onClose()
    } catch (error) {
      console.error('Failed to save appointment:', error)
      addToast({ 
        type: 'error', 
        message: error.message || 'Failed to save appointment' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return

    try {
      setIsSaving(true)
      await schedulingService.deleteAppointment(appointment.id)
      addToast({ 
        type: 'success', 
        message: 'Appointment deleted successfully' 
      })
      onDelete?.(appointment.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      addToast({ 
        type: 'error', 
        message: 'Failed to delete appointment' 
      })
    } finally {
      setIsSaving(false)
    }
  }

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

  const canJoinSession = appointment && appointment.status === 'confirmed' && 
    new Date(appointment.datetime) <= new Date(Date.now() + 15 * 60 * 1000) // 15 minutes before

  // Render form for new/edit appointments
  if (isNewAppointment || isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isNewAppointment ? 'Schedule Appointment' : 'Edit Appointment'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isNewAppointment ? 'Book a new therapy session' : 'Update appointment details'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAppointment} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Therapy Session, Check-up"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.time ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(SESSION_TYPES).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange('sessionType', type)}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.sessionType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${
                        formData.sessionType === type 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.sessionType === type 
                          ? 'text-blue-700' 
                          : 'text-gray-600'
                      }`}>
                        {config.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Therapist Selection */}
            {(!hasRole('therapist') || hasRole('admin')) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Therapist *
                </label>
                <select
                  value={formData.therapistId}
                  onChange={(e) => handleInputChange('therapistId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.therapistId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select therapist</option>
                  {therapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </option>
                  ))}
                </select>
                {errors.therapistId && (
                  <p className="mt-1 text-sm text-red-600">{errors.therapistId}</p>
                )}
              </div>
            )}

            {/* Patient Selection */}
            {(!hasRole('patient') || hasRole('admin') || hasRole('therapist')) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.patientId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or preparation instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {!isNewAppointment && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => isNewAppointment ? onClose() : setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : isNewAppointment ? 'Schedule' : 'Update'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  // Render appointment details view

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
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Appointment Details
                </h3>
              </div>
              
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit appointment"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
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

            {/* Session Type */}
            {appointment.sessionType && (
              <div className="flex items-center space-x-3">
                {(() => {
                  const sessionConfig = SESSION_TYPES[appointment.sessionType]
                  if (!sessionConfig) return null
                  const Icon = sessionConfig.icon
                  return (
                    <>
                      <Icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {sessionConfig.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Session type
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

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
