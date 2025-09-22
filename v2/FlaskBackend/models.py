from .app import db
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True) # is crucial when deleting users where we give them a deactivated status instead of hard delete incase they later on want to reactivate their account
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    phone = db.Column(db.String(20))
    gender = db.Column(db.String(20))
    # date_of_birth = db.Column(db.Date)
    therapist_profile = db.relationship('TherapistProfile', backref='user', uselist=False)
    patient_profile = db.relationship('PatientProfile', backref='user', uselist=False)
    admin_profile = db.relationship('AdminProfile', backref='user', uselist=False)


class TherapistProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    license_number = db.Column(db.String(50))
    specializations = db.Column(JSONB)
    languages = db.Column(JSONB)
    experience = db.Column(db.Integer)
    education = db.Column(db.String(200))
    bio = db.Column(db.Text)
    is_approved = db.Column(db.Boolean, default=False)
    approved_at = db.Column(db.DateTime) # requires admin approval
    availability = db.Column(JSONB)
    timezone = db.Column(db.String(50), default='UTC')
    accepts_emergency = db.Column(db.Boolean, default=False)


class PatientProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    medical_history = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    preferred_language = db.Column(db.String(20))
    timezone = db.Column(db.String(50), default='UTC')


class AdminProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    permissions = db.Column(JSONB)
    level = db.Column(db.String(20))


class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    therapist_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    scheduled_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    duration = db.Column(db.Integer)
    status = db.Column(db.String(20))
    session_type = db.Column(db.String(20))
    title = db.Column(db.String(100))
    notes = db.Column(db.Text)
    is_emergency = db.Column(db.Boolean, default=False)
    emergency_notes = db.Column(db.Text)


class SessionNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    therapist_id = db.Column(db.Integer, db.ForeignKey('therapist_profile.id'))
    content = db.Column(db.Text)
    is_shared_with_patient = db.Column(db.Boolean, default=False)


class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    giver_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    rating = db.Column(db.Integer)
    review = db.Column(db.Text)
    is_anonymous = db.Column(db.Boolean, default=False)


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    content = db.Column(db.Text)
    message_type = db.Column(db.String(20))
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)


class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    original_name = db.Column(db.String(100))
    file_name = db.Column(db.String(100))
    file_path = db.Column(db.String(200))
    mime_type = db.Column(db.String(50))
    size = db.Column(db.Integer)
    uploader_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    description = db.Column(db.Text)
    category = db.Column(db.String(20))
    is_public = db.Column(db.Boolean, default=False)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user_email = db.Column(db.String(120))
    action = db.Column(db.String(50))
    resource = db.Column(db.String(50))
    resource_id = db.Column(db.Integer)
    status = db.Column(db.String(20))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(200))
    details = db.Column(JSONB)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class RefreshToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    refresh_token = db.Column(db.String(256), unique=True, nullable=False)
    revoked = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref='refresh_tokens')