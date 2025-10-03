from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, TherapistProfile
from ..extensions import db
from datetime import datetime
from . import therapists_bp

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
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role.upper() != 'THERAPIST':
        return jsonify({'error': 'Only therapists can access availability'}), 403
    
    therapist_profile = TherapistProfile.query.filter_by(user_id=current_user_id).first()
    if not therapist_profile:
        return jsonify({'error': 'Therapist profile not found'}), 404
    
    return jsonify({
        'availability': therapist_profile.availability or {},
        'timezone': therapist_profile.timezone
    })


@therapists_bp.route('/availability', methods=['POST'])
@jwt_required()
def update_availability():
    """Update therapist's availability schedule"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role.upper() != 'THERAPIST':
        return jsonify({'error': 'Only therapists can update availability'}), 403
    
    therapist_profile = TherapistProfile.query.filter_by(user_id=current_user_id).first()
    if not therapist_profile:
        return jsonify({'error': 'Therapist profile not found'}), 404
    
    data = request.get_json()
    if 'availability' not in data:
        return jsonify({'error': 'Availability data is required'}), 400
    
    # Validate availability data structure
    availability = data['availability']
    if not isinstance(availability, dict):
        return jsonify({'error': 'Availability must be a dictionary'}), 400
    
    # Update the availability
    therapist_profile.availability = availability
    
    # Update timezone if provided
    if 'timezone' in data:
        therapist_profile.timezone = data['timezone']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': therapist_profile.availability
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update availability: {str(e)}'}), 500


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