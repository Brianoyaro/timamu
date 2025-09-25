from flask_mail import Message
from flask import current_app, render_template_string
from ..extensions import mail
from datetime import datetime, timedelta

def send_email(to_email, subject, body):
    msg = Message(subject, recipients=[to_email], body=body, sender=current_app.config.get('MAIL_DEFAULT_SENDER'))
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
    """Send session confirmation emails to patient and therapist"""
    try:
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
        
        # Send emails
        mail.send(patient_msg)
        mail.send(therapist_msg)
        
        current_app.logger.info(f"Session confirmation emails sent for session {session.id}")
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
    """Render session confirmation email template"""
    scheduled_time = session.scheduled_at.strftime('%B %d, %Y at %I:%M %p')
    
    if recipient_type == 'patient':
        recipient_name = patient.first_name
        other_person = f"Dr. {therapist.first_name} {therapist.last_name}"
    else:
        recipient_name = therapist.first_name
        other_person = f"{patient.first_name} {patient.last_name}"
    
    template = """
    <h2>Hello {{ recipient_name }},</h2>
    <p>Your therapy session has been confirmed!</p>
    
    <h3>Session Details:</h3>
    <p><strong>Title:</strong> {{ session_title }}</p>
    <p><strong>Date & Time:</strong> {{ scheduled_time }} ({{ session_timezone }})</p>
    <p><strong>Duration:</strong> {{ duration }} minutes</p>
    <p><strong>With:</strong> {{ other_person }}</p>
    <p><strong>Type:</strong> {{ session_type }}</p>
    
    <p>Join URL: <a href="{{ join_url }}">{{ join_url }}</a></p>
    
    <p><strong>Important Notes:</strong></p>
    <ul>
        <li>Please test your camera and microphone before the session</li>
        <li>Ensure you have a stable internet connection</li>
        <li>Find a quiet, private space for the session</li>
        <li>You can join 15 minutes before the scheduled time</li>
    </ul>
    
    <p>Best regards,<br>The Timamu Team</p>
    """
    
    return render_template_string(template,
        recipient_name=recipient_name,
        other_person=other_person,
        session_title=session.title,
        scheduled_time=scheduled_time,
        session_timezone=session.timezone,
        duration=session.duration,
        session_type=session.session_type.title(),
        join_url=session.join_url
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
