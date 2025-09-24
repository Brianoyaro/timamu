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

### Local Development
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
   ```bash
   python app.py
   ```

### Deployment on Render

1. **Push your code to GitHub** (make sure the FlaskBackend directory is in your repo)

2. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Set the Root Directory to `FlaskBackend`
   - Set the Environment to `Python 3`
   - Set the Build Command: `pip install -r requirements.txt`
   - Set the Start Command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`

3. **Environment Variables to set on Render:**
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   DATABASE_URL=your-database-url-here
   FRONTEND_URL=your-frontend-url-here
   ```

4. **Database Setup:**
   - Create a PostgreSQL database on Render
   - Set the DATABASE_URL environment variable to the connection string

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
