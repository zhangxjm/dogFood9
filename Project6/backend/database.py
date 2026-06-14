from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./mine_safety.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Personnel(Base):
    __tablename__ = "personnel"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    employee_id = Column(String(20), unique=True, nullable=False)
    role = Column(String(30), nullable=False)
    team = Column(String(30), nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)
    zone = Column(String(50), default="surface")
    status = Column(String(20), default="normal")
    enter_time = Column(DateTime, default=None)
    last_update = Column(DateTime, default=datetime.now)


class GasSensor(Base):
    __tablename__ = "gas_sensor"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)
    gas_type = Column(String(20), default="CH4")
    value = Column(Float, default=0.0)
    unit = Column(String(10), default="%")
    threshold_warning = Column(Float, default=1.0)
    threshold_critical = Column(Float, default=1.5)
    status = Column(String(20), default="normal")
    last_update = Column(DateTime, default=datetime.now)


class VentilationEquipment(Base):
    __tablename__ = "ventilation_equipment"
    id = Column(Integer, primary_key=True, index=True)
    equip_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)
    equip_type = Column(String(30), default="fan")
    airflow_rate = Column(Float, default=0.0)
    power = Column(Float, default=0.0)
    running = Column(Boolean, default=True)
    status = Column(String(20), default="normal")
    last_update = Column(DateTime, default=datetime.now)


class RoofSensor(Base):
    __tablename__ = "roof_sensor"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)
    stress_value = Column(Float, default=0.0)
    displacement = Column(Float, default=0.0)
    threshold_warning = Column(Float, default=15.0)
    threshold_critical = Column(Float, default=25.0)
    status = Column(String(20), default="normal")
    last_update = Column(DateTime, default=datetime.now)


class Warning(Base):
    __tablename__ = "warning"
    id = Column(Integer, primary_key=True, index=True)
    warning_type = Column(String(30), nullable=False)
    level = Column(String(20), nullable=False)
    zone = Column(String(50), nullable=False)
    sensor_id = Column(String(20), nullable=True)
    value = Column(Float, default=0.0)
    threshold = Column(Float, default=0.0)
    message = Column(Text, nullable=False)
    handled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    handled_at = Column(DateTime, default=None)
    handled_by = Column(String(50), default=None)


class EvacuationRoute(Base):
    __tablename__ = "evacuation_route"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=False)
    waypoints = Column(Text, nullable=False)
    distance = Column(Float, default=0.0)
    estimated_time = Column(Float, default=0.0)
    status = Column(String(20), default="available")
    created_at = Column(DateTime, default=datetime.now)


class MineZone(Base):
    __tablename__ = "mine_zone"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    level = Column(Integer, default=0)
    zone_type = Column(String(30), default="tunnel")
    x_start = Column(Float, default=0.0)
    y_start = Column(Float, default=0.0)
    z_start = Column(Float, default=0.0)
    x_end = Column(Float, default=0.0)
    y_end = Column(Float, default=0.0)
    z_end = Column(Float, default=0.0)
    status = Column(String(20), default="normal")


class MonitoringData(Base):
    __tablename__ = "monitoring_data"
    id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String(30), nullable=False)
    source_id = Column(String(20), nullable=False)
    value = Column(Float, default=0.0)
    unit = Column(String(10), default="")
    zone = Column(String(50), default="")
    recorded_at = Column(DateTime, default=datetime.now)


class SafetyReport(Base):
    __tablename__ = "safety_report"
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(30), nullable=False)
    title = Column(String(100), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    content = Column(Text, default="")
    file_path = Column(String(200), default="")
    generated_at = Column(DateTime, default=datetime.now)


class MiningPlan(Base):
    __tablename__ = "mining_plan"
    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String(100), nullable=False)
    zone = Column(String(50), nullable=False)
    plan_type = Column(String(30), default="excavation")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    target_output = Column(Float, default=0.0)
    actual_output = Column(Float, default=0.0)
    status = Column(String(20), default="planned")
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.now)


class FlinkJob(Base):
    __tablename__ = "flink_job"
    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(100), nullable=False)
    job_type = Column(String(20), default="streaming")
    job_id = Column(String(100), default="")
    status = Column(String(20), default="pending")
    submitted_at = Column(DateTime, default=datetime.now)
    last_check = Column(DateTime, default=datetime.now)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
