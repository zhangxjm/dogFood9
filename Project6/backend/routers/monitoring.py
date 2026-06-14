from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from database import SessionLocal, get_db, Personnel, GasSensor, VentilationEquipment, RoofSensor, MonitoringData
from models import PersonnelResponse, GasSensorResponse, VentilationResponse, RoofSensorResponse, MonitoringDataResponse

router = APIRouter()


@router.get("/personnel", response_model=List[PersonnelResponse])
def list_personnel(
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Personnel)
    if zone:
        query = query.filter(Personnel.zone == zone)
    if status:
        query = query.filter(Personnel.status == status)
    return query.all()


@router.get("/personnel/{personnel_id}", response_model=PersonnelResponse)
def get_personnel(personnel_id: int, db: Session = Depends(get_db)):
    return db.query(Personnel).filter(Personnel.id == personnel_id).first()


@router.get("/gas-sensors", response_model=List[GasSensorResponse])
def list_gas_sensors(
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(GasSensor)
    if zone:
        query = query.filter(GasSensor.zone == zone)
    if status:
        query = query.filter(GasSensor.status == status)
    return query.all()


@router.get("/gas-sensors/{sensor_id}", response_model=GasSensorResponse)
def get_gas_sensor(sensor_id: str, db: Session = Depends(get_db)):
    return db.query(GasSensor).filter(GasSensor.sensor_id == sensor_id).first()


@router.get("/ventilation", response_model=List[VentilationResponse])
def list_ventilation(
    zone: Optional[str] = Query(None),
    running: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(VentilationEquipment)
    if zone:
        query = query.filter(VentilationEquipment.zone == zone)
    if running is not None:
        query = query.filter(VentilationEquipment.running == running)
    return query.all()


@router.get("/ventilation/{equip_id}", response_model=VentilationResponse)
def get_ventilation(equip_id: str, db: Session = Depends(get_db)):
    return db.query(VentilationEquipment).filter(VentilationEquipment.equip_id == equip_id).first()


@router.get("/roof-sensors", response_model=List[RoofSensorResponse])
def list_roof_sensors(
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RoofSensor)
    if zone:
        query = query.filter(RoofSensor.zone == zone)
    if status:
        query = query.filter(RoofSensor.status == status)
    return query.all()


@router.get("/roof-sensors/{sensor_id}", response_model=RoofSensorResponse)
def get_roof_sensor(sensor_id: str, db: Session = Depends(get_db)):
    return db.query(RoofSensor).filter(RoofSensor.sensor_id == sensor_id).first()


@router.get("/monitoring-data", response_model=List[MonitoringDataResponse])
def list_monitoring_data(
    data_type: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    query = db.query(MonitoringData)
    if data_type:
        query = query.filter(MonitoringData.data_type == data_type)
    query = query.order_by(MonitoringData.recorded_at.desc()).limit(limit)
    return query.all()


@router.get("/history/{source_id}", response_model=List[MonitoringDataResponse])
def get_history(
    source_id: str,
    hours: int = Query(24),
    db: Session = Depends(get_db)
):
    since = datetime.now() - timedelta(hours=hours)
    return db.query(MonitoringData).filter(
        MonitoringData.source_id == source_id,
        MonitoringData.recorded_at >= since
    ).order_by(MonitoringData.recorded_at.desc()).all()
