import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, YieldPrediction, SoilData, WeatherData, CropGrowthData
from src.models import get_yield_model


def render_yield_prediction():
    st.header("📈 产量预测")
    
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        field_names = [f.name for f in fields]
        selected_field = st.selectbox("选择农田", field_names, key="yield_field_select")
        
        field = next((f for f in fields if f.name == selected_field), None)
        if not field:
            return
        
        yield_model = get_yield_model()
        prediction = yield_model.predict_for_field(field.id)
        
        if prediction:
            render_prediction_result(field, prediction)
        else:
            st.warning("无法生成产量预测，请检查数据完整性")
        
        st.subheader("📊 特征重要性分析")
        render_feature_importance(yield_model)
        
        st.subheader("📋 历史预测记录")
        render_prediction_history(field)
        
    finally:
        db.close()


def render_prediction_result(field, prediction):
    predicted_yield = prediction['predicted_yield']
    confidence = prediction['confidence']
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            "🎯 预测产量",
            f"{predicted_yield:.1f} kg/亩",
            delta=f"置信度 {confidence*100:.1f}%",
        )
    
    with col2:
        total_yield = predicted_yield * field.area
        st.metric(
            "📦 预计总产量",
            f"{total_yield/1000:.2f} 吨",
            delta=f"面积 {field.area} 亩",
        )
    
    with col3:
        growth_days = (datetime.now() - field.planting_date).days
        st.metric(
            "🌱 当前生育期",
            "生长中",
            delta=f"{growth_days} 天",
        )
    
    st.markdown("---")
    
    st.markdown("### 产量贡献因素分析")
    features = prediction['features']
    
    factors = [
        ("土壤肥力", (features['soil_nitrogen'] + features['soil_phosphorus'] + features['soil_potassium']) / 3),
        ("水分条件", features['soil_moisture']),
        ("气象条件", features['avg_temp'] * 0.5 + features['avg_solar'] * 0.01),
        ("作物长势", features['biomass'] / 15 + features['chlorophyll']),
    ]
    
    max_val = max(v for _, v in factors)
    normalized_factors = [(name, min(val / max_val * 100, 100)) for name, val in factors]
    
    fig = go.Figure(go.Bar(
        x=[val for _, val in normalized_factors],
        y=[name for name, _ in normalized_factors],
        orientation='h',
        marker=dict(
            color=[val for _, val in normalized_factors],
            colorscale='Viridis',
        ),
        text=[f"{val:.1f}%" for _, val in normalized_factors],
        textposition='auto',
    ))
    
    fig.update_layout(
        xaxis_title="贡献度 (%)",
        yaxis_title="影响因素",
        height=300,
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
    )
    
    st.plotly_chart(fig, width='stretch')


def render_feature_importance(yield_model):
    try:
        importance = yield_model.get_feature_importance()
        
        feature_names_cn = {
            'soil_temperature': '土壤温度',
            'soil_moisture': '土壤湿度',
            'soil_ph': '土壤PH值',
            'soil_nitrogen': '土壤氮素',
            'soil_phosphorus': '土壤磷素',
            'soil_potassium': '土壤钾素',
            'avg_temp': '平均气温',
            'avg_humidity': '平均湿度',
            'total_rainfall': '总降雨量',
            'avg_solar': '平均光照',
            'growth_day': '生长天数',
            'leaf_area_index': '叶面积指数',
            'biomass': '生物量',
            'chlorophyll': '叶绿素',
        }
        
        sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        
        names_cn = [feature_names_cn.get(name, name) for name, _ in sorted_features]
        values = [val for _, val in sorted_features]
        
        fig = go.Figure(go.Bar(
            x=values,
            y=names_cn,
            orientation='h',
            marker=dict(
                color=values,
                colorscale='Blues_r',
            ),
        ))
        
        fig.update_layout(
            xaxis_title="重要性",
            yaxis_title="特征",
            height=400,
        )
        
        st.plotly_chart(fig, width='stretch')
        
    except Exception as e:
        st.info(f"特征重要性数据加载中: {e}")


def render_prediction_history(field):
    db = SessionLocal()
    try:
        predictions = db.query(YieldPrediction).filter(
            YieldPrediction.field_id == field.id
        ).order_by(YieldPrediction.prediction_date.desc()).limit(20).all()
        
        if predictions:
            df = pd.DataFrame([{
                "预测日期": p.prediction_date.strftime("%Y-%m-%d"),
                "预测产量(kg/亩)": p.predicted_yield,
                "置信度": f"{p.confidence*100:.1f}%",
                "模型版本": p.model_version,
            } for p in predictions])
            
            st.dataframe(df, width='stretch', hide_index=True)
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=[p.prediction_date for p in reversed(predictions)],
                y=[p.predicted_yield for p in reversed(predictions)],
                mode='lines+markers',
                name='预测产量',
                line=dict(color='#27ae60', width=2),
                fill='tozeroy',
                fillcolor='rgba(39, 174, 96, 0.1)',
            ))
            
            fig.update_layout(
                title="历史产量预测趋势",
                xaxis_title="日期",
                yaxis_title="预测产量 (kg/亩)",
                height=300,
            )
            
            st.plotly_chart(fig, width='stretch')
        else:
            st.info("暂无历史预测记录")
    finally:
        db.close()
