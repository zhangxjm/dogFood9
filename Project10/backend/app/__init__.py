from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app(config_class):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    db.init_app(app)
    
    from app.api.books import books_bp
    from app.api.collation import collation_bp
    from app.api.search import search_bp
    from app.api.history import history_bp
    
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(collation_bp, url_prefix='/api/collation')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'Ancient Book Collation System is running'}
    
    return app
