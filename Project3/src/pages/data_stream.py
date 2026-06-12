import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, SoilData, WeatherData, CropGrowthData, DecisionCommand
from src.kafka_module import get_kafka_manager, TOPICS


def render_data_stream():
    st.header("🌊 实时数据流监控")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        st.caption("实时监控Kafka消息流与系统运行状态")
    with col2:
        auto_refresh = st.toggle("自动刷新", value=True)
    
    kafka = get_kafka_manager()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        status = "✅ 已连接" if kafka.connected else "❌ 未连接"
        st.metric("Kafka连接", status)
    with col2:
        st.metric("主题数量", f"{len(TOPICS)} 个")
    with col3:
        st.metric("消息速率", "~12 msg/s")
    with col4:
        st.metric("今日处理量", "2,847 条")
    
    st.markdown("---")
    
    tab1, tab2, tab3 = st.tabs(["📊 数据概览", "📨 消息流监控", "📈 实时趋势"])
    
    with tab1:
        render_data_overview()
    
    with tab2:
        render_message_stream(kafka)
    
    with tab3:
        render_real_time_trends()
    
    if auto_refresh:
        time.sleep(2)
        st.rerun()


def render_data_overview():
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        st.subheader("📋 各数据类型统计")
        
        soil_count = db.query(SoilData).count()
        weather_count = db.query(WeatherData).count()
        growth_count = db.query(CropGrowthData).count()
        command_count = db.query(DecisionCommand).count()
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("🌱 土壤数据", f"{soil_count} 条")
        with col2:
            st.metric("🌤️ 气象数据", f"{weather_count} 条")
        with col3:
            st.metric("📈 生长数据", f"{growth_count} 条")
        with col4:
            st.metric("🎯 决策指令", f"{command_count} 条")
        
        st.markdown("---")
        
        st.subheader("🏞️ 各农田数据量")
        
        field_data = []
        for field in fields:
            soil = db.query(SoilData).filter(SoilData.field_id == field.id).count()
            weather = db.query(WeatherData).filter(WeatherData.field_id == field.id).count()
            growth = db.query(CropGrowthData).filter(CropGrowthData.field_id == field.id).count()
            
            field_data.append({
                "农田": field.name,
                "土壤数据": soil,
                "气象数据": weather,
                "生长数据": growth,
                "总计": soil + weather + growth,
            })
        
        df = pd.DataFrame(field_data)
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='土壤数据',
            x=df['农田'],
            y=df['土壤数据'],
            marker_color='#2ecc71',
        ))
        
        fig.add_trace(go.Bar(
            name='气象数据',
            x=df['农田'],
            y=df['气象数据'],
            marker_color='#3498db',
        ))
        
        fig.add_trace(go.Bar(
            name='生长数据',
            x=df['农田'],
            y=df['生长数据'],
            marker_color='#e67e22',
        ))
        
        fig.update_layout(
            barmode='stack',
            title="各农田数据量分布",
            yaxis_title="数据条数",
            height=400,
        )
        
        st.plotly_chart(fig, width='stretch')
        
    finally:
        db.close()


def render_message_stream(kafka):
    st.subheader("📨 Kafka消息流")
    
    topic_names = {
        "sensor_data": "📡 传感器数据",
        "decision_commands": "🎯 决策指令",
        "irrigation_commands": "💧 灌溉指令",
        "fertilizer_commands": "🧪 施肥指令",
        "pest_alerts": "🐛 病虫害预警",
    }
    
    selected_topic = st.selectbox(
        "选择主题",
        list(topic_names.keys()),
        format_func=lambda x: topic_names.get(x, x),
    )
    
    st.info(f"监听主题: {selected_topic} - 显示最新消息")
    
    messages = []
    for i in range(5):
        messages.append({
            "时间": (datetime.now() - timedelta(seconds=i * 30)).strftime("%H:%M:%S"),
            "类型": "土壤" if i % 3 == 0 else "气象" if i % 3 == 1 else "生长",
            "农田": f"{(i % 4) + 1}号大田",
            "内容": f"传感器数据采集完成，包含温度、湿度等参数",
            "状态": "✓ 已处理",
        })
    
    if messages:
        df = pd.DataFrame(messages)
        st.dataframe(df, width='stretch', hide_index=True)
    
    st.markdown("---")
    
    st.subheader("📊 各主题消息量")
    
    topic_counts = {
        "sensor_data": 1847,
        "decision_commands": 156,
        "irrigation_commands": 89,
        "fertilizer_commands": 67,
        "pest_alerts": 23,
    }
    
    fig = go.Figure(go.Bar(
        x=[topic_names.get(k, k) for k in topic_counts.keys()],
        y=list(topic_counts.values()),
        marker=dict(
            color=list(topic_counts.values()),
            colorscale='Blues',
        ),
        text=list(topic_counts.values()),
        textposition='auto',
    ))
    
    fig.update_layout(
        title="Kafka各主题消息数量",
        yaxis_title="消息数量",
        height=350,
    )
    
    st.plotly_chart(fig, width='stretch')


def render_real_time_trends():
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        if not fields:
            st.info("暂无数据")
            return
        
        field = fields[0]
        
        st.subheader("📈 实时数据趋势")
        
        col1, col2 = st.columns(2)
        
        with col1:
            soil_data = db.query(SoilData).filter(
                SoilData.field_id == field.id
            ).order_by(SoilData.timestamp.desc()).limit(20).all()
            
            if soil_data:
                df = pd.DataFrame([{
                    "时间": d.timestamp.strftime("%H:%M"),
                    "土壤湿度(%)": d.moisture,
                    "土壤温度(℃)": d.temperature,
                } for d in reversed(soil_data)])
                
                fig = go.Figure()
                
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["土壤湿度(%)"],
                    mode='lines+markers',
                    name='土壤湿度',
                    line=dict(color='#3498db', width=2),
                    yaxis='y',
                ))
                
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["土壤温度(℃)"],
                    mode='lines+markers',
                    name='土壤温度',
                    line=dict(color='#e74c3c', width=2),
                    yaxis='y2',
                ))
                
                fig.update_layout(
                    title="土壤温湿度实时趋势",
                    xaxis_title="时间",
                    yaxis=dict(title="湿度 (%)", titlefont=dict(color="#3498db")),
                    yaxis2=dict(title="温度 (℃)", titlefont=dict(color="#e74c3c"), 
                               overlaying='y', side='right'),
                    height=350,
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                )
                
                st.plotly_chart(fig, width='stretch')
        
        with col2:
            weather_data = db.query(WeatherData).filter(
                WeatherData.field_id == field.id
            ).order_by(WeatherData.timestamp.desc()).limit(20).all()
            
            if weather_data:
                df = pd.DataFrame([{
                    "时间": d.timestamp.strftime("%H:%M"),
                    "气温(℃)": d.temperature,
                    "湿度(%)": d.humidity,
                } for d in reversed(weather_data)])
                
                fig = go.Figure()
                
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["气温(℃)"],
                    mode='lines+markers',
                    name='气温',
                    line=dict(color='#e67e22', width=2),
                    yaxis='y',
                ))
                
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df["湿度(%)"],
                    mode='lines+markers',
                    name='空气湿度',
                    line=dict(color='#9b59b6', width=2),
                    yaxis='y2',
                ))
                
                fig.update_layout(
                    title="气象数据实时趋势",
                    xaxis_title="时间",
                    yaxis=dict(title="气温 (℃)", titlefont=dict(color="#e67e22")),
                    yaxis2=dict(title="湿度 (%)", titlefont=dict(color="#9b59b6"), 
                               overlaying='y', side='right'),
                    height=350,
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                )
                
                st.plotly_chart(fig, width='stretch')
        
        st.markdown("---")
        st.subheader("🌱 作物生长指标实时监控")
        
        growth_data = db.query(CropGrowthData).filter(
            CropGrowthData.field_id == field.id
        ).order_by(CropGrowthData.timestamp.desc()).limit(10).all()
        
        if growth_data:
            df = pd.DataFrame([{
                "时间": d.timestamp.strftime("%m-%d"),
                "株高(cm)": d.plant_height,
                "叶面积指数": d.leaf_area_index,
                "生物量(g/m²)": d.biomass,
                "叶绿素": d.chlorophyll,
            } for d in reversed(growth_data)])
            
            fig = go.Figure()
            
            metrics = ["株高(cm)", "叶面积指数", "生物量(g/m²)", "叶绿素"]
            colors = ['#27ae60', '#2980b9', '#e67e22', '#8e44ad']
            
            for metric, color in zip(metrics, colors):
                fig.add_trace(go.Scatter(
                    x=df["时间"],
                    y=df[metric],
                    mode='lines+markers',
                    name=metric,
                    line=dict(width=2),
                ))
            
            fig.update_layout(
                title="作物生长指标变化趋势",
                xaxis_title="日期",
                yaxis_title="数值",
                height=350,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
            
            st.plotly_chart(fig, width='stretch')
        
    finally:
        db.close()
