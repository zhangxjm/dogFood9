import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, SoilData, WeatherData, CropGrowthData, SensorDevice


def render_dashboard():
    st.header("🌾 农田总览")
    
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        total_area = sum(f.area for f in fields)
        active_devices = db.query(SensorDevice).filter(SensorDevice.status == "在线").count()
        total_devices = db.query(SensorDevice).count()
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("🏞️ 农田数量", f"{len(fields)} 块")
        with col2:
            st.metric("📐 总种植面积", f"{total_area:.1f} 亩")
        with col3:
            st.metric("📡 在线传感器", f"{active_devices}/{total_devices}")
        with col4:
            st.metric("🌡️ 环境状态", "正常")
        
        st.subheader("农田分布概览")
        render_field_overview_map(fields)
        
        st.subheader("关键指标趋势")
        col1, col2 = st.columns(2)
        with col1:
            render_soil_moisture_trend()
        with col2:
            render_temperature_trend()
        
        st.subheader("作物生长状态")
        render_growth_status(fields)
        
    finally:
        db.close()


def render_field_overview_map(fields):
    field_data = []
    for field in fields:
        field_data.append({
            "name": field.name,
            "lat": field.latitude,
            "lon": field.longitude,
            "area": field.area,
            "crop": field.crop_type,
            "status": field.status,
        })
    
    df = pd.DataFrame(field_data)
    
    fig = go.Figure()
    
    color_map = {"正常": "green", "需关注": "orange", "异常": "red"}
    
    for _, row in df.iterrows():
        color = color_map.get(row["status"], "blue")
        size = max(15, min(40, row["area"] * 0.6))
        
        fig.add_trace(go.Scattermapbox(
            lat=[row["lat"]],
            lon=[row["lon"]],
            mode='markers+text',
            marker=go.scattermapbox.Marker(
                size=size,
                color=color,
                opacity=0.8,
            ),
            text=row["name"],
            textposition="bottom center",
            hovertext=f"""{row["name"]}<br>作物: {row["crop"]}<br>面积: {row["area"]}亩<br>状态: {row["status"]}""",
            hoverinfo='text',
            showlegend=False,
        ))
    
    fig.update_layout(
        mapbox_style="carto-positron",
        mapbox=dict(
            center=dict(lat=df["lat"].mean(), lon=df["lon"].mean()),
            zoom=13,
        ),
        height=400,
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
    )
    
    st.plotly_chart(fig, width='stretch')


def render_soil_moisture_trend():
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        fig = go.Figure()
        
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
        
        for i, field in enumerate(fields):
            data = db.query(SoilData).filter(
                SoilData.field_id == field.id
            ).order_by(SoilData.timestamp.desc()).limit(30).all()
            
            if data:
                df = pd.DataFrame([{
                    "时间": d.timestamp,
                    "湿度(%)": d.moisture,
                } for d in reversed(data)])
                
                color = colors[i % len(colors)]
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["湿度(%)"],
                    mode='lines+markers',
                    name=field.name,
                    line=dict(color=color, width=2),
                ))
        
        fig.add_hline(y=40, line_dash="dash", line_color="red", 
                      annotation_text="灌溉阈值", annotation_position="top right")
        
        fig.update_layout(
            title="土壤湿度趋势 (近7天)",
            xaxis_title="时间",
            yaxis_title="土壤湿度 (%)",
            height=300,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        
        st.plotly_chart(fig, width='stretch')
    finally:
        db.close()


def render_temperature_trend():
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        fig = go.Figure()
        
        colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']
        
        for i, field in enumerate(fields):
            data = db.query(WeatherData).filter(
                WeatherData.field_id == field.id
            ).order_by(WeatherData.timestamp.desc()).limit(30).all()
            
            if data:
                df = pd.DataFrame([{
                    "时间": d.timestamp,
                    "温度(℃)": d.temperature,
                } for d in reversed(data)])
                
                color = colors[i % len(colors)]
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["温度(℃)"],
                    mode='lines+markers',
                    name=field.name,
                    line=dict(color=color, width=2),
                ))
        
        fig.update_layout(
            title="环境温度趋势 (近7天)",
            xaxis_title="时间",
            yaxis_title="温度 (℃)",
            height=300,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        
        st.plotly_chart(fig, width='stretch')
    finally:
        db.close()


def render_growth_status(fields):
    db = SessionLocal()
    try:
        growth_data = []
        
        for field in fields:
            latest_growth = db.query(CropGrowthData).filter(
                CropGrowthData.field_id == field.id
            ).order_by(CropGrowthData.timestamp.desc()).first()
            
            if latest_growth:
                growth_days = (datetime.now() - field.planting_date).days
                growth_data.append({
                    "农田": field.name,
                    "作物": field.crop_type,
                    "生育期": latest_growth.growth_stage,
                    "株高(cm)": latest_growth.plant_height,
                    "叶面积指数": latest_growth.leaf_area_index,
                    "生物量": latest_growth.biomass,
                    "健康状态": latest_growth.health_status,
                    "生长天数": growth_days,
                })
        
        if growth_data:
            df = pd.DataFrame(growth_data)
            
            def highlight_health(val):
                if val == "健康":
                    return 'background-color: #d4edda; color: #155724'
                elif val == "良好":
                    return 'background-color: #fff3cd; color: #856404'
                else:
                    return 'background-color: #f8d7da; color: #721c24'
            
            styled_df = df.style.map(highlight_health, subset=['健康状态'])
            st.dataframe(styled_df, width='stretch', hide_index=True)
        else:
            st.info("暂无作物生长数据")
    finally:
        db.close()
