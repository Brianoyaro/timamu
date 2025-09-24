#!/bin/bash
# Render startup script for Flask backend

# Install dependencies (Render does this automatically, but just in case)
pip install -r requirements.txt

# Run database migrations (if you have a database)
# flask db upgrade

# Start the application with Gunicorn
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app