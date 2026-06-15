from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import RiskAlert
from app.schemas import (
    RiskAlertResponse, RiskAlertListResponse, RiskAlertHandle
)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=RiskAlertListResponse)
def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    is_handled: Optional[bool] = None,
    alert_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiskAlert)
    
    if risk_level:
        query = query.filter(RiskAlert.risk_level == risk_level)
    if is_handled is not None:
        query = query.filter(RiskAlert.is_handled == is_handled)
    if alert_type:
        query = query.filter(RiskAlert.alert_type == alert_type)
    
    total = query.count()
    items = query.order_by(desc(RiskAlert.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return RiskAlertListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get("/{alert_id}", response_model=RiskAlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(RiskAlert).filter(RiskAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}/handle", response_model=RiskAlertResponse)
def handle_alert(alert_id: str, handle_data: RiskAlertHandle, db: Session = Depends(get_db)):
    alert = db.query(RiskAlert).filter(RiskAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_handled = handle_data.is_handled
    alert.handled_by = handle_data.handled_by
    alert.handle_notes = handle_data.handle_notes
    
    if handle_data.is_handled:
        alert.handled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    
    return alert


@router.get("/stats/summary")
def get_alert_stats(db: Session = Depends(get_db)):
    total = db.query(RiskAlert).count()
    pending = db.query(RiskAlert).filter(RiskAlert.is_handled == False).count()
    
    critical = db.query(RiskAlert).filter(RiskAlert.risk_level == "critical").count()
    high = db.query(RiskAlert).filter(RiskAlert.risk_level == "high").count()
    medium = db.query(RiskAlert).filter(RiskAlert.risk_level == "medium").count()
    low = db.query(RiskAlert).filter(RiskAlert.risk_level == "low").count()
    
    return {
        "total": total,
        "pending": pending,
        "by_level": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        },
        "pending_by_level": {
            "critical": db.query(RiskAlert).filter(RiskAlert.risk_level == "critical", RiskAlert.is_handled == False).count(),
            "high": db.query(RiskAlert).filter(RiskAlert.risk_level == "high", RiskAlert.is_handled == False).count(),
            "medium": db.query(RiskAlert).filter(RiskAlert.risk_level == "medium", RiskAlert.is_handled == False).count(),
            "low": db.query(RiskAlert).filter(RiskAlert.risk_level == "low", RiskAlert.is_handled == False).count()
        }
    }
