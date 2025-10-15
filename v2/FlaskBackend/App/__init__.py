from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import db, migrate, bcrypt, mail, oauth, jwt

# App factory
def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    CORS(app)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)  # Initialize Flask-JWT-Extended
    mail.init_app(app)  # Initialize Flask-Mail
    oauth.init_app(app)  # Initialize Authlib OAuth
    
    # Configure OAuth providers
    oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        server_metadata_url=app.config['GOOGLE_DISCOVERY_URL'],
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    
    # Initialize SocketIO event handlers
    # Removed: Socket.io functionality no longer needed

    # Register blueprints
    from .auth import auth_bp
    from .admin import admin_bp
    from .therapists import therapists_bp
    from .patients import patients_bp
    from .sessions import sessions_bp
    from .files import files_bp
    from .messages import messages_bp
    from .dashboard import dashboard_bp
    # from .test_routes import test_bp
    from .routes.availability import availability_bp # WE'RE NOT USING THESE YET, BUT THEY WILL BE USEFUL LATER
    
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("Registering blueprints...")
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    logger.debug(f"Auth blueprint registered with prefix: /api/auth")
    logger.debug(f"Auth blueprint rules: {[rule.rule for rule in app.url_map.iter_rules() if rule.endpoint.startswith('auth')]}")
    
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(therapists_bp, url_prefix='/api/therapists')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(files_bp, url_prefix='/api/files')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(availability_bp)  # Availability routes
    # app.register_blueprint(test_bp)  # Test routes at root level
    
    logger.info("All blueprints registered successfully")
    logger.debug(f"All registered routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    
    # Add a simple health check route
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Flask app is running'})
    
    @app.route('/debug-routes')
    def debug_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'rule': rule.rule
            })
        return jsonify(routes)
    
    logger.info("Health check and debug routes added")

    return app
