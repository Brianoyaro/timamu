// Legacy email functions - now using enhanced emailService
import { sendWelcomeEmail as sendWelcomeEmailNew, sendPasswordResetEmail as sendPasswordResetEmailNew, sendEmail as sendEmailNew } from './emailService.js'

// Re-export enhanced functions for backward compatibility
export const sendEmail = sendEmailNew
export const sendWelcomeEmail = sendWelcomeEmailNew
export const sendPasswordResetEmail = sendPasswordResetEmailNew

// Keep original simple implementations as fallback
import nodemailer from 'nodemailer'

const createSimpleTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

export const sendSimpleEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createSimpleTransporter()
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
      text
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent:', result.messageId)
    return result
  } catch (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }
}
