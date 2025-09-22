class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///ngotherapy.db'  # Change to your Postgres URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'supersecretkey'
    GOOGLE_CLIENT_ID = 'your-google-client-id'
    GOOGLE_CLIENT_SECRET = 'your-google-client-secret'
    GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
