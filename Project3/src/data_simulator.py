import sys
import os
import time
import random
from datetime import datetime
import threading

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.kafka_module import SensorDataProducer, DecisionCommandProducer, get_kafka_manager
from src.database import SessionLocal, FarmField, SoilData, WeatherData, CropGrowthData


class DataSimulator:
    def __init__(self):
        self.sensor_producer = SensorDataProducer()
        self.decision_producer = DecisionCommandProducer()
        self.kafka = get_kafka_manager()
        self.running = False
        self.threads = []
    
    def start(self):
        if self.running:
            return
        
        self.running = True
        print("Starting data simulation...")
        
        self.kafka.ensure_topics()
        
        t1 = threading.Thread(target=self._simulate_soil_data, daemon=True)
        t2 = threading.Thread(target=self._simulate_weather_data, daemon=True)
        t3 = threading.Thread(target=self._simulate_growth_data, daemon=True)
        
        self.threads = [t1, t2, t3]
        
        for t in self.threads:
            t.start()
        
        print("Data simulation started successfully.")
    
    def stop(self):
        self.running = False
        for t in self.threads:
            t.join(timeout=2)
        print("Data simulation stopped.")
    
    def _get_field_ids(self):
        db = SessionLocal()
        try:
            fields = db.query(FarmField).all()
            return [f.id for f in fields]
        finally:
            db.close()
    
    def _simulate_soil_data(self):
        while self.running:
            try:
                field_ids = self._get_field_ids()
                
                for field_id in field_ids:
                    data = {
                        "temperature": round(18 + 10 * random.random(), 1),
                        "moisture": round(35 + 25 * random.random(), 1),
                        "ph": round(6.2 + 0.6 * random.random(), 2),
                        "nitrogen": round(100 + 60 * random.random(), 1),
                        "phosphorus": round(60 + 40 * random.random(), 1),
                        "potassium": round(120 + 60 * random.random(), 1),
                        "organic_matter": round(2 + random.random(), 2),
                        "conductivity": round(1 + random.random(), 2),
                    }
                    
                    self.sensor_producer.send_soil_data(field_id, data)
                    
                    db = SessionLocal()
                    try:
                        soil_record = SoilData(
                            field_id=field_id,
                            timestamp=datetime.now(),
                            temperature=data["temperature"],
                            moisture=data["moisture"],
                            ph=data["ph"],
                            nitrogen=data["nitrogen"],
                            phosphorus=data["phosphorus"],
                            potassium=data["potassium"],
                            organic_matter=data["organic_matter"],
                            conductivity=data["conductivity"],
                        )
                        db.add(soil_record)
                        db.commit()
                    finally:
                        db.close()
                
                time.sleep(60)
                
            except Exception as e:
                print(f"Soil simulation error: {e}")
                time.sleep(10)
    
    def _simulate_weather_data(self):
        while self.running:
            try:
                field_ids = self._get_field_ids()
                
                for field_id in field_ids:
                    data = {
                        "temperature": round(20 + 10 * random.random(), 1),
                        "humidity": round(50 + 30 * random.random(), 1),
                        "wind_speed": round(1 + 4 * random.random(), 1),
                        "wind_direction": random.choice(["东风", "南风", "西风", "北风"]),
                        "rainfall": round(max(0, random.gauss(1, 3)), 1),
                        "solar_radiation": round(100 + 300 * random.random(), 1),
                        "pressure": round(1013 + random.gauss(0, 3), 1),
                        "uv_index": round(2 + 6 * random.random(), 1),
                    }
                    
                    self.sensor_producer.send_weather_data(field_id, data)
                    
                    db = SessionLocal()
                    try:
                        weather_record = WeatherData(
                            field_id=field_id,
                            timestamp=datetime.now(),
                            temperature=data["temperature"],
                            humidity=data["humidity"],
                            wind_speed=data["wind_speed"],
                            wind_direction=data["wind_direction"],
                            rainfall=data["rainfall"],
                            solar_radiation=data["solar_radiation"],
                            pressure=data["pressure"],
                            uv_index=data["uv_index"],
                        )
                        db.add(weather_record)
                        db.commit()
                    finally:
                        db.close()
                
                time.sleep(90)
                
            except Exception as e:
                print(f"Weather simulation error: {e}")
                time.sleep(10)
    
    def _simulate_growth_data(self):
        while self.running:
            try:
                field_ids = self._get_field_ids()
                
                for field_id in field_ids:
                    db = SessionLocal()
                    try:
                        field = db.query(FarmField).filter(FarmField.id == field_id).first()
                        if not field:
                            continue
                        
                        growth_days = (datetime.now() - field.planting_date).days
                        growth_progress = min(growth_days / 120, 1.0)
                        
                        stages = {
                            "小麦": ["出苗期", "分蘖期", "拔节期", "抽穗期", "灌浆期", "成熟期"],
                            "玉米": ["出苗期", "三叶期", "拔节期", "抽雄期", "吐丝期", "成熟期"],
                            "水稻": ["出苗期", "分蘖期", "拔节期", "孕穗期", "抽穗期", "成熟期"],
                            "番茄": ["幼苗期", "开花期", "结果期", "盛果期", "采收期"],
                        }
                        
                        crop_stages = stages.get(field.crop_type, ["生长期", "成熟期"])
                        stage_index = min(int(growth_progress * len(crop_stages)), len(crop_stages) - 1)
                        
                        data = {
                            "growth_stage": crop_stages[stage_index],
                            "plant_height": round(30 + 60 * growth_progress + random.gauss(0, 3), 1),
                            "leaf_area_index": round(1 + 3 * growth_progress + random.gauss(0, 0.2), 2),
                            "biomass": round(500 + 1500 * growth_progress + random.gauss(0, 50), 1),
                            "fruit_count": int(max(0, 30 * (growth_progress - 0.3) * 2 + random.gauss(0, 3))),
                            "chlorophyll": round(35 + 12 * growth_progress + random.gauss(0, 2), 1),
                            "health_status": random.choice(["健康", "健康", "良好"]),
                        }
                        
                        self.sensor_producer.send_growth_data(field_id, data)
                        
                        growth_record = CropGrowthData(
                            field_id=field_id,
                            timestamp=datetime.now(),
                            growth_stage=data["growth_stage"],
                            plant_height=data["plant_height"],
                            leaf_area_index=data["leaf_area_index"],
                            biomass=data["biomass"],
                            fruit_count=data["fruit_count"],
                            chlorophyll=data["chlorophyll"],
                            health_status=data["health_status"],
                        )
                        db.add(growth_record)
                        db.commit()
                    finally:
                        db.close()
                
                time.sleep(180)
                
            except Exception as e:
                print(f"Growth simulation error: {e}")
                time.sleep(15)


def start_simulator():
    simulator = DataSimulator()
    simulator.start()
    return simulator


if __name__ == "__main__":
    simulator = start_simulator()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        simulator.stop()
        print("Simulator stopped.")
