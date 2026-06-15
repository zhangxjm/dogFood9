import sys
import os
from datetime import datetime, timedelta
import random
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models import Transaction, RiskAlert, RiskRule, CaseFile, MLModelConfig
from app.config import settings


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


def seed_data():
    db = SessionLocal()
    
    try:
        transaction_count = db.query(Transaction).count()
        rule_count = db.query(RiskRule).count()
        if transaction_count > 0 and rule_count > 0:
            print("Data already seeded, skipping.")
            return
        
        risk_rules = [
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "大额交易预警",
                "rule_type": "amount",
                "rule_expression": "amount > 50000",
                "risk_score": 30.0,
                "risk_level": "high",
                "description": "单笔交易金额超过5万元触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "高频交易预警",
                "rule_type": "frequency",
                "rule_expression": "transaction_count > 10",
                "risk_score": 25.0,
                "risk_level": "medium",
                "description": "24小时内交易次数超过10次触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "异地交易预警",
                "rule_type": "location",
                "rule_expression": "location_changed = true",
                "risk_score": 20.0,
                "risk_level": "medium",
                "description": "交易地点与常用地点不一致触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "新设备交易预警",
                "rule_type": "device",
                "rule_expression": "new_device = true",
                "risk_score": 15.0,
                "risk_level": "low",
                "description": "使用新设备进行交易触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "夜间交易预警",
                "rule_type": "time",
                "rule_expression": "hour >= 0 AND hour <= 5",
                "risk_score": 10.0,
                "risk_level": "low",
                "description": "凌晨0点至5点的交易触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "可疑商户交易",
                "rule_type": "merchant",
                "rule_expression": "merchant_risk = high",
                "risk_score": 35.0,
                "risk_level": "high",
                "description": "与高风险商户进行交易触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "连续失败交易预警",
                "rule_type": "failure",
                "rule_expression": "consecutive_failures >= 3",
                "risk_score": 20.0,
                "risk_level": "medium",
                "description": "连续3次以上交易失败触发预警",
                "is_enabled": True,
                "created_by": "system"
            },
            {
                "rule_id": f"RULE-{uuid.uuid4().hex[:8].upper()}",
                "rule_name": "账户余额突变预警",
                "rule_type": "balance",
                "rule_expression": "balance_change > 80",
                "risk_score": 25.0,
                "risk_level": "medium",
                "description": "账户余额单日变动超过80%触发预警",
                "is_enabled": True,
                "created_by": "system"
            }
        ]
        
        for rule in risk_rules:
            db_rule = RiskRule(**rule)
            db.add(db_rule)
        
        ml_configs = [
            {
                "model_name": "随机森林欺诈检测模型",
                "model_version": "v1.0.0",
                "model_type": "RandomForest",
                "is_active": True,
                "accuracy": 0.945,
                "precision": 0.923,
                "recall": 0.897,
                "f1_score": 0.910,
                "description": "基于随机森林算法的欺诈交易检测模型，使用历史交易数据训练"
            },
            {
                "model_name": "XGBoost欺诈检测模型",
                "model_version": "v2.0.0",
                "model_type": "XGBoost",
                "is_active": False,
                "accuracy": 0.958,
                "precision": 0.937,
                "recall": 0.912,
                "f1_score": 0.924,
                "description": "基于XGBoost算法的欺诈交易检测模型，准确率更高"
            }
        ]
        
        for config in ml_configs:
            db_ml = MLModelConfig(**config)
            db.add(db_ml)
        
        user_ids = [f"USER{str(i).zfill(5)}" for i in range(1, 51)]
        merchant_ids = [f"MERCHANT{str(i).zfill(4)}" for i in range(1, 21)]
        transaction_types = ["transfer", "payment", "withdrawal", "deposit", "refund"]
        locations = ["北京市", "上海市", "广州市", "深圳市", "杭州市", 
                     "成都市", "武汉市", "南京市", "西安市", "重庆市"]
        
        fraud_patterns = [
            {"fraud_type": "大额欺诈", "amount_range": (50000, 200000), "risk_score_range": (85, 99)},
            {"fraud_type": "盗刷", "amount_range": (1000, 10000), "risk_score_range": (75, 90)},
            {"fraud_type": "洗钱嫌疑", "amount_range": (20000, 100000), "risk_score_range": (80, 95)},
            {"fraud_type": "虚假交易", "amount_range": (500, 5000), "risk_score_range": (70, 85)}
        ]
        
        base_date = datetime.now() - timedelta(days=30)
        transaction_count = 500
        fraud_count = int(transaction_count * 0.08)
        
        for i in range(transaction_count):
            transaction_date = base_date + timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            is_fraud = i < fraud_count
            user_id = random.choice(user_ids)
            merchant_id = random.choice(merchant_ids)
            transaction_type = random.choice(transaction_types)
            location = random.choice(locations)
            
            if is_fraud:
                pattern = random.choice(fraud_patterns)
                amount = round(random.uniform(*pattern["amount_range"]), 2)
                risk_score = round(random.uniform(*pattern["risk_score_range"]), 2)
                fraud_type = pattern["fraud_type"]
                status = "flagged"
            else:
                amount = round(random.uniform(10, 30000), 2)
                risk_score = round(random.uniform(0, 40), 2)
                fraud_type = None
                status = "completed"
            
            transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
            
            transaction = Transaction(
                transaction_id=transaction_id,
                user_id=user_id,
                merchant_id=merchant_id,
                amount=amount,
                currency="CNY",
                transaction_type=transaction_type,
                status=status,
                risk_score=risk_score,
                is_fraud=is_fraud,
                fraud_type=fraud_type,
                description=f"{transaction_type} transaction",
                ip_address=f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
                device_id=f"DEV{uuid.uuid4().hex[:8].upper()}" if random.random() > 0.3 else None,
                location=location,
                created_at=transaction_date,
                updated_at=transaction_date
            )
            db.add(transaction)
            
            if is_fraud:
                alert_id = f"ALERT{uuid.uuid4().hex[:10].upper()}"
                risk_level = "critical" if risk_score >= 85 else "high"
                
                alert = RiskAlert(
                    alert_id=alert_id,
                    transaction_id=transaction_id,
                    risk_level=risk_level,
                    risk_score=risk_score,
                    alert_type="fraud_suspected",
                    description=f"疑似{fraud_type}，风险评分{risk_score}",
                    rule_triggered=random.choice(risk_rules)["rule_name"],
                    is_handled=random.choice([True, False]),
                    handled_by=random.choice(["analyst1", "analyst2", "analyst3"]) if random.random() > 0.5 else None,
                    handled_at=transaction_date + timedelta(hours=random.randint(1, 24)) if random.random() > 0.5 else None,
                    handle_notes="已核实为欺诈交易，已冻结账户" if random.random() > 0.7 else None,
                    created_at=transaction_date
                )
                db.add(alert)
                
                if random.random() > 0.4:
                    case_id = f"CASE{uuid.uuid4().hex[:10].upper()}"
                    case_statuses = ["open", "investigating", "closed"]
                    case_status = random.choice(case_statuses)
                    
                    case_file = CaseFile(
                        case_id=case_id,
                        transaction_id=transaction_id,
                        case_type=fraud_type,
                        case_status=case_status,
                        severity=risk_level,
                        description=f"疑似{fraud_type}案例，金额{amount}元",
                        analyst=random.choice(["analyst1", "analyst2", "analyst3"]) if case_status != "open" else None,
                        investigation_notes="正在调查中，已联系用户核实" if case_status == "investigating" else None,
                        conclusion="经核实确为欺诈交易，已上报监管部门" if case_status == "closed" else None,
                        created_at=transaction_date,
                        closed_at=transaction_date + timedelta(days=random.randint(1, 7)) if case_status == "closed" else None
                    )
                    db.add(case_file)
        
        db.commit()
        print(f"Seed data created successfully: {transaction_count} transactions, {fraud_count} fraud records.")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_data()
