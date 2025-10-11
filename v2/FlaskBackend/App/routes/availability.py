from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, TherapistProfile, TherapistAvailability, TherapistUnavailability
from ..utils.audit_utils import log_action
from datetime import datetime, time, timedelta
import json

'''
# WE'RE NOT USING THESE YET, BUT THEY WILL BE USEFUL LATER WHEN WE SWITCH FROM 
/api/therapists/availability (GET/POST) - for therapist availability management
/api/sessions/available-therapists (GET) - for patient booking
to
/api/availability/therapist/<int:therapist_id> (GET) - for therapist availability management
/api/availability/my-availability (GET/POST) - for therapist to manage their own availability
/api/availability/unavailable (POST) - to add unavailable periods
/api/availability/unavailable/<int:period_id> (DELETE) - to remove unavailable periods
/api/availability/available-slots/<int:therapist_id> (GET) - for patient booking
'''

availability_bp = Blueprint('availability', __name__, url_prefix='/api/availability')

@availability_bp.route('/therapist/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_therapist_availability(therapist_id):
    """Get availability for a specific therapist"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get therapist profile
        therapist = User.query.filter_by(id=therapist_id, role='therapist').first()
        if not therapist or not therapist.therapist_profile:
            return jsonify({'error': 'Therapist not found'}), 404
        
        # Get availability slots
        availability_slots = TherapistAvailability.query.filter_by(
            therapist_profile_id=therapist.therapist_profile.id
        ).order_by(TherapistAvailability.day_of_week, TherapistAvailability.start_time).all()
        
        # Get unavailability periods (for the next 30 days)
        end_date = datetime.now() + timedelta(days=30)
        unavailability_periods = TherapistUnavailability.query.filter(
            TherapistUnavailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistUnavailability.start_datetime >= datetime.now(),
            TherapistUnavailability.start_datetime <= end_date
        ).all()
        
        # Format availability data
        availability_data = {
            'therapist_id': therapist_id,
            'timezone': therapist.therapist_profile.timezone,
            'weekly_schedule': [],
            'unavailable_periods': []
        }
        
        # Group by day of week
        for slot in availability_slots:
            availability_data['weekly_schedule'].append({
                'id': slot.id,
                'day_of_week': slot.day_of_week,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'is_available': slot.is_available,
                'timezone': slot.timezone
            })
        
        # Add unavailability periods
        for period in unavailability_periods:
            availability_data['unavailable_periods'].append({
                'id': period.id,
                'start_datetime': period.start_datetime.isoformat(),
                'end_datetime': period.end_datetime.isoformat(),
                'reason': period.reason,
                'is_recurring': period.is_recurring
            })
        
        log_action(current_user_id, 'view_availability', 'therapist', therapist_id, 'success')
        return jsonify(availability_data), 200
        
    except Exception as e:
        log_action(current_user_id, 'view_availability', 'therapist', therapist_id, 'error', str(e))
        return jsonify({'error': 'Failed to retrieve availability'}), 500

@availability_bp.route('/my-availability', methods=['GET'])
@jwt_required()
def get_my_availability():
    """Get current therapist's availability"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'therapist' or not user.therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        return get_therapist_availability(current_user_id)
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve availability'}), 500

@availability_bp.route('/my-availability', methods=['POST'])
@jwt_required()
def update_my_availability():
    """Update current therapist's availability"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'therapist' or not user.therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        data = request.get_json()
        weekly_schedule = data.get('weekly_schedule', [])
        timezone = data.get('timezone', 'UTC')
        
        # Update therapist timezone
        user.therapist_profile.timezone = timezone
        
        # Delete existing availability slots
        TherapistAvailability.query.filter_by(
            therapist_profile_id=user.therapist_profile.id
        ).delete()
        
        # Create new availability slots
        for slot_data in weekly_schedule:
            try:
                start_time = time.fromisoformat(slot_data['start_time'])
                end_time = time.fromisoformat(slot_data['end_time'])
                
                availability_slot = TherapistAvailability(
                    therapist_profile_id=user.therapist_profile.id,
                    day_of_week=slot_data['day_of_week'],
                    start_time=start_time,
                    end_time=end_time,
                    is_available=slot_data.get('is_available', True),
                    timezone=timezone
                )
                
                db.session.add(availability_slot)
                
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Invalid time format in slot: {e}'}), 400
        
        db.session.commit()
        
        log_action(current_user_id, 'update_availability', 'therapist_profile', user.therapist_profile.id, 'success')
        return jsonify({'message': 'Availability updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        log_action(current_user_id, 'update_availability', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to update availability'}), 500

@availability_bp.route('/unavailable', methods=['POST'])
@jwt_required()
def add_unavailable_period():
    """Add an unavailable period for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'therapist' or not user.therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        data = request.get_json()
        
        # Parse datetime strings
        start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        
        if start_datetime >= end_datetime:
            return jsonify({'error': 'Start time must be before end time'}), 400
        
        unavailable_period = TherapistUnavailability(
            therapist_profile_id=user.therapist_profile.id,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            reason=data.get('reason', 'Not specified'),
            is_recurring=data.get('is_recurring', False),
            recurrence_pattern=data.get('recurrence_pattern')
        )
        
        db.session.add(unavailable_period)
        db.session.commit()
        
        log_action(current_user_id, 'add_unavailable_period', 'therapist_profile', user.therapist_profile.id, 'success')
        return jsonify({
            'message': 'Unavailable period added successfully',
            'id': unavailable_period.id
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid datetime format: {e}'}), 400
    except Exception as e:
        db.session.rollback()
        log_action(current_user_id, 'add_unavailable_period', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to add unavailable period'}), 500

@availability_bp.route('/unavailable/<int:period_id>', methods=['DELETE'])
@jwt_required()
def remove_unavailable_period(period_id):
    """Remove an unavailable period"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'therapist' or not user.therapist_profile:
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        # Find the unavailable period
        period = TherapistUnavailability.query.filter_by(
            id=period_id,
            therapist_profile_id=user.therapist_profile.id
        ).first()
        
        if not period:
            return jsonify({'error': 'Unavailable period not found'}), 404
        
        db.session.delete(period)
        db.session.commit()
        
        log_action(current_user_id, 'remove_unavailable_period', 'therapist_profile', user.therapist_profile.id, 'success')
        return jsonify({'message': 'Unavailable period removed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        log_action(current_user_id, 'remove_unavailable_period', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to remove unavailable period'}), 500

@availability_bp.route('/available-slots/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_available_slots(therapist_id):
    """Get available time slots for a therapist for booking"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        duration = int(request.args.get('duration', 60))  # Default 60 minutes
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date are required'}), 400
        
        # Parse dates
        start_date = datetime.fromisoformat(start_date).date()
        end_date = datetime.fromisoformat(end_date).date()
        
        # Get therapist profile
        therapist = User.query.filter_by(id=therapist_id, role='therapist').first()
        if not therapist or not therapist.therapist_profile:
            return jsonify({'error': 'Therapist not found'}), 404
        
        # Get availability slots
        availability_slots = TherapistAvailability.query.filter_by(
            therapist_profile_id=therapist.therapist_profile.id,
            is_available=True
        ).all()
        
        # Get existing sessions (booked slots)
        from ..models import Session
        existing_sessions = Session.query.filter(
            Session.therapist_id == therapist_id,
            Session.scheduled_at >= datetime.combine(start_date, time.min),
            Session.scheduled_at <= datetime.combine(end_date, time.max),
            Session.status.in_(['scheduled', 'started'])
        ).all()
        
        # Get unavailable periods
        unavailable_periods = TherapistUnavailability.query.filter(
            TherapistUnavailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistUnavailability.start_datetime <= datetime.combine(end_date, time.max),
            TherapistUnavailability.end_datetime >= datetime.combine(start_date, time.min)
        ).all()
        
        # Generate available slots
        available_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
            
            # Find availability for this day
            day_availability = [slot for slot in availability_slots if slot.day_of_week == day_of_week]
            
            for availability in day_availability:
                # Generate time slots for this availability window
                current_time = datetime.combine(current_date, availability.start_time)
                end_time = datetime.combine(current_date, availability.end_time)
                
                while current_time + timedelta(minutes=duration) <= end_time:
                    slot_end = current_time + timedelta(minutes=duration)
                    
                    # Check if this slot conflicts with existing sessions
                    is_booked = any(
                        session.scheduled_at <= current_time < session.scheduled_at + timedelta(minutes=session.duration or 60)
                        for session in existing_sessions
                    )
                    
                    # Check if this slot conflicts with unavailable periods
                    is_unavailable = any(
                        period.start_datetime <= current_time < period.end_datetime
                        for period in unavailable_periods
                    )
                    
                    if not is_booked and not is_unavailable:
                        available_slots.append({
                            'start_time': current_time.isoformat(),
                            'end_time': slot_end.isoformat(),
                            'duration': duration
                        })
                    
                    # Move to next slot (assuming 30-minute intervals)
                    current_time += timedelta(minutes=30)
            
            current_date += timedelta(days=1)
        
        log_action(current_user_id, 'view_available_slots', 'therapist', therapist_id, 'success')
        return jsonify({
            'therapist_id': therapist_id,
            'available_slots': available_slots,
            'timezone': therapist.therapist_profile.timezone
        }), 200
        
    except Exception as e:
        log_action(current_user_id, 'view_available_slots', 'therapist', therapist_id, 'error', str(e))
        return jsonify({'error': 'Failed to retrieve available slots'}), 500