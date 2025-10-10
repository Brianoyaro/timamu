from flask_mail import Message
from flask import current_app, render_template_string
from ..extensions import mail
from datetime import datetime, timedelta
from icalendar import Calendar, Event
import uuid

def send_email(to_email, subject, body):
    msg = Message(subject, recipients=[to_email], body=body, sender=current_app.config.get('MAIL_DEFAULT_SENDER'))
    mail.send(msg)


def generate_ics_calendar(session, patient, therapist):
    """Generate .ics calendar file for session"""
    try:
        # Create calendar
        cal = Calendar()
        cal.add('prodid', '-//Timamu Therapy Platform//Session Calendar//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'REQUEST')
        
        # Create event
        event = Event()
        event.add('uid', f'session-{session.id}@timamu.com')
        event.add('dtstamp', datetime.utcnow())
        event.add('dtstart', session.scheduled_at)
        event.add('dtend', session.scheduled_at + timedelta(minutes=session.duration))
        event.add('summary', session.title)
        
        # Event description
        description = f"""
Therapy Session Details:

Patient: {patient.first_name} {patient.last_name}
Therapist: Dr. {therapist.first_name} {therapist.last_name}
Duration: {session.duration} minutes
Type: {session.session_type.title()}

Join the session at: {session.join_url}

Notes: {session.notes if session.notes else 'No additional notes'}

Please ensure you have a stable internet connection and test your audio/video before joining.

Best regards,
The Timamu Team
        """.strip()
        
        event.add('description', description)
        event.add('location', f'Online Video Call - {session.join_url}')
        event.add('status', 'CONFIRMED')
        event.add('categories', ['THERAPY', 'HEALTHCARE', 'APPOINTMENT'])
        
        # Add attendees
        event.add('organizer', f'mailto:noreply@timamu.com')
        event.add('attendee', f'ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{patient.email}')
        event.add('attendee', f'ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:{therapist.email}')
        
        # Add reminders
        # 24 hour reminder
        alarm1 = event.add('valarm')
        alarm1.add('action', 'DISPLAY')
        alarm1.add('description', 'Therapy session reminder - 24 hours')
        alarm1.add('trigger', timedelta(days=-1))
        
        # 1 hour reminder
        alarm2 = event.add('valarm')
        alarm2.add('action', 'DISPLAY')
        alarm2.add('description', 'Therapy session starting in 1 hour')
        alarm2.add('trigger', timedelta(hours=-1))
        
        # 15 minute reminder
        alarm3 = event.add('valarm')
        alarm3.add('action', 'DISPLAY')
        alarm3.add('description', 'Therapy session starting in 15 minutes')
        alarm3.add('trigger', timedelta(minutes=-15))
        
        # Add event to calendar
        cal.add_component(event)
        
        return cal.to_ical()
        
    except Exception as e:
        current_app.logger.error(f"Failed to generate .ics calendar: {str(e)}")
        return None
    mail.send(msg)


    mail.send(msg)


def send_welcome_email(user_email, first_name):
    subject = 'Welcome to NGO Therapy Platform'
    body = f"""
    Hi {first_name},

    Welcome to the NGO Therapy Platform! We're glad to have you on board.

    Best regards,
    The NGO Therapy Team
    """
    send_email(user_email, subject, body)


def send_forgot_password_email(user_email, reset_link):
    subject = 'Password Reset Request'
    body = f"""
    Hi,

    We received a request to reset your password. Click the link below to reset it:
    {reset_link}

    If you did not request this, please ignore this email.

    Best regards,
    The NGO Therapy Team
    """
    send_email(user_email, subject, body)


def send_session_confirmation(session, patient, therapist):
    """Send session confirmation emails to patient and therapist with .ics calendar attachment"""
    try:
        # Generate .ics calendar file
        ics_data = generate_ics_calendar(session, patient, therapist)
        
        # Email to patient
        patient_subject = f"Session Confirmed: {session.title}"
        patient_body = render_session_confirmation_template(
            session, patient, therapist, recipient_type='patient'
        )
        
        patient_msg = Message(
            subject=patient_subject,
            recipients=[patient.email],
            html=patient_body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@timamu.com')
        )
        
        # Attach .ics file to patient email
        if ics_data:
            patient_msg.attach(
                filename=f"therapy_session_{session.id}.ics",
                content_type="text/calendar",
                data=ics_data
            )
        
        # Email to therapist
        therapist_subject = f"New Session Scheduled: {session.title}"
        therapist_body = render_session_confirmation_template(
            session, patient, therapist, recipient_type='therapist'
        )
        
        therapist_msg = Message(
            subject=therapist_subject,
            recipients=[therapist.email],
            html=therapist_body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@timamu.com')
        )
        
        # Attach .ics file to therapist email
        if ics_data:
            therapist_msg.attach(
                filename=f"therapy_session_{session.id}.ics",
                content_type="text/calendar",
                data=ics_data
            )
        
        # Send emails
        mail.send(patient_msg)
        mail.send(therapist_msg)
        
        current_app.logger.info(f"Session confirmation emails with calendar attachments sent for session {session.id}")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send session confirmation emails: {str(e)}")
        return False


def send_session_reminder(session, recipient, reminder_type='24h_reminder'):
    """Send session reminder email"""
    try:
        if reminder_type == '24h_reminder':
            subject = f"Reminder: Your therapy session tomorrow - {session.title}"
        elif reminder_type == '1h_reminder':
            subject = f"Starting Soon: Your therapy session in 1 hour - {session.title}"
        elif reminder_type == 'starting_now':
            subject = f"Join Now: Your therapy session is starting - {session.title}"
        else:
            subject = f"Session Reminder: {session.title}"
        
        body = render_session_reminder_template(session, recipient, reminder_type)
        
        msg = Message(
            subject=subject,
            recipients=[recipient.email],
            html=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@timamu.com')
        )
        
        mail.send(msg)
        current_app.logger.info(f"Session reminder sent to {recipient.email} for session {session.id}")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send session reminder: {str(e)}")
        return False


def render_session_confirmation_template(session, patient, therapist, recipient_type):
    """Render professional session confirmation email template (Zoom-style)"""
    scheduled_time = session.scheduled_at.strftime('%A, %B %d, %Y at %I:%M %p')
    scheduled_date = session.scheduled_at.strftime('%A, %B %d, %Y')
    scheduled_time_only = session.scheduled_at.strftime('%I:%M %p')
    end_time = (session.scheduled_at + timedelta(minutes=session.duration)).strftime('%I:%M %p')
    
    if recipient_type == 'patient':
        recipient_name = patient.first_name
        other_person = f"Dr. {therapist.first_name} {therapist.last_name}"
        greeting = "Your therapy session has been confirmed!"
    else:
        recipient_name = therapist.first_name
        other_person = f"{patient.first_name} {patient.last_name}"
        greeting = "A new therapy session has been scheduled with your patient."
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .session-card { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 25px; margin: 20px 0; }
            .session-title { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 15px; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .join-button { background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; text-align: center; }
            .join-button:hover { background-color: #3730A3; }
            .important-notes { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
            .calendar-attachment { background-color: #E0F2FE; border: 1px solid #0284C7; border-radius: 5px; padding: 15px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🩺 Timamu Therapy Platform</h1>
            <p>Professional Mental Health Services</p>
        </div>
        
        <div class="content">
            <h2>Hello {{ recipient_name }},</h2>
            <p>{{ greeting }}</p>
            
            <div class="session-card">
                <div class="session-title">{{ session_title }}</div>
                
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">{{ scheduled_date }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">{{ scheduled_time_only }} - {{ end_time }} ({{ session_timezone }})</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">⏱️ Duration:</span>
                    <span class="detail-value">{{ duration }} minutes</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">👤 {{ "Therapist" if recipient_type == "patient" else "Patient" }}:</span>
                    <span class="detail-value">{{ other_person }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">📋 Type:</span>
                    <span class="detail-value">{{ session_type }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">🔗 Session ID:</span>
                    <span class="detail-value">#{{ session_id }}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ join_url }}" class="join-button">
                    🎥 Join Therapy Session
                </a>
            </div>
            
            <div class="calendar-attachment">
                <h3>📅 Calendar Invitation</h3>
                <p>A calendar invitation (.ics file) has been attached to this email. Click on the attachment to add this session to your calendar automatically.</p>
            </div>
            
            <div class="important-notes">
                <h3>⚠️ Important Session Guidelines:</h3>
                <ul>
                    <li>🎤 <strong>Audio/Video Check:</strong> Test your camera and microphone 5-10 minutes before the session</li>
                    <li>🌐 <strong>Internet Connection:</strong> Ensure you have a stable, high-speed internet connection</li>
                    <li>🏠 <strong>Private Space:</strong> Find a quiet, private location where you won't be interrupted</li>
                    <li>⏰ <strong>Join Time:</strong> You can join the session up to 15 minutes before the scheduled time</li>
                    <li>📱 <strong>Device:</strong> Use a laptop/desktop for the best experience, mobile devices are also supported</li>
                    <li>🔒 <strong>Privacy:</strong> This is a secure, HIPAA-compliant video session</li>
                </ul>
            </div>
            
            {% if session_notes %}
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>📝 Session Notes:</h3>
                <p>{{ session_notes }}</p>
            </div>
            {% endif %}
            
            <div style="background-color: #ECFDF5; border: 1px solid #10B981; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <h3>🆘 Need Help?</h3>
                <p>If you experience any technical difficulties joining the session:</p>
                <ul>
                    <li>📧 Email: support@timamu.com</li>
                    <li>📞 Emergency Support: [Emergency Number]</li>
                    <li>💬 Live Chat: Available on our website</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>The Timamu Team</strong></p>
            <p>🌟 Professional Mental Health Care You Can Trust</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
                This email contains confidential healthcare information. If you received this email in error, 
                please delete it immediately and contact support@timamu.com.
            </p>
        </div>
    </body>
    </html>
    """
    
    return render_template_string(template,
        recipient_name=recipient_name,
        recipient_type=recipient_type,
        other_person=other_person,
        greeting=greeting,
        session_title=session.title,
        session_id=session.id,
        scheduled_date=scheduled_date,
        scheduled_time_only=scheduled_time_only,
        end_time=end_time,
        session_timezone=session.timezone,
        duration=session.duration,
        session_type=session.session_type.title(),
        join_url=session.join_url,
        session_notes=session.notes if session.notes else None
    )


def render_session_reminder_template(session, recipient, reminder_type):
    """Render session reminder email template"""
    scheduled_time = session.scheduled_at.strftime('%B %d, %Y at %I:%M %p')
    
    if reminder_type == '24h_reminder':
        reminder_text = "Your therapy session is scheduled for tomorrow."
    elif reminder_type == '1h_reminder':
        reminder_text = "Your therapy session starts in 1 hour."
    elif reminder_type == 'starting_now':
        reminder_text = "Your therapy session is starting now!"
    else:
        reminder_text = "Don't forget about your upcoming therapy session."
    
    template = """
    <h2>Hello {{ recipient_name }},</h2>
    <p>{{ reminder_text }}</p>
    
    <h3>Session Details:</h3>
    <p><strong>Title:</strong> {{ session_title }}</p>
    <p><strong>Date & Time:</strong> {{ scheduled_time }} ({{ session_timezone }})</p>
    <p><strong>Duration:</strong> {{ duration }} minutes</p>
    
    <p>Join URL: <a href="{{ join_url }}">Join Session Now</a></p>
    
    <p>Best regards,<br>The Timamu Team</p>
    """
    
    return render_template_string(template,
        recipient_name=recipient.first_name,
        reminder_text=reminder_text,
        session_title=session.title,
        scheduled_time=scheduled_time,
        session_timezone=session.timezone,
        duration=session.duration,
        join_url=session.join_url
    )
