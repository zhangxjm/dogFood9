from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import SessionLocal, get_db, Warning
from models import WarningResponse, WarningCreate
from services.warning_service import (
    check_gas_warnings,
    check_roof_warnings,
    get_active_warnings,
    handle_warning,
    get_warning_stats,
    trigger_evacuation_check,
)

router = APIRouter()


@router.get("/active", response_model=list[WarningResponse])
def active_warnings(db: Session = Depends(get_db)):
    return get_active_warnings(db)


@router.get("/stats")
def warning_stats(db: Session = Depends(get_db)):
    return get_warning_stats(db)


@router.get("/list", response_model=list[WarningResponse])
def warning_list(
    limit: int = Query(50),
    offset: int = Query(0),
    handled: Optional[bool] = Query(None),
    warning_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Warning)
    if handled is not None:
        query = query.filter(Warning.handled == handled)
    if warning_type is not None:
        query = query.filter(Warning.warning_type == warning_type)
    return query.offset(offset).limit(limit).all()


@router.get("/{warning_id}", response_model=WarningResponse)
def warning_detail(warning_id: int, db: Session = Depends(get_db)):
    return db.query(Warning).filter(Warning.id == warning_id).first()


@router.post("/create", response_model=WarningResponse)
def create_warning(warning: WarningCreate, db: Session = Depends(get_db)):
    db_warning = Warning(**warning.model_dump())
    db.add(db_warning)
    db.commit()
    db.refresh(db_warning)
    return db_warning


@router.put("/{warning_id}/handle", response_model=WarningResponse)
def handle_warning_endpoint(warning_id: int, handler_name: str, db: Session = Depends(get_db)):
    return handle_warning(db, warning_id, handler_name)


@router.post("/check", response_model=list[WarningResponse])
def check_warnings(db: Session = Depends(get_db)):
    new_warnings = []
    new_warnings.extend(check_gas_warnings(db))
    new_warnings.extend(check_roof_warnings(db))
    return new_warnings


@router.get("/evacuation-check")
def evacuation_check(db: Session = Depends(get_db)):
    return trigger_evacuation_check(db)
