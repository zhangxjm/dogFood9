from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Fraud Detection System"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    
    database_url: str = "sqlite:///./fraud_detection.db"
    
    model_path: str = "./ml_models/fraud_model.pkl"
    scaler_path: str = "./ml_models/scaler.pkl"
    
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
