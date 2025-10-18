from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, TherapistProfile, Session
from ..extensions import db
from datetime import datetime, timedelta
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
    """Redirect to the new availability endpoint"""
    logger.debug("[GET /availability] Endpoint accessed - redirecting to new route")
    current_user_id = get_jwt_identity()
    
    # Import redirect function
    from flask import redirect, url_for
    
    # Redirect to the new endpoint
    return redirect(url_for('availability.get_my_availability'))
    
    # The code below is kept for reference but not used
    """
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
    from datetime import datetime, timedelta, date, time
    
    # Get current date and time for filtering
    now = datetime.utcnow()
    today = now.date()
    current_time = now.time()
    
    availability_slots = TherapistAvailability.query.filter_by(
        therapist_profile_id=therapist_profile.id
    ).filter(
        TherapistAvailability.date >= today  # Only future and today's dates
    ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
    
    # Convert to date-based format with slot-level availability
    availability_data = {}
    
    for slot in availability_slots:
        date_str = slot.date.strftime('%Y-%m-%d')
        if date_str not in availability_data:
            availability_data[date_str] = []
        
        # Get available and booked slots for this time block
        total_slots = slot.get_total_slots()
        available_slots = slot.get_available_slots()
        booked_slots = slot.booked_slots or []
        
        # Filter individual slots based on current time
        filtered_individual_slots = []
        for i in range(total_slots):
            slot_start_time = (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i)).time()
            slot_datetime = datetime.combine(slot.date, slot_start_time)
            
            # Only include slots that are in the future
            if slot_datetime > now:
                filtered_individual_slots.append({
                    'slot_index': i,
                    'start_time': slot_start_time.strftime('%H:%M'),
                    'end_time': (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i+1)).time().strftime('%H:%M'),
                    'is_available': i in available_slots
                })
        
        # Only add the slot if it has future individual slots
        if filtered_individual_slots:
            availability_data[date_str].append({
                'id': slot.id,
                'start': slot.start_time.strftime('%H:%M'),
                'end': slot.end_time.strftime('%H:%M'),
                'available': slot.is_available,
                'total_slots': total_slots,
                'available_slots': available_slots,
                'booked_slots': booked_slots,
                'individual_slots': filtered_individual_slots
            })
    
    logger.debug(f"[GET /availability] Retrieved availability: {availability_data}")
    logger.debug(f"[GET /availability] Retrieved timezone: {therapist_profile.timezone}")
    
    return jsonify({
        'availability': availability_data,
        'timezone': therapist_profile.timezone
    })
    """


@therapists_bp.route('/availability', methods=['POST'])
@jwt_required()
def update_availability():
    """Redirect to the new availability endpoint"""
    logger.debug("[POST /availability] Endpoint accessed - redirecting to new route")
    
    # Forward the request to the new endpoint
    from flask import redirect, url_for
    from ..routes.availability import update_my_availability
    
    # Return the result of the new endpoint
    return update_my_availability()
    
    # The code below is kept for reference but not used
    """
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
    
    # Store existing booked slots before clearing availability
    from ..models import TherapistAvailability
    existing_slots = TherapistAvailability.query.filter_by(therapist_profile_id=therapist_profile.id).all()
    
    # Create a mapping of (date, time_range) -> booked_slots to preserve existing bookings
    existing_bookings = {}
    for existing_slot in existing_slots:
        # Create a key that identifies the time slot by date and time range
        date_key = existing_slot.date.strftime('%Y-%m-%d')
        time_key = f"{existing_slot.start_time.strftime('%H:%M')}-{existing_slot.end_time.strftime('%H:%M')}"
        slot_key = f"{date_key}_{time_key}"
        
        # Store the booked slots for this time range
        if existing_slot.booked_slots:
            existing_bookings[slot_key] = existing_slot.booked_slots.copy()
            logger.debug(f"[POST /availability] Preserving booked slots for {slot_key}: {existing_slot.booked_slots}")
    
    logger.debug(f"[POST /availability] Preserved {len(existing_bookings)} slots with bookings")
    
    # Clear existing availability slots
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
                        
                        # Check if this slot had any existing bookings
                        time_key = f"{start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')}"
                        slot_key = f"{date_str}_{time_key}"
                        preserved_booked_slots = existing_bookings.get(slot_key, [])
                        
                        if preserved_booked_slots:
                            logger.debug(f"[POST /availability] Restoring booked slots for {slot_key}: {preserved_booked_slots}")
                        
                        availability_slot = TherapistAvailability(
                            therapist_profile_id=therapist_profile.id,
                            date=date_obj,
                            start_time=start_time,
                            end_time=end_time,
                            is_available=is_available,
                            booked_slots=preserved_booked_slots,  # Restore preserved bookings
                            timezone=data.get('timezone', therapist_profile.timezone)
                        )
                        
                        db.session.add(availability_slot)
                        logger.debug(f"[POST /availability] Created slot for {date_str} from {start_time} to {end_time} with {len(preserved_booked_slots)} booked slots")
                        
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
    """


# Debug endpoint to check therapist profile data !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
    """Redirect to the new availability endpoint"""
    logger.debug(f"[GET /{therapist_id}/availability] Endpoint accessed - redirecting to new route")
    
    # Import redirect function
    from flask import redirect, url_for
    
    # Redirect to the new endpoint
    return redirect(url_for('availability.get_therapist_availability', therapist_id=therapist_id))
    
    # The code below is kept for reference but not used
    """
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
    from datetime import datetime, timedelta, date, time
    
    # Get current date and time for filtering
    now = datetime.utcnow()
    today = now.date()
    
    availability_slots = TherapistAvailability.query.filter_by(
        therapist_profile_id=therapist_profile.id
    ).filter(
        TherapistAvailability.date >= today  # Only future and today's dates
    ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
    
    # Convert to date-based format with slot-level availability for booking
    availability_data = {}
    
    for slot in availability_slots:
        date_str = slot.date.strftime('%Y-%m-%d')
        if date_str not in availability_data:
            availability_data[date_str] = []
        
        # Get available and booked slots for this time block
        total_slots = slot.get_total_slots()
        available_slots = slot.get_available_slots()
        booked_slots = slot.booked_slots or []
        
        # Filter individual slots based on current time
        filtered_individual_slots = []
        for i in range(total_slots):
            slot_start_time = (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i)).time()
            slot_datetime = datetime.combine(slot.date, slot_start_time)
            
            # Only include slots that are in the future
            if slot_datetime > now:
                filtered_individual_slots.append({
                    'slot_index': i,
                    'start_time': slot_start_time.strftime('%H:%M'),
                    'end_time': (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i+1)).time().strftime('%H:%M'),
                    'is_available': i in available_slots
                })
        
        # Only add the slot if it has future individual slots
        if filtered_individual_slots:
            availability_data[date_str].append({
                'id': slot.id,
                'start': slot.start_time.strftime('%H:%M'),
                'end': slot.end_time.strftime('%H:%M'),
                'available': slot.is_available,
                'total_slots': total_slots,
                'available_slots': available_slots,
                'booked_slots': booked_slots,
                'individual_slots': filtered_individual_slots
            })
    
    return jsonify({
        'therapist_id': therapist_id,
        'availability': availability_data,
        'timezone': therapist_profile.timezone,
        'accepts_emergency': therapist_profile.accepts_emergency
    })
    """

'''
This section contains endpoints to book and unbook individual slots within an availability block, I should ensure that these endpoints correctly handle the booking logic, including checking if a slot is available, updating the booked slots list, and managing concurrency issues.
'''
@therapists_bp.route('/availability/<int:availability_id>/slots/<int:slot_index>/book', methods=['POST'])
@jwt_required()
def book_slot(availability_id, slot_index):
    """Book a session using the new availability/booking system"""
    logger.debug(f"[POST /book_slot] Redirecting to new booking endpoint")
    
    # We need to use the new book endpoint instead
    from flask import request, redirect, url_for, jsonify
    current_user_id = get_jwt_identity()
    
    # Get the current request data
    data = request.get_json() or {}
    
    # Get the availability to find the therapist
    from ..models import TherapistAvailability
    availability_slot = TherapistAvailability.query.get(availability_id)
    
    if not availability_slot:
        return jsonify({'error': 'Availability slot not found'}), 404
    
    # Get the therapist profile and user ID
    therapist_profile = availability_slot.therapist_profile
    therapist_id = therapist_profile.user_id
    
    # Create booking data for the new endpoint
    booking_data = {
        'therapist_id': therapist_id,
        'availability_id': availability_id,
        'slot_index': slot_index,
        'title': data.get('title', 'Therapy Session'),
        'session_type': data.get('session_type', 'individual'),
        'notes': data.get('notes', ''),
        'is_emergency': data.get('is_emergency', False),
        'duration': data.get('duration', 60)
    }
    
    # Use the new endpoint directly with modified request
    from flask import current_app
    with current_app.test_request_context(
        '/api/availability/book',
        method='POST',
        json=booking_data,
        headers={k: v for k, v in request.headers.items() if k != 'Content-Length'}
    ):
        from ..routes.availability import book_session
        return book_session()

@therapists_bp.route('/availability/<int:availability_id>/slots/<int:slot_index>/unbook', methods=['POST'])
@jwt_required()
def unbook_slot(availability_id, slot_index):
    """Redirect to the cancel booking endpoint"""
    logger.debug(f"[POST /unbook_slot] Redirecting to cancel booking endpoint")
    
    # This is more complex - we need to find the session associated with this slot
    from ..models import Session, TherapistAvailability
    
    availability = TherapistAvailability.query.get(availability_id)
    if not availability:
        return jsonify({'error': 'Availability slot not found'}), 404
    
    # Find session associated with this slot
    session = Session.query.filter_by(
        availability_id=availability_id,
        slot_index=slot_index
    ).first()
    
    if not session:
        # If no session found, just unbook the slot directly
        try:
            availability.unbook_slot(slot_index)
            db.session.commit()
            return jsonify({
                'message': 'Slot unbooked successfully',
                'availability_id': availability_id,
                'slot_index': slot_index
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to unbook slot: {str(e)}'}), 500
    
    # If session found, redirect to cancel booking endpoint
    from flask import request, redirect, url_for
    data = request.get_json() or {}
    
    # Use the cancel booking endpoint directly
    from flask import current_app
    with current_app.test_request_context(
        f'/api/availability/cancel-booking/{session.id}',
        method='POST',
        json={'reason': data.get('reason', 'Cancelled by therapist')},
        headers={k: v for k, v in request.headers.items() if k != 'Content-Length'}
    ):
        from ..routes.availability import cancel_booking
        return cancel_booking(session.id)

@therapists_bp.route('/availability/<int:availability_id>/slots', methods=['GET'])
@jwt_required()
def get_availability_slots(availability_id):
    """Get detailed information about all slots in an availability block"""
    logger.debug(f"[GET /slots] Getting slots for availability {availability_id}")
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get the availability slot
    from ..models import TherapistAvailability
    availability_slot = TherapistAvailability.query.get(availability_id)
    
    if not availability_slot:
        return jsonify({'error': 'Availability slot not found'}), 404
    
    # Get detailed slot information
    total_slots = availability_slot.get_total_slots()
    available_slots = availability_slot.get_available_slots()
    booked_slots = availability_slot.booked_slots or []
    
    # Generate detailed slot information
    slots_info = []
    for i in range(total_slots):
        slot_start = datetime.combine(availability_slot.date, availability_slot.start_time) + timedelta(hours=i)
        slot_end = slot_start + timedelta(hours=1)
        
        slots_info.append({
            'slot_index': i,
            'start_datetime': slot_start.isoformat(),
            'end_datetime': slot_end.isoformat(),
            'start_time': slot_start.time().strftime('%H:%M'),
            'end_time': slot_end.time().strftime('%H:%M'),
            'is_available': i in available_slots,
            'is_booked': i in booked_slots
        })
    
    return jsonify({
        'availability_id': availability_id,
        'date': availability_slot.date.strftime('%Y-%m-%d'),
        'overall_start': availability_slot.start_time.strftime('%H:%M'),
        'overall_end': availability_slot.end_time.strftime('%H:%M'),
        'overall_available': availability_slot.is_available,
        'timezone': availability_slot.timezone,
        'total_slots': total_slots,
        'available_count': len(available_slots),
        'booked_count': len(booked_slots),
        'slots': slots_info
    })


@therapists_bp.route('/<int:therapist_id>/available-slots', methods=['GET'])
@jwt_required()
def get_available_slots_for_booking(therapist_id):
    """Redirect to the new available-slots endpoint"""
    logger.debug(f"[GET /{therapist_id}/available-slots] Redirecting to new route")
    
    from flask import request, redirect, url_for
    
    # Forward the query parameters
    query_string = request.query_string.decode()
    if query_string:
        query_string = '?' + query_string
    
    # Redirect to the new endpoint
    return redirect(url_for('availability.get_available_slots', therapist_id=therapist_id) + query_string)