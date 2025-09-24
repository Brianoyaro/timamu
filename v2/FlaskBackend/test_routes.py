"""
Health check and test routes for the Flask backend
"""
from flask import Blueprint, jsonify

# Create blueprint for test routes
test_bp = Blueprint('test', __name__)

@test_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask backend is running',
        'service': 'Timamu Flask Backend'
    }), 200

@test_bp.route('/api/test', methods=['GET'])
def api_test():
    """API test endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'API is working correctly',
        'endpoints': [
            '/api/auth/*',
            '/api/admin/*',
            '/api/therapists/*',
            '/api/patients/*',
            '/api/sessions/*',
            '/api/files/*',
            '/api/messages/*'
        ]
    }), 200