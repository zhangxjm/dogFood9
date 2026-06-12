import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
import numpy as np
from src.database import (
    SessionLocal,
    init_db,
    FarmField,
    SoilData,
    WeatherData,
    FertilizerWaterData,
    CropGrowthData,
    PestAlert,
    DecisionCommand,
    YieldPrediction,
    SensorDevice,
)


def init_sample_data():
    init_db()
    db = SessionLocal()
    
    try:
        if db.query(FarmField).count() > 0:
            print("Data already exists, skipping initialization.")
            return
        
        fields = [
            {
                "name": "一号大田",
                "area": 50.5,
                "crop_type": "小麦",
                "planting_date": datetime(2025, 10, 15),
                "latitude": 34.0522,
                "longitude": 118.2437,
                "soil_type": "壤土",
                "status": "正常",
                "description": "主要种植冬小麦，土壤肥沃，灌溉条件良好",
            },
            {
                "name": "二号大田",
                "area": 45.2,
                "crop_type": "玉米",
                "planting_date": datetime(2026, 3, 20),
                "latitude": 34.0550,
                "longitude": 118.2500,
                "soil_type": "砂壤土",
                "status": "正常",
                "description": "春玉米种植区，地势平坦",
            },
            {
                "name": "三号大田",
                "area": 38.8,
                "crop_type": "水稻",
                "planting_date": datetime(2026, 4, 10),
                "latitude": 34.0480,
                "longitude": 118.2380,
                "soil_type": "粘壤土",
                "status": "正常",
                "description": "水稻种植区，水源充足",
            },
            {
                "name": "四号大棚",
                "area": 15.0,
                "crop_type": "番茄",
                "planting_date": datetime(2026, 2, 1),
                "latitude": 34.0500,
                "longitude": 118.2450,
                "soil_type": "营养土",
                "status": "正常",
                "description": "设施农业大棚，种植反季节蔬菜",
            },
        ]
        
        for field_data in fields:
            field = FarmField(**field_data)
            db.add(field)
        
        db.commit()
        
        all_fields = db.query(FarmField).all()
        field_ids = [f.id for f in all_fields]
        
        sensor_types = ["土壤温湿度传感器", "气象站", "水肥一体机", "作物长势监测仪", "病虫害监测仪"]
        device_count = 0
        for field_id in field_ids:
            for i, stype in enumerate(sensor_types):
                device = SensorDevice(
                    device_id=f"SENSOR-{field_id:03d}-{i+1:02d}",
                    field_id=field_id,
                    device_type=stype,
                    location=f"{field_id}号田-{stype}-{i+1}号点位",
                    status="在线",
                    last_heartbeat=datetime.now(),
                )
                db.add(device)
                device_count += 1
        
        db.commit()
        print(f"Created {len(all_fields)} farm fields and {device_count} sensor devices.")
        
        days_back = 60
        now = datetime.now()
        
        for field_id in field_ids:
            field = db.query(FarmField).filter(FarmField.id == field_id).first()
            crop = field.crop_type
            
            soil_data_list = []
            weather_data_list = []
            growth_data_list = []
            fert_water_list = []
            
            for day in range(days_back):
                date = now - timedelta(days=day)
                day_progress = 1 - (day / days_back)
                
                base_temp = 18 + 10 * day_progress + random.gauss(0, 2)
                base_moisture = 45 + 15 * random.random()
                
                soil_data = SoilData(
                    field_id=field_id,
                    timestamp=date,
                    temperature=round(base_temp - 5, 1),
                    moisture=round(base_moisture, 1),
                    ph=round(6.5 + random.gauss(0, 0.3), 2),
                    nitrogen=round(120 + 30 * day_progress + random.gauss(0, 10), 1),
                    phosphorus=round(80 + 15 * random.random(), 1),
                    potassium=round(150 + 25 * day_progress + random.gauss(0, 12), 1),
                    organic_matter=round(2.5 + random.gauss(0, 0.3), 2),
                    conductivity=round(1.2 + random.gauss(0, 0.2), 2),
                )
                soil_data_list.append(soil_data)
                
                weather_data = WeatherData(
                    field_id=field_id,
                    timestamp=date,
                    temperature=round(base_temp, 1),
                    humidity=round(60 + 15 * random.random(), 1),
                    wind_speed=round(2 + 3 * random.random(), 1),
                    wind_direction=random.choice(["东风", "南风", "西风", "北风", "东南风"]),
                    rainfall=round(max(0, random.gauss(2, 5)), 1),
                    solar_radiation=round(150 + 200 * day_progress + random.gauss(0, 30), 1),
                    pressure=round(1013 + random.gauss(0, 5), 1),
                    uv_index=round(3 + 5 * day_progress + random.gauss(0, 1), 1),
                )
                weather_data_list.append(weather_data)
                
                growth_stages = get_growth_stages(crop)
                stage_index = min(int(day_progress * len(growth_stages)), len(growth_stages) - 1)
                
                growth_data = CropGrowthData(
                    field_id=field_id,
                    timestamp=date,
                    growth_stage=growth_stages[stage_index],
                    plant_height=round(30 + 70 * day_progress + random.gauss(0, 5), 1),
                    leaf_area_index=round(1 + 3.5 * day_progress + random.gauss(0, 0.3), 2),
                    biomass=round(500 + 2000 * day_progress + random.gauss(0, 100), 1),
                    fruit_count=int(0 + 50 * max(0, day_progress - 0.5) * 2 + random.gauss(0, 5)),
                    chlorophyll=round(35 + 15 * day_progress + random.gauss(0, 3), 1),
                    health_status=random.choice(["健康", "健康", "健康", "良好", "良好"]),
                )
                growth_data_list.append(growth_data)
                
                if day % 3 == 0:
                    fert_data = FertilizerWaterData(
                        field_id=field_id,
                        timestamp=date,
                        irrigation_amount=round(20 + 15 * random.random(), 1),
                        fertilizer_n=round(5 + 3 * random.random(), 1),
                        fertilizer_p=round(3 + 2 * random.random(), 1),
                        fertilizer_k=round(4 + 2 * random.random(), 1),
                        irrigation_method=random.choice(["滴灌", "喷灌", "漫灌"]),
                        fertilizer_type=random.choice(["复合肥", "尿素", "磷酸二氢钾"]),
                    )
                    fert_water_list.append(fert_data)
            
            db.add_all(soil_data_list)
            db.add_all(weather_data_list)
            db.add_all(growth_data_list)
            db.add_all(fert_water_list)
            
            db.commit()
            print(f"Generated historical data for field {field_id}.")
        
        pest_types = [
            {"name": "蚜虫", "desc": "刺吸式口器害虫，吸食作物汁液"},
            {"name": "红蜘蛛", "desc": "螨类害虫，危害叶片"},
            {"name": "玉米螟", "desc": "钻蛀性害虫，危害茎秆"},
            {"name": "稻飞虱", "desc": "刺吸式害虫，传播病毒病"},
            {"name": "白粉病", "desc": "真菌病害，叶片出现白色粉状物"},
            {"name": "锈病", "desc": "真菌病害，叶片出现锈色孢子堆"},
        ]
        
        for field_id in field_ids:
            num_alerts = random.randint(1, 4)
            for _ in range(num_alerts):
                pest = random.choice(pest_types)
                severity = random.choice(["轻度", "中度", "重度"])
                risk_map = {"轻度": 3, "中度": 6, "重度": 9}
                alert = PestAlert(
                    field_id=field_id,
                    timestamp=now - timedelta(days=random.randint(0, 30)),
                    pest_type=pest["name"],
                    severity=severity,
                    description=pest["desc"],
                    risk_level=risk_map[severity] + random.randint(-1, 1),
                    is_active=random.choice([True, False]),
                    recommendation=get_pest_recommendation(pest["name"], severity),
                )
                db.add(alert)
        
        db.commit()
        print("Generated pest alert data.")
        
        command_types = [
            {"type": "灌溉", "content": "根据土壤墒情，建议灌溉25立方米/亩"},
            {"type": "施肥", "content": "追施氮肥5公斤/亩，促进生长发育"},
            {"type": "植保", "content": "喷施吡虫啉1500倍液，防治蚜虫"},
            {"type": "通风", "content": "大棚内温度过高，建议打开通风口"},
        ]
        
        for field_id in field_ids:
            num_commands = random.randint(2, 5)
            for _ in range(num_commands):
                cmd = random.choice(command_types)
                command = DecisionCommand(
                    field_id=field_id,
                    timestamp=now - timedelta(days=random.randint(0, 15)),
                    command_type=cmd["type"],
                    content=cmd["content"],
                    priority=random.randint(1, 3),
                    status=random.choice(["待执行", "执行中", "已完成"]),
                    executor="系统自动",
                )
                db.add(command)
        
        db.commit()
        print("Generated decision command data.")
        
        for field_id in field_ids:
            field = db.query(FarmField).filter(FarmField.id == field_id).first()
            base_yield = get_base_yield(field.crop_type)
            
            prediction = YieldPrediction(
                field_id=field_id,
                prediction_date=now,
                predicted_yield=round(base_yield * (0.9 + 0.2 * random.random()), 2),
                confidence=round(0.8 + 0.15 * random.random(), 3),
                model_version="v1.0",
                factors="土壤肥力,气象条件,品种特性,田间管理",
            )
            db.add(prediction)
        
        db.commit()
        print("Generated yield prediction data.")
        
        print("\nAll sample data initialized successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing data: {e}")
        raise
    finally:
        db.close()


def get_growth_stages(crop_type):
    stages_map = {
        "小麦": ["播种期", "出苗期", "分蘖期", "越冬期", "返青期", "拔节期", "抽穗期", "灌浆期", "成熟期"],
        "玉米": ["播种期", "出苗期", "三叶期", "拔节期", "大喇叭口期", "抽雄期", "吐丝期", "灌浆期", "成熟期"],
        "水稻": ["播种期", "出苗期", "分蘖期", "拔节期", "孕穗期", "抽穗期", "开花期", "灌浆期", "成熟期"],
        "番茄": ["播种期", "出苗期", "幼苗期", "开花期", "结果期", "盛果期", "采收期"],
    }
    return stages_map.get(crop_type, ["苗期", "生长期", "成熟期"])


def get_base_yield(crop_type):
    yield_map = {
        "小麦": 600,
        "玉米": 750,
        "水稻": 650,
        "番茄": 8000,
    }
    return yield_map.get(crop_type, 500)


def get_pest_recommendation(pest_type, severity):
    recommendations = {
        "蚜虫": {
            "轻度": "悬挂黄板诱杀，保护天敌",
            "中度": "喷施吡虫啉1500倍液或噻虫嗪3000倍液",
            "重度": "喷施吡蚜酮+噻虫嗪复配剂，7天后复喷一次",
        },
        "红蜘蛛": {
            "轻度": "清除杂草，增加田间湿度",
            "中度": "喷施阿维菌素3000倍液",
            "重度": "喷施螺螨酯+阿维菌素，5天后复喷",
        },
        "玉米螟": {
            "轻度": "释放赤眼蜂生物防治",
            "中度": "心叶期撒施辛硫磷颗粒剂",
            "重度": "喷施氯虫苯甲酰胺，重点喷施穗部",
        },
        "稻飞虱": {
            "轻度": "保护田间蜘蛛等天敌",
            "中度": "喷施吡蚜酮水分散粒剂",
            "重度": "喷施噻虫嗪+异丙威，田间保持浅水层",
        },
        "白粉病": {
            "轻度": "加强通风，降低湿度",
            "中度": "喷施三唑酮可湿性粉剂",
            "重度": "喷施戊唑醇+醚菌酯，7天一次连喷2-3次",
        },
        "锈病": {
            "轻度": "增施磷钾肥，提高抗病性",
            "中度": "喷施三唑酮乳油1500倍液",
            "重度": "喷施丙环唑+嘧菌酯，10天一次连喷2次",
        },
    }
    return recommendations.get(pest_type, {}).get(severity, "建议咨询植保专家")


if __name__ == "__main__":
    init_sample_data()
