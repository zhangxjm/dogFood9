import re
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session

from app.models import RiskRule, Transaction


class RuleEngine:
    def __init__(self, db: Session):
        self.db = db
        self.rules = self._load_rules()
    
    def _load_rules(self) -> List[RiskRule]:
        return self.db.query(RiskRule).filter(RiskRule.is_enabled == True).all()
    
    def reload_rules(self):
        self.rules = self._load_rules()
    
    def evaluate_transaction(self, transaction: Transaction, context: Optional[Dict] = None) -> Dict:
        if context is None:
            context = {}
        
        total_risk_score = 0.0
        triggered_rules = []
        max_risk_level = "low"
        
        risk_level_order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        
        for rule in self.rules:
            is_triggered = self._evaluate_rule(rule, transaction, context)
            
            if is_triggered:
                total_risk_score += rule.risk_score
                triggered_rules.append({
                    "rule_id": rule.rule_id,
                    "rule_name": rule.rule_name,
                    "risk_score": rule.risk_score,
                    "risk_level": rule.risk_level,
                    "description": rule.description
                })
                
                if risk_level_order.get(rule.risk_level, 0) > risk_level_order.get(max_risk_level, 0):
                    max_risk_level = rule.risk_level
        
        final_risk_score = min(total_risk_score, 100.0)
        
        if final_risk_score >= 85:
            overall_level = "critical"
        elif final_risk_score >= 60:
            overall_level = "high"
        elif final_risk_score >= 30:
            overall_level = "medium"
        else:
            overall_level = "low"
        
        return {
            "risk_score": final_risk_score,
            "risk_level": overall_level,
            "triggered_rules": triggered_rules,
            "is_high_risk": final_risk_score >= 60,
            "max_triggered_level": max_risk_level
        }
    
    def _evaluate_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        rule_type = rule.rule_type.lower()
        
        evaluators = {
            "amount": self._evaluate_amount_rule,
            "frequency": self._evaluate_frequency_rule,
            "location": self._evaluate_location_rule,
            "device": self._evaluate_device_rule,
            "time": self._evaluate_time_rule,
            "merchant": self._evaluate_merchant_rule,
            "failure": self._evaluate_failure_rule,
            "balance": self._evaluate_balance_rule,
            "custom": self._evaluate_custom_rule
        }
        
        evaluator = evaluators.get(rule_type, self._evaluate_custom_rule)
        return evaluator(rule, transaction, context)
    
    def _evaluate_amount_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        expression = rule.rule_expression
        try:
            amount = transaction.amount
            
            match = re.search(r'amount\s*([><=!]+)\s*([\d.]+)', expression)
            if match:
                operator = match.group(1)
                threshold = float(match.group(2))
                
                if operator == '>':
                    return amount > threshold
                elif operator == '>=':
                    return amount >= threshold
                elif operator == '<':
                    return amount < threshold
                elif operator == '<=':
                    return amount <= threshold
                elif operator == '==' or operator == '=':
                    return amount == threshold
                elif operator == '!=':
                    return amount != threshold
            
            return False
        except Exception:
            return False
    
    def _evaluate_frequency_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        transaction_count = context.get('transaction_count_24h', 0)
        
        match = re.search(r'transaction_count\s*([><=!]+)\s*(\d+)', rule.rule_expression)
        if match:
            operator = match.group(1)
            threshold = int(match.group(2))
            
            if operator == '>':
                return transaction_count > threshold
            elif operator == '>=':
                return transaction_count >= threshold
            elif operator == '<':
                return transaction_count < threshold
            elif operator == '<=':
                return transaction_count <= threshold
        
        return transaction_count > 10
    
    def _evaluate_location_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        location_changed = context.get('location_changed', False)
        
        if 'location_changed = true' in rule.rule_expression or 'location_changed=true' in rule.rule_expression:
            return location_changed
        if 'location_changed = false' in rule.rule_expression or 'location_changed=false' in rule.rule_expression:
            return not location_changed
        
        return location_changed
    
    def _evaluate_device_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        new_device = context.get('new_device', False)
        
        if 'new_device = true' in rule.rule_expression or 'new_device=true' in rule.rule_expression:
            return new_device
        if 'new_device = false' in rule.rule_expression or 'new_device=false' in rule.rule_expression:
            return not new_device
        
        return new_device
    
    def _evaluate_time_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        hour = transaction.created_at.hour if transaction.created_at else datetime.now().hour
        
        hour_match = re.search(r'hour\s*>=\s*(\d+)\s*AND\s*hour\s*<=\s*(\d+)', rule.rule_expression, re.IGNORECASE)
        if hour_match:
            start_hour = int(hour_match.group(1))
            end_hour = int(hour_match.group(2))
            return start_hour <= hour <= end_hour
        
        night_match = re.search(r'hour\s*>=\s*(\d+)\s*OR\s*hour\s*<=\s*(\d+)', rule.rule_expression, re.IGNORECASE)
        if night_match:
            start_hour = int(night_match.group(1))
            end_hour = int(night_match.group(2))
            return hour >= start_hour or hour <= end_hour
        
        return 0 <= hour <= 5
    
    def _evaluate_merchant_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        merchant_risk = context.get('merchant_risk', 'low')
        
        risk_match = re.search(r'merchant_risk\s*=\s*(\w+)', rule.rule_expression, re.IGNORECASE)
        if risk_match:
            expected_risk = risk_match.group(1).lower()
            return merchant_risk.lower() == expected_risk
        
        return merchant_risk.lower() == 'high'
    
    def _evaluate_failure_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        consecutive_failures = context.get('consecutive_failures', 0)
        
        match = re.search(r'consecutive_failures\s*([><=!]+)\s*(\d+)', rule.rule_expression)
        if match:
            operator = match.group(1)
            threshold = int(match.group(2))
            
            if operator == '>':
                return consecutive_failures > threshold
            elif operator == '>=':
                return consecutive_failures >= threshold
            elif operator == '<':
                return consecutive_failures < threshold
            elif operator == '<=':
                return consecutive_failures <= threshold
        
        return consecutive_failures >= 3
    
    def _evaluate_balance_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        balance_change = context.get('balance_change_percent', 0)
        
        match = re.search(r'balance_change\s*([><=!]+)\s*([\d.]+)', rule.rule_expression)
        if match:
            operator = match.group(1)
            threshold = float(match.group(2))
            
            if operator == '>':
                return balance_change > threshold
            elif operator == '>=':
                return balance_change >= threshold
            elif operator == '<':
                return balance_change < threshold
            elif operator == '<=':
                return balance_change <= threshold
        
        return balance_change > 80
    
    def _evaluate_custom_rule(self, rule: RiskRule, transaction: Transaction, context: Dict) -> bool:
        try:
            expression = rule.rule_expression
            
            transaction_dict = {
                'amount': transaction.amount,
                'user_id': transaction.user_id,
                'merchant_id': transaction.merchant_id,
                'transaction_type': transaction.transaction_type,
                'currency': transaction.currency,
                'ip_address': transaction.ip_address,
                'location': transaction.location,
                'device_id': transaction.device_id
            }
            
            safe_dict = {
                'transaction': transaction_dict,
                'context': context,
                'amount': transaction.amount,
                'hour': transaction.created_at.hour if transaction.created_at else datetime.now().hour,
                'day': transaction.created_at.day if transaction.created_at else datetime.now().day,
                'True': True,
                'False': False,
                'true': True,
                'false': False
            }
            
            result = eval(expression, {"__builtins__": {}}, safe_dict)
            return bool(result)
        except Exception as e:
            print(f"Error evaluating custom rule {rule.rule_id}: {e}")
            return False


def get_rule_engine(db: Session) -> RuleEngine:
    return RuleEngine(db)
