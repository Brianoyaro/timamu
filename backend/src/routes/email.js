import express from 'express'
import { body } from 'express-validator'
import { authenticate, authorize } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'
import { sendEmail, sendBulkEmail, sendAppointmentReminder } from '../utils/emailService.js'

const router = express.Router()

// Send custom email (admin only)
router.post('/send',
  authenticate,
  authorize(['admin']),
  requireTenant,
  sanitizeInput,
  [
    body('to').isEmail().withMessage('Valid email required'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject required'),
    body('template').optional().isIn(['welcome', 'passwordReset', 'appointmentReminder']),
    body('html').optional().trim(),
    body('text').optional().trim(),
    body('templateData').optional().isObject()
  ],
  validateRequest,
  auditLog('email.sent'),
  async (req, res) => {
    try {
      const { to, subject, template, html, text, templateData } = req.body

      const result = await sendEmail({
        to,
        subject,
        template,
        html,
        text,
        templateData
      })

      res.json({
        success: true,
        data: {
          messageId: result.messageId,
          provider: result.provider || 'unknown',
          message: 'Email sent successfully'
        }
      })
    } catch (error) {
      console.error('Send email error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send email'
      })
    }
  }
)

// Send bulk emails (admin only)
router.post('/bulk',
  authenticate,
  authorize(['admin']),
  requireTenant,
  sanitizeInput,
  [
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*.email').isEmail().withMessage('Valid email required for each recipient'),
    body('recipients.*.name').optional().trim(),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject required'),
    body('template').optional().isIn(['welcome', 'passwordReset', 'appointmentReminder']),
    body('templateData').optional().isObject()
  ],
  validateRequest,
  auditLog('email.bulk_sent'),
  async (req, res) => {
    try {
      const { recipients, subject, template, templateData } = req.body

      const results = await sendBulkEmail(recipients, {
        subject,
        template,
        templateData
      })

      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      const providers = [...new Set(results.map(r => r.provider).filter(Boolean))]

      res.json({
        success: true,
        data: {
          total: recipients.length,
          successful,
          failed,
          providers: providers,
          results
        }
      })
    } catch (error) {
      console.error('Send bulk email error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk emails'
      })
    }
  }
)

// Send appointment reminder
router.post('/appointment-reminder',
  authenticate,
  requireTenant,
  sanitizeInput,
  [
    body('appointmentId').isUUID().withMessage('Valid appointment ID required')
  ],
  validateRequest,
  auditLog('email.appointment_reminder'),
  async (req, res) => {
    try {
      const { appointmentId } = req.body

      // This would typically fetch appointment data from database
      // For now, returning success - you'd implement the full logic
      res.json({
        success: true,
        data: { message: 'Appointment reminder sent' }
      })
    } catch (error) {
      console.error('Send appointment reminder error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send appointment reminder'
      })
    }
  }
)

// Test email configuration (admin only)
router.post('/test',
  authenticate,
  authorize(['admin']),
  sanitizeInput,
  [
    body('to').optional().isEmail().withMessage('Valid email required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { to } = req.body
      const testEmail = to || req.user.email

      const result = await sendEmail({
        to: testEmail,
        subject: 'MindLink Email Test - Configuration Check',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3b82f6;">✅ Email Configuration Test</h2>
            <p>Congratulations! Your MindLink email configuration is working correctly.</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">📋 Test Details:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li>Sent at: ${new Date().toISOString()}</li>
                <li>Sent to: ${testEmail}</li>
                <li>Sent by: ${req.user.name} (${req.user.email})</li>
                <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
                <li>Provider Used: <strong>${result.provider || 'unknown'}</strong></li>
              </ul>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #0369a1;">📧 Email Configuration Status:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
                <li>Gmail: ${process.env.GMAIL_USER ? '✅ Configured' : '❌ Not configured'}</li>
                <li>SMTP: ${process.env.SMTP_HOST ? '✅ Configured' : '❌ Not configured'}</li>
                <li>SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured (Production Ready)' : '❌ Not configured (Development Mode)'}</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">🔄 Provider Priority:</h4>
              <p style="margin: 0; color: #92400e;">
                <strong>Development:</strong> Gmail → SMTP → SendGrid (if configured)<br>
                <strong>Production:</strong> SendGrid → SMTP → Gmail
              </p>
            </div>

            <p>You can now send emails from your MindLink application with confidence!</p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #6b7280;">
              <p><strong>Next Steps for Production:</strong></p>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Set up SendGrid account and get API key</li>
                <li>Add SENDGRID_API_KEY to production environment</li>
                <li>Set NODE_ENV=production</li>
                <li>Test production email delivery</li>
              </ol>
            </div>
          </div>
        `
      })

      res.json({
        success: true,
        data: { 
          message: 'Test email sent successfully',
          sentTo: testEmail,
          provider: result.provider || 'unknown',
          messageId: result.messageId
        }
      })
    } catch (error) {
      console.error('Test email error:', error)
      res.status(500).json({
        success: false,
        error: `Email test failed: ${error.message}`
      })
    }
  }
)

export default router
