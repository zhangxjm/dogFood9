import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smart-home-voice-secret-key-2024')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(BASE_DIR, 'smart_home.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024

    ASR_API_URL = os.environ.get('ASR_API_URL', 'http://localhost:8001/asr')
    NLU_API_URL = os.environ.get('NLU_API_URL', 'http://localhost:8002/nlu')
    WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY', 'demo_weather_key')

    CORS_ORIGINS = ['*']
