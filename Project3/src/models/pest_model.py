import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.database import SessionLocal, WeatherData, SoilData, CropGrowthData, PestAlert

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

PEST_TYPES = ["蚜虫", "红蜘蛛", "玉米螟", "稻飞虱", "白粉病", "锈病"]


class PestWarningModel:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_names = [
            'avg_temp', 'avg_humidity', 'total_rainfall',
            'avg_wind_speed', 'soil_moisture', 'soil_temperature',
            'growth_day', 'leaf_area_index', 'biomass'
        ]
        self._load_all_models()
    
    def _model_path(self, pest_name):
        return os.path.join(MODEL_DIR, f"pest_{pest_name}_model.pkl")
    
    def _scaler_path(self, pest_name):
        return os.path.join(MODEL_DIR, f"pest_{pest_name}_scaler.pkl")
    
    def _load_all_models(self):
        for pest in PEST_TYPES:
            model_path = self._model_path(pest)
            scaler_path = self._scaler_path(pest)
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.models[pest] = pickle.load(f)
                    with open(scaler_path, 'rb') as f:
                        self.scalers[pest] = pickle.load(f)
                except:
                    pass
    
    def generate_synthetic_data(self, n_samples=500):
        np.random.seed(42)
        
        data = {
            'avg_temp': np.random.uniform(15, 35, n_samples),
            'avg_humidity': np.random.uniform(40, 95, n_samples),
            'total_rainfall': np.random.uniform(0, 100, n_samples),
            'avg_wind_speed': np.random.uniform(0.5, 8, n_samples),
            'soil_moisture': np.random.uniform(20, 80, n_samples),
            'soil_temperature': np.random.uniform(10, 30, n_samples),
            'growth_day': np.random.randint(10, 150, n_samples),
            'leaf_area_index': np.random.uniform(0.5, 5, n_samples),
            'biomass': np.random.uniform(100, 3000, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        pest_risks = {}
        
        for pest in PEST_TYPES:
            risk_score = self._calculate_risk_score(df, pest)
            pest_risks[pest] = (risk_score > 0.6).astype(int)
        
        return df, pest_risks
    
    def _calculate_risk_score(self, df, pest_type):
        temp = df['avg_temp']
        humidity = df['avg_humidity']
        rainfall = df['total_rainfall']
        lai = df['leaf_area_index']
        
        if pest_type == "蚜虫":
            score = (
                0.3 * ((temp > 20) & (temp < 28)).astype(float) +
                0.25 * (humidity / 100) +
                0.2 * (lai / 5) +
                0.15 * ((rainfall < 30)).astype(float) +
                0.1 * np.random.random(len(df))
            )
        elif pest_type == "红蜘蛛":
            score = (
                0.3 * ((temp > 25) & (temp < 35)).astype(float) +
                0.25 * ((humidity < 60)).astype(float) +
                0.2 * (lai / 5) +
                0.15 * (df['avg_wind_speed'] / 8) +
                0.1 * np.random.random(len(df))
            )
        elif pest_type == "玉米螟":
            score = (
                0.3 * ((temp > 22) & (temp < 30)).astype(float) +
                0.25 * (humidity / 100) +
                0.2 * (df['growth_day'] > 40).astype(float) +
                0.15 * (rainfall > 20).astype(float) +
                0.1 * np.random.random(len(df))
            )
        elif pest_type == "稻飞虱":
            score = (
                0.3 * ((temp > 25) & (temp < 32)).astype(float) +
                0.3 * (humidity / 100) +
                0.2 * (df['soil_moisture'] / 80) +
                0.1 * (rainfall > 30).astype(float) +
                0.1 * np.random.random(len(df))
            )
        elif pest_type == "白粉病":
            score = (
                0.3 * ((temp > 18) & (temp < 28)).astype(float) +
                0.3 * ((humidity > 70) & (humidity < 90)).astype(float) +
                0.2 * (lai / 5) +
                0.15 * ((rainfall < 20)).astype(float) +
                0.05 * np.random.random(len(df))
            )
        elif pest_type == "锈病":
            score = (
                0.3 * ((temp > 15) & (temp < 25)).astype(float) +
                0.3 * (humidity / 100) +
                0.2 * (rainfall > 10).astype(float) +
                0.1 * (lai / 5) +
                0.1 * np.random.random(len(df))
            )
        else:
            score = np.random.random(len(df))
        
        return np.clip(score, 0, 1)
    
    def train(self, pest_type):
        print(f"Training pest warning model for {pest_type}...")
        
        df, pest_risks = self.generate_synthetic_data(800)
        
        X = df[self.feature_names].values
        y = pest_risks[pest_type]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss',
        )
        
        model.fit(X_train_scaled, y_train)
        
        accuracy = model.score(X_test_scaled, y_test)
        print(f"{pest_type} model accuracy: {accuracy:.4f}")
        
        self.models[pest_type] = model
        self.scalers[pest_type] = scaler
        
        with open(self._model_path(pest_type), 'wb') as f:
            pickle.dump(model, f)
        with open(self._scaler_path(pest_type), 'wb') as f:
            pickle.dump(scaler, f)
        
        return accuracy
    
    def train_all(self):
        print("Training all pest warning models...")
        results = {}
        for pest in PEST_TYPES:
            results[pest] = self.train(pest)
        print("\nAll pest warning models trained.")
        return results
    
    def predict_risk(self, pest_type, features):
        if pest_type not in self.models:
            self.train(pest_type)
        
        model = self.models[pest_type]
        scaler = self.scalers[pest_type]
        
        if isinstance(features, dict):
            features = [features[f] for f in self.feature_names]
        
        features_array = np.array(features).reshape(1, -1)
        features_scaled = scaler.transform(features_array)
        
        probability = model.predict_proba(features_scaled)[0][1]
        
        return float(probability)
    
    def predict_field_risks(self, field_id):
        db = SessionLocal()
        try:
            weather_list = db.query(WeatherData).filter(
                WeatherData.field_id == field_id
            ).order_by(WeatherData.timestamp.desc()).limit(7).all()
            
            soil = db.query(SoilData).filter(
                SoilData.field_id == field_id
            ).order_by(SoilData.timestamp.desc()).first()
            
            growth = db.query(CropGrowthData).filter(
                CropGrowthData.field_id == field_id
            ).order_by(CropGrowthData.timestamp.desc()).first()
            
            if not weather_list or not soil or not growth:
                return {}
            
            avg_temp = sum(w.temperature for w in weather_list) / len(weather_list)
            avg_humidity = sum(w.humidity for w in weather_list) / len(weather_list)
            total_rainfall = sum(w.rainfall for w in weather_list)
            avg_wind = sum(w.wind_speed for w in weather_list) / len(weather_list)
            
            from src.database.models import FarmField
            field = db.query(FarmField).filter(FarmField.id == field_id).first()
            growth_day = (datetime.now() - field.planting_date).days if field else 60
            
            features = {
                'avg_temp': avg_temp,
                'avg_humidity': avg_humidity,
                'total_rainfall': total_rainfall,
                'avg_wind_speed': avg_wind,
                'soil_moisture': soil.moisture,
                'soil_temperature': soil.temperature,
                'growth_day': growth_day,
                'leaf_area_index': growth.leaf_area_index,
                'biomass': growth.biomass,
            }
            
            risks = {}
            for pest in PEST_TYPES:
                risk = self.predict_risk(pest, features)
                risks[pest] = {
                    'risk_probability': round(risk, 3),
                    'risk_level': self._get_risk_level(risk),
                    'recommendation': self._get_recommendation(pest, risk),
                }
            
            return risks
            
        finally:
            db.close()
    
    def _get_risk_level(self, probability):
        if probability < 0.3:
            return "低风险"
        elif probability < 0.6:
            return "中风险"
        else:
            return "高风险"
    
    def _get_recommendation(self, pest_type, risk):
        if risk < 0.3:
            recommendations = {
                "蚜虫": "定期巡查，保护天敌昆虫",
                "红蜘蛛": "保持田间湿度，清除杂草",
                "玉米螟": "灯光诱杀成虫，监测卵块",
                "稻飞虱": "保护田间蜘蛛，合理水肥",
                "白粉病": "通风降湿，增施磷钾肥",
                "锈病": "清除病残体，合理密植",
            }
        elif risk < 0.6:
            recommendations = {
                "蚜虫": "悬挂黄板诱杀，必要时喷施生物农药",
                "红蜘蛛": "喷施石硫合剂或矿物油",
                "玉米螟": "释放赤眼蜂进行生物防治",
                "稻飞虱": "喷施噻嗪酮等低毒农药",
                "白粉病": "喷施三唑酮或武夷菌素",
                "锈病": "喷施三唑类杀菌剂预防",
            }
        else:
            recommendations = {
                "蚜虫": "立即喷施吡虫啉或噻虫嗪，7天后复查",
                "红蜘蛛": "喷施阿维菌素+螺螨酯，5天后复喷",
                "玉米螟": "心叶期撒施颗粒剂，穗期重点防治",
                "稻飞虱": "喷施吡蚜酮+噻虫嗪，保持田间浅水",
                "白粉病": "喷施戊唑醇+醚菌酯，7天一次连喷2次",
                "锈病": "喷施丙环唑+嘧菌酯，10天一次连喷2次",
            }
        return recommendations.get(pest_type, "建议咨询植保专家")


def get_pest_model():
    model = PestWarningModel()
    if not model.models:
        model.train_all()
    return model


if __name__ == "__main__":
    model = PestWarningModel()
    model.train_all()
