from flask import request, jsonify
from ..models import User, PatientProfile
from ..extensions import db
from . import patients_bp

@patients_bp.route('/', methods=['GET'])
def list_patients():
    patients = PatientProfile.query.all()
    return jsonify([{'id': p.id, 'user_id': p.user_id} for p in patients])
