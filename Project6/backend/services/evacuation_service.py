import math
from database import EvacuationRoute, Personnel, Warning, MineZone, SessionLocal


def get_evacuation_routes(db):
    return db.query(EvacuationRoute).filter(EvacuationRoute.status == "available").all()


def get_evacuation_route_for_zone(db, zone_id):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        return None
    routes = (
        db.query(EvacuationRoute)
        .filter(EvacuationRoute.zone == zone_id, EvacuationRoute.status == "available")
        .order_by(EvacuationRoute.distance)
        .all()
    )
    if not routes:
        routes = (
            db.query(EvacuationRoute)
            .filter(EvacuationRoute.status == "available")
            .order_by(EvacuationRoute.distance)
            .all()
        )
    return routes[0] if routes else None


def calculate_evacuation_guidance(db, zone_id):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        return None
    route = get_evacuation_route_for_zone(db, zone_id)
    personnel = db.query(Personnel).filter(Personnel.zone == zone_id).all()
    personnel_count = len(personnel)
    personnel_names = [p.name for p in personnel]
    estimated_time = route.estimated_time if route else None
    critical_warnings = db.query(Warning).filter(
        Warning.zone != zone_id,
        Warning.level == "critical",
        Warning.handled == False
    ).all()
    blocked_paths = []
    for w in critical_warnings:
        blocked_zone = db.query(MineZone).filter(MineZone.zone_id == w.zone).first()
        if blocked_zone:
            blocked_paths.append({
                "zone_id": blocked_zone.zone_id,
                "name": blocked_zone.name,
                "warning_type": w.warning_type,
                "level": w.level
            })
    return {
        "zone_id": zone_id,
        "zone_name": zone.name,
        "route": {
            "id": route.id,
            "name": route.name,
            "waypoints": route.waypoints,
            "distance": route.distance,
            "estimated_time": route.estimated_time
        } if route else None,
        "personnel_count": personnel_count,
        "estimated_evacuation_time": estimated_time,
        "personnel_names": personnel_names,
        "blocked_paths": blocked_paths
    }


def trigger_zone_evacuation(db, zone_id):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        return None
    personnel = db.query(Personnel).filter(Personnel.zone == zone_id).all()
    for p in personnel:
        p.status = "evacuating"
    zone.status = "evacuating"
    db.commit()
    return calculate_evacuation_guidance(db, zone_id)


def get_evacuation_status(db):
    evacuating_zones = db.query(MineZone).filter(MineZone.status == "evacuating").all()
    evacuating_personnel = db.query(Personnel).filter(Personnel.status == "evacuating").all()
    completed_zones = db.query(MineZone).filter(MineZone.status == "evacuated").all()
    return {
        "evacuating_zones": [
            {"zone_id": z.zone_id, "name": z.name, "status": z.status}
            for z in evacuating_zones
        ],
        "evacuating_personnel": [
            {"id": p.id, "name": p.name, "zone": p.zone, "status": p.status}
            for p in evacuating_personnel
        ],
        "completed_evacuations": [
            {"zone_id": z.zone_id, "name": z.name, "status": z.status}
            for z in completed_zones
        ]
    }


def find_nearest_refuge(db, zone_id):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        return None
    refuges = db.query(MineZone).filter(MineZone.zone_type == "refuge").all()
    if not refuges:
        return None
    zone_cx = (zone.x_start + zone.x_end) / 2
    zone_cy = (zone.y_start + zone.y_end) / 2
    zone_cz = (zone.z_start + zone.z_end) / 2
    nearest = None
    min_dist = float("inf")
    for refuge in refuges:
        r_cx = (refuge.x_start + refuge.x_end) / 2
        r_cy = (refuge.y_start + refuge.y_end) / 2
        r_cz = (refuge.z_start + refuge.z_end) / 2
        dist = math.sqrt(
            (zone_cx - r_cx) ** 2
            + (zone_cy - r_cy) ** 2
            + (zone_cz - r_cz) ** 2
        )
        if dist < min_dist:
            min_dist = dist
            nearest = refuge
    route = get_evacuation_route_for_zone(db, zone_id)
    return {
        "refuge": {
            "zone_id": nearest.zone_id,
            "name": nearest.name,
            "zone_type": nearest.zone_type,
            "status": nearest.status,
            "center": {
                "x": (nearest.x_start + nearest.x_end) / 2,
                "y": (nearest.y_start + nearest.y_end) / 2,
                "z": (nearest.z_start + nearest.z_end) / 2
            }
        },
        "distance": min_dist,
        "route": {
            "id": route.id,
            "name": route.name,
            "waypoints": route.waypoints,
            "distance": route.distance,
            "estimated_time": route.estimated_time
        } if route else None
    }
