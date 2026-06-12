import sys
import os
from datetime import datetime, timedelta
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.database import (
    SessionLocal,
    FarmField,
    SoilData,
    WeatherData,
    CropGrowthData,
    FertilizerWaterData,
    DecisionCommand,
    PestAlert,
)
from src.kafka_module import DecisionCommandProducer

IRRIGATION_THRESHOLD = 40
NITROGEN_LOW = 100
PHOSPHORUS_LOW = 60
POTASSIUM_LOW = 120


class DecisionEngine:
    def __init__(self):
        self.kafka_producer = DecisionCommandProducer()
    
    def analyze_field(self, field_id):
        db = SessionLocal()
        try:
            field = db.query(FarmField).filter(FarmField.id == field_id).first()
            if not field:
                return {"error": "Field not found"}
            
            recent_soil = db.query(SoilData).filter(
                SoilData.field_id == field_id
            ).order_by(SoilData.timestamp.desc()).first()
            
            recent_weather_list = db.query(WeatherData).filter(
                WeatherData.field_id == field_id
            ).order_by(WeatherData.timestamp.desc()).limit(7).all()
            
            recent_growth = db.query(CropGrowthData).filter(
                CropGrowthData.field_id == field_id
            ).order_by(CropGrowthData.timestamp.desc()).first()
            
            if not recent_soil or not recent_weather_list or not recent_growth:
                return {"error": "Insufficient data"}
            
            avg_temp = sum(w.temperature for w in recent_weather_list) / len(recent_weather_list)
            avg_humidity = sum(w.humidity for w in recent_weather_list) / len(recent_weather_list)
            total_rainfall = sum(w.rainfall for w in recent_weather_list)
            
            analysis = {
                "field_id": field_id,
                "field_name": field.name,
                "crop_type": field.crop_type,
                "analysis_time": datetime.now().isoformat(),
                "soil_status": self._analyze_soil(recent_soil),
                "weather_status": self._analyze_weather(avg_temp, avg_humidity, total_rainfall),
                "growth_status": self._analyze_growth(recent_growth, field),
                "decisions": [],
            }
            
            irrigation_decision = self._make_irrigation_decision(recent_soil, total_rainfall, avg_temp)
            if irrigation_decision:
                analysis["decisions"].append(irrigation_decision)
            
            fertilizer_decision = self._make_fertilizer_decision(recent_soil, recent_growth)
            if fertilizer_decision:
                analysis["decisions"].append(fertilizer_decision)
            
            pest_decision = self._make_pest_decision(field_id, avg_temp, avg_humidity, total_rainfall, db)
            if pest_decision:
                analysis["decisions"].append(pest_decision)
            
            if not analysis["decisions"]:
                analysis["decisions"].append({
                    "type": "状态",
                    "priority": 3,
                    "content": "当前作物生长状态良好，无需特殊处理",
                    "status": "正常",
                })
            
            return analysis
            
        finally:
            db.close()
    
    def _analyze_soil(self, soil_data):
        status = "正常"
        issues = []
        
        if soil_data.moisture < 30:
            status = "缺水"
            issues.append("土壤含水量偏低")
        elif soil_data.moisture > 70:
            issues.append("土壤含水量偏高")
        
        if soil_data.nitrogen < NITROGEN_LOW:
            issues.append("氮素含量偏低")
        if soil_data.phosphorus < PHOSPHORUS_LOW:
            issues.append("磷素含量偏低")
        if soil_data.potassium < POTASSIUM_LOW:
            issues.append("钾素含量偏低")
        
        if soil_data.ph < 5.5:
            issues.append("土壤偏酸性")
        elif soil_data.ph > 8.0:
            issues.append("土壤偏碱性")
        
        if issues:
            status = "需关注" if len(issues) <= 2 else "需处理"
        
        return {
            "status": status,
            "moisture": soil_data.moisture,
            "ph": soil_data.ph,
            "nitrogen": soil_data.nitrogen,
            "phosphorus": soil_data.phosphorus,
            "potassium": soil_data.potassium,
            "issues": issues,
        }
    
    def _analyze_weather(self, avg_temp, avg_humidity, total_rainfall):
        status = "正常"
        issues = []
        
        if avg_temp > 32:
            status = "高温"
            issues.append("持续高温天气")
        elif avg_temp < 10:
            status = "低温"
            issues.append("低温天气")
        
        if total_rainfall > 80:
            issues.append("近期降雨偏多")
        elif total_rainfall < 10:
            issues.append("近期降雨偏少")
        
        if avg_humidity > 85:
            issues.append("空气湿度过高")
        elif avg_humidity < 40:
            issues.append("空气湿度过低")
        
        return {
            "status": status,
            "avg_temperature": round(avg_temp, 1),
            "avg_humidity": round(avg_humidity, 1),
            "total_rainfall_7d": round(total_rainfall, 1),
            "issues": issues,
        }
    
    def _analyze_growth(self, growth_data, field):
        growth_day = (datetime.now() - field.planting_date).days
        
        expected_stages = self._get_expected_stage(field.crop_type, growth_day)
        
        status = "正常"
        if growth_data.health_status != "健康":
            status = growth_data.health_status
        
        return {
            "status": status,
            "current_stage": growth_data.growth_stage,
            "expected_stage": expected_stages,
            "growth_day": growth_day,
            "plant_height": growth_data.plant_height,
            "leaf_area_index": growth_data.leaf_area_index,
            "biomass": growth_data.biomass,
            "chlorophyll": growth_data.chlorophyll,
            "health_status": growth_data.health_status,
        }
    
    def _get_expected_stage(self, crop_type, growth_day):
        stages_map = {
            "小麦": [(0, "播种期"), (10, "出苗期"), (30, "分蘖期"), (90, "越冬期"), 
                   (120, "返青期"), (150, "拔节期"), (180, "抽穗期"), (200, "灌浆期"), (230, "成熟期")],
            "玉米": [(0, "播种期"), (7, "出苗期"), (20, "三叶期"), (40, "拔节期"),
                   (60, "大喇叭口期"), (75, "抽雄期"), (85, "吐丝期"), (100, "灌浆期"), (120, "成熟期")],
            "水稻": [(0, "播种期"), (7, "出苗期"), (30, "分蘖期"), (60, "拔节期"),
                   (80, "孕穗期"), (95, "抽穗期"), (105, "开花期"), (120, "灌浆期"), (140, "成熟期")],
            "番茄": [(0, "播种期"), (10, "出苗期"), (30, "幼苗期"), (50, "开花期"),
                    (70, "结果期"), (90, "盛果期"), (120, "采收期")],
        }
        
        stages = stages_map.get(crop_type, [(0, "生长期")])
        for day_thresh, stage in reversed(stages):
            if growth_day >= day_thresh:
                return stage
        return stages[0][1]
    
    def _make_irrigation_decision(self, soil_data, rainfall_7d, avg_temp):
        if soil_data.moisture >= IRRIGATION_THRESHOLD and rainfall_7d > 20:
            return None
        
        water_deficit = IRRIGATION_THRESHOLD - soil_data.moisture
        evap_transpiration = avg_temp * 0.5
        
        irrigation_amount = round(water_deficit * 0.8 + evap_transpiration * 2, 1)
        irrigation_amount = max(10, min(50, irrigation_amount))
        
        priority = 1 if soil_data.moisture < 30 else 2
        
        decision = {
            "type": "灌溉",
            "priority": priority,
            "content": f"土壤含水量{soil_data.moisture:.1f}%，建议灌溉{irrigation_amount}立方米/亩，采用滴灌方式",
            "parameters": {
                "amount": irrigation_amount,
                "method": "滴灌",
                "reason": f"土壤墒情不足，水分亏缺{water_deficit:.1f}%",
            },
            "status": "建议",
        }
        
        return decision
    
    def _make_fertilizer_decision(self, soil_data, growth_data):
        needs_fertilizer = False
        n_need = 0
        p_need = 0
        k_need = 0
        reasons = []
        
        if soil_data.nitrogen < NITROGEN_LOW:
            needs_fertilizer = True
            n_deficit = NITROGEN_LOW - soil_data.nitrogen
            n_need = round(n_deficit * 0.05, 1)
            reasons.append(f"氮素不足(缺{n_deficit:.0f}mg/kg)")
        
        if soil_data.phosphorus < PHOSPHORUS_LOW:
            needs_fertilizer = True
            p_deficit = PHOSPHORUS_LOW - soil_data.phosphorus
            p_need = round(p_deficit * 0.03, 1)
            reasons.append(f"磷素不足(缺{p_deficit:.0f}mg/kg)")
        
        if soil_data.potassium < POTASSIUM_LOW:
            needs_fertilizer = True
            k_deficit = POTASSIUM_LOW - soil_data.potassium
            k_need = round(k_deficit * 0.04, 1)
            reasons.append(f"钾素不足(缺{k_deficit:.0f}mg/kg)")
        
        if not needs_fertilizer:
            return None
        
        priority = 1 if len(reasons) >= 2 else 2
        
        decision = {
            "type": "施肥",
            "priority": priority,
            "content": f"土壤养分不足：{', '.join(reasons)}，建议追施氮肥{n_need}kg/亩、磷肥{p_need}kg/亩、钾肥{k_need}kg/亩",
            "parameters": {
                "nitrogen": n_need,
                "phosphorus": p_need,
                "potassium": k_need,
                "fertilizer_type": "复合肥",
                "reasons": reasons,
            },
            "status": "建议",
        }
        
        return decision
    
    def _make_pest_decision(self, field_id, avg_temp, avg_humidity, rainfall_7d, db):
        from src.models import get_pest_model
        
        try:
            pest_model = get_pest_model()
            risks = pest_model.predict_field_risks(field_id)
            
            high_risks = [pest for pest, info in risks.items() 
                         if info['risk_level'] == "高风险"]
            
            if not high_risks:
                return None
            
            pest_name = high_risks[0]
            risk_info = risks[pest_name]
            
            priority = 1
            
            decision = {
                "type": "植保",
                "priority": priority,
                "content": f"检测到{pest_name}{risk_info['risk_level']}，建议：{risk_info['recommendation']}",
                "parameters": {
                    "pest_type": pest_name,
                    "risk_level": risk_info['risk_level'],
                    "risk_probability": risk_info['risk_probability'],
                    "recommendation": risk_info['recommendation'],
                },
                "status": "预警",
            }
            
            return decision
            
        except Exception as e:
            print(f"Pest decision error: {e}")
            return None
    
    def execute_decision(self, field_id, decision):
        db = SessionLocal()
        try:
            cmd = DecisionCommand(
                field_id=field_id,
                timestamp=datetime.now(),
                command_type=decision["type"],
                content=decision["content"],
                priority=decision["priority"],
                status="待执行",
                executor="系统自动",
            )
            db.add(cmd)
            db.commit()
            
            if decision["type"] == "灌溉":
                params = decision.get("parameters", {})
                self.kafka_producer.send_irrigation_command(
                    field_id,
                    params.get("amount", 20),
                    params.get("method", "滴灌"),
                )
            elif decision["type"] == "施肥":
                params = decision.get("parameters", {})
                self.kafka_producer.send_fertilizer_command(
                    field_id,
                    params.get("nitrogen", 5),
                    params.get("phosphorus", 3),
                    params.get("potassium", 4),
                    params.get("fertilizer_type", "复合肥"),
                )
            elif decision["type"] == "植保":
                params = decision.get("parameters", {})
                self.kafka_producer.send_pest_alert(
                    field_id,
                    params.get("pest_type", ""),
                    params.get("risk_level", ""),
                    params.get("risk_probability", 0),
                )
            
            self.kafka_producer.send_general_command(
                decision["type"],
                field_id,
                decision["content"],
                decision["priority"],
            )
            
            return cmd.id
            
        finally:
            db.close()
    
    def auto_dispatch_all(self):
        db = SessionLocal()
        try:
            fields = db.query(FarmField).all()
            results = []
            
            for field in fields:
                analysis = self.analyze_field(field.id)
                if "error" in analysis:
                    continue
                
                for decision in analysis.get("decisions", []):
                    if decision["type"] in ["灌溉", "施肥", "植保"]:
                        cmd_id = self.execute_decision(field.id, decision)
                        results.append({
                            "field_id": field.id,
                            "field_name": field.name,
                            "decision_type": decision["type"],
                            "command_id": cmd_id,
                        })
            
            return results
            
        finally:
            db.close()


def get_decision_engine():
    return DecisionEngine()


if __name__ == "__main__":
    engine = DecisionEngine()
    result = engine.auto_dispatch_all()
    print(f"Auto dispatched {len(result)} decisions.")
