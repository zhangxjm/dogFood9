import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, PestAlert, WeatherData, SoilData, CropGrowthData
from src.models import get_pest_model


def render_pest_warning():
    st.header("🐛 病虫害预警")
    
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        field_names = [f.name for f in fields]
        selected_field = st.selectbox("选择农田", field_names, key="pest_field_select")
        
        field = next((f for f in fields if f.name == selected_field), None)
        if not field:
            return
        
        pest_model = get_pest_model()
        risks = pest_model.predict_field_risks(field.id)
        
        if risks:
            render_pest_risk_overview(risks)
        else:
            st.warning("无法获取病虫害风险数据")
        
        st.subheader("📊 各类病虫害风险详情")
        render_pest_detail_risks(risks)
        
        st.subheader("📋 历史病虫害记录")
        render_pest_history(field)
        
    finally:
        db.close()


def render_pest_risk_overview(risks):
    high_count = sum(1 for info in risks.values() if info['risk_level'] == "高风险")
    mid_count = sum(1 for info in risks.values() if info['risk_level'] == "中风险")
    low_count = sum(1 for info in risks.values() if info['risk_level'] == "低风险")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("🔴 高风险", f"{high_count} 种")
    
    with col2:
        st.metric("🟡 中风险", f"{mid_count} 种")
    
    with col3:
        st.metric("🟢 低风险", f"{low_count} 种")
    
    if high_count > 0:
        st.error(f"⚠️ 警告：检测到 {high_count} 种高风险病虫害，请立即采取防治措施！")
    elif mid_count > 0:
        st.warning(f"⚠️ 注意：检测到 {mid_count} 种中风险病虫害，建议加强监测。")
    else:
        st.success("✅ 当前病虫害风险较低，继续保持监测。")
    
    st.markdown("---")
    
    pest_names = list(risks.keys())
    risk_values = [info['risk_probability'] * 100 for info in risks.values()]
    risk_levels = [info['risk_level'] for info in risks.values()]
    
    colors = []
    for level in risk_levels:
        if level == "高风险":
            colors.append('#e74c3c')
        elif level == "中风险":
            colors.append('#f39c12')
        else:
            colors.append('#2ecc71')
    
    fig = go.Figure(go.Bar(
        x=pest_names,
        y=risk_values,
        marker_color=colors,
        text=[f"{v:.1f}%" for v in risk_values],
        textposition='auto',
    ))
    
    fig.add_hline(y=60, line_dash="dash", line_color="red", 
                  annotation_text="高风险阈值", annotation_position="top right")
    fig.add_hline(y=30, line_dash="dash", line_color="orange", 
                  annotation_text="中风险阈值", annotation_position="top right")
    
    fig.update_layout(
        title="病虫害风险概率分布",
        xaxis_title="病虫害类型",
        yaxis_title="发生概率 (%)",
        yaxis_range=[0, 100],
        height=350,
    )
    
    st.plotly_chart(fig, width='stretch')


def render_pest_detail_risks(risks):
    for pest_name, info in risks.items():
        risk_level = info['risk_level']
        probability = info['risk_probability']
        
        if risk_level == "高风险":
            bg_color = "#fdecea"
            border_color = "#e74c3c"
            icon = "🔴"
        elif risk_level == "中风险":
            bg_color = "#fff4e5"
            border_color = "#f39c12"
            icon = "🟡"
        else:
            bg_color = "#eafaf1"
            border_color = "#2ecc71"
            icon = "🟢"
        
        with st.expander(f"{icon} {pest_name} - {risk_level} ({probability*100:.1f}%)", expanded=risk_level=="高风险"):
            st.markdown(f"""
            <div style="padding: 15px; background-color: {bg_color}; border-left: 4px solid {border_color}; border-radius: 5px;">
                <strong>风险等级：</strong>{risk_level}<br>
                <strong>发生概率：</strong>{probability*100:.1f}%<br><br>
                <strong>防治建议：</strong><br>
                {info['recommendation']}
            </div>
            """, unsafe_allow_html=True)


def render_pest_history(field):
    db = SessionLocal()
    try:
        alerts = db.query(PestAlert).filter(
            PestAlert.field_id == field.id
        ).order_by(PestAlert.timestamp.desc()).limit(20).all()
        
        if alerts:
            df = pd.DataFrame([{
                "发生时间": a.timestamp.strftime("%Y-%m-%d %H:%M"),
                "病虫害类型": a.pest_type,
                "严重程度": a.severity,
                "风险等级": a.risk_level,
                "状态": "活跃" if a.is_active else "已处理",
            } for a in alerts])
            
            st.dataframe(df, width='stretch', hide_index=True)
            
            severity_counts = {}
            for a in alerts:
                severity_counts[a.severity] = severity_counts.get(a.severity, 0) + 1
            
            fig = go.Figure(data=[go.Pie(
                labels=list(severity_counts.keys()),
                values=list(severity_counts.values()),
                hole=0.5,
                marker=dict(colors=['#e74c3c', '#f39c12', '#2ecc71']),
            )])
            
            fig.update_layout(
                title="历史病虫害严重程度分布",
                height=300,
            )
            
            st.plotly_chart(fig, width='stretch')
        else:
            st.info("暂无历史病虫害记录")
    finally:
        db.close()
