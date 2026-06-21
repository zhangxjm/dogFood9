from flask import Flask
from flask_cors import CORS
from config import Config
from app.database import db
from app.api import register_routes


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})

    db.init_app(app)

    register_routes(app)

    with app.app_context():
        db.create_all()
        from app.database.init_data import init_demo_data
        init_demo_data()

    return app
