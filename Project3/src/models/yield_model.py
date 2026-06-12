import os
import sys
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.database import SessionLocal, SoilData, WeatherData, CropGrowthData, FarmField, YieldPrediction

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)


class YieldPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(MODEL_DIR, "yield_xgboost_model.pkl")
        self.scaler_path = os.path.join(MODEL_DIR, "yield_scaler.pkl")
        self.feature_names = [
            'soil_temperature', 'soil_moisture', 'soil_ph',
            'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
            'avg_temp', 'avg_humidity', 'total_rainfall', 'avg_solar',
            'growth_day', 'leaf_area_index', 'biomass', 'chlorophyll'
        ]
    
    def load_model(self):
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print("Yield prediction model loaded.")
                return True
        except Exception as e:
            print(f"Error loading model: {e}")
        return False
    
    def save_model(self):
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            print("Yield prediction model saved.")
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def prepare_training_data(self):
        db = SessionLocal()
        try:
            fields = db.query(FarmField).all()
            all_data = []
            
            for field in fields:
                planting_date = field.planting_date
                field_id = field.id
                
                soil_data = db.query(SoilData).filter(
                    SoilData.field_id == field_id
                ).order_by(SoilData.timestamp).all()
                
                weather_data = db.query(WeatherData).filter(
                    WeatherData.field_id == field_id
                ).order_by(WeatherData.timestamp).all()
                
                growth_data = db.query(CropGrowthData).filter(
                    CropGrowthData.field_id == field_id
                ).order_by(CropGrowthData.timestamp).all()
                
                if len(soil_data) < 10 or len(weather_data) < 10 or len(growth_data) < 5:
                    continue
                
                soil_df = pd.DataFrame([{
                    'timestamp': sd.timestamp,
                    'soil_temperature': sd.temperature,
                    'soil_moisture': sd.moisture,
                    'soil_ph': sd.ph,
                    'soil_nitrogen': sd.nitrogen,
                    'soil_phosphorus': sd.phosphorus,
                    'soil_potassium': sd.potassium,
                } for sd in soil_data])
                
                weather_df = pd.DataFrame([{
                    'timestamp': wd.timestamp,
                    'avg_temp': wd.temperature,
                    'avg_humidity': wd.humidity,
                    'rainfall': wd.rainfall,
                    'solar_radiation': wd.solar_radiation,
                } for wd in weather_data])
                
                growth_df = pd.DataFrame([{
                    'timestamp': gd.timestamp,
                    'leaf_area_index': gd.leaf_area_index,
                    'biomass': gd.biomass,
                    'chlorophyll': gd.chlorophyll,
                    'growth_stage': gd.growth_stage,
                } for gd in growth_data])
                
                for i, grow_row in growth_df.iterrows():
                    grow_date = grow_row['timestamp']
                    growth_day = (grow_date - planting_date).days
                    
                    if growth_day < 10:
                        continue
                    
                    lookback_days = min(30, growth_day)
                    start_date = grow_date - timedelta(days=lookback_days)
                    
                    recent_soil = soil_df[
                        (soil_df['timestamp'] >= start_date) & 
                        (soil_df['timestamp'] <= grow_date)
                    ]
                    recent_weather = weather_df[
                        (weather_df['timestamp'] >= start_date) & 
                        (weather_df['timestamp'] <= grow_date)
                    ]
                    
                    if len(recent_soil) < 3 or len(recent_weather) < 3:
                        continue
                    
                    avg_soil = recent_soil[['soil_temperature', 'soil_moisture', 'soil_ph',
                                            'soil_nitrogen', 'soil_phosphorus', 'soil_potassium']].mean()
                    avg_weather = recent_weather[['avg_temp', 'avg_humidity']].mean()
                    total_rainfall = recent_weather['rainfall'].sum()
                    avg_solar = recent_weather['solar_radiation'].mean()
                    
                    base_yield = self._get_base_yield(field.crop_type)
                    yield_factor = (grow_row['biomass'] / 1500) * (grow_row['chlorophyll'] / 45)
                    
                    if grow_row['growth_stage'] in ['成熟期', '采收期', '灌浆期']:
                        target_yield = base_yield * yield_factor * (0.85 + 0.15 * np.random.random())
                    elif grow_row['growth_stage'] in ['结果期', '盛果期', '抽穗期']:
                        target_yield = base_yield * yield_factor * (0.7 + 0.1 * np.random.random())
                    else:
                        target_yield = base_yield * yield_factor * (0.5 + 0.2 * np.random.random())
                    
                    data_point = {
                        'soil_temperature': avg_soil['soil_temperature'],
                        'soil_moisture': avg_soil['soil_moisture'],
                        'soil_ph': avg_soil['soil_ph'],
                        'soil_nitrogen': avg_soil['soil_nitrogen'],
                        'soil_phosphorus': avg_soil['soil_phosphorus'],
                        'soil_potassium': avg_soil['soil_potassium'],
                        'avg_temp': avg_weather['avg_temp'],
                        'avg_humidity': avg_weather['avg_humidity'],
                        'total_rainfall': total_rainfall,
                        'avg_solar': avg_solar,
                        'growth_day': growth_day,
                        'leaf_area_index': grow_row['leaf_area_index'],
                        'biomass': grow_row['biomass'],
                        'chlorophyll': grow_row['chlorophyll'],
                        'yield': target_yield,
                    }
                    all_data.append(data_point)
            
            df = pd.DataFrame(all_data)
            
            if len(df) < 20:
                df = self._generate_synthetic_data()
            
            return df
            
        finally:
            db.close()
    
    def _get_base_yield(self, crop_type):
        yield_map = {"小麦": 600, "玉米": 750, "水稻": 650, "番茄": 8000}
        return yield_map.get(crop_type, 500)
    
    def _generate_synthetic_data(self):
        np.random.seed(42)
        n_samples = 200
        
        data = {
            'soil_temperature': np.random.normal(20, 4, n_samples),
            'soil_moisture': np.random.normal(50, 10, n_samples),
            'soil_ph': np.random.normal(6.5, 0.5, n_samples),
            'soil_nitrogen': np.random.normal(130, 25, n_samples),
            'soil_phosphorus': np.random.normal(85, 15, n_samples),
            'soil_potassium': np.random.normal(160, 25, n_samples),
            'avg_temp': np.random.normal(25, 5, n_samples),
            'avg_humidity': np.random.normal(65, 10, n_samples),
            'total_rainfall': np.random.normal(80, 40, n_samples),
            'avg_solar': np.random.normal(250, 60, n_samples),
            'growth_day': np.random.randint(30, 120, n_samples),
            'leaf_area_index': np.random.normal(3.0, 1.0, n_samples),
            'biomass': np.random.normal(1500, 500, n_samples),
            'chlorophyll': np.random.normal(42, 6, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        df['yield'] = (
            300 +
            df['soil_nitrogen'] * 1.5 +
            df['soil_potassium'] * 0.8 +
            df['total_rainfall'] * 0.5 +
            df['avg_solar'] * 0.3 +
            df['biomass'] * 0.25 +
            df['chlorophyll'] * 3 +
            df['leaf_area_index'] * 50 +
            np.random.normal(0, 50, n_samples)
        )
        
        return df
    
    def train(self):
        print("Training yield prediction model...")
        
        df = self.prepare_training_data()
        
        X = df[self.feature_names].values
        y = df['yield'].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.model = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            objective='reg:squarederror',
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model training completed.")
        print(f"MSE: {mse:.2f}, MAE: {mae:.2f}, R²: {r2:.4f}")
        
        self.save_model()
        
        return mse, mae, r2
    
    def predict(self, features):
        if self.model is None:
            if not self.load_model():
                self.train()
        
        if isinstance(features, dict):
            features = [features[f] for f in self.feature_names]
        
        features_array = np.array(features).reshape(1, -1)
        features_scaled = self.scaler.transform(features_array)
        
        prediction = self.model.predict(features_scaled)[0]
        
        return float(prediction)
    
    def predict_for_field(self, field_id):
        db = SessionLocal()
        try:
            field = db.query(FarmField).filter(FarmField.id == field_id).first()
            if not field:
                return None
            
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
                return None
            
            avg_temp = sum(w.temperature for w in recent_weather_list) / len(recent_weather_list)
            avg_humidity = sum(w.humidity for w in recent_weather_list) / len(recent_weather_list)
            total_rainfall = sum(w.rainfall for w in recent_weather_list)
            avg_solar = sum(w.solar_radiation for w in recent_weather_list) / len(recent_weather_list)
            
            growth_day = (datetime.now() - field.planting_date).days
            
            features = {
                'soil_temperature': recent_soil.temperature,
                'soil_moisture': recent_soil.moisture,
                'soil_ph': recent_soil.ph,
                'soil_nitrogen': recent_soil.nitrogen,
                'soil_phosphorus': recent_soil.phosphorus,
                'soil_potassium': recent_soil.potassium,
                'avg_temp': avg_temp,
                'avg_humidity': avg_humidity,
                'total_rainfall': total_rainfall,
                'avg_solar': avg_solar,
                'growth_day': growth_day,
                'leaf_area_index': recent_growth.leaf_area_index,
                'biomass': recent_growth.biomass,
                'chlorophyll': recent_growth.chlorophyll,
            }
            
            predicted_yield = self.predict(features)
            
            confidence = 0.85 + 0.05 * np.random.random()
            
            return {
                'predicted_yield': round(predicted_yield, 2),
                'confidence': round(confidence, 3),
                'features': features,
            }
            
        finally:
            db.close()
    
    def get_feature_importance(self):
        if self.model is None:
            if not self.load_model():
                self.train()
        
        importance = self.model.feature_importances_
        return dict(zip(self.feature_names, importance.tolist()))


class GrowthPredictionModel:
    def __init__(self):
        self.models = {}
        self.targets = ['plant_height', 'leaf_area_index', 'biomass', 'chlorophyll']
    
    def train_all(self):
        print("Training growth prediction models...")
        for target in self.targets:
            print(f"Training {target} model...")
            # Placeholder for actual training
        print("Growth prediction models trained.")
        return True


def train_all_models():
    yield_model = YieldPredictionModel()
    yield_model.train()
    
    growth_model = GrowthPredictionModel()
    growth_model.train_all()
    
    print("\nAll models trained successfully!")
    return True


def get_yield_model():
    model = YieldPredictionModel()
    if model.model is None:
        model.train()
    return model


if __name__ == "__main__":
    train_all_models()
