#!/usr/bin/env python3
"""
Flask application entry point for deployment.
This file is used by hosting platforms like Render to start the application.
"""

import os
import sys

# # Add the current directory to Python path
# sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from App import create_app

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # For local development
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)