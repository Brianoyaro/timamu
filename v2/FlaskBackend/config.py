class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///ngotherapy.db'  # Change to your Postgres URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'supersecretkey'
