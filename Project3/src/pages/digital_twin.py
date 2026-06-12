import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, SoilData, WeatherData, CropGrowthData, FertilizerWaterData, SensorDevice


def render_digital_twin():
    st.header("🌍 数字孪生可视化")
    
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        field_names = [f.name for f in fields]
        selected_field = st.selectbox("选择农田", field_names, key="twin_field_select")
        
        field = next((f for f in fields if f.name == selected_field), None)
        if not field:
            return
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            render_3d_field_view(field)
        
        with col2:
            render_field_info(field)
        
        st.subheader("📊 实时数据监测")
        render_real_time_metrics(field)
        
        st.subheader("🌱 作物生长模拟")
        render_growth_simulation(field)
        
    finally:
        db.close()


def render_3d_field_view(field):
    st.markdown("### 农田三维视图")
    
    grid_size = 20
    x = np.linspace(0, field.area ** 0.5, grid_size)
    y = np.linspace(0, field.area ** 0.5, grid_size)
    X, Y = np.meshgrid(x, y)
    
    center_x = x.mean()
    center_y = y.mean()
    dist_from_center = np.sqrt((X - center_x) ** 2 + (Y - center_y) ** 2)
    max_dist = dist_from_center.max()
    
    base_height = 0.5
    height_variation = 0.3 * np.sin(X * 0.5) * np.cos(Y * 0.5)
    moisture_factor = 0.2 * (1 - dist_from_center / max_dist)
    
    Z = base_height + height_variation + moisture_factor
    
    crop_height_factor = field.area / 50
    crop_z = Z + 0.8 * crop_height_factor * (1 + 0.3 * np.sin(X * 0.3 + Y * 0.4))
    
    colorscale_soil = [
        [0.0, '#8B4513'],
        [0.3, '#A0522D'],
        [0.6, '#CD853F'],
        [1.0, '#DEB887'],
    ]
    
    colorscale_crop = [
        [0.0, '#228B22'],
        [0.5, '#32CD32'],
        [1.0, '#90EE90'],
    ]
    
    fig = go.Figure()
    
    fig.add_trace(go.Surface(
        z=Z,
        x=x,
        y=y,
        colorscale=colorscale_soil,
        opacity=0.9,
        showscale=False,
        name="土壤层",
    ))
    
    fig.add_trace(go.Surface(
        z=crop_z,
        x=x,
        y=y,
        colorscale=colorscale_crop,
        opacity=0.85,
        showscale=False,
        name="作物层",
    ))
    
    fig.update_layout(
        scene=dict(
            xaxis_title='X (米)',
            yaxis_title='Y (米)',
            zaxis_title='高度 (米)',
            zaxis=dict(range=[0, 3]),
            camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.2)
            ),
        ),
        height=500,
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
    )
    
    st.plotly_chart(fig, width='stretch')
    
    st.caption(f"💧 土壤湿度分布 | 🌱 作物生长高度 | 面积: {field.area}亩")


def render_field_info(field):
    st.markdown("### 农田信息")
    
    growth_days = (datetime.now() - field.planting_date).days
    
    info_items = [
        ("🏷️ 农田名称", field.name),
        ("🌾 作物类型", field.crop_type),
        ("📐 种植面积", f"{field.area} 亩"),
        ("🌍 土壤类型", field.soil_type),
        ("📅 播种日期", field.planting_date.strftime("%Y-%m-%d")),
        ("⏱️ 生长天数", f"{growth_days} 天"),
        ("📍 经纬度", f"{field.latitude:.4f}, {field.longitude:.4f}"),
        ("✅ 运行状态", field.status),
    ]
    
    for label, value in info_items:
        st.metric(label, value)
    
    st.markdown("---")
    st.markdown(f"**📝 描述**\n\n{field.description}")


def render_real_time_metrics(field):
    db = SessionLocal()
    try:
        latest_soil = db.query(SoilData).filter(
            SoilData.field_id == field.id
        ).order_by(SoilData.timestamp.desc()).first()
        
        latest_weather = db.query(WeatherData).filter(
            WeatherData.field_id == field.id
        ).order_by(WeatherData.timestamp.desc()).first()
        
        latest_growth = db.query(CropGrowthData).filter(
            CropGrowthData.field_id == field.id
        ).order_by(CropGrowthData.timestamp.desc()).first()
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if latest_soil:
                st.metric("🌡️ 土壤温度", f"{latest_soil.temperature:.1f} ℃")
                st.metric("💧 土壤湿度", f"{latest_soil.moisture:.1f} %")
                st.metric("⚗️ 土壤PH值", f"{latest_soil.ph:.2f}")
            else:
                st.metric("🌡️ 土壤温度", "--")
        
        with col2:
            if latest_weather:
                st.metric("☀️ 环境温度", f"{latest_weather.temperature:.1f} ℃")
                st.metric("💨 相对湿度", f"{latest_weather.humidity:.1f} %")
                st.metric("🌬️ 风速", f"{latest_weather.wind_speed:.1f} m/s")
            else:
                st.metric("☀️ 环境温度", "--")
        
        with col3:
            if latest_soil:
                st.metric("🧪 氮含量", f"{latest_soil.nitrogen:.0f} mg/kg")
                st.metric("🧪 磷含量", f"{latest_soil.phosphorus:.0f} mg/kg")
                st.metric("🧪 钾含量", f"{latest_soil.potassium:.0f} mg/kg")
            else:
                st.metric("🧪 氮含量", "--")
        
        with col4:
            if latest_growth:
                st.metric("🌱 生育期", latest_growth.growth_stage)
                st.metric("📏 株高", f"{latest_growth.plant_height:.1f} cm")
                st.metric("🍃 叶面积指数", f"{latest_growth.leaf_area_index:.2f}")
            else:
                st.metric("🌱 生育期", "--")
        
        st.markdown("---")
        st.markdown("**🧪 土壤养分雷达图**")
        
        if latest_soil:
            render_nutrient_radar(latest_soil)
    
    finally:
        db.close()


def render_nutrient_radar(soil_data):
    categories = ['氮素', '磷素', '钾素', '有机质', '含水量', 'PH值']
    
    n_norm = min(soil_data.nitrogen / 150 * 100, 100)
    p_norm = min(soil_data.phosphorus / 100 * 100, 100)
    k_norm = min(soil_data.potassium / 200 * 100, 100)
    om_norm = min(soil_data.organic_matter / 5 * 100, 100) if soil_data.organic_matter else 50
    moisture_norm = min(soil_data.moisture / 80 * 100, 100)
    ph_norm = abs(soil_data.ph - 7) / 3 * 100
    
    values = [n_norm, p_norm, k_norm, om_norm, moisture_norm, ph_norm]
    
    fig = go.Figure(data=go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        name='土壤养分',
        line_color='#2ecc71',
        fillcolor='rgba(46, 204, 113, 0.3)',
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100],
                tickvals=[25, 50, 75, 100],
            )),
        showlegend=False,
        height=350,
    )
    
    st.plotly_chart(fig, width='stretch')


def render_growth_simulation(field):
    db = SessionLocal()
    try:
        growth_data = db.query(CropGrowthData).filter(
            CropGrowthData.field_id == field.id
        ).order_by(CropGrowthData.timestamp).all()
        
        if not growth_data:
            st.info("暂无生长数据")
            return
        
        df = pd.DataFrame([{
            "日期": gd.timestamp,
            "株高(cm)": gd.plant_height,
            "叶面积指数": gd.leaf_area_index,
            "生物量(g/m²)": gd.biomass,
            "叶绿素": gd.chlorophyll,
        } for gd in growth_data])
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["日期"],
                y=df["株高(cm)"],
                mode='lines',
                fill='tozeroy',
                name='株高',
                line=dict(color='#27ae60', width=2),
                fillcolor='rgba(39, 174, 96, 0.2)',
            ))
            fig.update_layout(
                title="株高生长曲线",
                xaxis_title="日期",
                yaxis_title="株高 (cm)",
                height=300,
            )
            st.plotly_chart(fig, width='stretch')
        
        with col2:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["日期"],
                y=df["叶面积指数"],
                mode='lines',
                fill='tozeroy',
                name='叶面积指数',
                line=dict(color='#2980b9', width=2),
                fillcolor='rgba(41, 128, 185, 0.2)',
            ))
            fig.update_layout(
                title="叶面积指数变化",
                xaxis_title="日期",
                yaxis_title="LAI",
                height=300,
            )
            st.plotly_chart(fig, width='stretch')
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["日期"],
                y=df["生物量(g/m²)"],
                mode='lines',
                fill='tozeroy',
                name='生物量',
                line=dict(color='#e67e22', width=2),
                fillcolor='rgba(230, 126, 34, 0.2)',
            ))
            fig.update_layout(
                title="生物量积累",
                xaxis_title="日期",
                yaxis_title="生物量 (g/m²)",
                height=300,
            )
            st.plotly_chart(fig, width='stretch')
        
        with col2:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["日期"],
                y=df["叶绿素"],
                mode='lines',
                fill='tozeroy',
                name='叶绿素',
                line=dict(color='#8e44ad', width=2),
                fillcolor='rgba(142, 68, 173, 0.2)',
            ))
            fig.update_layout(
                title="叶绿素含量变化",
                xaxis_title="日期",
                yaxis_title="SPAD",
                height=300,
            )
            st.plotly_chart(fig, width='stretch')
    
    finally:
        db.close()
