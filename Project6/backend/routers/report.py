from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import SafetyReportResponse
from services.report_service import (
    generate_daily_report,
    generate_weekly_report,
    generate_monthly_report,
    get_reports,
    get_report_content,
    export_report_excel,
)

router = APIRouter()


@router.post("/generate/daily")
def generate_daily(db: Session = Depends(get_db)):
    return generate_daily_report(db)


@router.post("/generate/weekly")
def generate_weekly(db: Session = Depends(get_db)):
    return generate_weekly_report(db)


@router.post("/generate/monthly")
def generate_monthly(db: Session = Depends(get_db)):
    return generate_monthly_report(db)


@router.get("/list")
def list_reports(
    report_type: str = Query(None),
    limit: int = Query(20),
    db: Session = Depends(get_db),
):
    return get_reports(db, report_type=report_type, limit=limit)


@router.get("/{report_id}", response_model=SafetyReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    return get_report_content(db, report_id)


@router.get("/{report_id}/export")
def export_report(report_id: int, db: Session = Depends(get_db)):
    return export_report_excel(db, report_id)
