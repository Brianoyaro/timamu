import { apiService } from './apiService'

export const activityService = {
  async getRecentActivity(limit = 10) {
    try {
      // Get recent appointments
      const appointmentsResponse = await apiService.get('/appointments', {
        limit: 5,
        status: 'completed'
      })
      
      // Get recent mood check-ins  
      const moodResponse = await apiService.get('/assessments/mood-checkins', {
        limit: 3
      })
      
      // Get recent assessments
      const assessmentsResponse = await apiService.get('/assessments', {
        limit: 3
      })
      
      const activities = []
      
      // Process appointments
      if (appointmentsResponse.appointments) {
        appointmentsResponse.appointments.forEach(appointment => {
          activities.push({
            id: `appointment-${appointment.id}`,
            type: 'session',
            title: `Session with ${appointment.therapist?.name || 'Therapist'}`,
            description: `Completed ${appointment.type} session`,
            timestamp: new Date(appointment.datetime),
            icon: 'calendar',
            color: 'text-primary-600'
          })
        })
      }
      
      // Process mood check-ins
      if (moodResponse.checkins) {
        moodResponse.checkins.forEach(checkin => {
          const moodLabels = ['Very sad', 'Sad', 'Neutral', 'Good', 'Great']
          activities.push({
            id: `mood-${checkin.id}`,
            type: 'mood',
            title: 'Mood Check-in',
            description: `Feeling ${moodLabels[checkin.mood - 1]} (${checkin.mood}/5)`,
            timestamp: new Date(checkin.timestamp),
            icon: 'heart',
            color: 'text-green-600'
          })
        })
      }
      
      // Process assessments
      if (assessmentsResponse.assessments) {
        assessmentsResponse.assessments.forEach(assessment => {
          activities.push({
            id: `assessment-${assessment.id}`,
            type: 'assessment',
            title: `${assessment.type} Assessment`,
            description: assessment.score ? `Score: ${assessment.score}` : 'Assessment completed',
            timestamp: new Date(assessment.completedAt),
            icon: 'fileText',
            color: 'text-yellow-600'
          })
        })
      }
      
      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      return []
    }
  }
}
