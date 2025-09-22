class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///ngotherapy.db'  # Change to your Postgres URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security
    SECRET_KEY = 'supersecretkey'

    # OAuth2 Configuration for Google
    GOOGLE_CLIENT_ID = 'your-google-client-id'
    GOOGLE_CLIENT_SECRET = 'your-google-client-secret'
    GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'

    # Frontend URL
    FRONTEND_URL = 'http://localhost:3000'  # Change to your frontend URL

    # Email configuration
    MAIL_SERVER = 'smtp.example.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@example.com'
    MAIL_PASSWORD = 'your-email-password'
