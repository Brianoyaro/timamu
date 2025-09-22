from .app import db, bcrypt
from .models import User, TherapistProfile, PatientProfile, AdminProfile, Session, SessionNote, Rating, Message, File, AuditLog
from datetime import datetime, timedelta

# Clear all tables
def clear_tables():
    for model in [AuditLog, File, Rating, Message, SessionNote, Session, AdminProfile, TherapistProfile, PatientProfile, User]:
        db.session.query(model).delete()
    db.session.commit()

# Seed demo data
def seed():
    clear_tables()
    print('🌱 Starting lean NGO telepsychology platform seed...')
    hashed_pw = bcrypt.generate_password_hash('password123').decode('utf-8')

    # Admin
    super_admin = User(email='admin@ngotherapyplatform.org', password=hashed_pw, first_name='Sarah', last_name='Administrator', role='ADMIN', is_active=True, is_verified=True, phone='+1-555-0100')
    db.session.add(super_admin)
    db.session.commit()
    admin_profile = AdminProfile(user_id=super_admin.id, permissions=['manage_users', 'view_analytics', 'handle_reports', 'approve_therapists'], level='SUPER_ADMIN')
    db.session.add(admin_profile)

    # Add more users, therapists, patients, sessions, etc. (see lean-seed.js for full logic)
    db.session.commit()
    print('✅ Seed completed!')

if __name__ == '__main__':
    seed()
