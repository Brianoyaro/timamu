from flask import request, jsonify
from ..models import Session
from ..extensions import db
from . import sessions_bp
# sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('/', methods=['GET'])
def list_sessions():
    sessions = Session.query.all()
    return jsonify([{'id': s.id, 'title': s.title, 'status': s.status} for s in sessions])
