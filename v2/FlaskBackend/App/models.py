from .extensions import db
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
    specializations = db.Column(db.JSON)
    languages = db.Column(db.JSON)
    experience = db.Column(db.Integer)
    education = db.Column(db.String(200))
    bio = db.Column(db.Text)
    #hourly_rate = db.Column(db.Numeric(10, 2))
    is_approved = db.Column(db.Boolean, default=False)
    approved_at = db.Column(db.DateTime) # requires admin approval
    timezone = db.Column(db.String(50), default='UTC')
    accepts_emergency = db.Column(db.Boolean, default=False)


class TherapistAvailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    therapist_profile_id = db.Column(db.Integer, db.ForeignKey('therapist_profile.id'))
    date = db.Column(db.Date)  # Actual date instead of day_of_week
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    is_available = db.Column(db.Boolean, default=True)  # Overall availability for the entire time block
    booked_slots = db.Column(db.JSON, default=list)  # Array of booked slot indices (0-based, 1-hour intervals)
    timezone = db.Column(db.String(50), default='UTC')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    therapist_profile = db.relationship('TherapistProfile', backref='availability_slots')
    
    def get_total_slots(self):
        """Calculate total number of 1-hour slots in this availability block"""
        if not self.start_time or not self.end_time:
            return 0
        start_hour = self.start_time.hour + (self.start_time.minute / 60)
        end_hour = self.end_time.hour + (self.end_time.minute / 60)
        return int(end_hour - start_hour)
    
    def get_available_slots(self):
        """Get list of available slot indices"""
        total_slots = self.get_total_slots()
        booked = self.booked_slots or []
        return [i for i in range(total_slots) if i not in booked]
    
    def is_slot_available(self, slot_index):
        """Check if a specific slot is available"""
        if not self.is_available:
            return False
        booked = self.booked_slots or []
        return slot_index not in booked and slot_index < self.get_total_slots()
    
    def get_contiguous_available_slots(self, duration_hours=1):
        """Get list of starting slot indices that have 'duration_hours' of contiguous availability"""
        total_slots = self.get_total_slots()
        booked = self.booked_slots or []
        available_starts = []
        
        for i in range(total_slots - duration_hours + 1):
            # Check if all consecutive slots are available
            if all(i + j not in booked for j in range(duration_hours)):
                available_starts.append(i)
        
        return available_starts
    
    def book_slot(self, slot_index):
        """Book a specific slot"""
        if not self.is_slot_available(slot_index):
            return False
        booked = (self.booked_slots or []).copy()  # Create a new list
        if slot_index not in booked:
            booked.append(slot_index)
            self.booked_slots = booked  # Assign new list to trigger change detection
        return True
    
    def book_slots(self, start_slot_index, duration_hours=1):
        """Book multiple consecutive slots starting from start_slot_index"""
        # Check if all required slots are available
        if not all(self.is_slot_available(start_slot_index + i) for i in range(duration_hours)):
            return False
        
        # Book all slots
        booked = (self.booked_slots or []).copy()
        for i in range(duration_hours):
            booked.append(start_slot_index + i)
        
        self.booked_slots = booked  # Assign new list to trigger change detection
        return True
    
    def unbook_slot(self, slot_index):
        """Unbook a specific slot"""
        booked = (self.booked_slots or []).copy()  # Create a new list
        if slot_index in booked:
            booked.remove(slot_index)
            self.booked_slots = booked  # Assign new list to trigger change detection
        return True
    
    def unbook_slots(self, start_slot_index, duration_hours=1):
        """Unbook multiple consecutive slots starting from start_slot_index"""
        booked = (self.booked_slots or []).copy()
        changed = False
        
        for i in range(duration_hours):
            if start_slot_index + i in booked:
                booked.remove(start_slot_index + i)
                changed = True
        
        if changed:
            self.booked_slots = booked  # Assign new list to trigger change detection
        
        return True
    
    def get_slot_datetime(self, slot_index):
        """Get the datetime object for a specific slot"""
        from datetime import datetime, timedelta
        
        if slot_index >= self.get_total_slots():
            return None
        
        slot_start = datetime.combine(self.date, self.start_time) + timedelta(hours=slot_index)
        return slot_start


class TherapistUnavailability(db.Model):
    """Track specific dates/times when therapist is unavailable (vacations, appointments, etc.)"""
    id = db.Column(db.Integer, primary_key=True)
    therapist_profile_id = db.Column(db.Integer, db.ForeignKey('therapist_profile.id'))
    start_datetime = db.Column(db.DateTime)
    end_datetime = db.Column(db.DateTime)
    reason = db.Column(db.String(100))  # vacation, appointment, emergency, etc.
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.JSON)  # For recurring unavailability
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    therapist_profile = db.relationship('TherapistProfile', backref='unavailability_periods')


class PatientProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    date_of_birth = db.Column(db.Date)
    medical_history = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    #emergency_phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    preferred_language = db.Column(db.String(20))
    timezone = db.Column(db.String(50), default='UTC')


class AdminProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    permissions = db.Column(db.JSON)
    level = db.Column(db.String(20))


class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    therapist_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    scheduled_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    duration = db.Column(db.Integer)  # planned duration in minutes
    actual_duration = db.Column(db.Integer)  # actual duration in minutes
    status = db.Column(db.String(20))  # scheduled, started, completed, cancelled, no_show
    session_type = db.Column(db.String(20))  # individual, group, emergency
    title = db.Column(db.String(100))
    notes = db.Column(db.Text)
    is_emergency = db.Column(db.Boolean, default=False)
    emergency_notes = db.Column(db.Text)
    
    # Availability slot reference
    availability_id = db.Column(db.Integer, db.ForeignKey('therapist_availability.id'), nullable=True)
    slot_index = db.Column(db.Integer, nullable=True)  # The specific slot index within the availability block
    
    # Video conferencing fields
    room_id = db.Column(db.String(100), unique=True)  # unique room identifier for video calls
    join_url = db.Column(db.String(500))  # video conference join URL
    meeting_password = db.Column(db.String(50))  # optional meeting password
    
    # Scheduling fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    timezone = db.Column(db.String(50), default='UTC')
    reminder_sent_patient = db.Column(db.Boolean, default=False)
    reminder_sent_therapist = db.Column(db.Boolean, default=False)
    
    # Cancellation fields
    cancelled_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    cancelled_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)
    
    # Relationships
    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_sessions')
    therapist = db.relationship('User', foreign_keys=[therapist_id], backref='therapist_sessions')
    cancelled_by_user = db.relationship('User', foreign_keys=[cancelled_by])
    availability_slot = db.relationship('TherapistAvailability', backref='booked_sessions')


class SessionParticipant(db.Model):
    """Track participants in video conference sessions"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    joined_at = db.Column(db.DateTime)
    left_at = db.Column(db.DateTime)
    connection_quality = db.Column(db.String(20))  # excellent, good, fair, poor
    device_info = db.Column(db.JSON)  # browser, device type, etc.
    
    # Video/Audio status tracking
    video_enabled = db.Column(db.Boolean, default=True)
    audio_enabled = db.Column(db.Boolean, default=True)
    screen_sharing = db.Column(db.Boolean, default=False)
    
    session = db.relationship('Session', backref='participants')
    user = db.relationship('User', backref='session_participations')


class SessionMessage(db.Model):
    """Messages sent during video conference sessions"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, system, file
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    session = db.relationship('Session', backref='session_messages')
    sender = db.relationship('User', backref='sent_session_messages')


class SessionRecording(db.Model):
    """Store information about session recordings"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    file_path = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    duration = db.Column(db.Integer)  # duration in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_available = db.Column(db.Boolean, default=True)
    
    # Privacy and access control
    patient_consent = db.Column(db.Boolean, default=False)
    therapist_consent = db.Column(db.Boolean, default=False)
    expiry_date = db.Column(db.DateTime)  # when recording should be deleted
    
    session = db.relationship('Session', backref='recordings')


class SessionReminder(db.Model):
    """Track email reminders for scheduled sessions"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    reminder_type = db.Column(db.String(30))  # confirmation, 24h_reminder, 1h_reminder, starting_now
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    email_status = db.Column(db.String(20), default='sent')  # sent, delivered, failed, bounced
    
    session = db.relationship('Session', backref='reminders')
    recipient = db.relationship('User', backref='session_reminders')


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
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class RefreshToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    refresh_token = db.Column(db.String(512), unique=True, nullable=False)  # Increased to 512 for long JWT tokens
    revoked = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref='refresh_tokens')