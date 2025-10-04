from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from . import dashboard_bp
from ..models import User, Session, TherapistProfile, PatientProfile
from ..extensions import db

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics and data based on user role
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Base response structure
    response = {
        'success': True,
        'role': user.role,
        'stats': {},
        'notifications': [],
        'sessions': [],
    }
    
    # Get current date for filtering
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)
    month_end = today_start + timedelta(days=30)
    
    if user.role.upper() == 'PATIENT':
        # Get patient specific stats
        return get_patient_stats(user, response, today_start, today_end, week_end, month_end)
    
    elif user.role.upper() == 'THERAPIST':
        # Get therapist specific stats
        return get_therapist_stats(user, response, today_start, today_end, week_end, month_end)
    
    elif user.role.upper() == 'ADMIN':
        # Get admin specific stats
        return get_admin_stats(user, response)
    
    return jsonify({'error': 'Invalid user role'}), 400

def get_patient_stats(user, response, today_start, today_end, week_end, month_end):
    """
    Get dashboard statistics for patients
    """
    # Get upcoming sessions
    upcoming_sessions = Session.query.filter(
        Session.patient_id == user.id,
        Session.scheduled_at >= today_start,
        Session.status.in_(['scheduled', 'confirmed'])
    ).order_by(Session.scheduled_at).all()
    
    # Process sessions
    sessions_data = []
    for session in upcoming_sessions:
        therapist = User.query.get(session.therapist_id)
        
        sessions_data.append({
            'id': session.id,
            'title': session.title,
            'date': session.scheduled_at.strftime('%Y-%m-%d'),
            'time': session.scheduled_at.strftime('%H:%M'),
            'therapist_id': session.therapist_id,
            'therapist_name': f"{therapist.first_name} {therapist.last_name}" if therapist else 'Unknown',
            'status': session.status,
            'duration': session.duration,
            'join_url': session.join_url
        })
    
    # Calculate statistics
    total_sessions = Session.query.filter_by(patient_id=user.id).count()
    upcoming_count = len(sessions_data)
    today_sessions = [s for s in sessions_data if s['date'] == today_start.strftime('%Y-%m-%d')]
    
    # Get notifications (placeholder - would be from a notifications system)
    notifications = [
        {
            'id': 1,
            'message': 'Remember to complete your therapy journal',
            'created_at': datetime.utcnow().isoformat(),
            'read': False
        }
    ]
    
    # Set response data
    response['stats'] = {
        'total_sessions': total_sessions,
        'upcoming_sessions': upcoming_count,
        'today_sessions': len(today_sessions)
    }
    response['sessions'] = {
        'today': today_sessions,
        'upcoming': sessions_data[:5],  # Limit to 5 upcoming sessions
        'this_week': [s for s in sessions_data if today_start <= datetime.strptime(s['date'], '%Y-%m-%d') < week_end][:5]
    }
    response['notifications'] = notifications
    
    return jsonify(response)

def get_therapist_stats(user, response, today_start, today_end, week_end, month_end):
    """
    Get dashboard statistics for therapists
    """
    # Get therapist profile
    therapist_profile = TherapistProfile.query.filter_by(user_id=user.id).first()
    
    # Get all sessions
    all_sessions = Session.query.filter_by(therapist_id=user.id).all()
    
    # Get today's sessions
    today_sessions = Session.query.filter(
        Session.therapist_id == user.id,
        Session.scheduled_at >= today_start,
        Session.scheduled_at < today_end,
        Session.status.in_(['scheduled', 'confirmed'])
    ).order_by(Session.scheduled_at).all()
    
    # Get upcoming sessions (next 7 days)
    upcoming_sessions = Session.query.filter(
        Session.therapist_id == user.id,
        Session.scheduled_at >= today_start,
        Session.scheduled_at < week_end,
        Session.status.in_(['scheduled', 'confirmed'])
    ).order_by(Session.scheduled_at).all()
    
    # Process sessions
    today_sessions_data = []
    for session in today_sessions:
        patient = User.query.get(session.patient_id)
        
        today_sessions_data.append({
            'id': session.id,
            'title': session.title,
            'time': session.scheduled_at.strftime('%H:%M'),
            'patient_id': session.patient_id,
            'patient_name': f"{patient.first_name} {patient.last_name}" if patient else 'Unknown',
            'status': session.status,
            'duration': session.duration,
            'join_url': session.join_url
        })
    
    upcoming_sessions_data = []
    for session in upcoming_sessions:
        patient = User.query.get(session.patient_id)
        
        upcoming_sessions_data.append({
            'id': session.id,
            'title': session.title,
            'date': session.scheduled_at.strftime('%Y-%m-%d'),
            'time': session.scheduled_at.strftime('%H:%M'),
            'patient_id': session.patient_id,
            'patient_name': f"{patient.first_name} {patient.last_name}" if patient else 'Unknown',
            'status': session.status,
            'duration': session.duration,
            'join_url': session.join_url
        })
    
    # Get unique patients for this therapist
    patient_ids = set([session.patient_id for session in all_sessions])
    
    # Recent patient updates (placeholder - would come from a patient notes system)
    patient_updates = []
    
    # Set response data
    response['stats'] = {
        'total_sessions': len(all_sessions),
        'total_patients': len(patient_ids),
        'today_sessions': len(today_sessions),
        'upcoming_sessions': len(upcoming_sessions)
    }
    response['sessions'] = {
        'today': today_sessions_data,
        'upcoming': upcoming_sessions_data[:10]  # Limit to 10 upcoming sessions
    }
    response['patient_updates'] = patient_updates
    
    # Get emergency sessions if therapist accepts them
    emergency_available = therapist_profile.accepts_emergency if therapist_profile else False
    response['emergency_available'] = emergency_available
    
    return jsonify(response)

def get_admin_stats(user, response):
    """
    Get dashboard statistics for administrators
    """
    # Get counts
    total_patients = User.query.filter_by(role='PATIENT').count()
    total_therapists = User.query.filter_by(role='THERAPIST').count()
    total_users = User.query.count()
    total_sessions = Session.query.count()
    
    # Get pending therapist approvals
    pending_therapists = TherapistProfile.query.filter_by(is_approved=False).count()
    
    # Get recent sessions
    recent_sessions = Session.query.order_by(Session.created_at.desc()).limit(5).all()
    recent_sessions_data = []
    
    for session in recent_sessions:
        patient = User.query.get(session.patient_id)
        therapist = User.query.get(session.therapist_id)
        
        recent_sessions_data.append({
            'id': session.id,
            'title': session.title,
            'date': session.scheduled_at.strftime('%Y-%m-%d') if session.scheduled_at else 'N/A',
            'time': session.scheduled_at.strftime('%H:%M') if session.scheduled_at else 'N/A',
            'patient_name': f"{patient.first_name} {patient.last_name}" if patient else 'Unknown',
            'therapist_name': f"{therapist.first_name} {therapist.last_name}" if therapist else 'Unknown',
            'status': session.status
        })
    
    # Set response data
    response['stats'] = {
        'total_users': total_users,
        'total_patients': total_patients,
        'total_therapists': total_therapists,
        'total_sessions': total_sessions,
        'pending_approvals': pending_therapists
    }
    response['recent_sessions'] = recent_sessions_data
    
    return jsonify(response)