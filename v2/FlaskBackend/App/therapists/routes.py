from flask import request, jsonify
from ..models import User, TherapistProfile
from ..extensions import db
from . import therapists_bp

# Initialize the therapists blueprint
# therapists_bp = Blueprint('therapists', __name__)

@therapists_bp.route('/', methods=['GET'])
def list_therapists():
    therapists = TherapistProfile.query.all()
    return jsonify([{'id': t.id, 'user_id': t.user_id, 'license_number': t.license_number} for t in therapists])