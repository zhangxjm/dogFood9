import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.pages import (
    render_dashboard,
    render_digital_twin,
    render_yield_prediction,
    render_pest_warning,
    render_smart_decision,
    render_device_management,
    render_data_stream,
)

st.set_page_config(
    page_title="农业数字孪生精准种植系统",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-header {
        font-size: 2rem;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #7f8c8d;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 15px;
        text-align: center;
    }
    [data-testid="stSidebar"] {
        background-color: #f0f8f0;
    }
    .stButton button {
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("## 🌾 智慧农业")
    st.markdown("### 数字孪生精准种植系统")
    st.markdown("---")
    
    page = st.radio(
        "功能导航",
        [
            "🏞️ 农田总览",
            "🌍 数字孪生",
            "📈 产量预测",
            "🐛 病虫害预警",
            "🤖 智能决策",
            "📡 设备管理",
            "🌊 数据流监控",
        ],
        key="nav_radio",
    )
    
    st.markdown("---")
    st.caption("版本: v1.0.0")
    st.caption("状态: 运行中 ✅")

st.markdown('<div class="main-header">🌾 农业数字孪生精准种植系统</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">整合土壤、气象、水肥、生长数据，实现智慧农业规模化种植</div>', 
            unsafe_allow_html=True)

if page == "🏞️ 农田总览":
    render_dashboard()
elif page == "🌍 数字孪生":
    render_digital_twin()
elif page == "📈 产量预测":
    render_yield_prediction()
elif page == "🐛 病虫害预警":
    render_pest_warning()
elif page == "🤖 智能决策":
    render_smart_decision()
elif page == "📡 设备管理":
    render_device_management()
elif page == "🌊 数据流监控":
    render_data_stream()
