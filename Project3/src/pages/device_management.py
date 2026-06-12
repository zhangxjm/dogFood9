import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, SensorDevice, FarmField


def render_device_management():
    st.header("📡 设备管理")
    
    db = SessionLocal()
    try:
        devices = db.query(SensorDevice).all()
        fields = db.query(FarmField).all()
        
        total_devices = len(devices)
        online_devices = sum(1 for d in devices if d.status == "在线")
        offline_devices = total_devices - online_devices
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("📟 设备总数", f"{total_devices} 台")
        with col2:
            st.metric("✅ 在线设备", f"{online_devices} 台", delta=f"{online_devices/total_devices*100:.1f}%")
        with col3:
            st.metric("❌ 离线设备", f"{offline_devices} 台")
        
        st.markdown("---")
        
        st.subheader("📋 设备列表")
        
        device_types = ["全部"] + list(set(d.device_type for d in devices))
        status_options = ["全部", "在线", "离线"]
        
        col1, col2 = st.columns(2)
        with col1:
            selected_type = st.selectbox("按类型筛选", device_types)
        with col2:
            selected_status = st.selectbox("按状态筛选", status_options)
        
        filtered_devices = devices
        if selected_type != "全部":
            filtered_devices = [d for d in filtered_devices if d.device_type == selected_type]
        if selected_status != "全部":
            filtered_devices = [d for d in filtered_devices if d.status == selected_status]
        
        if filtered_devices:
            df = pd.DataFrame([{
                "设备ID": d.device_id,
                "所属农田": next((f.name for f in fields if f.id == d.field_id), "未知"),
                "设备类型": d.device_type,
                "安装位置": d.location,
                "状态": d.status,
                "最后心跳": d.last_heartbeat.strftime("%Y-%m-%d %H:%M"),
            } for d in filtered_devices])
            
            def highlight_status(val):
                if val == "在线":
                    return 'background-color: #d4edda; color: #155724'
                else:
                    return 'background-color: #f8d7da; color: #721c24'
            
            styled_df = df.style.map(highlight_status, subset=['状态'])
            st.dataframe(styled_df, width='stretch', hide_index=True)
        else:
            st.info("没有符合条件的设备")
        
        st.markdown("---")
        st.subheader("📊 设备状态分布")
        
        col1, col2 = st.columns(2)
        
        with col1:
            status_counts = {}
            for d in devices:
                status_counts[d.status] = status_counts.get(d.status, 0) + 1
            
            fig = go.Figure(data=[go.Pie(
                labels=list(status_counts.keys()),
                values=list(status_counts.values()),
                hole=0.5,
                marker=dict(colors=['#2ecc71', '#e74c3c']),
            )])
            
            fig.update_layout(
                title="设备在线状态分布",
                height=300,
            )
            
            st.plotly_chart(fig, width='stretch')
        
        with col2:
            type_counts = {}
            for d in devices:
                type_counts[d.device_type] = type_counts.get(d.device_type, 0) + 1
            
            fig = go.Figure(go.Bar(
                x=list(type_counts.keys()),
                y=list(type_counts.values()),
                marker_color='#3498db',
            ))
            
            fig.update_layout(
                title="设备类型分布",
                yaxis_title="数量",
                height=300,
            )
            
            st.plotly_chart(fig, width='stretch')
        
        st.markdown("---")
        st.subheader("🏞️ 各农田设备分布")
        
        field_device_counts = {}
        for field in fields:
            field_devices = [d for d in devices if d.field_id == field.id]
            field_device_counts[field.name] = len(field_devices)
        
        fig = go.Figure(go.Bar(
            x=list(field_device_counts.keys()),
            y=list(field_device_counts.values()),
            marker=dict(
                color=list(field_device_counts.values()),
                colorscale='Viridis',
            ),
            text=list(field_device_counts.values()),
            textposition='auto',
        ))
        
        fig.update_layout(
            title="各农田设备数量",
            yaxis_title="设备数量",
            height=350,
        )
        
        st.plotly_chart(fig, width='stretch')
        
    finally:
        db.close()
