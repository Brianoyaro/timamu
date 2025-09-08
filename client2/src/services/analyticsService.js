// Analytics service abstraction - wire to your preferred analytics provider
class AnalyticsService {
  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    this.userId = null
    this.tenantId = null
  }

  identify(userId, traits = {}) {
    if (!this.isEnabled) return
    
    this.userId = userId
    console.log('Analytics: Identify user', { userId, traits })
    
    // TODO: Wire to real analytics provider
    // Example: analytics.identify(userId, traits)
  }

  track(event, properties = {}) {
    if (!this.isEnabled) return
    
    const payload = {
      event,
      properties: {
        ...properties,
        userId: this.userId,
        tenantId: this.tenantId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }
    
    console.log('Analytics: Track event', payload)
    
    // TODO: Wire to real analytics provider
    // Example: analytics.track(event, properties)
  }

  page(name, properties = {}) {
    if (!this.isEnabled) return
    
    this.track('Page Viewed', {
      page: name,
      ...properties
    })
  }

  setTenant(tenantId) {
    this.tenantId = tenantId
  }

  // Common event tracking methods
  trackSignIn(method = 'email') {
    this.track('User Signed In', { method })
  }

  trackSignUp(method = 'email') {
    this.track('User Signed Up', { method })
  }

  trackSessionJoined(sessionId, userRole) {
    this.track('Video Session Joined', { sessionId, userRole })
  }

  trackAppointmentBooked(appointmentId, therapistId) {
    this.track('Appointment Booked', { appointmentId, therapistId })
  }

  trackAssessmentCompleted(assessmentType, score) {
    this.track('Assessment Completed', { assessmentType, score })
  }

  trackCrisisResourceAccessed(resourceType) {
    this.track('Crisis Resource Accessed', { resourceType })
  }

  trackFeatureUsed(feature, context = {}) {
    this.track('Feature Used', { feature, ...context })
  }
}

export const analyticsService = new AnalyticsService()
