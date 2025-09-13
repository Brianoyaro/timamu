import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  User,
  Video,
  MessageCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'
import { schedulingService } from '@/services/schedulingService'
import { formatDate, formatRelativeTime } from '@/lib/utils'

/**
 * Appointments page showing user's scheduled sessions
 */
export function AppointmentsPage() {
  const { user, hasRole } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    loadAppointments()
  }, [])

  /**
   * Load appointments from API
   */
  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      const data = await schedulingService.getAppointments()
      setAppointments(data)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Filter appointments based on status and date
   */
  const getFilteredAppointments = () => {
    const now = new Date()
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => 
          new Date(apt.datetime) > now && apt.status === 'scheduled'
        )
      case 'past':
        return appointments.filter(apt => 
          new Date(apt.datetime) < now || apt.status === 'completed'
        )
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled')
      default:
        return appointments
    }
  }

  /**
   * Get status badge variant
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return { variant: 'default', text: 'Scheduled' }
      case 'completed':
        return { variant: 'secondary', text: 'Completed' }
      case 'cancelled':
        return { variant: 'destructive', text: 'Cancelled' }
      default:
        return { variant: 'outline', text: status }
    }
  }

  /**
   * Handle appointment action
   */
  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      switch (action) {
        case 'cancel':
          await schedulingService.cancelAppointment(appointmentId)
          break
        case 'reschedule':
          // Would open reschedule dialog
          console.log('Reschedule:', appointmentId)
          break
        case 'join':
          // Would open video call
          console.log('Join session:', appointmentId)
          break
        default:
          break
      }
      loadAppointments() // Refresh list
    } catch (error) {
      console.error('Appointment action failed:', error)
    }
  }

  const filteredAppointments = getFilteredAppointments()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
        <p className="text-muted-foreground">
          Manage your scheduled therapy sessions
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment, index) => {
                  const statusBadge = getStatusBadge(appointment.status)
                  const isUpcoming = new Date(appointment.datetime) > new Date()
                  const otherUser = hasRole('patient') 
                    ? appointment.therapist 
                    : appointment.patient

                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* User Avatar */}
                              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                                {otherUser?.name?.charAt(0) || 'U'}
                              </div>

                              {/* Appointment Details */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold">
                                    {otherUser?.name || 'Unknown User'}
                                  </h3>
                                  <Badge variant={statusBadge.variant}>
                                    {statusBadge.text}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {formatDate(appointment.datetime, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {formatDate(appointment.datetime, {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  
                                  <span>
                                    {appointment.duration || 60} minutes
                                  </span>
                                </div>

                                {appointment.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              {isUpcoming && appointment.status === 'scheduled' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAppointmentAction(appointment.id, 'join')}
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    Join
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAppointmentAction(appointment.id, 'reschedule')}
                                  >
                                    Reschedule
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {appointment.status === 'completed' && (
                                <Button variant="outline" size="sm">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Calendar className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No {filter !== 'all' ? filter : ''} appointments
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'upcoming' 
                    ? "You don't have any upcoming appointments scheduled."
                    : filter === 'past'
                    ? "You haven't completed any sessions yet."
                    : filter === 'cancelled'
                    ? "No cancelled appointments."
                    : "You don't have any appointments yet."
                  }
                </p>
                {filter === 'upcoming' && hasRole('patient') && (
                  <Button onClick={() => window.location.href = window.location.href.replace('/appointments', '/therapists')}>
                    Book an appointment
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
