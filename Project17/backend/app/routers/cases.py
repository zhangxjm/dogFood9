from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.models import CaseFile, Transaction
from app.schemas import (
    CaseFileCreate, CaseFileResponse, CaseFileUpdate, CaseFileListResponse
)

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=CaseFileListResponse)
def get_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    case_status: Optional[str] = None,
    severity: Optional[str] = None,
    analyst: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CaseFile)
    
    if case_status:
        query = query.filter(CaseFile.case_status == case_status)
    if severity:
        query = query.filter(CaseFile.severity == severity)
    if analyst:
        query = query.filter(CaseFile.analyst == analyst)
    
    total = query.count()
    items = query.order_by(desc(CaseFile.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return CaseFileListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get("/{case_id}", response_model=CaseFileResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseFile).filter(CaseFile.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("", response_model=CaseFileResponse)
def create_case(case: CaseFileCreate, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == case.transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    case_id = f"CASE{uuid.uuid4().hex[:10].upper()}"
    
    db_case = CaseFile(
        case_id=case_id,
        **case.model_dump()
    )
    
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    return db_case


@router.put("/{case_id}", response_model=CaseFileResponse)
def update_case(case_id: str, case_update: CaseFileUpdate, db: Session = Depends(get_db)):
    db_case = db.query(CaseFile).filter(CaseFile.case_id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = case_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_case, key, value)
    
    if 'case_status' in update_data and update_data['case_status'] == 'closed':
        db_case.closed_at = datetime.utcnow()
    
    db_case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_case)
    
    return db_case


@router.get("/stats/summary")
def get_case_stats(db: Session = Depends(get_db)):
    total = db.query(CaseFile).count()
    open_cases = db.query(CaseFile).filter(CaseFile.case_status == "open").count()
    investigating = db.query(CaseFile).filter(CaseFile.case_status == "investigating").count()
    closed = db.query(CaseFile).filter(CaseFile.case_status == "closed").count()
    
    critical = db.query(CaseFile).filter(CaseFile.severity == "critical").count()
    high = db.query(CaseFile).filter(CaseFile.severity == "high").count()
    medium = db.query(CaseFile).filter(CaseFile.severity == "medium").count()
    low = db.query(CaseFile).filter(CaseFile.severity == "low").count()
    
    return {
        "total": total,
        "by_status": {
            "open": open_cases,
            "investigating": investigating,
            "closed": closed
        },
        "by_severity": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        }
    }
