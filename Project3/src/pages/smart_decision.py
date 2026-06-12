import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, FarmField, DecisionCommand, SoilData, WeatherData, CropGrowthData
from src.decision import get_decision_engine


def render_smart_decision():
    st.header("🤖 智能决策中心")
    
    db = SessionLocal()
    try:
        fields = db.query(FarmField).all()
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            field_names = [f.name for f in fields]
            selected_field = st.selectbox("选择农田", field_names, key="decision_field_select")
        
        with col2:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("🔄 一键分析全部农田", type="primary", width='stretch'):
                engine = get_decision_engine()
                results = engine.auto_dispatch_all()
                st.success(f"已自动生成并下发 {len(results)} 条决策指令！")
                st.rerun()
        
        field = next((f for f in fields if f.name == selected_field), None)
        if not field:
            return
        
        engine = get_decision_engine()
        analysis = engine.analyze_field(field.id)
        
        if "error" in analysis:
            st.error(analysis["error"])
            return
        
        render_analysis_summary(analysis)
        
        st.subheader("📋 决策建议")
        render_decision_suggestions(field, analysis, engine)
        
        st.subheader("📜 决策指令记录")
        render_decision_history(field)
        
    finally:
        db.close()


def render_analysis_summary(analysis):
    soil_status = analysis["soil_status"]["status"]
    weather_status = analysis["weather_status"]["status"]
    growth_status = analysis["growth_status"]["status"]
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        status_emoji = "🟢" if soil_status == "正常" else "🟡" if soil_status == "需关注" else "🔴"
        st.metric(f"{status_emoji} 土壤状态", soil_status)
        st.caption(f"湿度: {analysis['soil_status']['moisture']:.1f}%")
    
    with col2:
        status_emoji = "🟢" if weather_status == "正常" else "🟡" if weather_status == "高温" else "🔴"
        st.metric(f"{status_emoji} 气象状态", weather_status)
        st.caption(f"均温: {analysis['weather_status']['avg_temperature']:.1f}℃")
    
    with col3:
        status_emoji = "🟢" if growth_status in ["正常", "健康"] else "🟡" if growth_status == "良好" else "🔴"
        st.metric(f"{status_emoji} 生长状态", analysis["growth_status"]["current_stage"])
        st.caption(f"生长天数: {analysis['growth_status']['growth_day']}天")
    
    st.markdown("---")


def render_decision_suggestions(field, analysis, engine):
    decisions = analysis.get("decisions", [])
    
    if not decisions:
        st.success("✅ 当前无需特殊决策，作物生长状态良好")
        return
    
    for i, decision in enumerate(decisions):
        decision_type = decision["type"]
        priority = decision["priority"]
        content = decision["content"]
        
        type_colors = {
            "灌溉": "#3498db",
            "施肥": "#e67e22",
            "植保": "#e74c3c",
            "状态": "#2ecc71",
        }
        
        bg_color = type_colors.get(decision_type, "#95a5a6")
        priority_labels = {1: "高优先级", 2: "中优先级", 3: "低优先级"}
        
        with st.container():
            st.markdown(f"""
            <div style="padding: 15px; border-radius: 10px; border-left: 5px solid {bg_color}; 
                        background-color: #f8f9fa; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: {bg_color}; font-size: 18px;">
                        🌿 {decision_type}决策
                    </strong>
                    <span style="background-color: {bg_color}; color: white; padding: 4px 12px; 
                                 border-radius: 20px; font-size: 12px;">
                        {priority_labels.get(priority, '普通')}
                    </span>
                </div>
                <p style="margin-top: 10px; color: #333;">{content}</p>
            </div>
            """, unsafe_allow_html=True)
            
            if decision_type in ["灌溉", "施肥", "植保"]:
                col1, col2 = st.columns([1, 5])
                with col1:
                    if st.button(f"✅ 执行", key=f"execute_{i}", type="primary"):
                        cmd_id = engine.execute_decision(field.id, decision)
                        st.success(f"决策指令已下发！指令ID: {cmd_id}")
                        st.rerun()
                with col2:
                    params = decision.get("parameters", {})
                    if params:
                        with st.expander("📊 查看详细参数"):
                            for key, value in params.items():
                                st.write(f"- **{key}**: {value}")
            
            st.markdown("---")


def render_decision_history(field):
    db = SessionLocal()
    try:
        commands = db.query(DecisionCommand).filter(
            DecisionCommand.field_id == field.id
        ).order_by(DecisionCommand.timestamp.desc()).limit(30).all()
        
        if commands:
            df = pd.DataFrame([{
                "下达时间": cmd.timestamp.strftime("%Y-%m-%d %H:%M"),
                "类型": cmd.command_type,
                "内容": cmd.content,
                "优先级": cmd.priority,
                "状态": cmd.status,
            } for cmd in commands])
            
            status_colors = {
                "待执行": "#f39c12",
                "执行中": "#3498db",
                "已完成": "#2ecc71",
                "已取消": "#95a5a6",
            }
            
            def color_status(val):
                color = status_colors.get(val, "#333")
                return f'color: {color}'
            
            styled_df = df.style.map(color_status, subset=['状态'])
            st.dataframe(styled_df, width='stretch', hide_index=True)
            
            type_counts = {}
            for cmd in commands:
                type_counts[cmd.command_type] = type_counts.get(cmd.command_type, 0) + 1
            
            if type_counts:
                fig = go.Figure(data=[go.Pie(
                    labels=list(type_counts.keys()),
                    values=list(type_counts.values()),
                    hole=0.5,
                )])
                
                fig.update_layout(
                    title="决策指令类型分布",
                    height=300,
                )
                
                st.plotly_chart(fig, width='stretch')
        else:
            st.info("暂无决策指令记录")
    finally:
        db.close()
