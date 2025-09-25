#!/bin/bash
# Render startup script for Flask backend

# Install dependencies (Render does this automatically, but just in case)
pip install -r requirements.txt

# Run database migrations (if you have a database)
# flask db upgrade

# Start the application with Gunicorn using gevent worker
gunicorn --worker-class gevent -w 1 --worker-connections 1000 --bind 0.0.0.0:${PORT:-5000} app:app