from flask import request, jsonify, Blueprint
from ..extensions import db, bcrypt, oauth, jwt as jwt_manager
from flask_jwt_extended import create_access_token, decode_token
import jwt
from datetime import datetime, timedelta
from ..utils.email_utils import send_welcome_email, send_forgot_password_email
from flask import redirect, url_for, session, current_app
from ..utils.audit_utils import create_audit_log
import logging
from . import auth_bp

# Configure logging for debug messages
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# auth_bp = Blueprint('auth', __name__)
from ..models import RefreshToken, TherapistProfile, User, PatientProfile

logger.info("Auth blueprint initialized successfully")
logger.debug(f"Auth blueprint name: {auth_bp.name}")

# Debug route to test if auth blueprint is working
@auth_bp.route('/debug', methods=['GET'])
def debug_route():
    logger.info("Debug route accessed successfully!")
    return jsonify({
        'message': 'Auth blueprint is working!',
        'blueprint_name': auth_bp.name,
        'available_routes': [rule.rule for rule in current_app.url_map.iter_rules() if rule.endpoint.startswith('auth')]
    })

def generate_jwt(user, exp_duration=10):
    '''Generate JWT token for a user.
    exp_duration: expiration duration in minutes (default 10 minutes)
    '''
    # Create additional claims for the token
    additional_claims = {
        'email': user.email,
        'role': user.role
    }
    
    # Use Flask-JWT-Extended to create the token
    # identity is set to the user_id which will be accessible via get_jwt_identity()
    expires_delta = timedelta(minutes=exp_duration)
    token = create_access_token(
        identity=user.id, 
        additional_claims=additional_claims,
        expires_delta=expires_delta
    )
    return token

@auth_bp.route('/login', methods=['POST'])
def login():
    logger.info("=== LOGIN ROUTE ACCESSED ===")
    logger.debug(f"Request method: {request.method}")
    logger.debug(f"Request endpoint: {request.endpoint}")
    logger.debug(f"Request URL: {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    logger.debug(f"Request content type: {request.content_type}")
    
    logging.debug('Login attempt')
    
    try:
        data = request.json
        logger.debug(f"Request data received: {data}")
        
        if not data:
            logger.error("No JSON data received in login request")
            return jsonify({'error': 'No data provided'}), 400
        
        if 'email' not in data or 'password' not in data:
            logger.error("Missing email or password in request data")
            return jsonify({'error': 'Email and password are required'}), 400
            
        user = User.query.filter_by(email=data['email']).first()
        logger.debug(f"User lookup result for {data['email']}: {'Found' if user else 'Not found'}")

        # If user not found or password does not match
        if not user or not bcrypt.check_password_hash(user.password, data['password']):
            logging.warning(f'Login failed for {data["email"]}')
            create_audit_log('LOGIN', None, data['email'], 'AUTH', status='FAILURE')
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = generate_jwt(user)
        refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token

        # Store refresh token in database
        new_refresh_token = RefreshToken(
            user_id=user.id, 
            refresh_token=refresh_token
        )
        db.session.add(new_refresh_token)
        db.session.commit()

        create_audit_log('LOGIN', user.id, user.email, 'AUTH', status='SUCCESS')
        logging.info(f'Login successful for {user.email}')
        logger.debug("=== LOGIN ROUTE COMPLETED SUCCESSFULLY ===")
        return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': {'id': user.id, 'email': user.email, 'role': user.role}})
    
    except Exception as e:
        logger.error(f"Exception in login route: {str(e)}")
        logger.exception("Full exception details:")
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    logger.info("=== REGISTER ROUTE ACCESSED ===")
    logger.debug(f"Request method: {request.method}")
    logger.debug(f"Request endpoint: {request.endpoint}")
    logger.debug(f"Request URL: {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    logger.debug(f"Request content type: {request.content_type}")
    
    logging.debug('Registration attempt')
    
    try:
        data = request.json
        logger.debug(f"Request data received: {data}")
        
        if not data:
            logger.error("No JSON data received in registration request")
            return jsonify({'error': 'No data provided'}), 400
        
        if 'email' not in data or 'password' not in data:
            logger.error("Missing email or password in request data")
            return jsonify({'error': 'Email and password are required'}), 400
        
        # check if email already exists
        if User.query.filter_by(email=data['email']).first():
            logging.warning(f'Registration failed for {data["email"]}: Email already registered')
            create_audit_log('REGISTER', None, data['email'], 'AUTH', status='FAILURE')
            return jsonify({'error': 'Email already registered'}), 400
        
        hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user = User(email=data['email'], password=hashed_pw, first_name=data.get('firstName'), last_name=data.get('lastName'), role=data.get('role', 'PATIENT'))
        db.session.add(user)
        db.session.commit()
        
        # handle role-specific profile creation
        if 'role' in data and data['role'] not in ['PATIENT', 'THERAPIST', 'ADMIN']:
            logger.error(f"Invalid role specified: {data['role']}")
            return jsonify({'error': 'Invalid role specified'}), 400
        
        logger.debug(f"Creating user with role: {data.get('role', 'PATIENT')}")
        
        if data.get('role') == 'PATIENT':
            user.is_verified = True  # Patients are auto-verified

            patient_profile = PatientProfile(user_id=user.id, medical_history=data.get('medicalHistory', ''), emergency_contact=data.get('emergencyContact', ''), preferred_language=data.get('preferredLanguage', 'English'), timezone=data.get('timezone', 'UTC'))
            db.session.add(patient_profile)
        
        elif data.get('role') == 'THERAPIST':
            # We'll receive these additional fields when we display a modal after login in the frontend where they can complete their profile or skip and fill later
            therapist_profile = TherapistProfile(user_id=user.id, license_number=data.get('licenseNumber', ''), specializations=data.get('specializations', []), languages=data.get('languages', []), experience=data.get('experience', 0), education=data.get('education', ''), bio=data.get('bio', ''), is_approved=False, availability=data.get('availability', {}), timezone=data.get('timezone', 'UTC'), accepts_emergency=data.get('acceptsEmergency', False))
            db.session.add(therapist_profile)

        db.session.commit()
        logger.debug(f"User created successfully with ID: {user.id}")
        
        # Send welcome email
        # send_welcome_email(user.email, user.first_name or "") # UNCOMMENT THIS. I AM LEAVING IT HERE FOR DEBUGING PURPOSES ON LOCAL HOST

        # generate JWT
        access_token = generate_jwt(user) # 10 minutes expiration for access token
        refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token
        
        # Store refresh token in database
        new_refresh_token = RefreshToken(
            user_id=user.id, 
            refresh_token=refresh_token
        )
        db.session.add(new_refresh_token)
        db.session.commit()
        
        create_audit_log('REGISTER', user.id, user.email, 'AUTH', status='SUCCESS')
        logging.info(f'Registration successful for {user.email}')
        logger.debug("=== REGISTER ROUTE COMPLETED SUCCESSFULLY ===")
        return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': {'id': user.id, 'email': user.email, 'role': user.role}})
    
    except Exception as e:
        logger.error(f"Exception in register route: {str(e)}")
        logger.exception("Full exception details:")
        db.session.rollback()  # Rollback any database changes
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    '''
    Refresh JWT token using a valid refresh token.
    Expected JSON payload:
    {
        "refresh_token": "<refresh_token>"
    }
    '''
    logging.debug('Token refresh attempt')
    data = request.json
    token = data.get('refresh_token')
    if not token:
        logging.warning('Token refresh failed: Refresh token is missing')
        create_audit_log('REFRESH_TOKEN', None, None, 'AUTH', status='FAILURE')
        return jsonify({'error': 'Refresh token is missing'}), 400
    
    # Check if the token is in database and not revoked
    token_entry = RefreshToken.query.filter_by(refresh_token=token, revoked=False).first()
    if not token_entry:
        logging.warning('Token refresh failed: Invalid or revoked refresh token')
        create_audit_log('REFRESH_TOKEN', None, None, 'AUTH', status='FAILURE')
        return jsonify({'error': 'Invalid or revoked refresh token'}), 401
    
    # decode and verify the token using Flask-JWT-Extended
    try:
        # Manually decode the token without verification to get the user_id
        # We've already verified it's in our database and not revoked
        decoded_token = decode_token(token, allow_expired=True)
        user_id = decoded_token['sub']  # 'sub' is where identity is stored
        
        user = User.query.get(user_id)
        if not user:
            logging.warning('Token refresh failed: User not found')
            create_audit_log('REFRESH_TOKEN', None, None, 'AUTH', status='FAILURE')
            return jsonify({'error': 'User not found'}), 404
        
        new_access_token = generate_jwt(user)
        new_refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token
        
        # Update the refresh token in database
        token_entry.refresh_token = new_refresh_token
        db.session.commit()

        create_audit_log('REFRESH_TOKEN', user.id, user.email, 'AUTH', status='SUCCESS')
        logging.info(f'Token refresh successful for {user.email}')

        return jsonify({'access_token': new_access_token, 'refresh_token': new_refresh_token})
    
    except Exception as e:
        logging.warning(f'Token refresh failed: {str(e)}')
        create_audit_log('REFRESH_TOKEN', None, None, 'AUTH', status='FAILURE')
        return jsonify({'error': 'Invalid refresh token'}), 401
    

@auth_bp.route('/logout', methods=['POST'])
def logout():
    '''
    Logout user by revoking their refresh token.
    Expected JSON payload:
    {
        "refresh_token": "<refresh_token>"
    }
    '''
    logging.debug('Logout attempt')
    data = request.json
    token = data.get('refresh_token')
    if not token:
        logging.warning('Logout failed: Refresh token is missing')
        create_audit_log('LOGOUT', None, None, 'AUTH', status='FAILURE')
        return jsonify({'error': 'Refresh token is missing'}), 400
    
    # find the token in database and mark it as revoked
    token_entry = RefreshToken.query.filter_by(refresh_token=token, revoked=False).first()
    if token_entry:
        try:
            # Just to verify the token, no need to use the result
            decoded_token = decode_token(token, allow_expired=True)
            
            logging.info(f'Logout successful for user ID {token_entry.user_id}')
            create_audit_log('LOGOUT', token_entry.user_id, token_entry.user.email if token_entry.user else None, 'AUTH', status='SUCCESS')
            
            token_entry.revoked = True
            db.session.commit()
            return jsonify({'message': 'Logged out successfully'}), 200
        except Exception as e:
            logging.warning(f'Logout token validation failed: {str(e)}')
            # Continue anyway since we're just revoking the token
    
    # If we couldn't find the token or validation failed but we still want to revoke
    if token_entry:
        token_entry.revoked = True
        db.session.commit()
        return jsonify({'message': 'Logged out successfully'}), 200
    else:
        logging.warning('Logout failed: Invalid or already revoked refresh token')
        create_audit_log('LOGOUT', None, None, 'AUTH', status='FAILURE')
        return jsonify({'error': 'Invalid or already revoked refresh token'}), 400

# Forgot password and reset password routes
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    logging.debug('Forgot password attempt')
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        logging.warning(f'Forgot password failed for {data["email"]}: Email not found')
        create_audit_log('FORGOT_PASSWORD', None, data['email'], 'AUTH', status='FAILURE')
        return jsonify({'error': 'Email not found'}), 404

    # Generate a password reset token
    reset_token = generate_jwt(user, exp_duration=15*60)  # 15 minutes expiration
    reset_link = f"{current_app.config['FRONTEND_URL']}/reset-password?token={reset_token}"

    send_forgot_password_email(user.email, reset_link)
    create_audit_log('FORGOT_PASSWORD', user.id, user.email, 'AUTH', status='SUCCESS')
    logging.info(f'Password reset email sent to {user.email}')
    return jsonify({'message': 'Password reset email sent'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    logging.debug('Reset password attempt')
    data = request.json
    token = data.get('reset_token')
    new_password = data.get('new_password')
    if not token or not new_password:
        logging.warning('Reset password failed: Missing token or new password')
        return jsonify({'error': 'Reset token and new password are required'}), 400
    
    try:
        # Decode the token using Flask-JWT-Extended
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']  # 'sub' is where identity is stored
        
        user = User.query.get(user_id)
        if not user:
            logging.warning('Reset password failed: User not found')
            create_audit_log('RESET_PASSWORD', None, None, 'AUTH', status='FAILURE')
            return jsonify({'error': 'User not found'}), 404
        
        # Update the user's password
        hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password = hashed_pw
        db.session.commit()
        
        create_audit_log('RESET_PASSWORD', user.id, user.email, 'AUTH', status='SUCCESS')
        logging.info(f'Password reset successful for {user.email}')
        return jsonify({'message': 'Password has been reset successfully'}), 200
    
    except Exception as e:
        logging.warning(f'Reset password failed: {str(e)}')
        return jsonify({'error': 'Invalid or expired reset token'}), 401
    

# Google OAuth2 login route
@auth_bp.route('/google-login')
def google_login():
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/google-callback')
def google_callback():
    token = oauth.google.authorize_access_token()
    user_info = token.get('userinfo') or oauth.google.parse_id_token(token)
    email = user_info['email']
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=user_info.get('given_name'), last_name=user_info.get('family_name'), role='PATIENT', is_verified=True)
        db.session.add(user)
        db.session.commit()
    access_token = generate_jwt(user)
    refresh_token = generate_jwt(user, exp_duration=7*24*60)
    session['access_token'] = access_token
    session['refresh_token'] = refresh_token
    return redirect('/dashboard')  # Change to your frontend route
