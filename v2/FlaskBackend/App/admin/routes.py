from flask import request, jsonify, Blueprint
from ..models import User, AdminProfile
from ..extensions import db
admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([{'id': u.id, 'email': u.email, 'role': u.role} for u in users])
