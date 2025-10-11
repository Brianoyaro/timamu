# Therapist Availability System Migration

This document outlines the migration from storing therapist availability as JSON in the `TherapistProfile` model to dedicated `TherapistAvailability` and `TherapistUnavailability` models.

## Overview

The new system provides better data structure, more flexibility, and improved performance for handling therapist availability.

### Key Changes

1. **Removed**: `availability` JSON field from `TherapistProfile`
2. **Added**: `TherapistAvailability` model for weekly recurring availability
3. **Added**: `TherapistUnavailability` model for specific unavailable periods
4. **Updated**: API endpoints to use the new models while maintaining backward compatibility

## Database Models

### TherapistAvailability
```python
class TherapistAvailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    therapist_profile_id = db.Column(db.Integer, db.ForeignKey('therapist_profile.id'))
    day_of_week = db.Column(db.Integer)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    is_available = db.Column(db.Boolean, default=True)
    timezone = db.Column(db.String(50), default='UTC')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### TherapistUnavailability
```python
class TherapistUnavailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    therapist_profile_id = db.Column(db.Integer, db.ForeignKey('therapist_profile.id'))
    start_datetime = db.Column(db.DateTime)
    end_datetime = db.Column(db.DateTime)
    reason = db.Column(db.String(100))  # vacation, appointment, emergency, etc.
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.JSON)  # For recurring unavailability
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

## API Endpoints

### New Availability Endpoints (`/api/availability/`)

- `GET /api/availability/therapist/<therapist_id>` - Get therapist's availability
- `GET /api/availability/my-availability` - Get current therapist's availability
- `POST /api/availability/my-availability` - Update current therapist's availability
- `POST /api/availability/unavailable` - Add unavailable period
- `DELETE /api/availability/unavailable/<period_id>` - Remove unavailable period
- `GET /api/availability/available-slots/<therapist_id>` - Get bookable slots

### Updated Existing Endpoints (`/api/therapists/`)

- `GET /api/therapists/availability` - Updated to use new model (backward compatible)
- `POST /api/therapists/availability` - Updated to use new model (backward compatible)
- `GET /api/therapists/<therapist_id>/availability` - Updated to use new model

## Migration Process

### 1. Database Migration

Run the migration to create new tables and remove the JSON field:

```bash
cd FlaskBackend
source venv/bin/activate
export FLASK_APP=app.py
flask db upgrade
```

### 2. Data Migration

Run the data migration script to move existing availability data:

```bash
cd FlaskBackend/App/scripts
python migrate_availability.py
```

To rollback if needed:
```bash
python migrate_availability.py rollback
```

### 3. Frontend Compatibility

The existing frontend code continues to work without changes due to backward compatibility in the API responses. The updated endpoints return data in the same format as before.

## Benefits of the New System

### 1. Better Data Structure
- Proper relational database design
- Individual time slots as database records
- Better indexing and query performance

### 2. Enhanced Flexibility
- Support for multiple time slots per day
- Granular availability control
- Specific unavailable periods (vacations, etc.)

### 3. Improved Booking Logic
- Efficient conflict detection
- Better slot availability calculation
- Support for recurring unavailability

### 4. Better Performance
- Indexed queries instead of JSON parsing
- Reduced data transfer
- More efficient availability checks

## Usage Examples

### Setting Weekly Availability

```python
# Old way (JSON)
therapist_profile.availability = {
    "monday": {"start": "09:00", "end": "17:00", "available": True},
    "tuesday": {"start": "09:00", "end": "17:00", "available": True}
}

# New way (Model)
availability_slot = TherapistAvailability(
    therapist_profile_id=profile.id,
    day_of_week=0,  # Monday
    start_time=time(9, 0),
    end_time=time(17, 0),
    is_available=True,
    timezone='UTC'
)
```

### Adding Unavailable Period

```python
unavailable_period = TherapistUnavailability(
    therapist_profile_id=profile.id,
    start_datetime=datetime(2025, 12, 23, 0, 0),
    end_datetime=datetime(2025, 12, 30, 23, 59),
    reason='Holiday vacation',
    is_recurring=False
)
```

### Getting Available Slots

```python
# Get availability for booking
response = requests.get('/api/availability/available-slots/123', {
    'start_date': '2025-10-15',
    'end_date': '2025-10-22',
    'duration': 60
})
```

## API Response Format

The API maintains backward compatibility by converting the new model data to the original JSON format:

```json
{
  "therapist_id": 123,
  "availability": {
    "monday": [
      {"start": "09:00", "end": "12:00", "available": true},
      {"start": "13:00", "end": "17:00", "available": true}
    ],
    "tuesday": [
      {"start": "09:00", "end": "17:00", "available": true}
    ]
  },
  "timezone": "UTC",
  "unavailable_periods": [
    {
      "start_datetime": "2025-12-23T00:00:00",
      "end_datetime": "2025-12-30T23:59:59",
      "reason": "Holiday vacation"
    }
  ]
}
```

## Testing

### Backend Tests

Test the new availability endpoints:

```bash
cd FlaskBackend
python -m pytest tests/test_availability.py
```

### Frontend Tests

The existing frontend tests should continue to pass due to backward compatibility.

## Troubleshooting

### Common Issues

1. **Migration fails**: Check database permissions and existing data validity
2. **API errors**: Verify that all imports are correctly updated
3. **Frontend issues**: Clear browser cache and check console for errors

### Rollback Process

If issues arise, you can rollback the migration:

```bash
# Rollback database
flask db downgrade

# Rollback data
python migrate_availability.py rollback
```

## Future Enhancements

The new system enables future features:

1. **Advanced Scheduling Rules**: Complex availability patterns
2. **Automatic Conflict Resolution**: Smart scheduling suggestions
3. **Calendar Integration**: Sync with external calendars
4. **Bulk Operations**: Update multiple therapists' availability
5. **Analytics**: Availability utilization reports

## Support

For issues or questions regarding the availability system migration, please refer to:

1. Database migration logs
2. API documentation
3. Error logs in the application
4. This documentation

---

*Last updated: October 11, 2025*