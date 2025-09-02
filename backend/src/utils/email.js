import nodemailer from 'nodemailer'

// Create transporter
const createTransporter = () => {
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

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()
    
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

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Password Reset Request</h2>
      <p>You requested a password reset for your MindLink account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        MindLink - Professional Telepsychology Platform
      </p>
    </div>
  `

  const text = `
    Password Reset Request
    
    You requested a password reset for your MindLink account.
    
    Reset your password: ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this reset, please ignore this email.
  `

  return sendEmail({
    to: email,
    subject: 'Reset Your MindLink Password',
    html,
    text
  })
}

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Welcome to MindLink!</h2>
      <p>Hi ${name},</p>
      <p>Welcome to MindLink, your professional telepsychology platform.</p>
      <p>You can now:</p>
      <ul>
        <li>Schedule sessions with licensed therapists</li>
        <li>Access secure video conferencing</li>
        <li>Track your mental health progress</li>
        <li>Access crisis resources when needed</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Get Started
      </a>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        MindLink - Professional Telepsychology Platform
      </p>
    </div>
  `

  const text = `
    Welcome to MindLink!
    
    Hi ${name},
    
    Welcome to MindLink, your professional telepsychology platform.
    
    Get started: ${process.env.FRONTEND_URL}
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to MindLink',
    html,
    text
  })
}
