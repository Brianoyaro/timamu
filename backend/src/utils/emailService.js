import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to MindLink - Your Mental Health Journey Begins',
    getHtml: (name, data = {}) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MindLink</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px; }
          .welcome-section { text-align: center; margin-bottom: 30px; }
          .welcome-section h2 { color: #1f2937; margin-bottom: 10px; font-size: 22px; }
          .features { margin: 30px 0; }
          .feature { display: flex; align-items: flex-start; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .feature-icon { width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
          .feature-content h3 { margin: 0 0 5px 0; color: #1f2937; font-size: 16px; }
          .feature-content p { margin: 0; color: #6b7280; font-size: 14px; }
          .cta { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .social-links { margin: 15px 0; }
          .social-links a { margin: 0 10px; color: #6b7280; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 MindLink</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 16px;">Professional Telepsychology Platform</p>
          </div>
          
          <div class="content">
            <div class="welcome-section">
              <h2>Welcome, ${name}! 🎉</h2>
              <p style="color: #6b7280; font-size: 16px;">Thank you for joining MindLink. We're here to support your mental health journey.</p>
            </div>

            <div class="features">
              <div class="feature">
                <div class="feature-icon">
                  <span style="color: white; font-size: 18px;">👨‍⚕️</span>
                </div>
                <div class="feature-content">
                  <h3>Connect with Licensed Therapists</h3>
                  <p>Browse our network of qualified mental health professionals and find the right match for you.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">
                  <span style="color: white; font-size: 18px;">📹</span>
                </div>
                <div class="feature-content">
                  <h3>Secure Video Sessions</h3>
                  <p>Attend therapy sessions from the comfort and privacy of your own space with our HIPAA-compliant platform.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">
                  <span style="color: white; font-size: 18px;">📊</span>
                </div>
                <div class="feature-content">
                  <h3>Track Your Progress</h3>
                  <p>Monitor your mental health journey with mood tracking, assessments, and progress insights.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">
                  <span style="color: white; font-size: 18px;">🆘</span>
                </div>
                <div class="feature-content">
                  <h3>24/7 Crisis Support</h3>
                  <p>Access immediate support resources and crisis intervention tools whenever you need them.</p>
                </div>
              </div>
            </div>

            <div class="cta">
              <a href="${process.env.FRONTEND_URL}/t/default" class="cta-button">Start Your Journey</a>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">📋 Next Steps:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Complete your profile to help us match you with the right therapist</li>
                <li>Browse available therapists and read their specializations</li>
                <li>Schedule your first consultation or therapy session</li>
                <li>Download our mobile app for on-the-go access</li>
              </ol>
            </div>
          </div>

          <div class="footer">
            <p><strong>MindLink</strong> - Professional Telepsychology Platform</p>
            <div class="social-links">
              <a href="#privacy">Privacy Policy</a> |
              <a href="#terms">Terms of Service</a> |
              <a href="#support">Support</a>
            </div>
            <p style="font-size: 12px; margin-top: 15px;">
              You're receiving this email because you created an account with MindLink.<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  passwordReset: {
    subject: 'Reset Your MindLink Password',
    getHtml: (name, data = {}) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - MindLink</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .alert h3 { margin: 0 0 10px 0; color: #dc2626; }
          .alert p { margin: 0; color: #7f1d1d; }
          .cta { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .security-info { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">MindLink Security</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hello${name ? ` ${name}` : ''},</h2>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              We received a request to reset the password for your MindLink account. If you made this request, 
              click the button below to set a new password.
            </p>

            <div class="cta">
              <a href="${data.resetUrl}" class="cta-button">Reset Your Password</a>
            </div>

            <div class="alert">
              <h3>⏰ Important:</h3>
              <p>This password reset link will expire in <strong>1 hour</strong> for your security.</p>
            </div>

            <div class="security-info">
              <h4 style="margin: 0 0 10px 0; color: #0369a1;">🛡️ Security Information:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your current password remains unchanged until you complete the reset</li>
                <li>For additional security, we recommend using a strong, unique password</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If the button above doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${data.resetUrl}" style="color: #3b82f6; word-break: break-all;">${data.resetUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p><strong>MindLink</strong> - Professional Telepsychology Platform</p>
            <p style="font-size: 12px; margin-top: 15px;">
              If you didn't request a password reset, please contact our support team immediately.<br>
              This email was sent from an automated system, please do not reply.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  appointmentReminder: {
    subject: 'Upcoming Therapy Session Reminder - MindLink',
    getHtml: (name, data = {}) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Reminder - MindLink</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .appointment-card { background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .appointment-details { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: 600; color: #047857; }
          .detail-value { color: #065f46; }
          .cta { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px; }
          .prep-tips { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Session Reminder</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Your upcoming therapy session</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937;">Hello ${name},</h2>
            
            <p>This is a friendly reminder about your upcoming therapy session.</p>

            <div class="appointment-card">
              <h3 style="margin: 0 0 15px 0; color: #047857;">📋 Session Details</h3>
              <div class="appointment-details">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${data.datetime}</span>
              </div>
              <div class="appointment-details">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="appointment-details">
                <span class="detail-label">Therapist:</span>
                <span class="detail-value">${data.therapistName}</span>
              </div>
              <div class="appointment-details">
                <span class="detail-label">Session Type:</span>
                <span class="detail-value">${data.type}</span>
              </div>
            </div>

            <div class="cta">
              <a href="${data.joinUrl}" class="cta-button">Join Session</a>
              <a href="${data.rescheduleUrl}" class="cta-button" style="background: #6b7280;">Reschedule</a>
            </div>

            <div class="prep-tips">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">💡 Preparation Tips:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Find a quiet, private space for your session</li>
                <li>Test your camera and microphone beforehand</li>
                <li>Have a glass of water nearby</li>
                <li>Prepare any questions or topics you'd like to discuss</li>
                <li>Join the session 5 minutes early</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Need to cancel or reschedule? Please do so at least 24 hours in advance to avoid cancellation fees.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Create transporter with fallback options
const createTransporter = () => {
  // Primary SMTP configuration (fallback)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  // Gmail fallback
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  }

  // Development fallback (Ethereal)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  No email configuration found, using test account')
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }

  throw new Error('No email configuration available')
}

// SendGrid email sending function
const sendEmailWithSendGrid = async ({ to, subject, html, text, from }) => {
  try {
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: from || process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    const result = await sgMail.send(msg)
    console.log('✅ SendGrid email sent successfully:', {
      messageId: result[0]?.headers?.['x-message-id'],
      to: Array.isArray(to) ? to.join(', ') : to,
      subject
    })
    
    return {
      messageId: result[0]?.headers?.['x-message-id'],
      provider: 'sendgrid',
      accepted: msg.to
    }
  } catch (error) {
    console.error('❌ SendGrid error:', error)
    if (error.response) {
      console.error('SendGrid response body:', error.response.body)
    }
    throw new Error(`SendGrid failed: ${error.message}`)
  }
}

// Nodemailer fallback function
const sendEmailWithNodemailer = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"MindLink" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Nodemailer email sent successfully:', {
      messageId: result.messageId,
      to,
      subject
    })
    
    return {
      messageId: result.messageId,
      provider: 'nodemailer',
      accepted: result.accepted
    }
  } catch (error) {
    console.error('❌ Nodemailer error:', error)
    throw new Error(`Nodemailer failed: ${error.message}`)
  }
}

// Generic email sending function with environment-aware provider selection
export const sendEmail = async ({ to, subject, html, text, template, templateData = {}, from }) => {
  try {
    // If template is provided, use it
    if (template && templates[template]) {
      const templateObj = templates[template]
      subject = subject || templateObj.subject
      html = templateObj.getHtml(templateData.name || '', templateData)
    }

    // Production: Use SendGrid first
    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
      try {
        console.log('🚀 Using SendGrid for production email delivery')
        return await sendEmailWithSendGrid({ to, subject, html, text, from })
      } catch (sendGridError) {
        console.warn('⚠️  SendGrid failed in production, falling back to SMTP:', sendGridError.message)
        
        // In production, you might want to fail rather than fallback
        if (process.env.SENDGRID_FALLBACK_DISABLED === 'true') {
          throw sendGridError
        }
      }
    }

    // Development/Testing: Use Gmail/SMTP first
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧪 Using Gmail/SMTP for development email delivery')
      return await sendEmailWithNodemailer({ to, subject, html, text })
    }

    // Fallback: Try SendGrid if available (development with SendGrid configured)
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log('📧 Falling back to SendGrid')
        return await sendEmailWithSendGrid({ to, subject, html, text, from })
      } catch (sendGridError) {
        console.warn('⚠️  SendGrid fallback failed:', sendGridError.message)
      }
    }

    // Final fallback: Nodemailer
    console.log('📧 Using final Nodemailer fallback')
    return await sendEmailWithNodemailer({ to, subject, html, text })

  } catch (error) {
    console.error('❌ All email providers failed:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

// Specific email functions
export const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    template: 'welcome',
    templateData: { name }
  })
}

export const sendPasswordResetEmail = async (email, resetToken, name = '') => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
  
  return sendEmail({
    to: email,
    template: 'passwordReset',
    templateData: { 
      name,
      resetUrl 
    }
  })
}

export const sendAppointmentReminder = async (email, appointmentData) => {
  const { name, datetime, duration, therapistName, type, sessionId } = appointmentData
  
  const joinUrl = `${process.env.FRONTEND_URL}/t/default/sessions/${sessionId}/video`
  const rescheduleUrl = `${process.env.FRONTEND_URL}/t/default/schedule`
  
  return sendEmail({
    to: email,
    template: 'appointmentReminder',
    templateData: {
      name,
      datetime: new Date(datetime).toLocaleString(),
      duration,
      therapistName,
      type,
      joinUrl,
      rescheduleUrl
    }
  })
}

// Bulk email function for notifications (optimized for SendGrid)
export const sendBulkEmail = async (recipients, { subject, template, templateData = {} }) => {
  // If using SendGrid, we can send to multiple recipients in one API call
  if (process.env.SENDGRID_API_KEY) {
    try {
      const emails = recipients.map(recipient => recipient.email)
      const result = await sendEmail({
        to: emails,
        subject,
        template,
        templateData
      })
      
      // Return success for all recipients
      return recipients.map(recipient => ({
        email: recipient.email,
        success: true,
        messageId: result.messageId,
        provider: 'sendgrid-bulk'
      }))
    } catch (error) {
      console.error('Bulk SendGrid send failed, falling back to individual sends:', error)
    }
  }
  
  // Fallback: send individual emails (for SMTP or if SendGrid bulk fails)
  const results = []
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        template,
        templateData: { ...templateData, name: recipient.name }
      })
      results.push({ 
        email: recipient.email, 
        success: true, 
        messageId: result.messageId,
        provider: result.provider || 'fallback'
      })
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error)
      results.push({ 
        email: recipient.email, 
        success: false, 
        error: error.message 
      })
    }
  }
  
  return results
}

// Email verification
export const sendEmailVerification = async (email, verificationToken, name = '') => {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}` // WE NEED TO ADD THIS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Verify Your Email Address</h2>
      <p>Hello ${name},</p>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Verify Email Address
      </a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Verify Your MindLink Account',
    html
  })
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAppointmentReminder,
  sendBulkEmail,
  sendEmailVerification
}
