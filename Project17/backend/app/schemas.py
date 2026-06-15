from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TransactionType(str, Enum):
    transfer = "transfer"
    payment = "payment"
    withdrawal = "withdrawal"
    deposit = "deposit"
    refund = "refund"


class TransactionBase(BaseModel):
    user_id: str
    merchant_id: str
    amount: float
    currency: Optional[str] = "CNY"
    transaction_type: str
    description: Optional[str] = None
    ip_address: str
    device_id: Optional[str] = None
    location: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    transaction_id: str
    status: str
    risk_score: float
    is_fraud: bool
    fraud_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TransactionResponse]


class RiskAlertBase(BaseModel):
    transaction_id: str
    risk_level: str
    risk_score: float
    alert_type: str
    description: str
    rule_triggered: Optional[str] = None


class RiskAlertCreate(RiskAlertBase):
    pass


class RiskAlertResponse(RiskAlertBase):
    id: int
    alert_id: str
    is_handled: bool
    handled_by: Optional[str] = None
    handled_at: Optional[datetime] = None
    handle_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskAlertListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[RiskAlertResponse]


class RiskAlertHandle(BaseModel):
    is_handled: bool = True
    handled_by: str
    handle_notes: Optional[str] = None


class RiskRuleBase(BaseModel):
    rule_name: str
    rule_type: str
    rule_expression: str
    risk_score: float = 10.0
    risk_level: str = "medium"
    description: Optional[str] = None
    is_enabled: bool = True


class RiskRuleCreate(RiskRuleBase):
    created_by: Optional[str] = None


class RiskRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_expression: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None


class RiskRuleResponse(RiskRuleBase):
    id: int
    rule_id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseFileBase(BaseModel):
    transaction_id: str
    case_type: str
    case_status: Optional[str] = "open"
    severity: Optional[str] = "medium"
    description: str


class CaseFileCreate(CaseFileBase):
    analyst: Optional[str] = None


class CaseFileUpdate(BaseModel):
    case_status: Optional[str] = None
    severity: Optional[str] = None
    investigation_notes: Optional[str] = None
    conclusion: Optional[str] = None
    analyst: Optional[str] = None


class CaseFileResponse(CaseFileBase):
    id: int
    case_id: str
    analyst: Optional[str] = None
    investigation_notes: Optional[str] = None
    conclusion: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CaseFileListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[CaseFileResponse]


class DashboardStats(BaseModel):
    total_transactions: int
    today_transactions: int
    total_fraud: int
    fraud_rate: float
    total_alerts: int
    pending_alerts: int
    total_cases: int
    open_cases: int
    total_amount: float
    high_risk_count: int


class MLModelInfo(BaseModel):
    model_name: str
    model_version: str
    model_type: str
    is_active: bool
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    description: Optional[str] = None


class FraudDetectionResult(BaseModel):
    transaction_id: str
    risk_score: float
    is_fraud: bool
    fraud_probability: float
    risk_level: str
    triggered_rules: List[str]
    ml_prediction: float
