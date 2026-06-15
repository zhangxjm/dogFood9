from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime
import uuid

from app.database import get_db
from app.models import RiskRule
from app.schemas import (
    RiskRuleCreate, RiskRuleResponse, RiskRuleUpdate
)

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("", response_model=List[RiskRuleResponse])
def get_rules(
    is_enabled: Optional[bool] = None,
    rule_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiskRule)
    
    if is_enabled is not None:
        query = query.filter(RiskRule.is_enabled == is_enabled)
    if rule_type:
        query = query.filter(RiskRule.rule_type == rule_type)
    
    return query.order_by(desc(RiskRule.created_at)).all()


@router.get("/{rule_id}", response_model=RiskRuleResponse)
def get_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RiskRule).filter(RiskRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("", response_model=RiskRuleResponse)
def create_rule(rule: RiskRuleCreate, db: Session = Depends(get_db)):
    rule_id = f"RULE-{uuid.uuid4().hex[:8].upper()}"
    
    db_rule = RiskRule(
        rule_id=rule_id,
        **rule.model_dump()
    )
    
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    return db_rule


@router.put("/{rule_id}", response_model=RiskRuleResponse)
def update_rule(rule_id: str, rule_update: RiskRuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(RiskRule).filter(RiskRule.rule_id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rule, key, value)
    
    db_rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_rule)
    
    return db_rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    db_rule = db.query(RiskRule).filter(RiskRule.rule_id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    
    return {"message": "Rule deleted successfully"}


@router.post("/{rule_id}/toggle", response_model=RiskRuleResponse)
def toggle_rule(rule_id: str, db: Session = Depends(get_db)):
    db_rule = db.query(RiskRule).filter(RiskRule.rule_id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db_rule.is_enabled = not db_rule.is_enabled
    db_rule.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_rule)
    
    return db_rule


@router.get("/types/list")
def get_rule_types():
    return {
        "types": [
            {"value": "amount", "label": "金额规则", "description": "基于交易金额触发的规则"},
            {"value": "frequency", "label": "频次规则", "description": "基于交易频率触发的规则"},
            {"value": "location", "label": "地理位置规则", "description": "基于交易地点触发的规则"},
            {"value": "device", "label": "设备规则", "description": "基于设备信息触发的规则"},
            {"value": "time", "label": "时间规则", "description": "基于交易时间触发的规则"},
            {"value": "merchant", "label": "商户规则", "description": "基于商户风险等级触发的规则"},
            {"value": "failure", "label": "失败交易规则", "description": "基于连续失败次数触发的规则"},
            {"value": "balance", "label": "余额规则", "description": "基于账户余额变动触发的规则"},
            {"value": "custom", "label": "自定义规则", "description": "用户自定义表达式规则"}
        ]
    }
