from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PersonnelResponse(BaseModel):
    id: int
    name: str
    employee_id: str
    role: str
    team: str
    x: float
    y: float
    z: float
    zone: str
    status: str
    enter_time: Optional[datetime] = None
    last_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class GasSensorResponse(BaseModel):
    id: int
    sensor_id: str
    name: str
    zone: str
    x: float
    y: float
    z: float
    gas_type: str
    value: float
    unit: str
    threshold_warning: float
    threshold_critical: float
    status: str
    last_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class VentilationResponse(BaseModel):
    id: int
    equip_id: str
    name: str
    zone: str
    x: float
    y: float
    z: float
    equip_type: str
    airflow_rate: float
    power: float
    running: bool
    status: str
    last_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoofSensorResponse(BaseModel):
    id: int
    sensor_id: str
    name: str
    zone: str
    x: float
    y: float
    z: float
    stress_value: float
    displacement: float
    threshold_warning: float
    threshold_critical: float
    status: str
    last_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class WarningResponse(BaseModel):
    id: int
    warning_type: str
    level: str
    zone: str
    sensor_id: Optional[str] = None
    value: float
    threshold: float
    message: str
    handled: bool
    created_at: Optional[datetime] = None
    handled_at: Optional[datetime] = None
    handled_by: Optional[str] = None

    class Config:
        from_attributes = True


class WarningCreate(BaseModel):
    warning_type: str
    level: str
    zone: str
    sensor_id: Optional[str] = None
    value: float = 0.0
    threshold: float = 0.0
    message: str


class EvacuationRouteResponse(BaseModel):
    id: int
    name: str
    zone: str
    waypoints: str
    distance: float
    estimated_time: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MineZoneResponse(BaseModel):
    id: int
    zone_id: str
    name: str
    level: int
    zone_type: str
    x_start: float
    y_start: float
    z_start: float
    x_end: float
    y_end: float
    z_end: float
    status: str

    class Config:
        from_attributes = True


class MonitoringDataResponse(BaseModel):
    id: int
    data_type: str
    source_id: str
    value: float
    unit: str
    zone: str
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SafetyReportResponse(BaseModel):
    id: int
    report_type: str
    title: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    content: str
    file_path: str
    generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MiningPlanResponse(BaseModel):
    id: int
    plan_name: str
    zone: str
    plan_type: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_output: float
    actual_output: float
    status: str
    description: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MiningPlanCreate(BaseModel):
    plan_name: str
    zone: str
    plan_type: str = "excavation"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_output: float = 0.0
    description: str = ""


class FlinkJobResponse(BaseModel):
    id: int
    job_name: str
    job_type: str
    job_id: str
    status: str
    submitted_at: Optional[datetime] = None
    last_check: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_personnel: int
    underground_personnel: int
    gas_sensors: int
    gas_warnings: int
    ventilation_running: int
    ventilation_total: int
    roof_warnings: int
    active_warnings: int
    zones_normal: int
    zones_total: int


class RealtimeDataPoint(BaseModel):
    timestamp: str
    type: str
    source_id: str
    value: float
    unit: str
    zone: str
    status: str
