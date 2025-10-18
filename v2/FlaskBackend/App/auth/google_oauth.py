from flask import Blueprint, request, url_for, jsonify, redirect, current_app, session as flask_session
from flask_jwt_extended import create_access_token, create_refresh_token
from authlib.integrations.flask_client import OAuth
from ..models import User, db
from datetime import datetime, timedelta
import os
import uuid

google_bp = Blueprint('google', __name__)

# Initialize OAuth
oauth = OAuth()

# Register Google OAuth provider
def init_google_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    return oauth

# Google Login route
@google_bp.route('/login', methods=['GET'])
def login():
    # Generate a random state to prevent CSRF attacks
    state = str(uuid.uuid4())
    flask_session['oauth_state'] = state
    
    redirect_uri = url_for('google.authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri, state=state)

# Google Authorization callback
@google_bp.route('/authorize', methods=['GET'])
def authorize():
    try:
        # Verify state to prevent CSRF
        request_state = request.args.get('state')
        session_state = flask_session.pop('oauth_state', None)
        
        if not request_state or request_state != session_state:
            return jsonify(error="Invalid state parameter"), 400
        
        # Get token
        token = oauth.google.authorize_access_token()
        user_info = oauth.google.parse_id_token(token)
        
        # Extract user data
        google_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name')
        first_name = user_info.get('given_name')
        last_name = user_info.get('family_name')
        picture = user_info.get('picture')
        
        # Check if user exists in the database
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create a new user
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role='patient',  # Default role
                profile_image=picture,
                google_id=google_id,
                password_hash=None,  # No password for OAuth users
                email_verified=True,  # Google already verified the email
                created_at=datetime.utcnow()
            )
            db.session.add(new_user)
            db.session.commit()
            user = new_user
        elif not user.google_id:
            # Link existing account with Google
            user.google_id = google_id
            user.email_verified = True
            if picture and not user.profile_image:
                user.profile_image = picture
            db.session.commit()
        
        # Create JWT tokens for authentication
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Create successful login response
        response_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'profile_image': user.profile_image
            }
        }
        
        # Determine the frontend URL for redirect
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        redirect_url = f"{frontend_url}/oauth-callback?data={access_token}&refresh={refresh_token}"
        
        return redirect(redirect_url)
    
    except Exception as e:
        current_app.logger.error(f"Google OAuth error: {str(e)}")
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        error_redirect = f"{frontend_url}/oauth-callback?error=Authentication failed"
        return redirect(error_redirect)