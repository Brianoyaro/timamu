from flask import request, jsonify
from ..models import User, PatientProfile
from .. import db
patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/', methods=['GET'])
def list_patients():
    patients = PatientProfile.query.all()
    return jsonify([{'id': p.id, 'user_id': p.user_id} for p in patients])
