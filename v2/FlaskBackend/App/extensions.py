"""
Flask extensions initialization.
This module contains all Flask extensions to avoid circular imports.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_mail import Mail
from authlib.integrations.flask_client import OAuth

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='threading',  # Use threading for development
    logger=True,
    engineio_logger=True
)
mail = Mail()
oauth = OAuth()