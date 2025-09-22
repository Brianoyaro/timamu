from flask import request, jsonify, Blueprint
from .. import db, bcrypt
import jwt
from flask import current_app
from datetime import datetime, timedelta
from ..utils.email_utils import send_welcome_email, send_forgot_password_email

auth_bp = Blueprint('auth', __name__)
from ..models import RefreshToken, TherapistProfile, User, PatientProfile

def generate_jwt(user, exp_duration=10):
    '''Generate JWT token for a user.
    exp_duration: expiration duration in minutes (default 10 minutes)
    '''
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(minutes=exp_duration)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token

@auth_bp.route('/login', methods=['POST'])
def login():
    '''
    Authenticate user and return JWT tokens.
    Expected JSON payload:
    {
        "email": "<user_email>",
        "password": "<user_password>"
    }
    '''

    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    # If user not found or password does not match
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = generate_jwt(user)
        # check if there's an existing valid refresh token
        existing_token = RefreshToken.query.filter_by(user_id=user.id, revoked=False).first()
        if not existing_token:
            refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token
            # Store refresh token in database
            new_refresh_token = RefreshToken(user_id=user.id, refresh_token=refresh_token)
            db.session.add(new_refresh_token)
            db.session.commit()
    return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': {'id': user.id, 'email': user.email, 'role': user.role}})

@auth_bp.route('/register', methods=['POST'])
def register():
    '''
    Register a new user and create role-specific profiles.
    Expected JSON payload:
    {
        "email": "<user_email>",
        "password": "<user_password>",
        "firstName": "<user_first_name>",
        "lastName": "<user_last_name>",
        "role": "<user_role>"
    }
    '''
    
    data = request.json
    # check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(email=data['email'], password=hashed_pw, first_name=data.get('firstName'), last_name=data.get('lastName'), role=data.get('role', 'PATIENT'))
    
    # handle role-specific profile creation
    if 'role' in data and data['role'] not in ['PATIENT', 'THERAPIST', 'ADMIN']:
        return jsonify({'error': 'Invalid role specified'}), 400
    
    if data.get('role') == 'PATIENT':
        user.is_verified = True  # Patients are auto-verified

        patient_profile = PatientProfile(user_id=user.id, medical_history=data.get('medicalHistory', ''), emergency_contact=data.get('emergencyContact', ''), preferred_language=data.get('preferredLanguage', 'English'), timezone=data.get('timezone', 'UTC'))
        db.session.add(patient_profile)
    
    elif data.get('role') == 'THERAPIST':
        # We'll receive these additional fields when we display a modal after login in the frontend where they can complete their profile or skip and fill later
        therapist_profile = TherapistProfile(user_id=user.id, license_number=data.get('licenseNumber', ''), specializations=data.get('specializations', []), languages=data.get('languages', []), experience=data.get('experience', 0), education=data.get('education', ''), bio=data.get('bio', ''), is_approved=False, availability=data.get('availability', {}), timezone=data.get('timezone', 'UTC'), accepts_emergency=data.get('acceptsEmergency', False))
        db.session.add(therapist_profile)

    db.session.add(user)
    db.session.commit()
    
    # Send welcome email
    send_welcome_email(user.email, user.first_name or "")

    # generate JWT
    access_token = generate_jwt(user) # 10 minutes expiration for access token
    refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token
    # Store refresh token in database
    new_refresh_token = RefreshToken(user_id=user.id, refresh_token=refresh_token)
    db.session.add(new_refresh_token)
    
    db.session.commit()

    '''TODO:
     - send verification email with a token link (not implemented yet)
    '''
    
    return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': {'id': user.id, 'email': user.email, 'role': user.role}})

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    '''
    Refresh JWT token using a valid refresh token.
    Expected JSON payload:
    {
        "refresh_token": "<refresh_token>"
    }
    '''
    data = request.json
    token = data.get('refresh_token')
    if not token:
        return jsonify({'error': 'Refresh token is missing'}), 400
    
    # check if the token is in database and not revoked (if implementing token revocation)
    token_entry = RefreshToken.query.filter_by(refresh_token=token, revoked=False).first()
    if not token_entry:
        return jsonify({'error': 'Invalid or revoked refresh token'}), 401
    
    # decode and verify the token
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        new_access_token = generate_jwt(user)
        new_refresh_token = generate_jwt(user, exp_duration=7*24*60)  # 7 days expiration for refresh token
        return jsonify({'access_token': new_access_token, 'refresh_token': new_refresh_token})
    
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Refresh token has expired'}), 401
    except jwt.InvalidTokenError:
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
    data = request.json
    token = data.get('refresh_token')
    if not token:
        return jsonify({'error': 'Refresh token is missing'}), 400
    
    # find the token in database and mark it as revoked
    token_entry = RefreshToken.query.filter_by(refresh_token=token, revoked=False).first()
    if token_entry:
        token_entry.revoked = True
        db.session.commit()
        return jsonify({'message': 'Logged out successfully'}), 200
    else:
        return jsonify({'error': 'Invalid or already revoked refresh token'}), 400
    return jsonify({'error': 'An error occurred during logout'}), 500

# Forgot password and reset password routes
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    '''
    Handle forgot password requests.
    Expected JSON payload:
    {
        "email": "<user_email>"
    }
    '''
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'Email not found'}), 404

    # Generate a password reset token
    reset_token = generate_jwt(user, exp_duration=15*60)  # 15 minutes expiration
    reset_link = f"https://yourdomain.com/reset-password?token={reset_token}" # Replace with your frontend URL!!!!
    send_forgot_password_email(user.email, reset_link)
    return jsonify({'message': 'Password reset email sent'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    '''
    Reset user password using a valid reset token.
    Expected JSON payload:
    {
        "reset_token": "<reset_token>",
        "new_password": "<new_password>"
    }
    '''
    data = request.json
    token = data.get('reset_token')
    new_password = data.get('new_password')
    if not token or not new_password:
        return jsonify({'error': 'Reset token and new password are required'}), 400
    
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update the user's password
        hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password = hashed_pw
        db.session.commit()
        
        return jsonify({'message': 'Password has been reset successfully'}), 200
    
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Reset token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid reset token'}), 401
    

# Google OAuth2 login route