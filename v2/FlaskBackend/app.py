#!/usr/bin/env python3
"""
Flask application entry point for deployment.
This file is used by hosting platforms like Render to start the application.
"""

import os
import sys

# # Add the current directory to Python path
# sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# from __init__ import create_app
# from sockets.socket_handler import socketio
from App import create_app
from App.extensions import socketio

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # For local development
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    # Run with SocketIO support - use threading for development
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=True  # Needed for socketio in development
    )
else:
    # For production deployment (Gunicorn, etc.)
    # The app object is what's imported by the WSGI server
    pass