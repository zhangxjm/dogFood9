import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import BASE_DIR, settings

MODEL_DIR = BASE_DIR / "ml_models"
MODEL_PATH = MODEL_DIR / "fraud_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"


def generate_training_data(n_samples=10000):
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        amount = np.random.exponential(1000)
        is_weekend = np.random.choice([0, 1], p=[0.7, 0.3])
        is_night = np.random.choice([0, 1], p=[0.8, 0.2])
        transaction_type = np.random.choice([0, 1, 2, 3, 4])
        new_device = np.random.choice([0, 1], p=[0.9, 0.1])
        location_change = np.random.choice([0, 1], p=[0.85, 0.15])
        merchant_risk = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1])
        user_history = np.random.uniform(0, 1)
        amount_ratio = amount / 5000
        
        fraud_prob = (
            0.01 +
            0.3 * (amount > 50000) +
            0.1 * is_night +
            0.05 * is_weekend +
            0.15 * new_device +
            0.12 * location_change +
            0.2 * merchant_risk +
            0.08 * (transaction_type == 2) +
            0.05 * amount_ratio
        )
        
        is_fraud = np.random.choice([0, 1], p=[1 - min(fraud_prob, 0.9), min(fraud_prob, 0.9)])
        
        data.append([
            amount,
            is_weekend,
            is_night,
            transaction_type,
            new_device,
            location_change,
            merchant_risk,
            user_history,
            amount_ratio,
            is_fraud
        ])
    
    columns = [
        'amount',
        'is_weekend',
        'is_night',
        'transaction_type',
        'new_device',
        'location_change',
        'merchant_risk',
        'user_history',
        'amount_ratio',
        'is_fraud'
    ]
    
    return pd.DataFrame(data, columns=columns)


def train_model():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Generating training data...")
    df = generate_training_data(10000)
    
    X = df.drop('is_fraud', axis=1)
    y = df['is_fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"Model evaluation:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall: {recall:.4f}")
    print(f"  F1 Score: {f1:.4f}")
    
    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    print("Model training completed.")
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1
    }


class FraudDetectionModel:
    _instance = None
    _model = None
    _scaler = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance
    
    def _load_model(self):
        if not MODEL_PATH.exists():
            print("Model not found, training new model...")
            train_model()
        
        self._model = joblib.load(MODEL_PATH)
        self._scaler = joblib.load(SCALER_PATH)
        print("ML Model loaded successfully.")
    
    def predict(self, transaction_data: dict) -> dict:
        features = self._extract_features(transaction_data)
        features_scaled = self._scaler.transform([features])
        
        prediction = self._model.predict(features_scaled)[0]
        probability = self._model.predict_proba(features_scaled)[0][1]
        
        risk_score = self._calculate_risk_score(probability, transaction_data)
        
        return {
            'is_fraud': bool(prediction),
            'fraud_probability': float(probability),
            'ml_risk_score': float(risk_score)
        }
    
    def _extract_features(self, data: dict) -> list:
        amount = data.get('amount', 0)
        
        hour = data.get('hour', datetime.now().hour)
        is_night = 1 if (hour >= 0 and hour <= 5) else 0
        
        day_of_week = data.get('day_of_week', datetime.now().weekday())
        is_weekend = 1 if day_of_week >= 5 else 0
        
        type_mapping = {
            'transfer': 0,
            'payment': 1,
            'withdrawal': 2,
            'deposit': 3,
            'refund': 4
        }
        transaction_type = type_mapping.get(data.get('transaction_type', 'payment'), 1)
        
        new_device = 1 if data.get('new_device', False) else 0
        location_change = 1 if data.get('location_change', False) else 0
        
        merchant_risk_mapping = {'low': 0, 'medium': 1, 'high': 2}
        merchant_risk = merchant_risk_mapping.get(data.get('merchant_risk', 'low'), 0)
        
        user_history = data.get('user_history_score', 0.5)
        
        amount_ratio = min(amount / 50000, 5.0)
        
        return [
            amount,
            is_weekend,
            is_night,
            transaction_type,
            new_device,
            location_change,
            merchant_risk,
            user_history,
            amount_ratio
        ]
    
    def _calculate_risk_score(self, ml_probability: float, transaction_data: dict) -> float:
        base_score = ml_probability * 60
        
        amount = transaction_data.get('amount', 0)
        if amount > 50000:
            base_score += 15
        elif amount > 20000:
            base_score += 8
        
        if transaction_data.get('new_device', False):
            base_score += 10
        
        if transaction_data.get('location_change', False):
            base_score += 8
        
        if transaction_data.get('merchant_risk') == 'high':
            base_score += 12
        
        hour = transaction_data.get('hour', datetime.now().hour)
        if 0 <= hour <= 5:
            base_score += 5
        
        return min(base_score, 100)


def get_model() -> FraudDetectionModel:
    return FraudDetectionModel()


if __name__ == "__main__":
    train_model()
