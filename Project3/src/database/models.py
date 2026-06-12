import os
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agri_db.sqlite3")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class FarmField(Base):
    __tablename__ = "farm_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    area = Column(Float, nullable=False)
    crop_type = Column(String(50), nullable=False)
    planting_date = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String(50), default="壤土")
    status = Column(String(20), default="正常")
    description = Column(Text, default="")


class SoilData(Base):
    __tablename__ = "soil_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    temperature = Column(Float, nullable=False)
    moisture = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    organic_matter = Column(Float, default=0)
    conductivity = Column(Float, default=0)


class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    wind_speed = Column(Float, default=0)
    wind_direction = Column(String(10), default="")
    rainfall = Column(Float, default=0)
    solar_radiation = Column(Float, default=0)
    pressure = Column(Float, default=1013)
    uv_index = Column(Float, default=0)


class FertilizerWaterData(Base):
    __tablename__ = "fertilizer_water_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    irrigation_amount = Column(Float, default=0)
    fertilizer_n = Column(Float, default=0)
    fertilizer_p = Column(Float, default=0)
    fertilizer_k = Column(Float, default=0)
    irrigation_method = Column(String(20), default="滴灌")
    fertilizer_type = Column(String(50), default="复合肥")


class CropGrowthData(Base):
    __tablename__ = "crop_growth_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    growth_stage = Column(String(30), nullable=False)
    plant_height = Column(Float, default=0)
    leaf_area_index = Column(Float, default=0)
    biomass = Column(Float, default=0)
    fruit_count = Column(Integer, default=0)
    chlorophyll = Column(Float, default=0)
    health_status = Column(String(20), default="健康")


class PestAlert(Base):
    __tablename__ = "pest_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    pest_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, default="")
    risk_level = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    recommendation = Column(Text, default="")


class DecisionCommand(Base):
    __tablename__ = "decision_commands"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    command_type = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(Integer, default=1)
    status = Column(String(20), default="待执行")
    executor = Column(String(50), default="系统自动")


class YieldPrediction(Base):
    __tablename__ = "yield_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, nullable=False)
    prediction_date = Column(DateTime, default=datetime.now)
    predicted_yield = Column(Float, nullable=False)
    confidence = Column(Float, default=0.85)
    model_version = Column(String(20), default="v1.0")
    factors = Column(Text, default="")


class SensorDevice(Base):
    __tablename__ = "sensor_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, nullable=False)
    field_id = Column(Integer, nullable=False)
    device_type = Column(String(30), nullable=False)
    location = Column(String(100), default="")
    status = Column(String(20), default="在线")
    last_heartbeat = Column(DateTime, default=datetime.now)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
