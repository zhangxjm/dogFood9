from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import math

from database import get_db, SessionLocal, MineZone, Personnel, GasSensor, VentilationEquipment, RoofSensor, Warning

router = APIRouter()

STATUS_COLORS = {
    "normal": "#4CAF50",
    "warning": "#FF9800",
    "critical": "#F44336",
    "danger": "#F44336",
    "evacuated": "#9C27B0",
    "maintenance": "#2196F3",
}


@router.get("/scene")
def get_scene(db: Session = Depends(get_db)):
    zones = db.query(MineZone).all()
    personnel = db.query(Personnel).all()
    gas_sensors = db.query(GasSensor).all()
    roof_sensors = db.query(RoofSensor).all()
    ventilation = db.query(VentilationEquipment).all()
    warnings = db.query(Warning).filter(Warning.handled == False).all()

    zone_list = []
    for z in zones:
        zone_list.append({
            "zone_id": z.zone_id,
            "name": z.name,
            "level": z.level,
            "zone_type": z.zone_type,
            "geometry": {
                "x_start": z.x_start,
                "y_start": z.y_start,
                "z_start": z.z_start,
                "x_end": z.x_end,
                "y_end": z.y_end,
                "z_end": z.z_end,
            },
            "status": z.status,
            "color": STATUS_COLORS.get(z.status, "#9E9E9E"),
        })

    personnel_list = []
    for p in personnel:
        personnel_list.append({
            "id": p.id,
            "name": p.name,
            "employee_id": p.employee_id,
            "role": p.role,
            "team": p.team,
            "position": {"x": p.x, "y": p.y, "z": p.z},
            "zone": p.zone,
            "status": p.status,
        })

    sensor_list = []
    for s in gas_sensors:
        sensor_list.append({
            "id": s.id,
            "sensor_id": s.sensor_id,
            "name": s.name,
            "type": "gas",
            "zone": s.zone,
            "position": {"x": s.x, "y": s.y, "z": s.z},
            "value": s.value,
            "status": s.status,
        })
    for s in roof_sensors:
        sensor_list.append({
            "id": s.id,
            "sensor_id": s.sensor_id,
            "name": s.name,
            "type": "roof",
            "zone": s.zone,
            "position": {"x": s.x, "y": s.y, "z": s.z},
            "value": s.stress_value,
            "status": s.status,
        })

    ventilation_list = []
    for v in ventilation:
        ventilation_list.append({
            "id": v.id,
            "equip_id": v.equip_id,
            "name": v.name,
            "zone": v.zone,
            "position": {"x": v.x, "y": v.y, "z": v.z},
            "equip_type": v.equip_type,
            "airflow_rate": v.airflow_rate,
            "running": v.running,
            "status": v.status,
        })

    warning_list = []
    for w in warnings:
        warning_list.append({
            "id": w.id,
            "warning_type": w.warning_type,
            "level": w.level,
            "zone": w.zone,
            "sensor_id": w.sensor_id,
            "value": w.value,
            "threshold": w.threshold,
            "message": w.message,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        })

    connections = _compute_connections(zones)

    return {
        "zones": zone_list,
        "personnel": personnel_list,
        "sensors": sensor_list,
        "ventilation": ventilation_list,
        "warnings": warning_list,
        "connections": connections,
    }


@router.get("/scene/zone/{zone_id}")
def get_zone_scene(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    personnel = db.query(Personnel).filter(Personnel.zone == zone_id).all()
    gas_sensors = db.query(GasSensor).filter(GasSensor.zone == zone_id).all()
    roof_sensors = db.query(RoofSensor).filter(RoofSensor.zone == zone_id).all()
    ventilation = db.query(VentilationEquipment).filter(VentilationEquipment.zone == zone_id).all()
    warnings = db.query(Warning).filter(Warning.zone == zone_id, Warning.handled == False).all()

    personnel_list = [
        {
            "id": p.id,
            "name": p.name,
            "employee_id": p.employee_id,
            "role": p.role,
            "team": p.team,
            "position": {"x": p.x, "y": p.y, "z": p.z},
            "status": p.status,
        }
        for p in personnel
    ]

    sensor_list = []
    for s in gas_sensors:
        sensor_list.append({
            "id": s.id,
            "sensor_id": s.sensor_id,
            "name": s.name,
            "type": "gas",
            "position": {"x": s.x, "y": s.y, "z": s.z},
            "gas_type": s.gas_type,
            "value": s.value,
            "unit": s.unit,
            "status": s.status,
        })
    for s in roof_sensors:
        sensor_list.append({
            "id": s.id,
            "sensor_id": s.sensor_id,
            "name": s.name,
            "type": "roof",
            "position": {"x": s.x, "y": s.y, "z": s.z},
            "stress_value": s.stress_value,
            "displacement": s.displacement,
            "status": s.status,
        })

    ventilation_list = [
        {
            "id": v.id,
            "equip_id": v.equip_id,
            "name": v.name,
            "position": {"x": v.x, "y": v.y, "z": v.z},
            "equip_type": v.equip_type,
            "airflow_rate": v.airflow_rate,
            "running": v.running,
            "status": v.status,
        }
        for v in ventilation
    ]

    warning_list = [
        {
            "id": w.id,
            "warning_type": w.warning_type,
            "level": w.level,
            "sensor_id": w.sensor_id,
            "value": w.value,
            "threshold": w.threshold,
            "message": w.message,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in warnings
    ]

    return {
        "zone": {
            "zone_id": zone.zone_id,
            "name": zone.name,
            "level": zone.level,
            "zone_type": zone.zone_type,
            "geometry": {
                "x_start": zone.x_start,
                "y_start": zone.y_start,
                "z_start": zone.z_start,
                "x_end": zone.x_end,
                "y_end": zone.y_end,
                "z_end": zone.z_end,
            },
            "status": zone.status,
            "color": STATUS_COLORS.get(zone.status, "#9E9E9E"),
        },
        "personnel": personnel_list,
        "sensors": sensor_list,
        "ventilation": ventilation_list,
        "warnings": warning_list,
    }


@router.get("/tunnel-network")
def get_tunnel_network(db: Session = Depends(get_db)):
    zones = db.query(MineZone).all()
    nodes = []
    for z in zones:
        cx = (z.x_start + z.x_end) / 2
        cy = (z.y_start + z.y_end) / 2
        cz = (z.z_start + z.z_end) / 2
        nodes.append({
            "zone_id": z.zone_id,
            "name": z.name,
            "level": z.level,
            "zone_type": z.zone_type,
            "position": {"x": cx, "y": cy, "z": cz},
            "status": z.status,
        })

    edges = []
    seen = set()
    for i, a in enumerate(zones):
        for j, b in enumerate(zones):
            if j <= i:
                continue
            if _zones_adjacent(a, b):
                pair = (a.zone_id, b.zone_id)
                if pair not in seen:
                    seen.add(pair)
                    edges.append({"source": a.zone_id, "target": b.zone_id})

    return {"nodes": nodes, "edges": edges}


@router.get("/heatmap/{metric}")
def get_heatmap(metric: str, db: Session = Depends(get_db)):
    if metric not in ("gas", "stress", "personnel_density"):
        raise HTTPException(status_code=400, detail="Invalid metric. Use: gas, stress, personnel_density")

    zones = db.query(MineZone).all()
    result = []

    for z in zones:
        cx = (z.x_start + z.x_end) / 2
        cy = (z.y_start + z.y_end) / 2
        cz = (z.z_start + z.z_end) / 2
        value = 0.0

        if metric == "gas":
            sensors = db.query(GasSensor).filter(GasSensor.zone == z.zone_id).all()
            if sensors:
                value = max(s.value for s in sensors)

        elif metric == "stress":
            sensors = db.query(RoofSensor).filter(RoofSensor.zone == z.zone_id).all()
            if sensors:
                value = max(s.stress_value for s in sensors)

        elif metric == "personnel_density":
            count = db.query(Personnel).filter(Personnel.zone == z.zone_id).count()
            volume = abs(z.x_end - z.x_start) * abs(z.y_end - z.y_start) * abs(z.z_end - z.z_start)
            if volume > 0:
                value = count / volume

        result.append({
            "zone_id": z.zone_id,
            "value": round(value, 4),
            "x": cx,
            "y": cy,
            "z": cz,
        })

    return result


@router.get("/realtime-positions")
def get_realtime_positions(db: Session = Depends(get_db)):
    personnel = db.query(Personnel).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "employee_id": p.employee_id,
            "role": p.role,
            "team": p.team,
            "position": {"x": p.x, "y": p.y, "z": p.z},
            "zone": p.zone,
            "status": p.status,
            "last_update": p.last_update.isoformat() if p.last_update else None,
        }
        for p in personnel
    ]


def _zones_adjacent(a: MineZone, b: MineZone) -> bool:
    overlap_tolerance = 1.0
    x_overlap = not (a.x_end < b.x_start - overlap_tolerance or b.x_end < a.x_start - overlap_tolerance)
    y_overlap = not (a.y_end < b.y_start - overlap_tolerance or b.y_end < a.y_start - overlap_tolerance)
    z_overlap = not (a.z_end < b.z_start - overlap_tolerance or b.z_end < a.z_start - overlap_tolerance)

    touching_x = abs(a.x_end - b.x_start) <= overlap_tolerance or abs(b.x_end - a.x_start) <= overlap_tolerance
    touching_y = abs(a.y_end - b.y_start) <= overlap_tolerance or abs(b.y_end - a.y_start) <= overlap_tolerance
    touching_z = abs(a.z_end - b.z_start) <= overlap_tolerance or abs(b.z_end - a.z_start) <= overlap_tolerance

    if x_overlap and y_overlap and touching_z:
        return True
    if x_overlap and z_overlap and touching_y:
        return True
    if y_overlap and z_overlap and touching_x:
        return True
    return False


def _compute_connections(zones: list) -> list:
    connections = []
    seen = set()
    for i, a in enumerate(zones):
        for j, b in enumerate(zones):
            if j <= i:
                continue
            if _zones_adjacent(a, b):
                pair = (a.zone_id, b.zone_id)
                if pair not in seen:
                    seen.add(pair)
                    connections.append({"source": a.zone_id, "target": b.zone_id})
    return connections
