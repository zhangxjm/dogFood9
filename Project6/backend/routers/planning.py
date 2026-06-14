from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db, SessionLocal, MiningPlan, MineZone
from models import MiningPlanResponse, MiningPlanCreate

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str


class ProgressUpdate(BaseModel):
    actual_output: float


@router.get("/plans", response_model=List[MiningPlanResponse])
def list_plans(
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MiningPlan)
    if zone:
        query = query.filter(MiningPlan.zone == zone)
    if status:
        query = query.filter(MiningPlan.status == status)
    return query.all()


@router.get("/plans/{plan_id}", response_model=MiningPlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(MiningPlan).filter(MiningPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mining plan not found")
    return plan


@router.post("/plans", response_model=MiningPlanResponse)
def create_plan(plan: MiningPlanCreate, db: Session = Depends(get_db)):
    data = plan.model_dump()
    if data.get("start_date") is None:
        data["start_date"] = datetime.now()
    if data.get("end_date") is None:
        data["end_date"] = datetime.now() + timedelta(days=30)
    db_plan = MiningPlan(**data)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.put("/plans/{plan_id}/status", response_model=MiningPlanResponse)
def update_plan_status(plan_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["planned", "in_progress", "completed", "cancelled"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")
    plan = db.query(MiningPlan).filter(MiningPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mining plan not found")
    plan.status = body.status
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/plans/{plan_id}/progress", response_model=MiningPlanResponse)
def update_plan_progress(plan_id: int, body: ProgressUpdate, db: Session = Depends(get_db)):
    plan = db.query(MiningPlan).filter(MiningPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mining plan not found")
    plan.actual_output = body.actual_output
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/zones")
def list_zones(
    zone_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MineZone)
    if zone_type:
        query = query.filter(MineZone.zone_type == zone_type)
    return query.all()


@router.get("/zones/{zone_id}")
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.put("/zones/{zone_id}/status")
def update_zone_status(zone_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    zone = db.query(MineZone).filter(MineZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    zone.status = body.status
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/dashboard")
def planning_dashboard(db: Session = Depends(get_db)):
    plans = db.query(MiningPlan).all()
    zones = db.query(MineZone).all()

    plans_summary = {
        "total": len(plans),
        "planned": len([p for p in plans if p.status == "planned"]),
        "in_progress": len([p for p in plans if p.status == "in_progress"]),
        "completed": len([p for p in plans if p.status == "completed"]),
        "cancelled": len([p for p in plans if p.status == "cancelled"]),
    }

    zone_utilization = {
        "total": len(zones),
        "normal": len([z for z in zones if z.status == "normal"]),
        "warning": len([z for z in zones if z.status == "warning"]),
        "critical": len([z for z in zones if z.status == "critical"]),
        "maintenance": len([z for z in zones if z.status == "maintenance"]),
    }

    active_plans = [p for p in plans if p.status == "in_progress"]
    production_progress = []
    for p in active_plans:
        progress_pct = (p.actual_output / p.target_output * 100) if p.target_output > 0 else 0
        production_progress.append({
            "plan_id": p.id,
            "plan_name": p.plan_name,
            "zone": p.zone,
            "target_output": p.target_output,
            "actual_output": p.actual_output,
            "progress_pct": round(progress_pct, 2),
        })

    return {
        "plans_summary": plans_summary,
        "zone_utilization": zone_utilization,
        "production_progress": production_progress,
    }
