from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models import Transaction, RiskAlert, CaseFile
from app.schemas import (
    TransactionCreate, TransactionResponse, TransactionListResponse,
    FraudDetectionResult
)
from app.ml_model import get_model
from app.rule_engine import get_rule_engine

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    is_fraud: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    if status:
        query = query.filter(Transaction.status == status)
    if is_fraud is not None:
        query = query.filter(Transaction.is_fraud == is_fraud)
    if risk_level:
        if risk_level == "critical":
            query = query.filter(Transaction.risk_score >= 85)
        elif risk_level == "high":
            query = query.filter(and_(Transaction.risk_score >= 60, Transaction.risk_score < 85))
        elif risk_level == "medium":
            query = query.filter(and_(Transaction.risk_score >= 30, Transaction.risk_score < 60))
        elif risk_level == "low":
            query = query.filter(Transaction.risk_score < 30)
    if start_date:
        query = query.filter(Transaction.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.created_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    items = query.order_by(desc(Transaction.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return TransactionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    model = get_model()
    rule_engine = get_rule_engine(db)
    
    transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
    
    db_transaction = Transaction(
        transaction_id=transaction_id,
        **transaction.model_dump()
    )
    
    context = _build_context(db, transaction)
    
    ml_result = model.predict({
        'amount': transaction.amount,
        'transaction_type': transaction.transaction_type,
        'hour': datetime.now().hour,
        'day_of_week': datetime.now().weekday(),
        'new_device': context.get('new_device', False),
        'location_change': context.get('location_change', False),
        'merchant_risk': context.get('merchant_risk', 'low'),
        'user_history_score': context.get('user_history_score', 0.5)
    })
    
    rule_result = rule_engine.evaluate_transaction(db_transaction, context)
    
    combined_score = (ml_result['ml_risk_score'] * 0.6) + (rule_result['risk_score'] * 0.4)
    is_fraud = combined_score >= 60
    
    if combined_score >= 85:
        risk_level = "critical"
    elif combined_score >= 60:
        risk_level = "high"
    elif combined_score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    db_transaction.risk_score = round(combined_score, 2)
    db_transaction.is_fraud = is_fraud
    
    if is_fraud:
        db_transaction.status = "flagged"
        if combined_score >= 85:
            db_transaction.fraud_type = "高风险欺诈嫌疑"
        elif combined_score >= 70:
            db_transaction.fraud_type = "中等欺诈嫌疑"
        else:
            db_transaction.fraud_type = "低风险欺诈嫌疑"
    else:
        db_transaction.status = "completed"
    
    db.add(db_transaction)
    
    if combined_score >= 30:
        alert_id = f"ALERT{uuid.uuid4().hex[:10].upper()}"
        triggered_rules_str = ", ".join([r['rule_name'] for r in rule_result['triggered_rules']])
        
        alert = RiskAlert(
            alert_id=alert_id,
            transaction_id=transaction_id,
            risk_level=risk_level,
            risk_score=round(combined_score, 2),
            alert_type="risk_detection",
            description=f"风险评分{round(combined_score, 2)}，触发规则: {triggered_rules_str if triggered_rules_str else '无'}",
            rule_triggered=triggered_rules_str if triggered_rules_str else None,
            is_handled=False,
            created_at=datetime.utcnow()
        )
        db.add(alert)
    
    if is_fraud:
        case_id = f"CASE{uuid.uuid4().hex[:10].upper()}"
        case_file = CaseFile(
            case_id=case_id,
            transaction_id=transaction_id,
            case_type=db_transaction.fraud_type or "欺诈嫌疑",
            case_status="open",
            severity=risk_level,
            description=f"疑似欺诈交易，金额{transaction.amount}元，风险评分{round(combined_score, 2)}",
            created_at=datetime.utcnow()
        )
        db.add(case_file)
    
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.post("/{transaction_id}/detect", response_model=FraudDetectionResult)
def detect_fraud(transaction_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    model = get_model()
    rule_engine = get_rule_engine(db)
    
    context = _build_context(db, transaction)
    
    ml_result = model.predict({
        'amount': transaction.amount,
        'transaction_type': transaction.transaction_type,
        'hour': transaction.created_at.hour if transaction.created_at else datetime.now().hour,
        'day_of_week': transaction.created_at.weekday() if transaction.created_at else datetime.now().weekday(),
        'new_device': context.get('new_device', False),
        'location_change': context.get('location_change', False),
        'merchant_risk': context.get('merchant_risk', 'low'),
        'user_history_score': context.get('user_history_score', 0.5)
    })
    
    rule_result = rule_engine.evaluate_transaction(transaction, context)
    
    combined_score = (ml_result['ml_risk_score'] * 0.6) + (rule_result['risk_score'] * 0.4)
    
    if combined_score >= 85:
        risk_level = "critical"
    elif combined_score >= 60:
        risk_level = "high"
    elif combined_score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return FraudDetectionResult(
        transaction_id=transaction_id,
        risk_score=round(combined_score, 2),
        is_fraud=combined_score >= 60,
        fraud_probability=round(ml_result['fraud_probability'], 4),
        risk_level=risk_level,
        triggered_rules=[r['rule_name'] for r in rule_result['triggered_rules']],
        ml_prediction=round(ml_result['fraud_probability'], 4)
    )


def _build_context(db: Session, transaction) -> dict:
    user_id = transaction.user_id if hasattr(transaction, 'user_id') else transaction.user_id
    
    last_24h = datetime.utcnow() - timedelta(hours=24)
    transaction_count_24h = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.created_at >= last_24h
    ).count()
    
    user_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(desc(Transaction.created_at)).limit(20).all()
    
    new_device = True
    if transaction.device_id and user_transactions:
        device_ids = [t.device_id for t in user_transactions if t.device_id]
        if transaction.device_id in device_ids:
            new_device = False
    
    location_change = False
    if transaction.location and len(user_transactions) > 5:
        recent_locations = [t.location for t in user_transactions if t.location][:10]
        if recent_locations and transaction.location not in recent_locations:
            location_change = True
    
    fraud_count = sum(1 for t in user_transactions if t.is_fraud)
    user_history_score = max(0.1, 1.0 - (fraud_count / max(len(user_transactions), 1)) * 2)
    
    high_risk_merchants = ['MERCHANT0018', 'MERCHANT0019', 'MERCHANT0020']
    merchant_risk = 'high' if transaction.merchant_id in high_risk_merchants else 'low'
    
    return {
        'transaction_count_24h': transaction_count_24h,
        'new_device': new_device,
        'location_change': location_change,
        'user_history_score': user_history_score,
        'merchant_risk': merchant_risk,
        'consecutive_failures': 0,
        'balance_change_percent': 0
    }
