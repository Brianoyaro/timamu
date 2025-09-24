from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from .utils.email_utils import init_mail
from .sockets.socket_handler import init_socketio, socketio
from .auth.routes import init_oauth

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()

# App factory
def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    init_mail(app)  # Initialize Flask-Mail
    init_socketio(app)  # Initialize Flask-SocketIO
    init_oauth(app)  # Initialize Authlib OAuth

    # Register blueprints
    from .auth import auth_bp
    from .admin import admin_bp
    from .therapists import therapists_bp
    from .patients import patients_bp
    from .sessions import sessions_bp
    from .files import files_bp
    from .messages import messages_bp
    from .test_routes import test_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(therapists_bp, url_prefix='/api/therapists')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(files_bp, url_prefix='/api/files')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(test_bp)  # Test routes at root level

    return app
