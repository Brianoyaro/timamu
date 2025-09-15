/**
 * Email utility using Nodemailer
 * Handles sending various types of emails with templates
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Email templates
 */
const templates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - Telepsychology Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Welcome to Telepsychology Platform!</h2>
        <p>Hi ${data.name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${data.verificationLink}</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset - Telepsychology Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #dc2626;">Password Reset Request</h2>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${data.resetLink}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </p>
      </div>
    `
  }),

  sessionReminder: (data) => ({
    subject: 'Session Reminder - Telepsychology Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #059669;">Session Reminder</h2>
        <p>Hi ${data.patientName},</p>
        <p>This is a reminder that you have an upcoming therapy session:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Therapist:</strong> ${data.therapistName}</p>
          <p><strong>Date & Time:</strong> ${data.sessionDateTime}</p>
          <p><strong>Type:</strong> ${data.sessionType}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.sessionLink}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Session
          </a>
        </div>
        <p>Please join the session 5 minutes before the scheduled time.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you need to reschedule or cancel, please contact your therapist as soon as possible.
        </p>
      </div>
    `
  }),

  sessionInvitation: (data) => ({
    subject: 'Session Invitation - Telepsychology Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #7c3aed;">Session Invitation</h2>
        <p>Hi ${data.recipientName},</p>
        <p>You have been invited to join a therapy session:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Session ID:</strong> ${data.sessionId}</p>
          <p><strong>Date & Time:</strong> ${data.sessionDateTime}</p>
          <p><strong>Type:</strong> ${data.sessionType}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.sessionLink}" 
             style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Session
          </a>
        </div>
        <p>Please ensure you have a stable internet connection and are in a private, comfortable space.</p>
      </div>
    `
  }),

  therapistApproval: (data) => ({
    subject: 'Therapist Application Approved - Telepsychology Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #059669;">Congratulations! Your Application is Approved</h2>
        <p>Hi Dr. ${data.name},</p>
        <p>We're excited to inform you that your therapist application has been approved!</p>
        <p>You can now:</p>
        <ul>
          <li>Access your therapist dashboard</li>
          <li>Set your availability</li>
          <li>Accept patient session requests</li>
          <li>Manage your profile and specializations</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardLink}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Dashboard
          </a>
        </div>
        <p>Welcome to our platform! We look forward to working with you to provide excellent mental health care.</p>
      </div>
    `
  })
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject (optional if using template)
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML content
 * @param {string} options.text - Plain text content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    let emailContent = {};

    if (options.template && templates[options.template]) {
      const template = templates[options.template](options.data || {});
      emailContent = {
        subject: options.subject || template.subject,
        html: template.html,
        text: template.text || '' // Extract text from HTML if needed
      };
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html,
        text: options.text
      };
    }

    const mailOptions = {
      from: `"Telepsychology Platform" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${options.to}`, {
      messageId: result.messageId,
      template: options.template
    });

    return result;

  } catch (error) {
    logger.error('Email sending failed:', {
      error: error.message,
      to: options.to,
      template: options.template
    });
    throw new Error('Failed to send email');
  }
};

/**
 * Send bulk emails (for notifications, newsletters, etc.)
 * @param {Array} recipients - Array of email addresses
 * @param {string} template - Template name
 * @param {Object} data - Template data
 */
const sendBulkEmail = async (recipients, template, data) => {
  const promises = recipients.map(recipient => {
    return sendEmail({
      to: recipient,
      template,
      data: { ...data, recipientEmail: recipient }
    });
  });

  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, results };
  } catch (error) {
    logger.error('Bulk email failed:', error);
    throw new Error('Bulk email operation failed');
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  verifyEmailConfig,
  templates
};
