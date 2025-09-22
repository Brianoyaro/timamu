from flask_mail import Message
from flask import current_app

mail = None  # Will be initialized in app factory

def init_mail(app):
    global mail
    from flask_mail import Mail
    mail = Mail(app)


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
