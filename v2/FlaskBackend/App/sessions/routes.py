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
    
    # Get query parameters for filtering
    status_filter = request.args.get('status', 'all')  # all, active, completed, cancelled
    include_old = request.args.get('include_old', 'false').lower() == 'true'
    
    # Base query based on user role
    if user.role.upper() == 'PATIENT':
        query = Session.query.filter_by(patient_id=current_user_id)
    elif user.role.upper() == 'THERAPIST':
        query = Session.query.filter_by(therapist_id=current_user_id)
    else:
        # Admin can see all sessions
        query = Session.query
    
    # Apply status filters
    if status_filter == 'active':
        query = query.filter(Session.status.in_(['scheduled', 'started']))
    elif status_filter == 'completed':
        query = query.filter(Session.status.in_(['completed']))
    elif status_filter == 'cancelled':
        query = query.filter(Session.status.in_(['cancelled', 'no_show', 'forfeited']))
    
    # Filter out old sessions unless explicitly requested
    if not include_old:
        cutoff_date = datetime.utcnow() - timedelta(days=30)  # Only show sessions from last 30 days
        query = query.filter(Session.scheduled_at >= cutoff_date)
    
    # Order by scheduled date (newest first)
    sessions = query.order_by(Session.scheduled_at.desc()).all()
    
    sessions_data = []
    for session in sessions:
        patient = User.query.get(session.patient_id)
        therapist = User.query.get(session.therapist_id)
        
        # Check if session is overdue and should be marked as no-show/forfeited
        now = datetime.utcnow()
        grace_period_end = session.scheduled_at + timedelta(minutes=30)
        absolute_deadline = session.scheduled_at + timedelta(hours=1)
        
        # Auto-update overdue sessions status
        if session.status == 'scheduled' and now > grace_period_end:
            participants = SessionParticipant.query.filter_by(session_id=session.id).count()
            if participants == 0:
                if now > absolute_deadline:
                    session.status = 'forfeited'
                else:
                    session.status = 'no_show'
                session.updated_at = now
                # Note: We'll commit this change at the end
        
        # Determine join eligibility for active sessions
        can_join = False
        join_window_start = session.scheduled_at - timedelta(minutes=15)
        
        if session.status in ['scheduled', 'started'] and join_window_start <= now <= absolute_deadline:
            can_join = True
        
        sessions_data.append({
            'id': session.id,
            'title': session.title,
            'status': session.status,
            'scheduled_at': session.scheduled_at.isoformat() if session.scheduled_at else None,
            'started_at': session.started_at.isoformat() if session.started_at else None,
            'ended_at': session.ended_at.isoformat() if session.ended_at else None,
            'duration': session.duration,
            'actual_duration': session.actual_duration,
            'session_type': session.session_type,
            'patient_name': f"{patient.first_name} {patient.last_name}" if patient else 'Unknown',
            'therapist_name': f"{therapist.first_name} {therapist.last_name}" if therapist else 'Unknown',
            'room_id': session.room_id,
            'join_url': session.join_url,
            'timezone': session.timezone,
            'can_join': can_join,
            'is_emergency': session.is_emergency,
            'created_at': session.created_at.isoformat() if session.created_at else None,
            'updated_at': session.updated_at.isoformat() if session.updated_at else None,
            'cancelled_at': session.cancelled_at.isoformat() if session.cancelled_at else None,
            'cancellation_reason': session.cancellation_reason
        })
    
    # Commit any status updates we made
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
    
    return jsonify({
        'sessions': sessions_data,
        'total_count': len(sessions_data),
        'filters_applied': {
            'status': status_filter,
            'include_old': include_old
        }
    })


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
        
        # Send confirmation emails with calendar attachments
        patient_user = User.query.get(session.patient_id)
        therapist_user = User.query.get(session.therapist_id)
        
        # Send emails asynchronously to avoid blocking the response
        try:
            send_session_confirmation(session, patient_user, therapist_user)
            current_app.logger.info(f"Session confirmation emails sent for session {session.id}")
        except Exception as e:
            current_app.logger.error(f"Failed to send confirmation emails for session {session.id}: {str(e)}")
            # Don't fail the request if email sending fails
        
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
    
    # Check session status - cannot join cancelled or completed sessions
    if session.status in ['cancelled', 'completed', 'no_show', 'forfeited']:
        return jsonify({'error': f'Cannot join session with status: {session.status}'}), 400
    
    # Check timing and enforce attendance window
    now = datetime.utcnow()
    join_window_start = session.scheduled_at - timedelta(minutes=15)  # 15 minutes before
    grace_period_end = session.scheduled_at + timedelta(minutes=30)   # 30 minutes after start
    absolute_deadline = session.scheduled_at + timedelta(hours=1)     # 1 hour max (for emergencies)
    
    # If trying to join before the window opens
    if now < join_window_start:
        minutes_until_available = int((join_window_start - now).total_seconds() / 60)
        return jsonify({
            'error': 'Session is not yet available to join',
            'details': f'Session will be available in {minutes_until_available} minutes'
        }), 400
    
    # If session is past the grace period, mark as forfeited/no-show
    if now > grace_period_end and session.status == 'scheduled':
        # Check if anyone has joined yet
        existing_participants = SessionParticipant.query.filter_by(session_id=session_id).count()
        
        if existing_participants == 0:
            # No one has joined within grace period - mark as no-show
            session.status = 'no_show'
            session.updated_at = now
            
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            
            return jsonify({
                'error': 'Session has been marked as no-show due to late attendance',
                'details': f'Sessions must be joined within 30 minutes of scheduled time'
            }), 410  # HTTP 410 Gone
    
    # If way past deadline (more than 1 hour), absolutely refuse
    if now > absolute_deadline:
        if session.status == 'scheduled':
            session.status = 'forfeited'
            session.updated_at = now
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        
        hours_late = int((now - session.scheduled_at).total_seconds() / 3600)
        return jsonify({
            'error': 'Session has been forfeited due to excessive delay',
            'details': f'Cannot join session {hours_late} hours after scheduled time'
        }), 410  # HTTP 410 Gone
    
    # Check if user is joining late (after grace period but within absolute deadline)
    late_join_warning = None
    if now > grace_period_end:
        minutes_late = int((now - session.scheduled_at).total_seconds() / 60)
        late_join_warning = f'You are joining {minutes_late} minutes late. Future late attendance may result in session forfeiture.'
    
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
        # User rejoining session
        participant.joined_at = now
        participant.left_at = None
    
    # Update session status if this is the first join
    if session.status == 'scheduled':
        session.status = 'started'
        session.started_at = now
    
    try:
        db.session.commit()
        
        response_data = {
            'message': 'Successfully joined session',
            'session': {
                'id': session.id,
                'room_id': session.room_id,
                'join_url': session.join_url,
                'meeting_password': session.meeting_password,
                'status': session.status
            }
        }
        
        # Add late join warning if applicable
        if late_join_warning:
            response_data['warning'] = late_join_warning
        
        return jsonify(response_data)
        
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
            'availability': profile.availability,
            'accepts_emergency': profile.accepts_emergency
        })
    
    return jsonify(therapists_data)


@sessions_bp.route('/check-availability', methods=['POST'])
@jwt_required()
def check_availability():
    """Check if a therapist is available at a specific time"""
    data = request.get_json()
    
    required_fields = ['therapist_id', 'date', 'time']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    therapist_id = data['therapist_id']
    date = data['date']  # Format: YYYY-MM-DD
    time = data['time']  # Format: HH:MM
    
    # Get therapist profile
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
    if not therapist_profile:
        return jsonify({'error': 'Therapist not found'}), 404
    
    # Check if therapist has availability on this date/time
    availability = therapist_profile.availability or {}
    
    # Check day of week availability (for recurring weekly slots)
    try:
        from datetime import datetime
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        day_name = date_obj.strftime('%A')
        
        day_slots = availability.get(day_name, [])
        specific_date_slots = availability.get(date, [])
        
        # Combine both day-of-week and specific date slots
        all_slots = day_slots + specific_date_slots
        
        is_available = False
        for slot in all_slots:
            if isinstance(slot, dict):
                start_time = slot.get('start', '')
                end_time = slot.get('end', '')
                if start_time <= time < end_time:
                    is_available = True
                    break
            elif isinstance(slot, str):
                # Handle simple time format
                if slot == time:
                    is_available = True
                    break
        
        # Check for existing bookings
        if is_available:
            scheduled_datetime = datetime.strptime(f"{date} {time}", '%Y-%m-%d %H:%M')
            existing_session = Session.query.filter(
                Session.therapist_id == therapist_id,
                Session.scheduled_at == scheduled_datetime,
                Session.status.in_(['scheduled', 'started'])
            ).first()
            
            if existing_session:
                is_available = False
        
        return jsonify({
            'available': is_available,
            'therapist_id': therapist_id,
            'date': date,
            'time': time
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400


@sessions_bp.route('/cleanup-overdue', methods=['POST'])
@jwt_required()
def cleanup_overdue_sessions():
    """Mark overdue sessions as no-show or forfeited"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins or system can run cleanup
    if user.role.upper() != 'ADMIN':
        return jsonify({'error': 'Access denied. Admin access required.'}), 403
    
    now = datetime.utcnow()
    grace_period = timedelta(minutes=30)  # 30 minutes grace period
    absolute_deadline = timedelta(hours=1)  # 1 hour absolute deadline
    
    # Find scheduled sessions that are overdue
    overdue_sessions = Session.query.filter(
        Session.status == 'scheduled',
        Session.scheduled_at < now - grace_period
    ).all()
    
    marked_no_show = 0
    marked_forfeited = 0
    
    for session in overdue_sessions:
        # Check if anyone has joined this session
        participants = SessionParticipant.query.filter_by(session_id=session.id).count()
        
        if session.scheduled_at < now - absolute_deadline:
            # Past absolute deadline - mark as forfeited
            session.status = 'forfeited'
            session.updated_at = now
            marked_forfeited += 1
        elif participants == 0:
            # Past grace period with no participants - mark as no-show
            session.status = 'no_show'
            session.updated_at = now
            marked_no_show += 1
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Cleanup completed successfully',
            'marked_no_show': marked_no_show,
            'marked_forfeited': marked_forfeited,
            'total_processed': marked_no_show + marked_forfeited
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Cleanup failed: {str(e)}'}), 500


@sessions_bp.route('/<int:session_id>/status', methods=['GET'])
@jwt_required()
def get_session_status(session_id):
    """Get current session status and join eligibility"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = Session.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check permissions
    if user.role.upper() not in ['ADMIN'] and current_user_id not in [session.patient_id, session.therapist_id]:
        return jsonify({'error': 'Access denied'}), 403
    
    now = datetime.utcnow()
    join_window_start = session.scheduled_at - timedelta(minutes=15)
    grace_period_end = session.scheduled_at + timedelta(minutes=30)
    absolute_deadline = session.scheduled_at + timedelta(hours=1)
    
    # Determine join eligibility
    can_join = False
    join_status = "not_available"
    join_message = ""
    
    if session.status in ['cancelled', 'completed', 'no_show', 'forfeited']:
        join_status = "unavailable"
        join_message = f"Session is {session.status}"
    elif now < join_window_start:
        join_status = "too_early"
        minutes_until = int((join_window_start - now).total_seconds() / 60)
        join_message = f"Available in {minutes_until} minutes"
    elif now > absolute_deadline:
        join_status = "expired"
        join_message = "Session window has expired"
    elif now > grace_period_end:
        join_status = "late_join_warning"
        minutes_late = int((now - session.scheduled_at).total_seconds() / 60)
        join_message = f"Late join ({minutes_late} minutes past scheduled time)"
        can_join = True
    else:
        join_status = "available"
        join_message = "Ready to join"
        can_join = True
    
    # Get participant count
    participant_count = SessionParticipant.query.filter_by(session_id=session_id).count()
    
    return jsonify({
        'session_id': session.id,
        'status': session.status,
        'scheduled_at': session.scheduled_at.isoformat(),
        'current_time': now.isoformat(),
        'can_join': can_join,
        'join_status': join_status,
        'join_message': join_message,
        'participant_count': participant_count,
        'time_windows': {
            'join_available_from': join_window_start.isoformat(),
            'grace_period_ends': grace_period_end.isoformat(),
            'absolute_deadline': absolute_deadline.isoformat()
        }
    })
