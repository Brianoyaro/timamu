import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Star, 
  MapPin, 
  Calendar,
  Clock,
  MessageCircle,
  Video,
  CheckCircle,
  Award,
  BookOpen,
  Users
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { userService } from '@/services/userService'
import { schedulingService } from '@/services/schedulingService'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BookingCalendar } from '@/components/scheduling/BookingCalendar'

/**
 * Therapist detail page with booking functionality
 * Main booking interface as requested
 */
export function TherapistDetailPage() {
  const navigate = useNavigate()
  const { tenantId, therapistId } = useParams()
  const { toast } = useToast()
  const [therapist, setTherapist] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isBooking, setIsBooking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  useEffect(() => {
    loadTherapistData()
  }, [therapistId])

  /**
   * Load therapist information and availability
   */
  const loadTherapistData = async () => {
    try {
      setIsLoading(true)
      
      // Load therapist details
      const therapistData = await userService.getUser(therapistId)
      setTherapist(therapistData)

      // Load available time slots
      const slots = await schedulingService.getAvailableSlots(therapistId)
      setAvailableSlots(slots)

    } catch (error) {
      console.error('Failed to load therapist data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load therapist information',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle appointment booking
   */
  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      toast({
        title: 'No time selected',
        description: 'Please select an available time slot',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsBooking(true)
      
      const appointment = await schedulingService.bookAppointment({
        therapistId: therapist.id,
        datetime: selectedSlot.datetime,
        duration: selectedSlot.duration || 60,
        type: 'therapy-session',
      })

      toast({
        title: 'Appointment booked!',
        description: `Your session with ${therapist.name} is scheduled for ${formatDate(selectedSlot.datetime)}`,
      })

      // Navigate to appointments page
      navigate(`/t/${tenantId}/appointments`)

    } catch (error) {
      console.error('Failed to book appointment:', error)
      toast({
        title: 'Booking failed',
        description: error.message || 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsBooking(false)
      setBookingDialogOpen(false)
    }
  }

  /**
   * Handle contact actions
   */
  const handleContact = (type) => {
    switch (type) {
      case 'message':
        navigate(`/t/${tenantId}/messages?therapist=${therapist.id}`)
        break
      case 'video':
        // Would integrate with video calling system
        toast({
          title: 'Video calling',
          description: 'Video calling feature coming soon',
        })
        break
      default:
        break
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!therapist) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Therapist not found</h3>
        <p className="text-muted-foreground mb-4">
          The therapist you're looking for doesn't exist or is no longer available
        </p>
        <Button onClick={() => navigate(`/t/${tenantId}/therapists`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to therapists
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(`/t/${tenantId}/therapists`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to therapists
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Therapist Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {therapist.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{therapist.name}</CardTitle>
                      <p className="text-muted-foreground">{therapist.credentials || 'Licensed Therapist'}</p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{therapist.rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-sm text-muted-foreground">
                            ({therapist.reviewCount || 0} reviews)
                          </span>
                        </div>
                        
                        {therapist.location && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{therapist.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {therapist.isAvailable !== false && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {therapist.specializations?.map((spec) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Therapist Information Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="approach">Approach</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">About {therapist.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {therapist.bio || `${therapist.name} is a dedicated mental health professional committed to helping clients achieve their therapeutic goals. With a compassionate approach and evidence-based techniques, they create a safe and supportive environment for healing and growth.`}
                    </p>
                    
                    {therapist.languages && therapist.languages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {therapist.languages.map((lang) => (
                            <Badge key={lang} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Professional Experience</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Years of Experience</p>
                          <p className="text-sm text-muted-foreground">
                            {therapist.yearsExperience || '5+'} years practicing therapy
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Education & Credentials</p>
                          <p className="text-sm text-muted-foreground">
                            {therapist.education || 'Master\'s in Clinical Psychology, Licensed Clinical Social Worker (LCSW)'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Licenses & Certifications</p>
                          <p className="text-sm text-muted-foreground">
                            {therapist.licenses || 'Licensed in multiple states, Certified in CBT and DBT'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="approach" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Therapeutic Approach</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {therapist.approach || `${therapist.name} uses an integrative approach combining cognitive-behavioral therapy (CBT), mindfulness-based techniques, and person-centered therapy. They believe in meeting each client where they are and tailoring treatment to individual needs and goals.`}
                    </p>
                    
                    {therapist.methodologies && therapist.methodologies.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Treatment Methodologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {therapist.methodologies.map((method) => (
                            <Badge key={method} variant="outline">{method}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Client Reviews</h3>
                    
                    {therapist.reviews && therapist.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {therapist.reviews.slice(0, 3).map((review, index) => (
                          <div key={index} className="border-l-4 border-primary/20 pl-4">
                            <div className="flex items-center space-x-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              "{review.comment}"
                            </p>
                            <p className="text-xs text-muted-foreground">
                              - {review.clientInitials}, {formatDate(review.date)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No reviews available yet. Be the first to book a session!
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {therapist.hourlyRate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="text-lg font-bold">{formatCurrency(therapist.hourlyRate)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session Duration</span>
                <span className="font-medium">60 minutes</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session Type</span>
                <span className="font-medium">Video Call</span>
              </div>
            </CardContent>
          </Card>

          {/* Booking Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>
                Schedule your appointment with {therapist.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Schedule with {therapist.name}</DialogTitle>
                    <DialogDescription>
                      Select an available time slot for your session
                    </DialogDescription>
                  </DialogHeader>
                  
                  <BookingCalendar
                    therapistId={therapist.id}
                    availableSlots={availableSlots}
                    selectedSlot={selectedSlot}
                    onSlotSelect={setSelectedSlot}
                    onBook={handleBookAppointment}
                    isBooking={isBooking}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleContact('message')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Message
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleContact('video')}
              >
                <Video className="mr-2 h-4 w-4" />
                Quick Consultation
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Usually responds within 2 hours</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Verified credentials</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{therapist.sessionCount || 150}+ sessions completed</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
