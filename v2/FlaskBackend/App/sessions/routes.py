from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Session, User, SessionReminder, SessionParticipant, SessionMessage, TherapistProfile
from ..extensions import db
from datetime import datetime, timedelta
import uuid
import secrets
from . import sessions_bp
from ..utils.email_utils import send_session_confirmation, send_session_reminder

@sessions_bp.route('/', methods=['GET'])
@jwt_required() # Require authentication
def list_sessions():
    """Get sessions for the current user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get sessions based on user role
    if user.role.upper() == 'PATIENT':
        sessions = Session.query.filter_by(patient_id=current_user_id).all()
    elif user.role.upper() == 'THERAPIST':
        sessions = Session.query.filter_by(therapist_id=current_user_id).all()
    else:
        # Admin can see all sessions
        sessions = Session.query.all()
    
    sessions_data = []
    for session in sessions:
        patient = User.query.get(session.patient_id)
        therapist = User.query.get(session.therapist_id)
        
        sessions_data.append({
            'id': session.id,
            'title': session.title,
            'status': session.status,
            'scheduled_at': session.scheduled_at.isoformat() if session.scheduled_at else None,
            'duration': session.duration,
            'session_type': session.session_type,
            'patient_name': f"{patient.first_name} {patient.last_name}" if patient else 'Unknown',
            'therapist_name': f"{therapist.first_name} {therapist.last_name}" if therapist else 'Unknown',
            'room_id': session.room_id,
            'join_url': session.join_url,
            'timezone': session.timezone,
            'created_at': session.created_at.isoformat() if session.created_at else None
        })
    
    return jsonify(sessions_data)


@sessions_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_session():
    """Schedule a new therapy session"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['therapist_id', 'scheduled_at', 'duration', 'session_type', 'title']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Parse scheduled time
    try:
        scheduled_at = datetime.fromisoformat(data['scheduled_at'])
    except ValueError:
        return jsonify({'error': 'Invalid scheduled_at format. Use ISO format.'}), 400
    
    # Check if therapist exists and is available
    therapist = User.query.get(data['therapist_id'])
    if not therapist or therapist.role.upper() != 'THERAPIST':
        return jsonify({'error': 'Invalid therapist'}), 400
    
    # Check for scheduling conflicts
    conflict = Session.query.filter(
        Session.therapist_id == data['therapist_id'],
        Session.scheduled_at == scheduled_at,
        Session.status.in_(['scheduled', 'started'])
    ).first()
    
    if conflict:
        return jsonify({'error': 'Therapist is not available at this time'}), 409
    
    # Generate unique room ID and join URL
    room_id = f"session_{uuid.uuid4().hex[:12]}"
    meeting_password = secrets.token_urlsafe(8)
    join_url = f"{request.host_url}video-call/{room_id}"
    
    # Create session
    session = Session(
        patient_id=current_user_id if user.role.upper() == 'PATIENT' else data.get('patient_id', current_user_id),
        therapist_id=data['therapist_id'],
        scheduled_at=scheduled_at,
        duration=data['duration'],
        status='scheduled',
        session_type=data['session_type'],
        title=data['title'],
        room_id=room_id,
        join_url=join_url,
        meeting_password=meeting_password,
        timezone=data.get('timezone', 'UTC'),
        notes=data.get('notes', '')
    )
    
    try:
        db.session.add(session)
        db.session.commit()
        
        # Send confirmation emails
        patient_user = User.query.get(session.patient_id)
        therapist_user = User.query.get(session.therapist_id)
        
        # Send emails asynchronously (implement this later)
        # send_session_confirmation(session, patient_user, therapist_user)
        
        return jsonify({
            'message': 'Session scheduled successfully',
            'session': {
                'id': session.id,
                'title': session.title,
                'scheduled_at': session.scheduled_at.isoformat(),
                'duration': session.duration,
                'status': session.status,
                'join_url': session.join_url,
                'room_id': session.room_id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to schedule session: {str(e)}'}), 500


@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get details of a specific session"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = Session.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if user has access to this session
    if user.role.upper() not in ['ADMIN'] and current_user_id not in [session.patient_id, session.therapist_id]:
        return jsonify({'error': 'Access denied'}), 403
    
    patient = User.query.get(session.patient_id)
    therapist = User.query.get(session.therapist_id)
    
    return jsonify({
        'id': session.id,
        'title': session.title,
        'status': session.status,
        'scheduled_at': session.scheduled_at.isoformat() if session.scheduled_at else None,
        'started_at': session.started_at.isoformat() if session.started_at else None,
        'ended_at': session.ended_at.isoformat() if session.ended_at else None,
        'duration': session.duration,
        'actual_duration': session.actual_duration,
        'session_type': session.session_type,
        'notes': session.notes,
        'patient': {
            'id': patient.id,
            'name': f"{patient.first_name} {patient.last_name}",
            'email': patient.email
        } if patient else None,
        'therapist': {
            'id': therapist.id,
            'name': f"{therapist.first_name} {therapist.last_name}",
            'email': therapist.email
        } if therapist else None,
        'room_id': session.room_id,
        'join_url': session.join_url,
        'timezone': session.timezone,
        'created_at': session.created_at.isoformat() if session.created_at else None,
        'updated_at': session.updated_at.isoformat() if session.updated_at else None
    })


@sessions_bp.route('/<int:session_id>/update', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update session details"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = Session.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check permissions
    if user.role.upper() not in ['ADMIN'] and current_user_id not in [session.patient_id, session.therapist_id]:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'title' in data:
        session.title = data['title']
    if 'notes' in data:
        session.notes = data['notes']
    if 'scheduled_at' in data and session.status == 'scheduled':
        try:
            session.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
        except ValueError:
            return jsonify({'error': 'Invalid scheduled_at format'}), 400
    if 'duration' in data and session.status == 'scheduled':
        session.duration = data['duration']
    
    session.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': 'Session updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update session: {str(e)}'}), 500


@sessions_bp.route('/<int:session_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_session(session_id):
    """Cancel a scheduled session"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = Session.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check permissions
    if user.role.upper() not in ['ADMIN'] and current_user_id not in [session.patient_id, session.therapist_id]:
        return jsonify({'error': 'Access denied'}), 403
    
    if session.status not in ['scheduled']:
        return jsonify({'error': 'Can only cancel scheduled sessions'}), 400
    
    data = request.get_json() or {}
    
    session.status = 'cancelled'
    session.cancelled_by = current_user_id
    session.cancelled_at = datetime.utcnow()
    session.cancellation_reason = data.get('reason', '')
    session.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        # TODO: Send cancellation emails
        return jsonify({'message': 'Session cancelled successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to cancel session: {str(e)}'}), 500


@sessions_bp.route('/<int:session_id>/join', methods=['POST'])
@jwt_required()
def join_session(session_id):
    """Join a video conference session"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = Session.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check permissions
    if current_user_id not in [session.patient_id, session.therapist_id]:
        return jsonify({'error': 'Access denied'}), 403
    
    # Check if session is ready to join (within 15 minutes of start time)
    now = datetime.utcnow()
    join_window_start = session.scheduled_at - timedelta(minutes=15)
    join_window_end = session.scheduled_at + timedelta(hours=2)  # 2 hour max session length
    
    if now < join_window_start:
        return jsonify({'error': 'Session is not yet available to join'}), 400
    
    if now > join_window_end:
        return jsonify({'error': 'Session join window has expired'}), 400
    
    # Create or update participant record
    participant = SessionParticipant.query.filter_by(
        session_id=session_id, 
        user_id=current_user_id
    ).first()
    
    if not participant:
        participant = SessionParticipant(
            session_id=session_id,
            user_id=current_user_id,
            joined_at=now,
            video_enabled=True,
            audio_enabled=True
        )
        db.session.add(participant)
    else:
        participant.joined_at = now
        participant.left_at = None
    
    # Update session status if this is the first join
    if session.status == 'scheduled':
        session.status = 'started'
        session.started_at = now
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Successfully joined session',
            'session': {
                'id': session.id,
                'room_id': session.room_id,
                'join_url': session.join_url,
                'meeting_password': session.meeting_password,
                'status': session.status
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to join session: {str(e)}'}), 500


@sessions_bp.route('/available-therapists', methods=['GET'])
@jwt_required()
def get_available_therapists():
    """Get list of available therapists for scheduling"""
    # Get all approved therapists
    therapists = db.session.query(User, TherapistProfile).join(
        TherapistProfile, User.id == TherapistProfile.user_id
    ).filter(
        User.role == 'THERAPIST',
        User.is_active == True,
        TherapistProfile.is_approved == True
    ).all()
    
    therapists_data = []
    for user, profile in therapists:
        therapists_data.append({
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'specializations': profile.specializations,
            'languages': profile.languages,
            'experience': profile.experience,
            'bio': profile.bio,
            'timezone': profile.timezone,
            'availability': profile.availability
        })
    
    return jsonify(therapists_data)
