import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ancient-book-collation-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///ancient_books.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    ELASTICSEARCH_HOST = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    ELASTICSEARCH_PORT = int(os.environ.get('ELASTICSEARCH_PORT', 9200))
    ELASTICSEARCH_USE_SSL = os.environ.get('ELASTICSEARCH_USE_SSL', 'false').lower() == 'true'
    
    ES_INDEX_BOOKS = 'ancient_books'
    ES_INDEX_PAGES = 'ancient_book_pages'
    
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    VARIANT_CHARS_DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'variant_chars.json')
