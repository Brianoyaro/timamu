import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  Clock,
  Star,
  ArrowRight,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import { schedulingService } from '@/services/schedulingService'
import { formatDate } from '@/lib/utils'

/**
 * Main dashboard page with role-specific content
 * Displays relevant information and quick actions based on user role
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user, hasRole } = useAuthStore()
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [featuredTherapists, setFeaturedTherapists] = useState([])
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedSessions: 0,
    upcomingAppointments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  /**
   * Load dashboard data based on user role
   */
  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load appointments for all users
      const appointments = await schedulingService.getAppointments({ limit: 5 })
      setUpcomingAppointments(appointments)

      // Load featured therapists for patients
      if (hasRole('patient')) {
        const therapists = await userService.getTherapists({ limit: 4 })
        const featured = therapists
          .filter(t => t.rating >= 4.5)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        setFeaturedTherapists(featured)
      }

      // Calculate stats
      const totalAppointments = await schedulingService.getAppointments()
      setStats({
        totalAppointments: totalAppointments.length,
        completedSessions: totalAppointments.filter(a => a.status === 'completed').length,
        upcomingAppointments: totalAppointments.filter(a => 
          new Date(a.datetime) > new Date() && a.status === 'scheduled'
        ).length,
      })

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Quick action handlers
   */
  const handleQuickAction = (action) => {
    switch (action) {
      case 'findTherapists':
        navigate(`/t/${tenantId}/therapists`)
        break
      case 'viewSchedule':
        navigate(`/t/${tenantId}/appointments`)
        break
      case 'messages':
        navigate(`/t/${tenantId}/messages`)
        break
      default:
        break
    }
  }

  /**
   * Navigation to therapist detail
   */
  const handleTherapistClick = (therapistId) => {
    navigate(`/t/${tenantId}/therapists/${therapistId}`)
  }

  /**
   * Get greeting based on time of day
   */
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAppointments} total appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              appointments scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.filter(a => {
                const appointmentDate = new Date(a.datetime)
                const weekFromNow = new Date()
                weekFromNow.setDate(weekFromNow.getDate() + 7)
                return appointmentDate <= weekFromNow
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              appointments this week
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasRole('patient') && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleQuickAction('findTherapists')}
                  >
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Find Therapists
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleQuickAction('viewSchedule')}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Appointments
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleQuickAction('messages')}
              >
                <div className="flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your next scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {hasRole('patient') 
                            ? appointment.therapist?.name 
                            : appointment.patient?.name
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(appointment.datetime, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  {hasRole('patient') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleQuickAction('findTherapists')}
                    >
                      Book an appointment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Featured Therapists for Patients */}
      {hasRole('patient') && featuredTherapists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recommended Therapists</CardTitle>
              <CardDescription>
                Highly-rated therapists available for booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredTherapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleTherapistClick(therapist.id)}
                  >
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                      {therapist.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{therapist.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm text-muted-foreground">
                          {therapist.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {therapist.specializations?.[0] || 'General Therapy'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
