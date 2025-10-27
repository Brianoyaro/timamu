from flask import request, jsonify, Blueprint
from ..extensions import db, bcrypt, oauth, jwt as jwt_manager
from flask_jwt_extended import create_access_token, decode_token, jwt_required, get_jwt_identity
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
            therapist_profile = TherapistProfile(
                user_id=user.id, 
                license_number=data.get('licenseNumber', ''), 
                specializations=data.get('specializations', []), 
                languages=data.get('languages', []), 
                experience=data.get('experience', 0), 
                education=data.get('education', ''), 
                bio=data.get('bio', ''), 
                is_approved=False, 
                timezone=data.get('timezone', 'UTC'), 
                accepts_emergency=data.get('acceptsEmergency', False)
            )
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
        
        # Get complete profile data
        profile_data = None
        if data.get('role') == 'PATIENT':
            patient_profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if patient_profile:
                profile_data = {
                    'date_of_birth': patient_profile.date_of_birth.isoformat() if patient_profile.date_of_birth else None,
                    'medical_history': patient_profile.medical_history,
                    'emergency_contact': patient_profile.emergency_contact,
                    'preferred_language': patient_profile.preferred_language,
                    'timezone': patient_profile.timezone,
                    'phone': patient_profile.phone,
                    'address': patient_profile.address,
                    'isComplete': bool(patient_profile.date_of_birth and patient_profile.phone and patient_profile.emergency_contact)
                }
        elif data.get('role') == 'THERAPIST':
            therapist_profile = TherapistProfile.query.filter_by(user_id=user.id).first()
            if therapist_profile:
                profile_data = {
                    'license_number': therapist_profile.license_number,
                    'specializations': therapist_profile.specializations,
                    'languages': therapist_profile.languages,
                    'experience': therapist_profile.experience,
                    'education': therapist_profile.education,
                    'bio': therapist_profile.bio,
                    'is_approved': therapist_profile.is_approved,
                    'timezone': therapist_profile.timezone,
                    'accepts_emergency': therapist_profile.accepts_emergency,
                    'isComplete': bool(therapist_profile.license_number and therapist_profile.bio and therapist_profile.specializations)
                }

        create_audit_log('REGISTER', user.id, user.email, 'AUTH', status='SUCCESS')
        logging.info(f'Registration successful for {user.email}')
        logger.debug("=== REGISTER ROUTE COMPLETED SUCCESSFULLY ===")
        return jsonify({
            'access_token': access_token, 
            'refresh_token': refresh_token, 
            'user': {
                'id': user.id, 
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_verified': user.is_verified,
                'profile': profile_data
            }
        })
    
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

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    '''
    Get current user information based on JWT token.
    This endpoint validates the token and returns user data.
    '''
    logging.debug('Get current user attempt')
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            logging.warning(f'Get current user failed: User not found or inactive (ID: {current_user_id})')
            return jsonify({'error': 'User not found or inactive'}), 404
        
        # Get user profile data based on role
        profile_data = None
        if user.role == 'PATIENT':
            profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if profile:
                profile_data = {
                    'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                    'phone': profile.phone,
                    'address': profile.address,
                    'emergency_contact': profile.emergency_contact,
                    #'emergency_phone': profile.emergency_phone
                }
        elif user.role == 'THERAPIST':
            profile = TherapistProfile.query.filter_by(user_id=user.id).first()
            if profile:
                profile_data = {
                    'license_number': profile.license_number,
                    'specializations': profile.specializations,
                    'bio': profile.bio,
                    'hourly_rate': float(profile.hourly_rate) if profile.hourly_rate else None,
                    'is_approved': profile.is_approved,
                    'accepts_emergency': profile.accepts_emergency
                }
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'profile': profile_data
        }
        
        logging.info(f'Get current user successful for {user.email}')
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        logging.error(f'Get current user failed with exception: {str(e)}')
        return jsonify({'error': 'Invalid or expired token'}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    '''
    Get current user's complete profile information
    '''
    logging.debug('Get profile attempt')
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            logging.warning(f'Get profile failed: User not found or inactive (ID: {current_user_id})')
            return jsonify({'error': 'User not found or inactive'}), 404
        
        # Get detailed profile data based on role
        profile_data = None
        if user.role == 'PATIENT':
            profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if profile:
                profile_data = {
                    'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                    'medical_history': profile.medical_history,
                    'emergency_contact': profile.emergency_contact,
                    #'emergency_phone': profile.emergency_phone,
                    'address': profile.address,
                    'preferred_language': profile.preferred_language,
                    'timezone': profile.timezone
                }
        elif user.role == 'THERAPIST':
            profile = TherapistProfile.query.filter_by(user_id=user.id).first()
            if profile:
                profile_data = {
                    'license_number': profile.license_number,
                    'specializations': profile.specializations,
                    'languages': profile.languages,
                    'experience': profile.experience,
                    'education': profile.education,
                    'bio': profile.bio,
                    #'hourly_rate': float(profile.hourly_rate) if profile.hourly_rate else None,
                    'is_approved': profile.is_approved,
                    'approved_at': profile.approved_at.isoformat() if profile.approved_at else None,
                    'timezone': profile.timezone,
                    'accepts_emergency': profile.accepts_emergency
                }
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'gender': user.gender,
            'role': user.role,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'profile': profile_data
        }
        
        logging.info(f'Get profile successful for {user.email}')
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        logging.error(f'Get profile failed with exception: {str(e)}')
        return jsonify({'error': 'Failed to retrieve profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    '''
    Update current user's profile information
    '''
    logging.debug('Update profile attempt')
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            logging.warning(f'Update profile failed: User not found or inactive (ID: {current_user_id})')
            return jsonify({'error': 'User not found or inactive'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update basic user information
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'gender' in data:
            user.gender = data['gender']
        
        # Update role-specific profile
        if user.role == 'PATIENT':
            profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if not profile:
                profile = PatientProfile(user_id=user.id)
                db.session.add(profile)
            
            if 'date_of_birth' in data:
                from datetime import datetime
                if data['date_of_birth']:
                    profile.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            if 'medical_history' in data:
                profile.medical_history = data['medical_history']
            if 'emergency_contact' in data:
                profile.emergency_contact = data['emergency_contact']
            if 'emergency_phone' in data:
                profile.emergency_phone = data['emergency_phone']
            if 'address' in data:
                profile.address = data['address']
            if 'preferred_language' in data:
                profile.preferred_language = data['preferred_language']
            if 'timezone' in data:
                profile.timezone = data['timezone']
                
        elif user.role == 'THERAPIST':
            profile = TherapistProfile.query.filter_by(user_id=user.id).first()
            if not profile:
                profile = TherapistProfile(user_id=user.id)
                db.session.add(profile)
            
            if 'license_number' in data:
                profile.license_number = data['license_number']
            if 'specializations' in data:
                profile.specializations = data['specializations']
            if 'languages' in data:
                profile.languages = data['languages']
            if 'experience' in data:
                profile.experience = data['experience']
            if 'education' in data:
                profile.education = data['education']
            if 'bio' in data:
                profile.bio = data['bio']
            if 'hourly_rate' in data:
                profile.hourly_rate = data['hourly_rate']
            if 'timezone' in data:
                profile.timezone = data['timezone']
            if 'accepts_emergency' in data:
                profile.accepts_emergency = data['accepts_emergency']
        
        db.session.commit()
        
        logging.info(f'Profile updated successfully for {user.email}')
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Update profile failed with exception: {str(e)}')
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    '''
    Verify JWT token validity without fetching full user data.
    This is a lightweight endpoint for token validation.
    '''
    try:
        current_user_id = get_jwt_identity()
        
        # Just check if user exists and is active without fetching full profile
        user = User.query.filter_by(id=current_user_id, is_active=True).first()
        
        if not user:
            logging.warning(f'Token verification failed: User not found or inactive (ID: {current_user_id})')
            return jsonify({'error': 'User not found or inactive'}), 404
        
        logging.debug(f'Token verification successful for user ID: {current_user_id}')
        return jsonify({
            'success': True,
            'message': 'Token is valid',
            'user_id': user.id,
            'email': user.email,
            'role': user.role
        }), 200
        
    except Exception as e:
        logging.error(f'Token verification failed with exception: {str(e)}')
        return jsonify({'error': 'Invalid or expired token'}), 401

@auth_bp.route('/profile-status', methods=['GET'])
@jwt_required()
def get_profile_status():
    '''
    Check if user has completed their profile setup
    '''
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        profile_complete = False
        profile_data = None
        
        if user.role == 'PATIENT':
            profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if profile:
                # Check if essential fields are filled
                profile_complete = bool(
                    profile.date_of_birth or 
                    profile.phone or 
                    profile.emergency_contact
                )
                profile_data = {
                    'has_basic_info': bool(profile.date_of_birth and profile.phone),
                    'has_emergency_contact': bool(profile.emergency_contact),
                    'completion_percentage': 0
                }
                
                # Calculate completion percentage
                fields = [
                    profile.date_of_birth, profile.phone, profile.address,
                    profile.emergency_contact, profile.medical_history,
                    profile.preferred_language, profile.timezone
                ]
                filled_fields = sum(1 for field in fields if field)
                profile_data['completion_percentage'] = int((filled_fields / len(fields)) * 100)
                
        elif user.role == 'THERAPIST':
            profile = TherapistProfile.query.filter_by(user_id=user.id).first()
            if profile:
                # Check if essential fields are filled
                profile_complete = bool(
                    profile.license_number and 
                    profile.specializations and 
                    profile.bio
                )
                profile_data = {
                    'has_license': bool(profile.license_number),
                    'has_specializations': bool(profile.specializations),
                    'has_bio': bool(profile.bio),
                    'is_approved': profile.is_approved,
                    'completion_percentage': 0
                }
                
                # Calculate completion percentage
                fields = [
                    profile.license_number, profile.specializations, profile.languages,
                    profile.experience, profile.education, profile.bio, profile.timezone
                ]
                filled_fields = sum(1 for field in fields if field)
                profile_data['completion_percentage'] = int((filled_fields / len(fields)) * 100)
        
        return jsonify({
            'success': True,
            'profile_complete': profile_complete,
            'profile_data': profile_data,
            'user_role': user.role
        }), 200
        
    except Exception as e:
        logging.error(f'Get profile status failed with exception: {str(e)}')
        return jsonify({'error': 'Failed to get profile status'}), 500
