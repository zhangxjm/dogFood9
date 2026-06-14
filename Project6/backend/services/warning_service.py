from datetime import datetime
from sqlalchemy.orm import Session
from database import Warning, GasSensor, RoofSensor, MineZone, SessionLocal


def check_gas_warnings():
    db = SessionLocal()
    try:
        sensors = db.query(GasSensor).all()
        zone_map = {z.zone_id: z.name for z in db.query(MineZone).all()}
        for sensor in sensors:
            zone_name = zone_map.get(sensor.zone, sensor.zone)
            level = None
            threshold = None
            if sensor.value >= sensor.threshold_critical:
                level = "critical"
                threshold = sensor.threshold_critical
            elif sensor.value >= sensor.threshold_warning:
                level = "warning"
                threshold = sensor.threshold_warning
            if level:
                existing = db.query(Warning).filter(
                    Warning.sensor_id == sensor.sensor_id,
                    Warning.warning_type == "gas_overlimit",
                    Warning.handled == False,
                ).first()
                if existing:
                    existing.value = sensor.value
                    existing.threshold = threshold
                    existing.level = level
                    existing.message = f"{zone_name}{sensor.gas_type}浓度超过{level}阈值，当前值: {sensor.value}{sensor.unit}"
                    existing.created_at = datetime.now()
                else:
                    warning = Warning(
                        warning_type="gas_overlimit",
                        level=level,
                        zone=sensor.zone,
                        sensor_id=sensor.sensor_id,
                        value=sensor.value,
                        threshold=threshold,
                        message=f"{zone_name}{sensor.gas_type}浓度超过{level}阈值，当前值: {sensor.value}{sensor.unit}",
                    )
                    db.add(warning)
        db.commit()
    finally:
        db.close()


def check_roof_warnings():
    db = SessionLocal()
    try:
        sensors = db.query(RoofSensor).all()
        zone_map = {z.zone_id: z.name for z in db.query(MineZone).all()}
        for sensor in sensors:
            zone_name = zone_map.get(sensor.zone, sensor.zone)
            level = None
            threshold = None
            if sensor.stress_value >= sensor.threshold_critical:
                level = "critical"
                threshold = sensor.threshold_critical
            elif sensor.stress_value >= sensor.threshold_warning:
                level = "warning"
                threshold = sensor.threshold_warning
            if level:
                existing = db.query(Warning).filter(
                    Warning.sensor_id == sensor.sensor_id,
                    Warning.warning_type == "roof_stress",
                    Warning.handled == False,
                ).first()
                if existing:
                    existing.value = sensor.stress_value
                    existing.threshold = threshold
                    existing.level = level
                    existing.message = f"{zone_name}顶板应力超过{level}阈值，当前值: {sensor.stress_value}"
                    existing.created_at = datetime.now()
                else:
                    warning = Warning(
                        warning_type="roof_stress",
                        level=level,
                        zone=sensor.zone,
                        sensor_id=sensor.sensor_id,
                        value=sensor.stress_value,
                        threshold=threshold,
                        message=f"{zone_name}顶板应力超过{level}阈值，当前值: {sensor.stress_value}",
                    )
                    db.add(warning)
        db.commit()
    finally:
        db.close()


def get_active_warnings(db: Session):
    return db.query(Warning).filter(Warning.handled == False).order_by(Warning.created_at.desc()).all()


def handle_warning(db: Session, warning_id: int, handler_name: str):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if warning:
        warning.handled = True
        warning.handled_at = datetime.now()
        warning.handled_by = handler_name
        db.commit()
        db.refresh(warning)
    return warning


def get_warning_stats(db: Session):
    warnings = db.query(Warning).all()
    total = len(warnings)
    active = sum(1 for w in warnings if not w.handled)
    by_type = {}
    by_level = {}
    by_zone = {}
    for w in warnings:
        by_type[w.warning_type] = by_type.get(w.warning_type, 0) + 1
        by_level[w.level] = by_level.get(w.level, 0) + 1
        by_zone[w.zone] = by_zone.get(w.zone, 0) + 1
    return {
        "total": total,
        "active": active,
        "by_type": by_type,
        "by_level": by_level,
        "by_zone": by_zone,
    }


def trigger_evacuation_check(db: Session):
    critical_warnings = db.query(Warning).filter(
        Warning.handled == False,
        Warning.level == "critical",
    ).all()
    zone_critical_count = {}
    for w in critical_warnings:
        zone_critical_count[w.zone] = zone_critical_count.get(w.zone, 0) + 1
    zone_map = {z.zone_id: z.name for z in db.query(MineZone).all()}
    evacuation_zones = []
    for zone_id, count in zone_critical_count.items():
        if count >= 2:
            evacuation_zones.append({
                "zone_id": zone_id,
                "zone_name": zone_map.get(zone_id, zone_id),
                "critical_count": count,
            })
    return evacuation_zones
