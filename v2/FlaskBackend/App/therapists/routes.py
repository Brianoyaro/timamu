from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, TherapistProfile, Session
from ..extensions import db
from datetime import datetime
from . import therapists_bp
import logging

# Configure logging for therapist routes
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize the therapists blueprint
# therapists_bp = Blueprint('therapists', __name__)

@therapists_bp.route('/', methods=['GET'])
def list_therapists():
    therapists = TherapistProfile.query.all()
    return jsonify([{'id': t.id, 'user_id': t.user_id, 'license_number': t.license_number} for t in therapists])


@therapists_bp.route('/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_therapist_detail(therapist_id):
    """Get detailed information about a specific therapist"""
    # Get therapist user and profile
    user = User.query.get(therapist_id)
    if not user or user.role.upper() != 'THERAPIST':
        return jsonify({'error': 'Therapist not found'}), 404
        
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
    if not therapist_profile:
        return jsonify({'error': 'Therapist profile not found'}), 404
        
    # Only return approved therapists to patients
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role.upper() == 'PATIENT' and not therapist_profile.is_approved:
        return jsonify({'error': 'Therapist not available'}), 404
    
    # Get session statistics
    total_sessions = Session.query.filter(
        Session.therapist_id == therapist_id,
        Session.status.in_(['completed', 'started'])
    ).count()
    
    return jsonify({
        'id': user.id,
        'name': f"{user.first_name} {user.last_name}",
        'email': user.email,
        'phone': user.phone,
        'specializations': therapist_profile.specializations or [],
        'languages': therapist_profile.languages or ['English'],
        'experience': therapist_profile.experience,
        'education': therapist_profile.education,
        'bio': therapist_profile.bio,
        'license_number': therapist_profile.license_number,
        'timezone': therapist_profile.timezone,
        'accepts_emergency': therapist_profile.accepts_emergency,
        'is_approved': therapist_profile.is_approved,
        'approved_at': therapist_profile.approved_at.isoformat() if therapist_profile.approved_at else None,
        'total_sessions': total_sessions,
        'created_at': user.created_at.isoformat()
    })


@therapists_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get therapist's availability schedule using new availability model"""
    logger.debug("[GET /availability] Endpoint accessed")
    current_user_id = get_jwt_identity()
    logger.debug(f"[GET /availability] Current user ID: {current_user_id}")
    
    user = User.query.get(current_user_id)
    logger.debug(f"[GET /availability] User retrieved: {user is not None}, Role: {user.role if user else 'None'}")
    
    if not user or user.role.upper() != 'THERAPIST':
        logger.warning(f"[GET /availability] Authorization failed: User is not a therapist. User role: {user.role if user else 'None'}")
        return jsonify({'error': 'Only therapists can access availability'}), 403
    
    therapist_profile = TherapistProfile.query.filter_by(user_id=current_user_id).first()
    logger.debug(f"[GET /availability] Therapist profile found: {therapist_profile is not None}")
    
    if not therapist_profile:
        logger.warning(f"[GET /availability] Therapist profile not found for user_id: {current_user_id}")
        return jsonify({'error': 'Therapist profile not found'}), 404
    
    # Get availability slots from new model
    from ..models import TherapistAvailability
    from datetime import datetime, timedelta
    availability_slots = TherapistAvailability.query.filter_by(
        therapist_profile_id=therapist_profile.id
    ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
    
    # Convert to date-based format for frontend calendar compatibility
    availability_data = {}
    
    for slot in availability_slots:
        date_str = slot.date.strftime('%Y-%m-%d')
        if date_str not in availability_data:
            availability_data[date_str] = []
        
        availability_data[date_str].append({
            'start': slot.start_time.strftime('%H:%M'),
            'end': slot.end_time.strftime('%H:%M'),
            'available': slot.is_available
        })
    
    logger.debug(f"[GET /availability] Retrieved availability: {availability_data}")
    logger.debug(f"[GET /availability] Retrieved timezone: {therapist_profile.timezone}")
    
    return jsonify({
        'availability': availability_data,
        'timezone': therapist_profile.timezone
    })


@therapists_bp.route('/availability', methods=['POST'])
@jwt_required()
def update_availability():
    """Update therapist's availability schedule using new availability model"""
    logger.debug("[POST /availability] Endpoint accessed for updating availability")
    current_user_id = get_jwt_identity()
    logger.debug(f"[POST /availability] Current user ID: {current_user_id}")
    
    user = User.query.get(current_user_id)
    logger.debug(f"[POST /availability] User retrieved: {user is not None}, Role: {user.role if user else 'None'}")
    
    if not user or user.role.upper() != 'THERAPIST':
        logger.warning(f"[POST /availability] Authorization failed: User is not a therapist. User role: {user.role if user else 'None'}")
        return jsonify({'error': 'Only therapists can update availability'}), 403
    
    therapist_profile = TherapistProfile.query.filter_by(user_id=current_user_id).first()
    logger.debug(f"[POST /availability] Therapist profile found: {therapist_profile is not None}")
    
    if not therapist_profile:
        logger.warning(f"[POST /availability] Therapist profile not found for user_id: {current_user_id}")
        return jsonify({'error': 'Therapist profile not found'}), 404
    
    data = request.get_json()
    logger.debug(f"[POST /availability] Request data received: {data}")
    
    if 'availability' not in data:
        logger.warning("[POST /availability] Missing 'availability' in request data")
        return jsonify({'error': 'Availability data is required'}), 400
    
    # Clear existing availability slots
    from ..models import TherapistAvailability
    TherapistAvailability.query.filter_by(therapist_profile_id=therapist_profile.id).delete()
    
    # Parse availability data and create new slots
    availability = data['availability']
    logger.debug(f"[POST /availability] Availability data: {availability}")
    
    if not isinstance(availability, dict):
        logger.warning(f"[POST /availability] Invalid availability format. Expected dict, got: {type(availability)}")
        return jsonify({'error': 'Availability must be a dictionary'}), 400
    
    try:
        for date_str, day_slots in availability.items():
            # Parse the date string
            try:
                from datetime import datetime, time
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                logger.debug(f"[POST /availability] Processing date: {date_str}")
            except ValueError:
                logger.warning(f"[POST /availability] Invalid date format: {date_str}")
                continue
            
            # Handle array of slots for each date
            slots = day_slots if isinstance(day_slots, list) else [day_slots] if day_slots else []
            
            for slot_data in slots:
                if isinstance(slot_data, dict) and 'start' in slot_data and 'end' in slot_data:
                    try:
                        start_time = time.fromisoformat(slot_data['start'])
                        end_time = time.fromisoformat(slot_data['end'])
                        is_available = slot_data.get('available', True)
                        
                        availability_slot = TherapistAvailability(
                            therapist_profile_id=therapist_profile.id,
                            date=date_obj,
                            start_time=start_time,
                            end_time=end_time,
                            is_available=is_available,
                            timezone=data.get('timezone', therapist_profile.timezone)
                        )
                        
                        db.session.add(availability_slot)
                        logger.debug(f"[POST /availability] Created slot for {date_str} from {start_time} to {end_time}")
                        
                    except ValueError as e:
                        logger.error(f"[POST /availability] Error parsing time for {date_str}: {e}")
                        continue
        
        # Update timezone if provided
        if 'timezone' in data:
            prev_timezone = therapist_profile.timezone
            therapist_profile.timezone = data['timezone']
            logger.debug(f"[POST /availability] Updated timezone from {prev_timezone} to {data['timezone']}")
        
        # Count how many slots we're about to save
        new_slots_count = len([obj for obj in db.session.new if isinstance(obj, TherapistAvailability)])
        logger.debug(f"[POST /availability] About to save {new_slots_count} availability slots")
        
        db.session.commit()
        logger.debug("[POST /availability] Successfully saved availability to database")
        
        # Verify the slots were saved
        saved_slots_count = TherapistAvailability.query.filter_by(therapist_profile_id=therapist_profile.id).count()
        logger.debug(f"[POST /availability] Verified {saved_slots_count} slots saved in database")
        
        # Return the updated availability in the old format for compatibility
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': availability
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /availability] Failed to save availability: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to update availability: {str(e)}'}), 500


@therapists_bp.route('/debug', methods=['GET'])
@jwt_required()
def debug_therapist_profile():
    """Debug endpoint to check therapist profile data"""
    logger.debug("[DEBUG] Therapist debug endpoint accessed")
    current_user_id = get_jwt_identity()
    logger.debug(f"[DEBUG] Current user ID: {current_user_id}")
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get user role and check if therapist
    is_therapist = user.role.upper() == 'THERAPIST' if user.role else False
    
    # Try to get therapist profile regardless of role for debugging
    therapist_profile = TherapistProfile.query.filter_by(user_id=current_user_id).first()
    
    # Check DB connection
    try:
        db_check = db.session.execute("SELECT 1").fetchone()
        db_connected = True
    except Exception as e:
        db_connected = False
        db_error = str(e)
    
    return jsonify({
        'debug_info': {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'is_therapist': is_therapist,
            'has_therapist_profile': therapist_profile is not None,
            'therapist_profile_id': therapist_profile.id if therapist_profile else None,
            'availability_slots_count': len(therapist_profile.availability_slots) if therapist_profile else 0,
            'db_connection': {
                'connected': db_connected,
                'error': db_error if not db_connected else None
            }
        }
    })

@therapists_bp.route('/<int:therapist_id>/availability', methods=['GET'])
@jwt_required()
def get_therapist_availability(therapist_id):
    """Get specific therapist's availability for booking using new availability model"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
    if not therapist_profile:
        return jsonify({'error': 'Therapist not found'}), 404
    
    # Check if therapist is approved
    if not therapist_profile.is_approved:
        return jsonify({'error': 'Therapist is not approved'}), 404
    
    # Get availability slots from new model
    from ..models import TherapistAvailability
    from datetime import datetime, timedelta
    availability_slots = TherapistAvailability.query.filter_by(
        therapist_profile_id=therapist_profile.id
    ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
    
    # Convert to date-based format for frontend calendar compatibility
    availability_data = {}
    
    for slot in availability_slots:
        date_str = slot.date.strftime('%Y-%m-%d')
        if date_str not in availability_data:
            availability_data[date_str] = []
        
        availability_data[date_str].append({
            'start': slot.start_time.strftime('%H:%M'),
            'end': slot.end_time.strftime('%H:%M'),
            'available': slot.is_available
        })
    
    return jsonify({
        'therapist_id': therapist_id,
        'availability': availability_data,
        'timezone': therapist_profile.timezone,
        'accepts_emergency': therapist_profile.accepts_emergency
    })