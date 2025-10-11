#!/usr/bin/env python3
"""
Migration script to move availability data from TherapistProfile.availability (JSON) 
to the new TherapistAvailability model.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions import db
from models import TherapistProfile, TherapistAvailability
from datetime import time
import json

def migrate_availability_data():
    """
    Migrate availability data from JSON field to new TherapistAvailability model
    """
    print("Starting availability data migration...")
    
    # Get all therapist profiles with availability data
    therapist_profiles = TherapistProfile.query.filter(
        TherapistProfile.availability.isnot(None)
    ).all()
    
    print(f"Found {len(therapist_profiles)} therapist profiles with availability data")
    
    for profile in therapist_profiles:
        try:
            availability_data = profile.availability
            if not availability_data or not isinstance(availability_data, dict):
                continue
                
            print(f"Migrating availability for therapist profile ID: {profile.id}")
            
            # Parse the availability data (assuming it's in a format like:
            # {"monday": {"start": "09:00", "end": "17:00", "available": true}, ...}
            day_mapping = {
                'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                'friday': 4, 'saturday': 5, 'sunday': 6
            }
            
            for day_name, day_data in availability_data.items():
                if day_name.lower() in day_mapping and isinstance(day_data, dict):
                    day_of_week = day_mapping[day_name.lower()]
                    
                    # Parse time strings
                    start_time_str = day_data.get('start', '09:00')
                    end_time_str = day_data.get('end', '17:00')
                    is_available = day_data.get('available', True)
                    
                    try:
                        # Convert time strings to time objects
                        start_time = time.fromisoformat(start_time_str)
                        end_time = time.fromisoformat(end_time_str)
                        
                        # Create new availability record
                        availability_slot = TherapistAvailability(
                            therapist_profile_id=profile.id,
                            day_of_week=day_of_week,
                            start_time=start_time,
                            end_time=end_time,
                            is_available=is_available,
                            timezone=profile.timezone or 'UTC'
                        )
                        
                        db.session.add(availability_slot)
                        
                    except ValueError as e:
                        print(f"Error parsing time for {day_name}: {e}")
                        continue
            
            # Clear the old availability JSON field
            profile.availability = None
            
        except Exception as e:
            print(f"Error migrating profile {profile.id}: {e}")
            continue
    
    try:
        db.session.commit()
        print("Migration completed successfully!")
        
        # Verify migration
        total_slots = TherapistAvailability.query.count()
        print(f"Total availability slots created: {total_slots}")
        
    except Exception as e:
        db.session.rollback()
        print(f"Migration failed: {e}")
        raise

def rollback_migration():
    """
    Rollback the migration by moving data back to JSON field
    """
    print("Rolling back availability migration...")
    
    therapist_profiles = TherapistProfile.query.all()
    
    for profile in therapist_profiles:
        availability_slots = TherapistAvailability.query.filter_by(
            therapist_profile_id=profile.id
        ).all()
        
        if availability_slots:
            availability_data = {}
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            
            for slot in availability_slots:
                day_name = day_names[slot.day_of_week]
                availability_data[day_name] = {
                    'start': slot.start_time.strftime('%H:%M'),
                    'end': slot.end_time.strftime('%H:%M'),
                    'available': slot.is_available
                }
            
            profile.availability = availability_data
            
            # Delete the new availability records
            for slot in availability_slots:
                db.session.delete(slot)
    
    try:
        db.session.commit()
        print("Rollback completed successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Rollback failed: {e}")
        raise

if __name__ == "__main__":
    from app import app
    
    with app.app_context():
        if len(sys.argv) > 1 and sys.argv[1] == "rollback":
            rollback_migration()
        else:
            migrate_availability_data()