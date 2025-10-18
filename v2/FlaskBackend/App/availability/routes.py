from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, TherapistProfile, TherapistAvailability, TherapistUnavailability, Session, SessionParticipant
from ..utils.audit_utils import log_action
from datetime import datetime, time, timedelta, date
import json
import logging
import uuid
import secrets
from . import availability_bp

# Configure logging for availability routes
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

"""
Availability Management System Endpoints:
/api/availability/therapist/<int:therapist_id> (GET) - for viewing a therapist's availability
/api/availability/my-availability (GET/POST) - for therapist to manage their own availability
/api/availability/unavailable (POST) - to add unavailable periods
/api/availability/unavailable/<int:period_id> (DELETE) - to remove unavailable periods
/api/availability/available-slots/<int:therapist_id> (GET) - for patient booking
/api/availability/book (POST) - for booking a slot
/api/availability/cancel-booking/<int:session_id> (POST) - for canceling a booked slot
"""

# availability_bp = Blueprint('availability', __name__)

@availability_bp.route('/therapist/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_therapist_availability(therapist_id):
    """Get availability for a specific therapist"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[GET /therapist/{therapist_id}] Retrieving availability for therapist: {therapist_id}")
        
        # Get therapist profile
        therapist = User.query.filter_by(id=therapist_id, role='therapist').first()
        if not therapist or not therapist.therapist_profile:
            logger.warning(f"[GET /therapist/{therapist_id}] Therapist not found")
            return jsonify({'error': 'Therapist not found'}), 404
        
        # Get current date and time
        today = date.today()
        
        # Get availability slots for the next 30 days
        end_date = today + timedelta(days=30)
        
        availability_slots = TherapistAvailability.query.filter(
            TherapistAvailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistAvailability.date >= today,
            TherapistAvailability.date <= end_date
        ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
        
        # Get unavailability periods (for the next 30 days)
        now = datetime.now()
        end_datetime = datetime.combine(end_date, time.max)
        unavailability_periods = TherapistUnavailability.query.filter(
            TherapistUnavailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistUnavailability.start_datetime >= now,
            TherapistUnavailability.start_datetime <= end_datetime
        ).all()
        
        # Format availability data
        availability_data = {
            'therapist_id': therapist_id,
            'timezone': therapist.therapist_profile.timezone,
            'availability': {},
            'unavailable_periods': []
        }
        
        # Group by date
        for slot in availability_slots:
            date_str = slot.date.strftime('%Y-%m-%d')
            
            if date_str not in availability_data['availability']:
                availability_data['availability'][date_str] = []
            
            # Get available and booked slots
            total_slots = slot.get_total_slots()
            available_slots = slot.get_available_slots()
            
            # Format individual slots data
            individual_slots = []
            for i in range(total_slots):
                slot_start_time = (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i)).time()
                slot_end_time = (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i+1)).time()
                
                individual_slots.append({
                    'slot_index': i,
                    'start_time': slot_start_time.strftime('%H:%M'),
                    'end_time': slot_end_time.strftime('%H:%M'),
                    'is_available': i in available_slots
                })
            
            # Add the slot to the date
            availability_data['availability'][date_str].append({
                'id': slot.id,
                'start': slot.start_time.strftime('%H:%M'),
                'end': slot.end_time.strftime('%H:%M'),
                'is_available': slot.is_available,
                'total_slots': total_slots,
                'available_slots': available_slots,
                'booked_slots': slot.booked_slots or [],
                'individual_slots': individual_slots
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
        logger.error(f"[GET /therapist/{therapist_id}] Error retrieving availability: {str(e)}", exc_info=True)
        log_action(current_user_id, 'view_availability', 'therapist', therapist_id, 'error', str(e))
        return jsonify({'error': 'Failed to retrieve availability'}), 500

@availability_bp.route('/my-availability', methods=['GET'])
@jwt_required()
def get_my_availability():
    """Get current therapist's availability"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[GET /my-availability] Retrieving availability for current user: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user or user.role.upper() != 'THERAPIST' or not user.therapist_profile:
            logger.warning(f"[GET /my-availability] User is not a therapist or has no profile: {current_user_id}")
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        return get_therapist_availability(current_user_id)
        
    except Exception as e:
        logger.error(f"[GET /my-availability] Error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to retrieve availability'}), 500

@availability_bp.route('/my-availability', methods=['POST'])
@jwt_required()
def update_my_availability():
    """Update current therapist's availability"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[POST /my-availability] Updating availability for therapist: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user or user.role.upper() != 'THERAPIST' or not user.therapist_profile:
            logger.warning(f"[POST /my-availability] User is not a therapist or has no profile: {current_user_id}")
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        data = request.get_json()
        logger.debug(f"[POST /my-availability] Received data: {data}")
        
        if 'availability' not in data:
            logger.warning("[POST /my-availability] Missing availability data in request")
            return jsonify({'error': 'Availability data is required'}), 400
        
        timezone = data.get('timezone', user.therapist_profile.timezone)
        
        # Store existing booked slots before clearing availability
        existing_slots = TherapistAvailability.query.filter_by(therapist_profile_id=user.therapist_profile.id).all()
        
        # Create a mapping of (date, time_range) -> booked_slots to preserve existing bookings
        existing_bookings = {}
        for existing_slot in existing_slots:
            # Create a key that identifies the time slot by date and time range
            date_key = existing_slot.date.strftime('%Y-%m-%d')
            time_key = f"{existing_slot.start_time.strftime('%H:%M')}-{existing_slot.end_time.strftime('%H:%M')}"
            slot_key = f"{date_key}_{time_key}"
            
            # Store the booked slots for this time range
            if existing_slot.booked_slots:
                existing_bookings[slot_key] = existing_slot.booked_slots.copy()
                logger.debug(f"[POST /my-availability] Preserving booked slots for {slot_key}: {existing_slot.booked_slots}")
        
        logger.debug(f"[POST /my-availability] Preserved {len(existing_bookings)} slots with bookings")
        
        # Clear existing availability slots that have no bookings
        for slot in existing_slots:
            date_key = slot.date.strftime('%Y-%m-%d')
            time_key = f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}"
            slot_key = f"{date_key}_{time_key}"
            
            # If the slot has bookings, keep it for now
            if not slot.booked_slots:
                db.session.delete(slot)
        
        # Parse availability data and create new slots
        availability = data['availability']
        logger.debug(f"[POST /my-availability] Availability data: {availability}")
        
        if not isinstance(availability, dict):
            logger.warning(f"[POST /my-availability] Invalid availability format. Expected dict, got: {type(availability)}")
            return jsonify({'error': 'Availability must be a dictionary with dates as keys'}), 400
        
        try:
            for date_str, day_slots in availability.items():
                # Parse the date string
                try:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    logger.debug(f"[POST /my-availability] Processing date: {date_str}")
                except ValueError:
                    logger.warning(f"[POST /my-availability] Invalid date format: {date_str}")
                    continue
                
                # Handle array of slots for each date
                slots = day_slots if isinstance(day_slots, list) else [day_slots] if day_slots else []
                
                for slot_data in slots:
                    if isinstance(slot_data, dict) and 'start' in slot_data and 'end' in slot_data:
                        try:
                            start_time = datetime.strptime(slot_data['start'], '%H:%M').time()
                            end_time = datetime.strptime(slot_data['end'], '%H:%M').time()
                            is_available = slot_data.get('available', True)
                            
                            # Check if this slot had any existing bookings
                            time_key = f"{start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')}"
                            slot_key = f"{date_str}_{time_key}"
                            preserved_booked_slots = existing_bookings.get(slot_key, [])
                            
                            # Check if slot already exists (to handle case where we kept slots with bookings)
                            existing_slot = TherapistAvailability.query.filter(
                                TherapistAvailability.therapist_profile_id == user.therapist_profile.id,
                                TherapistAvailability.date == date_obj,
                                TherapistAvailability.start_time == start_time,
                                TherapistAvailability.end_time == end_time
                            ).first()
                            
                            if existing_slot:
                                # Update existing slot
                                existing_slot.is_available = is_available
                                existing_slot.timezone = timezone
                            else:
                                # Create new slot
                                availability_slot = TherapistAvailability(
                                    therapist_profile_id=user.therapist_profile.id,
                                    date=date_obj,
                                    start_time=start_time,
                                    end_time=end_time,
                                    is_available=is_available,
                                    booked_slots=preserved_booked_slots,  # Restore preserved bookings
                                    timezone=timezone
                                )
                                
                                db.session.add(availability_slot)
                                logger.debug(f"[POST /my-availability] Created slot for {date_str} from {start_time} to {end_time} with {len(preserved_booked_slots)} booked slots")
                            
                        except ValueError as e:
                            logger.error(f"[POST /my-availability] Error parsing time for {date_str}: {e}")
                            continue
            
            # Update timezone if provided
            prev_timezone = user.therapist_profile.timezone
            user.therapist_profile.timezone = timezone
            logger.debug(f"[POST /my-availability] Updated timezone from {prev_timezone} to {timezone}")
            
            db.session.commit()
            logger.debug("[POST /my-availability] Successfully saved availability to database")
            
            log_action(current_user_id, 'update_availability', 'therapist_profile', user.therapist_profile.id, 'success')
            return jsonify({'message': 'Availability updated successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"[POST /my-availability] Failed to save availability: {str(e)}", exc_info=True)
            log_action(current_user_id, 'update_availability', 'therapist_profile', 
                      user.therapist_profile.id, 'error', str(e))
            return jsonify({'error': f'Failed to update availability: {str(e)}'}), 500
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /my-availability] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'update_availability', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to update availability'}), 500

@availability_bp.route('/unavailable', methods=['POST'])
@jwt_required()
def add_unavailable_period():
    """Add an unavailable period for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[POST /unavailable] Adding unavailable period for therapist: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user or user.role.upper() != 'THERAPIST' or not user.therapist_profile:
            logger.warning(f"[POST /unavailable] User is not a therapist or has no profile: {current_user_id}")
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        data = request.get_json()
        logger.debug(f"[POST /unavailable] Received data: {data}")
        
        if not data.get('start_datetime') or not data.get('end_datetime'):
            logger.warning("[POST /unavailable] Missing start or end datetime")
            return jsonify({'error': 'Start and end datetimes are required'}), 400
        
        # Parse datetime strings
        try:
            start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
            end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        except ValueError as e:
            logger.error(f"[POST /unavailable] Invalid datetime format: {e}")
            return jsonify({'error': f'Invalid datetime format: {e}'}), 400
        
        if start_datetime >= end_datetime:
            logger.warning(f"[POST /unavailable] Start time ({start_datetime}) must be before end time ({end_datetime})")
            return jsonify({'error': 'Start time must be before end time'}), 400
        
        # Check for conflicts with existing sessions
        existing_sessions = Session.query.filter(
            Session.therapist_id == current_user_id,
            Session.scheduled_at < end_datetime,
            Session.scheduled_at + timedelta(minutes=Session.duration) > start_datetime,
            Session.status.in_(['scheduled', 'started'])
        ).all()
        
        if existing_sessions:
            logger.warning(f"[POST /unavailable] Conflict with {len(existing_sessions)} existing sessions")
            session_details = [{
                'id': session.id,
                'scheduled_at': session.scheduled_at.isoformat(),
                'duration': session.duration,
                'status': session.status
            } for session in existing_sessions]
            
            return jsonify({
                'error': 'Unavailable period conflicts with existing sessions',
                'conflicts': session_details
            }), 409
        
        unavailable_period = TherapistUnavailability(
            therapist_profile_id=user.therapist_profile.id,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            reason=data.get('reason', 'Not specified'),
            is_recurring=data.get('is_recurring', False),
            recurrence_pattern=data.get('recurrence_pattern')
        )
        
        db.session.add(unavailable_period)
        
        # Update availability slots to mark overlapping slots as booked
        affected_slots = TherapistAvailability.query.filter(
            TherapistAvailability.therapist_profile_id == user.therapist_profile.id,
            TherapistAvailability.date >= start_datetime.date(),
            TherapistAvailability.date <= end_datetime.date()
        ).all()
        
        for slot in affected_slots:
            slot_start_datetime = datetime.combine(slot.date, slot.start_time)
            slot_end_datetime = datetime.combine(slot.date, slot.end_time)
            
            # If slot overlaps with unavailable period
            if slot_start_datetime < end_datetime and slot_end_datetime > start_datetime:
                # Calculate which individual hours in the slot are affected
                for i in range(slot.get_total_slots()):
                    hour_start = slot_start_datetime + timedelta(hours=i)
                    hour_end = hour_start + timedelta(hours=1)
                    
                    if hour_start < end_datetime and hour_end > start_datetime:
                        # This hour overlaps with unavailable period, so mark it as booked
                        slot.book_slot(i)
        
        db.session.commit()
        
        log_action(current_user_id, 'add_unavailable_period', 'therapist_profile', user.therapist_profile.id, 'success')
        return jsonify({
            'message': 'Unavailable period added successfully',
            'id': unavailable_period.id
        }), 201
        
    except ValueError as e:
        logger.error(f"[POST /unavailable] Value error: {e}")
        return jsonify({'error': f'Invalid datetime format: {e}'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /unavailable] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'add_unavailable_period', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to add unavailable period'}), 500

@availability_bp.route('/unavailable/<int:period_id>', methods=['DELETE'])
@jwt_required()
def remove_unavailable_period(period_id):
    """Remove an unavailable period"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[DELETE /unavailable/{period_id}] Removing unavailable period")
        
        user = User.query.get(current_user_id)
        
        if not user or user.role.upper() != 'THERAPIST' or not user.therapist_profile:
            logger.warning(f"[DELETE /unavailable/{period_id}] User is not a therapist or has no profile: {current_user_id}")
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        # Find the unavailable period
        period = TherapistUnavailability.query.filter_by(
            id=period_id,
            therapist_profile_id=user.therapist_profile.id
        ).first()
        
        if not period:
            logger.warning(f"[DELETE /unavailable/{period_id}] Unavailable period not found")
            return jsonify({'error': 'Unavailable period not found'}), 404
        
        # Store the period details before deleting
        start_datetime = period.start_datetime
        end_datetime = period.end_datetime
        
        db.session.delete(period)
        
        # Unbooking the slots requires careful consideration - only if there are no actual bookings
        # We don't automatically unbook slots because some may have been booked by patients
        
        db.session.commit()
        
        log_action(current_user_id, 'remove_unavailable_period', 'therapist_profile', user.therapist_profile.id, 'success')
        return jsonify({
            'message': 'Unavailable period removed successfully',
            'note': 'Slots that were previously marked as unavailable due to this period may still be marked as booked if there are actual bookings'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"[DELETE /unavailable/{period_id}] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'remove_unavailable_period', 'therapist_profile', 
                  user.therapist_profile.id if user and user.therapist_profile else None, 'error', str(e))
        return jsonify({'error': 'Failed to remove unavailable period'}), 500

@availability_bp.route('/unavailable', methods=['GET'])
@jwt_required()
def get_unavailable_periods():
    """Get all unavailable periods for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[GET /unavailable] Getting unavailable periods for therapist: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user or user.role.upper() != 'THERAPIST' or not user.therapist_profile:
            logger.warning(f"[GET /unavailable] User is not a therapist or has no profile: {current_user_id}")
            return jsonify({'error': 'Therapist profile not found'}), 404
        
        # Get date range parameters (optional)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Build query
        query = TherapistUnavailability.query.filter_by(
            therapist_profile_id=user.therapist_profile.id
        )
        
        # Add date filters if provided
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                query = query.filter(TherapistUnavailability.start_datetime >= start_date)
            except ValueError:
                logger.warning(f"[GET /unavailable] Invalid start_date format: {start_date_str}")
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                query = query.filter(TherapistUnavailability.end_datetime <= end_date)
            except ValueError:
                logger.warning(f"[GET /unavailable] Invalid end_date format: {end_date_str}")
        
        # Execute query
        unavailable_periods = query.order_by(TherapistUnavailability.start_datetime).all()
        
        # Format response
        periods_data = []
        for period in unavailable_periods:
            periods_data.append({
                'id': period.id,
                'start_datetime': period.start_datetime.isoformat(),
                'end_datetime': period.end_datetime.isoformat(),
                'reason': period.reason,
                'is_recurring': period.is_recurring,
                'recurrence_pattern': period.recurrence_pattern
            })
        
        return jsonify({
            'therapist_id': current_user_id,
            'unavailable_periods': periods_data
        }), 200
        
    except Exception as e:
        logger.error(f"[GET /unavailable] Error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to retrieve unavailable periods'}), 500

@availability_bp.route('/available-slots/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_available_slots(therapist_id):
    """Get available time slots for a therapist for booking"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[GET /available-slots/{therapist_id}] Getting available slots for therapist")
        
        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        duration = int(request.args.get('duration', 60))  # Default 60 minutes (1 hour)
        
        if not start_date_str:
            logger.warning("[GET /available-slots] Missing start_date parameter")
            return jsonify({'error': 'start_date is required'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else start_date + timedelta(days=30)
        except ValueError as e:
            logger.error(f"[GET /available-slots] Date parsing error: {e}")
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Limit end_date to be at most 30 days from start_date
        if (end_date - start_date).days > 30:
            end_date = start_date + timedelta(days=30)
            logger.debug(f"[GET /available-slots] Limited end_date to {end_date}")
        
        # Get therapist profile
        therapist = User.query.filter_by(id=therapist_id).first()
        if not therapist or therapist.role.upper() != 'THERAPIST' or not therapist.therapist_profile:
            logger.warning(f"[GET /available-slots] Therapist not found: {therapist_id}")
            return jsonify({'error': 'Therapist not found'}), 404
        
        # Check if therapist is approved
        if not therapist.therapist_profile.is_approved:
            logger.warning(f"[GET /available-slots] Therapist is not approved: {therapist_id}")
            return jsonify({'error': 'Therapist is not approved for bookings'}), 403
        
        # Get availability slots
        availability_slots = TherapistAvailability.query.filter(
            TherapistAvailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistAvailability.date >= start_date,
            TherapistAvailability.date <= end_date,
            TherapistAvailability.is_available == True
        ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
        
        logger.debug(f"[GET /available-slots] Found {len(availability_slots)} availability slots")
        
        # Get unavailable periods
        now = datetime.now()
        unavailable_periods = TherapistUnavailability.query.filter(
            TherapistUnavailability.therapist_profile_id == therapist.therapist_profile.id,
            TherapistUnavailability.start_datetime <= datetime.combine(end_date, time.max),
            TherapistUnavailability.end_datetime >= datetime.combine(start_date, time.min)
        ).all()
        
        logger.debug(f"[GET /available-slots] Found {len(unavailable_periods)} unavailable periods")
        
        # Generate available slots based on duration requested
        duration_hours = duration / 60  # Convert minutes to hours
        
        available_slots = []
        for slot in availability_slots:
            # Get slots that have enough contiguous availability for the requested duration
            contiguous_slots = []
            
            # For 1-hour sessions, we can just use available_slots directly
            if duration_hours == 1:
                contiguous_slots = slot.get_available_slots()
            else:
                # For longer sessions, we need to find contiguous blocks
                contiguous_slots = slot.get_contiguous_available_slots(duration_hours)
            
            logger.debug(f"[GET /available-slots] Found {len(contiguous_slots)} contiguous slots for date {slot.date}")
            
            for slot_index in contiguous_slots:
                slot_start = slot.get_slot_datetime(slot_index)
                
                if slot_start is None:
                    continue  # Invalid slot index
                
                # Skip slots in the past
                if slot_start <= now:
                    continue
                
                slot_end = slot_start + timedelta(minutes=duration)
                
                # Check if this slot conflicts with unavailable periods
                is_unavailable = any(
                    period.start_datetime <= slot_start < period.end_datetime or
                    period.start_datetime < slot_end <= period.end_datetime or
                    (slot_start <= period.start_datetime and slot_end >= period.end_datetime)
                    for period in unavailable_periods
                )
                
                if not is_unavailable:
                    available_slots.append({
                        'availability_id': slot.id,
                        'slot_index': slot_index,
                        'date': slot.date.strftime('%Y-%m-%d'),
                        'start_datetime': slot_start.isoformat(),
                        'end_datetime': slot_end.isoformat(),
                        'start_time': slot_start.time().strftime('%H:%M'),
                        'end_time': slot_end.time().strftime('%H:%M'),
                        'duration': duration
                    })
        
        log_action(current_user_id, 'view_available_slots', 'therapist', therapist_id, 'success')
        return jsonify({
            'therapist_id': therapist_id,
            'therapist_name': f"{therapist.first_name} {therapist.last_name}",
            'available_slots': available_slots,
            'timezone': therapist.therapist_profile.timezone,
            'total_available': len(available_slots)
        }), 200
        
    except Exception as e:
        logger.error(f"[GET /available-slots] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'view_available_slots', 'therapist', therapist_id, 'error', str(e))
        return jsonify({'error': 'Failed to retrieve available slots'}), 500

@availability_bp.route('/book', methods=['POST'])
@jwt_required()
def book_session():
    """Book a session with a therapist"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[POST /book] Booking session for user: {current_user_id}")
        
        user = User.query.get(current_user_id)
        if not user:
            logger.warning(f"[POST /book] User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is a patient
        if user.role.upper() != 'PATIENT':
            logger.warning(f"[POST /book] User is not a patient: {current_user_id}")
            return jsonify({'error': 'Only patients can book sessions'}), 403
        
        # Get booking data
        data = request.get_json()
        logger.debug(f"[POST /book] Received data: {data}")
        
        required_fields = ['therapist_id', 'availability_id', 'slot_index', 'title']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"[POST /book] Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Get therapist
        therapist_id = data['therapist_id']
        therapist = User.query.get(therapist_id)
        if not therapist or therapist.role.upper() != 'THERAPIST':
            logger.warning(f"[POST /book] Therapist not found: {therapist_id}")
            return jsonify({'error': 'Therapist not found'}), 404
        
        # Check if therapist is approved
        therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
        if not therapist_profile or not therapist_profile.is_approved:
            logger.warning(f"[POST /book] Therapist {therapist_id} is not approved for bookings")
            return jsonify({'error': 'Therapist is not approved for bookings'}), 403
        
        # Get availability
        availability_id = data['availability_id']
        slot_index = data['slot_index']
        
        availability = TherapistAvailability.query.get(availability_id)
        if not availability:
            logger.warning(f"[POST /book] Availability not found: {availability_id}")
            return jsonify({'error': 'Availability slot not found'}), 404
        
        # Check if the therapist matches the availability
        if availability.therapist_profile.user_id != therapist_id:
            logger.warning(f"[POST /book] Therapist ID mismatch: {therapist_id} vs {availability.therapist_profile.user_id}")
            return jsonify({'error': 'Therapist ID does not match availability slot'}), 400
        
        # Check if slot is available
        if not availability.is_slot_available(slot_index):
            logger.warning(f"[POST /book] Slot {slot_index} is not available in availability {availability_id}")
            return jsonify({'error': 'The requested slot is not available'}), 409
        
        # Calculate session duration (default 60 minutes)
        duration = data.get('duration', 60)
        
        # Get the start time of the slot
        slot_start = availability.get_slot_datetime(slot_index)
        if not slot_start:
            logger.warning(f"[POST /book] Invalid slot index: {slot_index}")
            return jsonify({'error': 'Invalid slot index'}), 400
        
        # Check if slot is in the past
        if slot_start <= datetime.now():
            logger.warning(f"[POST /book] Slot is in the past: {slot_start}")
            return jsonify({'error': 'Cannot book slots in the past'}), 400
        
        # Check for scheduling conflicts and double bookings
        existing_session = Session.query.filter(
            Session.therapist_id == therapist_id,
            Session.scheduled_at == slot_start,
            Session.status.in_(['scheduled', 'started'])
        ).first()
        
        if existing_session:
            logger.warning(f"[POST /book] Time slot conflict: Therapist {therapist_id} already has a session at {slot_start}")
            return jsonify({'error': 'This time slot has already been booked'}), 409
        
        # Generate unique room ID and join URL for video sessions
        room_id = f"session_{uuid.uuid4().hex[:12]}"
        meeting_password = secrets.token_urlsafe(8)
        join_url = f"{request.host_url}video-call/{room_id}"
        
        # Create session
        session = Session(
            patient_id=current_user_id,
            therapist_id=therapist_id,
            scheduled_at=slot_start,
            duration=duration,
            status='scheduled',
            session_type=data.get('session_type', 'individual'),
            title=data['title'],
            notes=data.get('notes', ''),
            is_emergency=data.get('is_emergency', False),
            timezone=availability.timezone,
            availability_id=availability_id,
            slot_index=slot_index,
            room_id=room_id,
            join_url=join_url,
            meeting_password=meeting_password
        )
        
        # Book the slot
        if not availability.book_slot(slot_index):
            logger.error(f"[POST /book] Failed to book slot {slot_index} in availability {availability_id}")
            return jsonify({'error': 'Failed to book the time slot'}), 500
        
        # Save both the session and the updated availability
        db.session.add(session)
        db.session.commit()
        
        logger.debug(f"[POST /book] Successfully booked session {session.id}")
        
        # Log the action
        log_action(current_user_id, 'book_session', 'session', session.id, 'success')
        
        # Send confirmation emails with calendar attachments (asynchronously)
        try:
            from ..utils.email_utils import send_session_confirmation
            patient_user = User.query.get(session.patient_id)
            therapist_user = User.query.get(session.therapist_id)
            
            send_session_confirmation(session, patient_user, therapist_user)
            logger.debug(f"[POST /book] Session confirmation emails sent for session {session.id}")
        except Exception as e:
            logger.error(f"[POST /book] Failed to send confirmation emails for session {session.id}: {str(e)}")
            # Don't fail the request if email sending fails
        
        return jsonify({
            'message': 'Session booked successfully',
            'session': {
                'id': session.id,
                'title': session.title,
                'scheduled_at': slot_start.isoformat(),
                'duration': duration,
                'status': session.status,
                'join_url': session.join_url,
                'room_id': session.room_id
            },
            'therapist': {
                'id': therapist.id,
                'name': f"{therapist.first_name} {therapist.last_name}",
                'timezone': therapist_profile.timezone
            },
            'slot_booked': {
                'availability_id': availability_id,
                'slot_index': slot_index,
                'date': slot_start.date().strftime('%Y-%m-%d'),
                'time': slot_start.time().strftime('%H:%M')
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /book] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'book_session', 'session', None, 'error', str(e))
        return jsonify({'error': f'Failed to book session: {str(e)}'}), 500

@availability_bp.route('/<int:availability_id>/slots/<int:slot_index>/unbook', methods=['POST'])
@jwt_required()
def unbook_slot(availability_id, slot_index):
    """Unbook a slot directly without requiring a session"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[POST /{availability_id}/slots/{slot_index}/unbook] Unbooking slot for therapist: {current_user_id}")
        
        user = User.query.get(current_user_id)
        if not user or user.role.upper() != 'THERAPIST':
            logger.warning(f"[POST /{availability_id}/slots/{slot_index}/unbook] User is not a therapist: {current_user_id}")
            return jsonify({'error': 'Only therapists can unbook slots directly'}), 403
        
        # Get the availability
        availability = TherapistAvailability.query.get(availability_id)
        if not availability:
            logger.warning(f"[POST /{availability_id}/slots/{slot_index}/unbook] Availability not found")
            return jsonify({'error': 'Availability slot not found'}), 404
        
        # Check if the therapist owns this availability
        if availability.therapist_profile.user_id != current_user_id:
            logger.warning(f"[POST /{availability_id}/slots/{slot_index}/unbook] Therapist doesn't own this availability: {current_user_id}")
            return jsonify({'error': 'Unauthorized to unbook this slot'}), 403
        
        # Find session associated with this slot
        session = Session.query.filter_by(
            availability_id=availability_id,
            slot_index=slot_index,
            status='scheduled'
        ).first()
        
        if session:
            # If a session exists, cancel it
            session.status = 'cancelled'
            session.cancelled_by = current_user_id
            session.cancelled_at = datetime.now()
            session.cancellation_reason = 'Cancelled by therapist'
            logger.debug(f"[POST /{availability_id}/slots/{slot_index}/unbook] Found and cancelled associated session {session.id}")
        
        # Unbook the slot
        availability.unbook_slot(slot_index)
        db.session.commit()
        logger.debug(f"[POST /{availability_id}/slots/{slot_index}/unbook] Successfully unbooked slot")
        
        # Log the action
        log_action(current_user_id, 'unbook_slot', 'availability', availability_id, 'success')
        
        return jsonify({
            'message': 'Slot unbooked successfully',
            'availability_id': availability_id,
            'slot_index': slot_index
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /{availability_id}/slots/{slot_index}/unbook] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'unbook_slot', 'availability', availability_id, 'error', str(e))
        return jsonify({'error': 'Failed to unbook slot'}), 500

@availability_bp.route('/cancel-booking/<int:session_id>', methods=['POST'])
@jwt_required()
def cancel_booking(session_id):
    """Cancel a booked session"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[POST /cancel-booking/{session_id}] Canceling session for user: {current_user_id}")
        
        user = User.query.get(current_user_id)
        if not user:
            logger.warning(f"[POST /cancel-booking/{session_id}] User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        # Get the session
        session = Session.query.get(session_id)
        if not session:
            logger.warning(f"[POST /cancel-booking/{session_id}] Session not found")
            return jsonify({'error': 'Session not found'}), 404
        
        # Check if user is authorized to cancel the session
        is_patient = session.patient_id == current_user_id
        is_therapist = session.therapist_id == current_user_id
        is_admin = user.role.upper() == 'ADMIN'
        
        if not (is_patient or is_therapist or is_admin):
            logger.warning(f"[POST /cancel-booking/{session_id}] Unauthorized user: {current_user_id}")
            return jsonify({'error': 'Unauthorized to cancel this session'}), 403
        
        # Check if session is in a cancellable state
        if session.status not in ['scheduled']:
            logger.warning(f"[POST /cancel-booking/{session_id}] Session is in non-cancellable state: {session.status}")
            return jsonify({'error': f'Cannot cancel session in {session.status} state'}), 400
        
        # Get cancellation reason
        data = request.get_json() or {}
        cancellation_reason = data.get('reason', 'No reason provided')
        
        # Check cancellation time policy
        now = datetime.now()
        session_time = session.scheduled_at
        hours_until_session = (session_time - now).total_seconds() / 3600
        
        # For patient cancellations, check if it's within the allowed time frame
        # (e.g., must cancel at least 24 hours before the session)
        cancellation_fee = False
        if is_patient and hours_until_session < 24 and not is_admin:
            # Apply cancellation fee logic here
            cancellation_fee = True
            logger.debug(f"[POST /cancel-booking/{session_id}] Late cancellation fee applies for patient: {current_user_id}")
        
        # Update session status
        session.status = 'cancelled'
        session.cancelled_by = current_user_id
        session.cancelled_at = now
        session.cancellation_reason = cancellation_reason
        if cancellation_fee:
            session.late_cancellation_fee = True
        
        # If the session is associated with an availability slot, unbook that slot
        if session.availability_id and session.slot_index is not None:
            # Get the availability
            availability = TherapistAvailability.query.get(session.availability_id)
            if availability:
                # Unbook the slot
                availability.unbook_slot(session.slot_index)
                logger.debug(f"[POST /cancel-booking/{session_id}] Unbooked slot {session.slot_index} from availability {session.availability_id}")
        
        db.session.commit()
        logger.debug(f"[POST /cancel-booking/{session_id}] Successfully cancelled session")
        
        # Log the action
        log_action(current_user_id, 'cancel_booking', 'session', session_id, 'success')
        
        # Send cancellation notification emails
        try:
            # Import here to avoid circular imports
            from ..utils.email_utils import send_cancellation_notification
            patient_user = User.query.get(session.patient_id)
            therapist_user = User.query.get(session.therapist_id)
            
            send_cancellation_notification(session, patient_user, therapist_user, user.role)
            logger.debug(f"[POST /cancel-booking/{session_id}] Cancellation notification emails sent")
        except Exception as e:
            logger.error(f"[POST /cancel-booking/{session_id}] Failed to send cancellation emails: {str(e)}")
            # Don't fail the request if email sending fails
        
        response_data = {
            'message': 'Session cancelled successfully',
            'session_id': session.id,
            'cancelled_by': current_user_id,
            'cancelled_at': session.cancelled_at.isoformat()
        }
        
        if cancellation_fee:
            response_data['warning'] = 'Late cancellation fee applies'
            response_data['cancellation_fee'] = True
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"[POST /cancel-booking/{session_id}] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'cancel_booking', 'session', session_id, 'error', str(e))
        return jsonify({'error': f'Failed to cancel booking: {str(e)}'}), 500
        
@availability_bp.route('/patient-bookings', methods=['GET'])
@jwt_required()
def get_patient_bookings():
    """Get all bookings for the current patient"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"[GET /patient-bookings] Getting bookings for patient: {current_user_id}")
        
        user = User.query.get(current_user_id)
        if not user:
            logger.warning(f"[GET /patient-bookings] User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        if user.role.upper() != 'PATIENT':
            logger.warning(f"[GET /patient-bookings] User is not a patient: {current_user_id}")
            return jsonify({'error': 'Only patients can access this endpoint'}), 403
            
        # Get query parameters for filtering
        status_filter = request.args.get('status', 'upcoming').lower()  # upcoming, past, cancelled, all
        include_past = request.args.get('include_past', 'false').lower() == 'true'
        
        # Build query
        query = Session.query.filter_by(patient_id=current_user_id)
        
        # Apply status filters
        if status_filter == 'upcoming':
            query = query.filter(
                Session.scheduled_at >= datetime.now(), 
                Session.status == 'scheduled'
            )
        elif status_filter == 'past':
            query = query.filter(
                Session.scheduled_at < datetime.now(),
                Session.status.in_(['completed', 'no_show'])
            )
        elif status_filter == 'cancelled':
            query = query.filter(Session.status == 'cancelled')
            
        # Sort by date (newest first for past sessions, soonest first for upcoming)
        if status_filter == 'past' or status_filter == 'cancelled':
            query = query.order_by(Session.scheduled_at.desc())
        else:
            query = query.order_by(Session.scheduled_at.asc())
            
        sessions = query.all()
        
        bookings_data = []
        for session in sessions:
            # Get therapist info
            therapist = User.query.get(session.therapist_id)
            
            # Add booking data
            bookings_data.append({
                'id': session.id,
                'title': session.title,
                'status': session.status,
                'scheduled_at': session.scheduled_at.isoformat(),
                'duration': session.duration,
                'session_type': session.session_type,
                'therapist': {
                    'id': therapist.id,
                    'name': f"{therapist.first_name} {therapist.last_name}" if therapist else "Unknown"
                },
                'notes': session.notes,
                'join_url': session.join_url,
                'room_id': session.room_id,
                'availability_id': session.availability_id,
                'slot_index': session.slot_index,
                'created_at': session.created_at.isoformat() if session.created_at else None
            })
            
        log_action(current_user_id, 'view_bookings', 'patient', current_user_id, 'success')
        return jsonify({
            'patient_id': current_user_id,
            'bookings': bookings_data,
            'total_count': len(bookings_data),
            'status_filter': status_filter
        })
        
    except Exception as e:
        logger.error(f"[GET /patient-bookings] Error: {str(e)}", exc_info=True)
        log_action(current_user_id, 'view_bookings', 'patient', current_user_id, 'error', str(e))
        return jsonify({'error': f'Failed to retrieve bookings: {str(e)}'}), 500
        
# Add a test endpoint to verify the system
@availability_bp.route('/test', methods=['GET'])
def test_availability_system():
    """Test endpoint to verify the availability and booking system works correctly"""
    try:
        # Get current date
        today = date.today()
        
        # Create a test response with system status
        response = {
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'system_components': []
        }
        
        # Test 1: Check if we can access the database
        try:
            db_test = db.session.execute("SELECT 1").fetchone()
            response['system_components'].append({
                'name': 'database',
                'status': 'ok' if db_test else 'error',
                'message': 'Database connection successful'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'database', 
                'status': 'error',
                'message': f'Database connection failed: {str(e)}'
            })
        
        # Test 2: Check if we can query users
        try:
            users_count = User.query.count()
            response['system_components'].append({
                'name': 'users',
                'status': 'ok',
                'message': f'User model accessible, {users_count} users found'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'users',
                'status': 'error',
                'message': f'User model access failed: {str(e)}'
            })
            
        # Test 3: Check if we can query therapist profiles
        try:
            therapists_count = TherapistProfile.query.count()
            response['system_components'].append({
                'name': 'therapist_profiles',
                'status': 'ok',
                'message': f'TherapistProfile model accessible, {therapists_count} therapist profiles found'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'therapist_profiles',
                'status': 'error',
                'message': f'TherapistProfile model access failed: {str(e)}'
            })
            
        # Test 4: Check if we can query availability slots
        try:
            availability_count = TherapistAvailability.query.filter(
                TherapistAvailability.date >= today
            ).count()
            response['system_components'].append({
                'name': 'availability',
                'status': 'ok',
                'message': f'TherapistAvailability model accessible, {availability_count} future availability slots found'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'availability',
                'status': 'error',
                'message': f'TherapistAvailability model access failed: {str(e)}'
            })
            
        # Test 5: Check if we can query unavailability periods
        try:
            unavailable_count = TherapistUnavailability.query.filter(
                TherapistUnavailability.start_datetime >= datetime.now()
            ).count()
            response['system_components'].append({
                'name': 'unavailability',
                'status': 'ok',
                'message': f'TherapistUnavailability model accessible, {unavailable_count} future unavailability periods found'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'unavailability',
                'status': 'error',
                'message': f'TherapistUnavailability model access failed: {str(e)}'
            })
            
        # Test 6: Check if we can query sessions
        try:
            session_count = Session.query.filter(
                Session.scheduled_at >= datetime.now()
            ).count()
            response['system_components'].append({
                'name': 'sessions',
                'status': 'ok',
                'message': f'Session model accessible, {session_count} future sessions found'
            })
        except Exception as e:
            response['system_components'].append({
                'name': 'sessions',
                'status': 'error',
                'message': f'Session model access failed: {str(e)}'
            })
        
        # Set overall status based on component statuses
        if any(component['status'] == 'error' for component in response['system_components']):
            response['status'] = 'error'
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"[GET /test] Error: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Test failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500
        
@availability_bp.route('/therapists', methods=['GET'])
@jwt_required()
def get_available_therapists():
    """Get list of available therapists for scheduling"""
    # Get all approved therapists
    therapists = db.session.query(User, TherapistProfile).join(
        TherapistProfile, User.id == TherapistProfile.user_id
    ).filter(
        User.role == 'THERAPIST',
        User.is_active == True,
        TherapistProfile.is_approved == True
    ).all()
    
    therapists_data = []
    for user, profile in therapists:
        # Get availability data for this therapist
        now = datetime.utcnow()
        today = now.date()
        
        availability_slots = TherapistAvailability.query.filter_by(
            therapist_profile_id=profile.id
        ).filter(
            TherapistAvailability.date >= today  # Only future and today's dates
        ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
        
        # Convert to date-based format with slot-level availability
        availability_data = {}
        
        for slot in availability_slots:
            date_str = slot.date.strftime('%Y-%m-%d')
            if date_str not in availability_data:
                availability_data[date_str] = []
            
            # Get available and booked slots for this time block
            total_slots = slot.get_total_slots()
            available_slots = slot.get_available_slots()
            booked_slots = slot.booked_slots or []
            
            # Filter individual slots based on current time
            filtered_individual_slots = []
            for i in range(total_slots):
                slot_start_time = (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i)).time()
                slot_datetime = datetime.combine(slot.date, slot_start_time)
                
                # Only include slots that are in the future
                if slot_datetime > now:
                    filtered_individual_slots.append({
                        'slot_index': i,
                        'start_time': slot_start_time.strftime('%H:%M'),
                        'end_time': (datetime.combine(slot.date, slot.start_time) + timedelta(hours=i+1)).time().strftime('%H:%M'),
                        'is_available': i in available_slots
                    })
            
            # Only add the slot if it has future individual slots
            if filtered_individual_slots:
                availability_data[date_str].append({
                    'id': slot.id,
                    'start': slot.start_time.strftime('%H:%M'),
                    'end': slot.end_time.strftime('%H:%M'),
                    'available': slot.is_available,
                    'total_slots': total_slots,
                    'available_slots': available_slots,
                    'booked_slots': booked_slots,
                    'individual_slots': filtered_individual_slots
                })
        
        therapists_data.append({
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'specializations': profile.specializations,
            'languages': profile.languages,
            'experience': profile.experience,
            'bio': profile.bio,
            'timezone': profile.timezone,
            'accepts_emergency': profile.accepts_emergency,
            'availability': availability_data
        })
    
    return jsonify(therapists_data)

@availability_bp.route('/check', methods=['POST'])
@jwt_required()
def check_availability():
    """Check if a therapist is available at a specific time"""
    data = request.get_json()
    logger.debug(f"[POST /check] Checking availability with data: {data}")
    
    required_fields = ['therapist_id', 'date', 'time']
    for field in required_fields:
        if field not in data:
            logger.warning(f"[POST /check] Missing required field: {field}")
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    therapist_id = data['therapist_id']
    date = data['date']  # Format: YYYY-MM-DD
    time = data['time']  # Format: HH:MM
    
    # Get therapist profile
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
    if not therapist_profile:
        logger.warning(f"[POST /check] Therapist not found with ID: {therapist_id}")
        return jsonify({'error': 'Therapist not found'}), 404
    
    # Check specific date availability
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(time, '%H:%M').time()
        logger.debug(f"[POST /check] Parsed date: {date_obj}, time: {time_obj}")
        
        # Get availability slots for this specific date
        availability_slots = TherapistAvailability.query.filter_by(
            therapist_profile_id=therapist_profile.id,
            date=date_obj,
            is_available=True
        ).all()
        
        is_available = False
        availability_slot_found = None
        slot_index = None
        
        for slot in availability_slots:
            if slot.start_time <= time_obj < slot.end_time:
                # Calculate which hour slot this time falls into
                time_diff = datetime.combine(date_obj, time_obj) - datetime.combine(date_obj, slot.start_time)
                hour_slot = int(time_diff.total_seconds() / 3600)
                
                # Check if this specific hour slot is available (not booked)
                if slot.is_slot_available(hour_slot):
                    is_available = True
                    availability_slot_found = slot
                    slot_index = hour_slot
                break
        
        # Check for existing session bookings at this exact time
        if is_available:
            scheduled_datetime = datetime.strptime(f"{date} {time}", '%Y-%m-%d %H:%M')
            existing_session = Session.query.filter(
                Session.therapist_id == therapist_id,
                Session.scheduled_at == scheduled_datetime,
                Session.status.in_(['scheduled', 'started'])
            ).first()
            
            if existing_session:
                is_available = False
                logger.debug(f"[POST /check] Found conflicting session for therapist {therapist_id} at {scheduled_datetime}")
        
        response_data = {
            'available': is_available,
            'therapist_id': therapist_id,
            'date': date,
            'time': time
        }
        
        # Add slot details if available
        if availability_slot_found and slot_index is not None:
            response_data.update({
                'availability_id': availability_slot_found.id,
                'slot_index': slot_index,
                'slot_details': {
                    'start_time': availability_slot_found.start_time.strftime('%H:%M'),
                    'end_time': availability_slot_found.end_time.strftime('%H:%M'),
                    'total_slots': availability_slot_found.get_total_slots(),
                    'available_slots': availability_slot_found.get_available_slots(),
                    'booked_slots': availability_slot_found.booked_slots or []
                }
            })
        
        logger.debug(f"[POST /check] Availability check result: {response_data}")
        return jsonify(response_data)
        
    except ValueError as e:
        logger.error(f"[POST /check] Invalid date format: {e}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD for date and HH:MM for time'}), 400

@availability_bp.route('/slots', methods=['POST'])
@jwt_required()
def get_available_slots_for_booking():
    """Get all available individual slots for booking within a date range"""
    data = request.get_json()
    logger.debug(f"[POST /slots] Getting available slots with data: {data}")
    
    required_fields = ['therapist_id', 'start_date']
    for field in required_fields:
        if field not in data:
            logger.warning(f"[POST /slots] Missing required field: {field}")
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    therapist_id = data['therapist_id']
    start_date = data['start_date']  # Format: YYYY-MM-DD
    end_date = data.get('end_date', start_date)  # Default to same day if not provided
    
    # Get therapist profile
    therapist_profile = TherapistProfile.query.filter_by(user_id=therapist_id).first()
    if not therapist_profile:
        logger.warning(f"[POST /slots] Therapist profile not found for user ID: {therapist_id}")
        return jsonify({'error': 'Therapist not found'}), 404
    
    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        logger.debug(f"[POST /slots] Date range: {start_date_obj} to {end_date_obj}")
    except ValueError as e:
        logger.error(f"[POST /slots] Invalid date format: {e}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Get availability slots within date range
    availability_slots = TherapistAvailability.query.filter(
        TherapistAvailability.therapist_profile_id == therapist_profile.id,
        TherapistAvailability.date >= start_date_obj,
        TherapistAvailability.date <= end_date_obj,
        TherapistAvailability.is_available == True
    ).order_by(TherapistAvailability.date, TherapistAvailability.start_time).all()
    
    logger.debug(f"[POST /slots] Found {len(availability_slots)} availability slots in range")
    
    # Collect all available individual slots
    available_slots = []
    
    for availability_slot in availability_slots:
        available_slot_indices = availability_slot.get_available_slots()
        
        for slot_index in available_slot_indices:
            slot_start = datetime.combine(availability_slot.date, availability_slot.start_time) + timedelta(hours=slot_index)
            slot_end = slot_start + timedelta(hours=1)
            
            # Check for existing session bookings at this time
            existing_session = Session.query.filter(
                Session.therapist_id == therapist_id,
                Session.scheduled_at == slot_start,
                Session.status.in_(['scheduled', 'started'])
            ).first()
            
            if not existing_session:  # Only include if no session conflict
                available_slots.append({
                    'availability_id': availability_slot.id,
                    'slot_index': slot_index,
                    'date': availability_slot.date.strftime('%Y-%m-%d'),
                    'start_datetime': slot_start.isoformat(),
                    'end_datetime': slot_end.isoformat(),
                    'start_time': slot_start.time().strftime('%H:%M'),
                    'end_time': slot_end.time().strftime('%H:%M'),
                    'timezone': availability_slot.timezone
                })
    
    logger.debug(f"[POST /slots] Returning {len(available_slots)} available individual slots")
    return jsonify({
        'therapist_id': therapist_id,
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        },
        'available_slots': available_slots,
        'total_available': len(available_slots)
    })