from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True)
    user_id = Column(String(50), index=True)
    merchant_id = Column(String(50), index=True)
    amount = Column(Float)
    currency = Column(String(10), default="CNY")
    transaction_type = Column(String(50))
    status = Column(String(50), default="pending")
    risk_score = Column(Float, default=0.0)
    is_fraud = Column(Boolean, default=False)
    fraud_type = Column(String(100), nullable=True)
    description = Column(String(500), nullable=True)
    ip_address = Column(String(50))
    device_id = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    risk_alerts = relationship("RiskAlert", back_populates="transaction")
    case_files = relationship("CaseFile", back_populates="transaction")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True)
    transaction_id = Column(String(100), ForeignKey("transactions.transaction_id"))
    risk_level = Column(String(20))
    risk_score = Column(Float)
    alert_type = Column(String(100))
    description = Column(Text)
    rule_triggered = Column(String(200), nullable=True)
    is_handled = Column(Boolean, default=False)
    handled_by = Column(String(50), nullable=True)
    handled_at = Column(DateTime, nullable=True)
    handle_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="risk_alerts")


class RiskRule(Base):
    __tablename__ = "risk_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(100), unique=True, index=True)
    rule_name = Column(String(200))
    rule_type = Column(String(50))
    rule_expression = Column(Text)
    risk_score = Column(Float, default=10.0)
    risk_level = Column(String(20), default="medium")
    description = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=True)
    created_by = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CaseFile(Base):
    __tablename__ = "case_files"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(100), unique=True, index=True)
    transaction_id = Column(String(100), ForeignKey("transactions.transaction_id"))
    case_type = Column(String(100))
    case_status = Column(String(50), default="open")
    severity = Column(String(20), default="medium")
    description = Column(Text)
    analyst = Column(String(50), nullable=True)
    investigation_notes = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="case_files")


class MLModelConfig(Base):
    __tablename__ = "ml_model_configs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100))
    model_version = Column(String(50))
    model_type = Column(String(50))
    is_active = Column(Boolean, default=True)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
