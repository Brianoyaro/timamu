from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import User, AdminProfile, Session, TherapistProfile
from ..utils.audit_utils import log_action
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@admin_bp.before_request
@jwt_required()
def check_admin():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Unauthorized access'}), 403

@admin_bp.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([{'id': u.id, 'email': u.email, 'role': u.role} for u in users])

@admin_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    total_users = User.query.filter(User.role != 'admin').count()
    total_therapists = User.query.filter_by(role='therapist').count()
    total_sessions = Session.query.count()
    # TherapistProfile uses `is_approved` in this codebase
    pending_verifications = TherapistProfile.query.filter_by(is_approved=False).count()

    return jsonify({
        'totalUsers': total_users,
        'totalTherapists': total_therapists,
        'totalSessions': total_sessions,
        'pendingVerifications': pending_verifications
    })

@admin_bp.route('/sessions/monthly', methods=['GET'])
def get_monthly_sessions():
    # Get the last 6 months of sessions
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)

    # Query sessions grouped by month
    sessions = db.session.query(
        func.date_trunc('month', Session.scheduled_at).label('month'),
        func.count(Session.id).label('count')
    ).filter(
        Session.scheduled_at >= start_date,
        Session.scheduled_at <= end_date
    ).group_by('month').order_by('month').all()

    # Format data for the frontend
    labels = []
    data = []

    for month, count in sessions:
        labels.append(month.strftime('%B %Y'))
        data.append(count)

    return jsonify({
        'labels': labels,
        'data': data
    })

@admin_bp.route('/therapists/pending', methods=['GET'])
def get_pending_therapists():
    pending_therapists = TherapistProfile.query.filter_by(is_approved=False).all()

    therapists_data = []
    for profile in pending_therapists:
        # TherapistProfile has a relationship to User as `user`
        user = profile.user
        if user:
            # `specializations` is stored as JSON on the profile in this schema
            specializations = profile.specializations or []
            therapists_data.append({
                'id': user.id,
                'name': f"{user.first_name or ''} {user.last_name or ''}".strip(),
                'email': user.email,
                'phone': user.phone,
                'specializations': specializations,
                # Use the user's created_at as the submission date fallback
                'submissionDate': (user.created_at.isoformat() if getattr(user, 'created_at', None) else None)
            })

    return jsonify(therapists_data)

@admin_bp.route('/therapists/<int:therapist_id>/verify', methods=['POST'])
def verify_therapist(therapist_id):
    admin_id = get_jwt_identity()
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first_or_404()

    # Mark as approved and set approval timestamp (no approved_by field on model)
    therapist_profile.is_approved = True
    therapist_profile.approved_at = datetime.now()

    # Update the user's role to therapist
    user = User.query.get(therapist_id)
    if user:
        user.role = 'therapist'

    db.session.commit()
    
    log_action(
        user_id=admin_id,
        action='therapist_verified',
        resource='therapist_profile',
        resource_id=therapist_id,
        details={'therapist_id': therapist_id}
    )
    
    return jsonify({'message': 'Therapist verified successfully'})@admin_bp.route('/therapists/<int:therapist_id>/reject', methods=['POST'])
def reject_therapist(therapist_id):
    admin_id = get_jwt_identity()
    data = request.get_json()
    reason = data.get('reason', '')

    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first_or_404()

    # Mark as not approved; keep rejection reason in the audit log
    therapist_profile.is_approved = False
    # If the model had an approved_at field, clear it
    if hasattr(therapist_profile, 'approved_at'):
        therapist_profile.approved_at = None

    db.session.commit()
    
    log_action(
        user_id=admin_id,
        action='therapist_rejected',
        resource='therapist_profile',
        resource_id=therapist_id,
        details={'therapist_id': therapist_id, 'reason': reason}
    )
    
    return jsonify({'message': 'Therapist application rejected'})