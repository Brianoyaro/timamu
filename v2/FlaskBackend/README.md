# FlaskBackend

A modern telepsychology backend built with Flask, Flask-SQLAlchemy, Flask-SocketIO, Flask-Mail, and Authlib.

## Features
- User authentication (JWT, Google OAuth)
- Real-time WebRTC signaling and chat (Flask-SocketIO)
- Role-based access (Admin, Therapist, Patient)
- Email notifications (welcome, password reset)
- RESTful API with blueprints and app factory
- Database models for users, sessions, messages, files, ratings, audit logs

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment variables in `config.py` (database, mail, Google OAuth).
3. Run migrations:
   ```bash
   flask db init
   flask db migrate
   flask db upgrade
   ```
4. Start the server:
   ```python
   from FlaskBackend import create_app, socketio
   app = create_app()
   socketio.run(app, debug=True)
   ```

## WebRTC Signaling
- Uses Flask-SocketIO for signaling events (`webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`).
- Room management for sessions and roles.

## OAuth
- Google OAuth via Authlib (`/api/auth/google-login`, `/api/auth/google-callback`).

## Email
- Welcome and password reset emails via Flask-Mail.

## Contributing
PRs welcome! See code comments for extension points.

## License
MIT
