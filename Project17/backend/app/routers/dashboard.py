from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, case
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Transaction, RiskAlert, CaseFile
from app.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    total_transactions = db.query(Transaction).count()
    today_transactions = db.query(Transaction).filter(Transaction.created_at >= today_start).count()
    total_fraud = db.query(Transaction).filter(Transaction.is_fraud == True).count()
    fraud_rate = (total_fraud / total_transactions * 100) if total_transactions > 0 else 0
    
    total_alerts = db.query(RiskAlert).count()
    pending_alerts = db.query(RiskAlert).filter(RiskAlert.is_handled == False).count()
    
    total_cases = db.query(CaseFile).count()
    open_cases = db.query(CaseFile).filter(CaseFile.case_status == "open").count()
    
    total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0
    
    high_risk_count = db.query(Transaction).filter(Transaction.risk_score >= 60).count()
    
    return DashboardStats(
        total_transactions=total_transactions,
        today_transactions=today_transactions,
        total_fraud=total_fraud,
        fraud_rate=round(fraud_rate, 2),
        total_alerts=total_alerts,
        pending_alerts=pending_alerts,
        total_cases=total_cases,
        open_cases=open_cases,
        total_amount=round(total_amount, 2),
        high_risk_count=high_risk_count
    )


@router.get("/chart/transactions")
def get_transaction_chart(db: Session = Depends(get_db)):
    days = 30
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    results = db.query(
        func.date(Transaction.created_at).label('date'),
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.created_at >= start_date
    ).group_by(
        func.date(Transaction.created_at)
    ).order_by(
        'date'
    ).all()
    
    fraud_results = db.query(
        func.date(Transaction.created_at).label('date'),
        func.count(Transaction.id).label('fraud_count')
    ).filter(
        Transaction.created_at >= start_date,
        Transaction.is_fraud == True
    ).group_by(
        func.date(Transaction.created_at)
    ).all()
    
    fraud_map = {str(row.date): row.fraud_count for row in fraud_results}
    
    date_map = {}
    for i in range(days):
        date = (end_date - timedelta(days=days - 1 - i)).date()
        date_str = str(date)
        date_map[date_str] = {
            "date": date_str,
            "count": 0,
            "amount": 0,
            "fraud_count": fraud_map.get(date_str, 0)
        }
    
    for row in results:
        date_str = str(row.date)
        if date_str in date_map:
            date_map[date_str]["count"] = row.count or 0
            date_map[date_str]["amount"] = float(row.amount or 0)
    
    return {"data": list(date_map.values())}


@router.get("/chart/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    critical = db.query(Transaction).filter(Transaction.risk_score >= 85).count()
    high = db.query(Transaction).filter(and_(Transaction.risk_score >= 60, Transaction.risk_score < 85)).count()
    medium = db.query(Transaction).filter(and_(Transaction.risk_score >= 30, Transaction.risk_score < 60)).count()
    low = db.query(Transaction).filter(Transaction.risk_score < 30).count()
    
    return {
        "data": [
            {"level": "critical", "label": "极高风险", "count": critical, "color": "#ef4444"},
            {"level": "high", "label": "高风险", "count": high, "color": "#f97316"},
            {"level": "medium", "label": "中风险", "count": medium, "color": "#eab308"},
            {"level": "low", "label": "低风险", "count": low, "color": "#22c55e"}
        ]
    }


@router.get("/chart/fraud-types")
def get_fraud_types(db: Session = Depends(get_db)):
    results = db.query(
        Transaction.fraud_type,
        func.count(Transaction.id).label('count')
    ).filter(
        Transaction.is_fraud == True,
        Transaction.fraud_type.isnot(None)
    ).group_by(
        Transaction.fraud_type
    ).order_by(
        desc('count')
    ).all()
    
    return {
        "data": [
            {"type": row.fraud_type, "count": row.count}
            for row in results
        ]
    }


@router.get("/chart/top-fraud-users")
def get_top_fraud_users(db: Session = Depends(get_db), limit: int = 10):
    results = db.query(
        Transaction.user_id,
        func.count(Transaction.id).label('fraud_count'),
        func.sum(Transaction.amount).label('fraud_amount')
    ).filter(
        Transaction.is_fraud == True
    ).group_by(
        Transaction.user_id
    ).order_by(
        desc('fraud_count')
    ).limit(limit).all()
    
    return {
        "data": [
            {"user_id": row.user_id, "fraud_count": row.fraud_count, "fraud_amount": float(row.fraud_amount or 0)}
            for row in results
        ]
    }


@router.get("/recent-alerts")
def get_recent_alerts(db: Session = Depends(get_db), limit: int = 10):
    alerts = db.query(RiskAlert).order_by(desc(RiskAlert.created_at)).limit(limit).all()
    return {"data": alerts}


@router.get("/recent-transactions")
def get_recent_transactions(db: Session = Depends(get_db), limit: int = 10):
    transactions = db.query(Transaction).order_by(desc(Transaction.created_at)).limit(limit).all()
    return {"data": transactions}
