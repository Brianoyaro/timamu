from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import User, AdminProfile, Session, TherapistProfile, PatientProfile, ConversationThread, ThreadMessage
from ..utils.audit_utils import log_action
from sqlalchemy import func, desc
import logging
from . import admin_bp
from functools import wraps

# admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

def is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

def admin_required(f):
    """Decorator that combines JWT authentication and admin permission check"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            if not is_admin(user_id):
                logger.warning(f"Unauthorized admin access attempt by user {user_id} to {f.__name__}")
                return jsonify({
                    'error': 'Unauthorized access. Admin privileges required.',
                    'code': 'ADMIN_REQUIRED'
                }), 403
            
            # Log admin action for audit trail (safely handle potential errors)
            try:
                log_action(
                    user_id=user_id,
                    action=f.__name__,
                    resource='admin_endpoint',
                    resource_id=None,
                    details={
                        'endpoint': request.endpoint,
                        'method': request.method,
                        'function': f.__name__
                    }
                )
            except Exception as audit_error:
                # Don't fail the request if audit logging fails
                logger.warning(f"Audit logging failed for {f.__name__}: {audit_error}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Error in admin_required decorator for {f.__name__}: {str(e)}")
            return jsonify({
                'error': 'Authentication error',
                'code': 'AUTH_ERROR'
            }), 401
    
    return decorated_function

@admin_bp.route('/sessions', methods=['GET'])
@admin_required
def get_sessions():
    """Get all sessions with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status_filter = request.args.get('status')
        
        query = Session.query.options(
            db.joinedload(Session.patient),
            db.joinedload(Session.therapist)
        )
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        sessions = query.order_by(desc(Session.scheduled_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'sessions': [{
                'id': s.id,
                'patient': {
                    'id': s.patient.id if s.patient else None,
                    'name': f"{s.patient.first_name} {s.patient.last_name}" if s.patient else "Unknown"
                },
                'therapist': {
                    'id': s.therapist.id if s.therapist else None,
                    'name': f"{s.therapist.first_name} {s.therapist.last_name}" if s.therapist else "Unknown"
                },
                'scheduled_at': s.scheduled_at.isoformat() if s.scheduled_at else None,
                'started_at': s.started_at.isoformat() if s.started_at else None,
                'ended_at': s.ended_at.isoformat() if s.ended_at else None,
                'status': s.status,
                'duration': s.duration,
                'actual_duration': s.actual_duration,
                'session_type': getattr(s, 'session_type', 'standard'),
                'notes': s.notes
            } for s in sessions.items],
            'total': sessions.total,
            'pages': sessions.pages,
            'current_page': sessions.page
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        return jsonify({'error': 'Failed to fetch sessions'}), 500

@admin_bp.route('/sessions/active', methods=['GET'])
@admin_required
def get_active_sessions():
    """Get currently active sessions"""
    try:
        active_sessions = Session.query.filter_by(status='started').options(
            db.joinedload(Session.patient),
            db.joinedload(Session.therapist)
        ).all()
        
        return jsonify([{
            'id': s.id,
            'patient': {
                'id': s.patient.id if s.patient else None,
                'name': f"{s.patient.first_name} {s.patient.last_name}" if s.patient else "Unknown"
            },
            'therapist': {
                'id': s.therapist.id if s.therapist else None,
                'name': f"{s.therapist.first_name} {s.therapist.last_name}" if s.therapist else "Unknown"
            },
            'started_at': s.started_at.isoformat() if s.started_at else None,
            'session_type': getattr(s, 'session_type', 'standard'),
        } for s in active_sessions]), 200
        
    except Exception as e:
        logger.error(f"Error fetching active sessions: {str(e)}")
        return jsonify({'error': 'Failed to fetch active sessions'}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Get paginated list of all users with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        role_filter = request.args.get('role')
        search = request.args.get('search')
        
        query = User.query
        
        if role_filter:
            query = query.filter_by(role=role_filter)
        
        if search:
            query = query.filter(
                db.or_(
                    User.email.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%')
                )
            )
        
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [{
                'id': u.id, 
                'email': u.email, 
                'role': u.role,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'is_active': u.is_active,
                'is_verified': u.is_verified,
                'created_at': u.created_at.isoformat() if u.created_at else None
            } for u in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        })
    except Exception as e:
        logger.error(f"Error in list_users: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        # Debug: Log all unique roles to understand the data
        unique_roles = db.session.query(User.role).distinct().all()
        logger.info(f"Unique roles in database: {[r[0] for r in unique_roles]}")
        
        # Basic counts - check for various case combinations
        total_users = User.query.filter(User.role.notin_(['admin', 'ADMIN'])).count()
        total_therapists = User.query.filter(User.role.in_(['THERAPIST', 'therapist'])).count()
        total_patients = User.query.filter(User.role.in_(['PATIENT', 'patient'])).count()
        total_sessions = Session.query.count()
        pending_verifications = TherapistProfile.query.filter_by(is_approved=False).count()
        
        # Active sessions (scheduled for today and not completed)
        today = datetime.utcnow().date()
        active_sessions = Session.query.filter(
            func.date(Session.scheduled_at) == today,
            Session.status.in_(['scheduled', 'started'])
        ).count()
        
        # New users this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_this_week = User.query.filter(
            User.created_at >= week_ago,
            User.role.notin_(['admin', 'ADMIN'])
        ).count()
        
        # Session completion rate
        completed_sessions = Session.query.filter_by(status='completed').count()
        scheduled_sessions = Session.query.filter(Session.status.in_(['completed', 'cancelled', 'no_show'])).count()
        completion_rate = round((completed_sessions / scheduled_sessions * 100) if scheduled_sessions > 0 else 0, 1)
        
        # Total revenue (mock data - implement based on your payment system)
        total_revenue = completed_sessions * 100  # Assuming $100 per session
        
        logger.info(f"Dashboard stats: Users={total_users}, Therapists={total_therapists}, Patients={total_patients}, Sessions={total_sessions}")
        
        return jsonify({
            'totalUsers': total_users,
            'totalTherapists': total_therapists,
            'totalPatients': total_patients,
            'totalSessions': total_sessions,
            'pendingVerifications': pending_verifications,
            'activeSessions': active_sessions,
            'newUsersThisWeek': new_users_this_week,
            'completionRate': completion_rate,
            'totalRevenue': total_revenue
        })
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/activity/recent', methods=['GET'])
@admin_required
def get_recent_activity():
    """Get recent platform activity"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        # Get recent user registrations
        recent_users = User.query.filter(User.role != 'admin').order_by(desc(User.created_at)).limit(10).all()
        
        # Get recent sessions
        recent_sessions = Session.query.order_by(desc(Session.created_at)).limit(10).all()
        
        # Get recent therapist applications
        recent_applications = TherapistProfile.query.order_by(desc(TherapistProfile.id)).limit(5).all()
        
        activity = []
        
        # Add user registrations
        for user in recent_users:
            activity.append({
                'id': f'user_{user.id}',
                'timestamp': user.created_at.isoformat() if user.created_at else None,
                'action': 'New user registered',
                'type': 'user_registered',
                'user': f"{user.first_name} {user.last_name}".strip() or user.email,
                'details': f"{user.role.title()} account created"
            })
        
        # Add completed sessions
        for session in recent_sessions:
            if session.status == 'completed':
                activity.append({
                    'id': f'session_{session.id}',
                    'timestamp': session.ended_at.isoformat() if session.ended_at else session.created_at.isoformat(),
                    'action': 'Session completed',
                    'type': 'session_completed',
                    'user': f"Dr. {session.therapist.first_name} {session.therapist.last_name}" if session.therapist else 'Unknown',
                    'details': f"Therapy session with {session.patient.first_name}" if session.patient else 'Unknown patient'
                })
        
        # Add therapist applications
        for app in recent_applications:
            if app.user:
                activity.append({
                    'id': f'application_{app.id}',
                    'timestamp': app.user.created_at.isoformat() if app.user.created_at else None,
                    'action': 'Therapist application',
                    'type': 'therapist_application',
                    'user': f"Dr. {app.user.first_name} {app.user.last_name}".strip() if app.user else 'Unknown',
                    'details': 'New therapist verification request'
                })
        
        # Sort by timestamp and limit
        activity.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        return jsonify(activity[:limit])
    except Exception as e:
        logger.error(f"Error in get_recent_activity: {str(e)}")
        return jsonify([])

@admin_bp.route('/therapists/pending', methods=['GET'])
@admin_required
def get_pending_therapists():
    """Get pending therapist verifications with enhanced data"""
    try:
        pending_therapists = TherapistProfile.query.filter_by(is_approved=False).all()

        therapists_data = []
        for profile in pending_therapists:
            user = profile.user
            if user:
                therapists_data.append({
                    'id': user.id,
                    'name': f"{user.first_name or ''} {user.last_name or ''}".strip() or 'Unknown',
                    'email': user.email,
                    'phone': user.phone,
                    'specializations': profile.specializations or [],
                    'education': profile.education,
                    'experience': profile.experience,
                    'license_number': profile.license_number,
                    'bio': profile.bio,
                    'languages': profile.languages or [],
                    'submissionDate': user.created_at.isoformat() if user.created_at else None
                })

        return jsonify(therapists_data)
    except Exception as e:
        logger.error(f"Error in get_pending_therapists: {str(e)}")
        return jsonify([])

@admin_bp.route('/therapists/<int:therapist_id>/verify', methods=['POST'])
@admin_required
def verify_therapist(therapist_id):
    """Verify a therapist application"""
    try:
        admin_id = get_jwt_identity()
        therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
        
        if not therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404

        therapist_profile.is_approved = True
        therapist_profile.approved_at = datetime.utcnow()

        user = User.query.get(therapist_id)
        if user:
            user.role = 'THERAPIST'
            user.is_verified = True

        db.session.commit()
        
        log_action(
            user_id=admin_id,
            action='therapist_verified',
            resource='therapist_profile',
            resource_id=therapist_id,
            details={'therapist_id': therapist_id}
        )
        
        return jsonify({'message': 'Therapist verified successfully'})
    except Exception as e:
        logger.error(f"Error in verify_therapist: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/therapists/<int:therapist_id>/reject', methods=['POST'])
@admin_required
def reject_therapist(therapist_id):
    """Reject a therapist application"""
    try:
        admin_id = get_jwt_identity()
        data = request.get_json()
        reason = data.get('reason', '')

        therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
        
        if not therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404

        # Instead of deleting, mark as rejected
        therapist_profile.is_approved = False
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
    except Exception as e:
        logger.error(f"Error in reject_therapist: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@admin_bp.route('/platform/health', methods=['GET'])
@admin_required
def get_platform_health():
    """Get platform health metrics"""
    try:
        # Count active users (logged in within last 24 hours)
        day_ago = datetime.utcnow() - timedelta(days=1)
        
        # Basic health metrics
        total_users = User.query.count()
        active_sessions = Session.query.filter_by(status='started').count()
        pending_verifications = TherapistProfile.query.filter_by(is_approved=False).count()
        
        # System status (simplified - you might want to add actual health checks)
        system_status = 'healthy'
        uptime = '99.9%'
        avg_response_time = '125ms'
        error_rate = '0.1%'
        
        return jsonify({
            'systemStatus': system_status,
            'uptime': uptime,
            'responseTime': avg_response_time,
            'errorRate': error_rate,
            'totalUsers': total_users,
            'activeSessions': active_sessions,
            'pendingVerifications': pending_verifications
        })
    except Exception as e:
        logger.error(f"Error in get_platform_health: {str(e)}")
        return jsonify({'systemStatus': 'error'})


@admin_bp.route('/users/<int:user_id>/deactivate', methods=['POST'])
@admin_required
def deactivate_user(user_id):
    """Deactivate a user account"""
    try:
        admin_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        if user.role == 'admin':
            return jsonify({'error': 'Cannot deactivate admin users'}), 400
        
        user.is_active = False
        db.session.commit()
        
        log_action(
            user_id=admin_id,
            action='user_deactivated',
            resource='user',
            resource_id=user_id,
            details={'deactivated_user': user.email}
        )
        
        return jsonify({'message': 'User deactivated successfully'})
    except Exception as e:
        logger.error(f"Error in deactivate_user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<int:user_id>/activate', methods=['POST'])
@admin_required
def activate_user(user_id):
    """Activate a user account"""
    try:
        admin_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        user.is_active = True
        db.session.commit()
        
        log_action(
            user_id=admin_id,
            action='user_activated',
            resource='user',
            resource_id=user_id,
            details={'activated_user': user.email}
        )
        
        return jsonify({'message': 'User activated successfully'})
    except Exception as e:
        logger.error(f"Error in activate_user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500