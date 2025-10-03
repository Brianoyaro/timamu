from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, TherapistProfile
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


@therapists_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get therapist's availability schedule"""
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
    
    logger.debug(f"[GET /availability] Retrieved availability: {therapist_profile.availability}")
    logger.debug(f"[GET /availability] Retrieved timezone: {therapist_profile.timezone}")
    
    return jsonify({
        'availability': therapist_profile.availability or {},
        'timezone': therapist_profile.timezone
    })


@therapists_bp.route('/availability', methods=['POST'])
@jwt_required()
def update_availability():
    """Update therapist's availability schedule"""
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
    
    # Validate availability data structure
    availability = data['availability']
    logger.debug(f"[POST /availability] Availability data: {availability}")
    
    if not isinstance(availability, dict):
        logger.warning(f"[POST /availability] Invalid availability format. Expected dict, got: {type(availability)}")
        return jsonify({'error': 'Availability must be a dictionary'}), 400
    
    # Update the availability
    prev_availability = therapist_profile.availability
    therapist_profile.availability = availability
    logger.debug(f"[POST /availability] Updated availability from {prev_availability} to {availability}")
    
    # Update timezone if provided
    if 'timezone' in data:
        prev_timezone = therapist_profile.timezone
        therapist_profile.timezone = data['timezone']
        logger.debug(f"[POST /availability] Updated timezone from {prev_timezone} to {data['timezone']}")
    
    try:
        db.session.commit()
        logger.debug("[POST /availability] Successfully saved availability to database")
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': therapist_profile.availability
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
            'availability_set': therapist_profile.availability is not None if therapist_profile else False,
            'availability_type': type(therapist_profile.availability).__name__ if therapist_profile and therapist_profile.availability else None,
            'availability_keys': list(therapist_profile.availability.keys()) if therapist_profile and therapist_profile.availability and isinstance(therapist_profile.availability, dict) else [],
            'db_connection': {
                'connected': db_connected,
                'error': db_error if not db_connected else None
            }
        }
    })

@therapists_bp.route('/<int:therapist_id>/availability', methods=['GET'])
@jwt_required()
def get_therapist_availability(therapist_id):
    """Get specific therapist's availability for booking (patients can access this)"""
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
    
    return jsonify({
        'therapist_id': therapist_id,
        'availability': therapist_profile.availability or {},
        'timezone': therapist_profile.timezone,
        'accepts_emergency': therapist_profile.accepts_emergency
    })