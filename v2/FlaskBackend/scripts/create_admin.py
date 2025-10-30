#!/usr/bin/env python3
import sys
import os
import argparse
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from App.extensions import db, bcrypt
from App.models import User, AdminProfile
from App import create_app

def create_admin_user(email, password, first_name=None, last_name=None, phone=None):
    """Create an admin user with the given details"""
    try:
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"Error: User with email {email} already exists")
            return False

        # Create the user
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(
            email=email,
            password=hashed_pw,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role='admin',
            is_active=True,
            is_verified=True
        )
        db.session.add(user)
        db.session.flush()  # Get the user ID without committing

        # Create admin profile
        admin_profile = AdminProfile(
            user_id=user.id,
            level='super_admin',  # You might want to make this configurable
            permissions={"full_access": True}  # Default full access for super admin
        )
        db.session.add(admin_profile)
        
        # Commit both user and profile
        db.session.commit()
        
        print(f"Successfully created admin user: {email}")
        return True

    except Exception as e:
        db.session.rollback()
        print(f"Error creating admin user: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Create an admin user for Timamu')
    parser.add_argument('--email', required=True, help='Admin user email')
    parser.add_argument('--password', required=True, help='Admin user password')
    parser.add_argument('--first-name', help='First name')
    parser.add_argument('--last-name', help='Last name')
    parser.add_argument('--phone', help='Phone number')

    args = parser.parse_args()

    # Initialize Flask app context
    app = create_app()
    with app.app_context():
        success = create_admin_user(
            email=args.email,
            password=args.password,
            first_name=args.first_name,
            last_name=args.last_name,
            phone=args.phone
        )
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()