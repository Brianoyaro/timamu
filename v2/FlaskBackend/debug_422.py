import requests
import json
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key'  # Use your actual secret key
jwt = JWTManager(app)

def test_therapist_availability_endpoint():
    """Test the therapist availability endpoint with detailed error handling"""
    
    # Create a test token
    with app.app_context():
        # Use the therapist ID found in previous tests (change if needed)
        test_therapist_id = 5
        access_token = create_access_token(identity=test_therapist_id)
    
    base_url = "http://localhost:5000/api"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n1. Testing GET /therapists/availability")
    try:
        get_response = requests.get(
            f"{base_url}/therapists/availability", 
            headers=headers,
            timeout=10
        )
        print(f"Status: {get_response.status_code}")
        if get_response.status_code == 200:
            print(f"Current availability: {json.dumps(get_response.json(), indent=2)}")
        else:
            print(f"Error response: {get_response.text}")
            print(f"Headers: {dict(get_response.headers)}")
    except Exception as e:
        print(f"GET request failed with error: {str(e)}")
    
    print(f"\n2. Testing POST /therapists/availability with different payload formats")
    
    # Test payloads
    test_cases = [
        {
            "name": "Basic availability",
            "payload": {
                "availability": {
                    "Monday": [
                        {"start": "09:00", "end": "12:00"}
                    ]
                }
            }
        },
        {
            "name": "Multiple days and times",
            "payload": {
                "availability": {
                    "Monday": [
                        {"start": "09:00", "end": "12:00"},
                        {"start": "14:00", "end": "17:00"}
                    ],
                    "Wednesday": [
                        {"start": "10:00", "end": "15:00"}
                    ]
                }
            }
        },
        {
            "name": "With timezone",
            "payload": {
                "availability": {
                    "Monday": [
                        {"start": "09:00", "end": "12:00"}
                    ]
                },
                "timezone": "America/New_York"
            }
        },
        {
            "name": "Empty availability",
            "payload": {
                "availability": {}
            }
        },
        {
            "name": "Specific date format",
            "payload": {
                "availability": {
                    "2025-10-15": [
                        {"start": "09:00", "end": "12:00"}
                    ]
                }
            }
        }
    ]
    
    for case in test_cases:
        print(f"\nTest case: {case['name']}")
        print(f"Payload: {json.dumps(case['payload'], indent=2)}")
        
        try:
            post_response = requests.post(
                f"{base_url}/therapists/availability", 
                headers=headers,
                json=case['payload'],
                timeout=10
            )
            print(f"Status: {post_response.status_code}")
            
            if post_response.status_code == 200:
                print(f"Success response: {json.dumps(post_response.json(), indent=2)}")
            else:
                print(f"Error response: {post_response.text}")
                print(f"Headers: {dict(post_response.headers)}")
                
                # Detailed debug for 422 error
                if post_response.status_code == 422:
                    print("\n422 ERROR DETAILS:")
                    print(f"Request URL: {post_response.request.url}")
                    print(f"Request method: {post_response.request.method}")
                    print(f"Request headers: {dict(post_response.request.headers)}")
                    print(f"Request body: {post_response.request.body.decode('utf-8')}")
                    print(f"Response headers: {dict(post_response.headers)}")
        except Exception as e:
            print(f"POST request failed with error: {str(e)}")
    
    print("\nTesting complete")

if __name__ == "__main__":
    # Start Flask app in background
    import subprocess
    import time
    import signal
    
    print("Starting Flask app in the background...")
    flask_process = subprocess.Popen(["python", "app.py"])
    
    try:
        # Wait for Flask to start
        print("Waiting for Flask to start...")
        time.sleep(5)
        test_therapist_availability_endpoint()
    finally:
        # Kill the Flask app
        print("\nShutting down Flask app...")
        flask_process.terminate()
        flask_process.wait()
