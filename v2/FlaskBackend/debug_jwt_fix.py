from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
import json
import os

# Get the actual JWT secret key from the app's configuration
from App import create_app

app = create_app()
app_jwt_secret = app.config['JWT_SECRET_KEY']
print(f"App JWT secret key: {app_jwt_secret}")

# Create a simple Flask app just for testing
test_app = Flask(__name__)
test_app.config['JWT_SECRET_KEY'] = app_jwt_secret
jwt = JWTManager(test_app)

# Create a valid JWT token with the correct secret
with test_app.app_context():
    # Use a test user ID (change if needed)
    test_user_id = 5
    access_token = create_access_token(identity=test_user_id)
    print(f"\nToken for testing: {access_token}")

    # Print a curl command to test the API
    print("\nTest command to verify token works:")
    print(f"curl -H 'Authorization: Bearer {access_token}' http://localhost:5000/api/therapists/availability")

    # Write the token to a file for easy access
    with open('test_token.txt', 'w') as f:
        f.write(access_token)
    print("\nToken saved to test_token.txt")
