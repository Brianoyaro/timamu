import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// SendGrid webhook handler for email events
router.post('/sendgrid', async (req, res) => {
  try {
    const events = req.body

    if (!Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload'
      })
    }

    console.log(`📧 Received ${events.length} SendGrid webhook events`)

    for (const event of events) {
      try {
        // Log the event
        console.log(`SendGrid Event: ${event.event} for ${event.email}`)

        // You can store these events in your database for analytics
        // Example: Track email delivery status, opens, clicks, bounces, etc.
        
        switch (event.event) {
          case 'delivered':
            console.log(`✅ Email delivered to ${event.email}`)
            break
            
          case 'opened':
            console.log(`👁️  Email opened by ${event.email}`)
            break
            
          case 'clicked':
            console.log(`🔗 Link clicked in email by ${event.email}`)
            break
            
          case 'bounce':
            console.log(`⚠️  Email bounced for ${event.email}: ${event.reason}`)
            break
            
          case 'dropped':
            console.log(`❌ Email dropped for ${event.email}: ${event.reason}`)
            break
            
          case 'spam_report':
            console.log(`🚨 Spam report from ${event.email}`)
            break
            
          case 'unsubscribe':
            console.log(`📵 Unsubscribe from ${event.email}`)
            // You might want to update user preferences here
            break
            
          default:
            console.log(`📋 Unknown event: ${event.event}`)
        }

        // Optional: Store in database for analytics
        /*
        await prisma.emailEvent.create({
          data: {
            messageId: event.sg_message_id,
            email: event.email,
            event: event.event,
            timestamp: new Date(event.timestamp * 1000),
            reason: event.reason,
            url: event.url,
            metadata: event
          }
        })
        */

      } catch (eventError) {
        console.error('Error processing SendGrid event:', eventError)
      }
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('SendGrid webhook error:', error)
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    })
  }
})

export default router
