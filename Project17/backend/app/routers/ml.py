from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database import get_db
from app.models import MLModelConfig
from app.schemas import MLModelInfo
from app.ml_model import train_model, get_model

router = APIRouter(prefix="/api/ml", tags=["ml"])


@router.get("/models", response_model=List[MLModelInfo])
def get_ml_models(db: Session = Depends(get_db)):
    models = db.query(MLModelConfig).order_by(desc(MLModelConfig.created_at)).all()
    return models


@router.get("/models/active", response_model=MLModelInfo)
def get_active_model(db: Session = Depends(get_db)):
    model = db.query(MLModelConfig).filter(MLModelConfig.is_active == True).first()
    if not model:
        raise HTTPException(status_code=404, detail="No active model found")
    return model


@router.post("/models/train")
def train_ml_model(db: Session = Depends(get_db)):
    try:
        metrics = train_model()
        
        active_model = db.query(MLModelConfig).filter(MLModelConfig.is_active == True).first()
        if active_model:
            active_model.is_active = False
        
        new_model = MLModelConfig(
            model_name="随机森林欺诈检测模型",
            model_version=f"v1.{int(active_model.id) + 1}.0" if active_model else "v1.0.0",
            model_type="RandomForest",
            is_active=True,
            accuracy=metrics['accuracy'],
            precision=metrics['precision'],
            recall=metrics['recall'],
            f1_score=metrics['f1_score'],
            description="基于随机森林算法的欺诈交易检测模型"
        )
        
        db.add(new_model)
        db.commit()
        
        return {
            "message": "Model trained successfully",
            "metrics": metrics,
            "model": new_model
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/features/importance")
def get_feature_importance(db: Session = Depends(get_db)):
    try:
        model = get_model()
        
        feature_names = [
            '交易金额',
            '是否周末',
            '是否夜间',
            '交易类型',
            '新设备',
            '地点变更',
            '商户风险',
            '用户历史',
            '金额比例'
        ]
        
        importances = model._model.feature_importances_ if hasattr(model._model, 'feature_importances_') else [0.1] * 9
        
        feature_importance = sorted(
            zip(feature_names, importances),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            "data": [
                {"feature": name, "importance": round(float(imp), 4)}
                for name, imp in feature_importance
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
