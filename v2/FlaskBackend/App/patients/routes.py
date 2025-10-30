from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, PatientProfile, Session
from ..extensions import db
from . import patients_bp
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
def list_patients():
    """Get list of patients based on user role and access rights"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role.upper() != 'THERAPIST' and user.role.upper() != 'ADMIN':
            return jsonify({'error': 'Unauthorized access'}), 403

        # For therapists, only show their assigned patients
        if user.role.upper() == 'THERAPIST':
            # Get patients from sessions where this therapist is assigned
            patient_ids = db.session.query(Session.patient_id)\
                .filter(Session.therapist_id == current_user_id)\
                .distinct()\
                .all()
            patient_ids = [id[0] for id in patient_ids]
            patients = User.query.filter(User.id.in_(patient_ids), User.role == 'PATIENT').all()
        else:
            # Admins can see all patients
            patients = User.query.filter_by(role='PATIENT').all()

        patients_data = []
        for patient in patients:
            profile = PatientProfile.query.filter_by(user_id=patient.id).first()
            if profile:
                patient_data = {
                    'id': patient.id,
                    'email': patient.email,
                    'first_name': patient.first_name,
                    'last_name': patient.last_name,
                    'phone': profile.phone if profile else None,
                    'address': profile.address if profile else None,
                    'created_at': patient.created_at.isoformat() if patient.created_at else None
                }
                patients_data.append(patient_data)

        return jsonify(patients_data)

    except Exception as e:
        logger.error(f"Error in list_patients: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_detail(patient_id):
    """Get detailed information about a specific patient"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role.upper() != 'THERAPIST' and user.role.upper() != 'ADMIN':
            return jsonify({'error': 'Unauthorized access'}), 403

        # Check if the therapist has access to this patient
        if user.role.upper() == 'THERAPIST':
            has_access = db.session.query(Session)\
                .filter(Session.therapist_id == current_user_id,
                        Session.patient_id == patient_id)\
                .first() is not None
            
            if not has_access:
                return jsonify({'error': 'Unauthorized access to this patient'}), 403

        patient = User.query.filter_by(id=patient_id, role='PATIENT').first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404

        profile = PatientProfile.query.filter_by(user_id=patient.id).first()
        
        # Get patient's session history
        sessions = Session.query\
            .filter(Session.patient_id == patient_id)\
            .order_by(Session.scheduled_at.desc())\
            .all()

        sessions_data = []
        for session in sessions:
            session_data = {
                'id': session.id,
                'title': session.title,
                'status': session.status,
                'scheduled_at': session.scheduled_at.isoformat() if session.scheduled_at else None,
                'duration': session.duration,
                'notes': session.notes,
                'created_at': session.created_at.isoformat() if session.created_at else None
            }
            sessions_data.append(session_data)

        patient_data = {
            'id': patient.id,
            'email': patient.email,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'profile': {
                'date_of_birth': profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None,
                'phone': profile.phone if profile else None,
                'address': profile.address if profile else None,
                'emergency_contact': profile.emergency_contact if profile else None,
                'preferred_language': profile.preferred_language if profile else None,
                'medical_history': profile.medical_history if profile else None
            } if profile else None,
            'sessions': sessions_data,
            'created_at': patient.created_at.isoformat() if patient.created_at else None,
            'updated_at': patient.updated_at.isoformat() if patient.updated_at else None
        }

        return jsonify(patient_data)

    except Exception as e:
        logger.error(f"Error in get_patient_detail: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
