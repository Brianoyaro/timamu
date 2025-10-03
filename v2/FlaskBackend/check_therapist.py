from App.models import TherapistProfile
from App.extensions import db
from App import create_app

app = create_app()
with app.app_context():
    t = TherapistProfile.query.first()
    print('First therapist:', t.id if t else 'None')
    if t:
        print('Current availability:', t.availability)
