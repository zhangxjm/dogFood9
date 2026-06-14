from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import EvacuationRouteResponse
from services.evacuation_service import (
    get_evacuation_routes,
    get_evacuation_route_for_zone,
    calculate_evacuation_guidance,
    trigger_zone_evacuation,
    get_evacuation_status,
    find_nearest_refuge,
)

router = APIRouter()


@router.get("/routes")
def read_evacuation_routes(db: Session = Depends(get_db)):
    return get_evacuation_routes(db)


@router.get("/route/{zone_id}")
def read_evacuation_route_for_zone(zone_id: int, db: Session = Depends(get_db)):
    return get_evacuation_route_for_zone(db, zone_id)


@router.get("/guidance/{zone_id}")
def read_evacuation_guidance(zone_id: int, db: Session = Depends(get_db)):
    return calculate_evacuation_guidance(db, zone_id)


@router.post("/trigger/{zone_id}")
def trigger_evacuation(zone_id: int, db: Session = Depends(get_db)):
    return trigger_zone_evacuation(db, zone_id)


@router.get("/status")
def read_evacuation_status(db: Session = Depends(get_db)):
    return get_evacuation_status(db)


@router.get("/refuge/{zone_id}")
def read_nearest_refuge(zone_id: int, db: Session = Depends(get_db)):
    return find_nearest_refuge(db, zone_id)
