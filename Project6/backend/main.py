import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import asyncio
import json
from datetime import datetime

from database import init_db, SessionLocal
from init_data import init_data
from services.data_simulator import DataSimulator
from routers import monitoring, warning, evacuation, report, planning, digital_twin, flink

simulator = DataSimulator()
ws_connections = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_data()
    simulator.start()
    asyncio.create_task(broadcast_realtime_data())
    yield
    simulator.stop()


app = FastAPI(
    title="矿山数字孪生安全管控系统",
    description="实时采集井下人员定位、瓦斯浓度、通风设备数据，构建井下数字孪生场景",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(monitoring.router, prefix="/api/monitoring", tags=["实时监测"])
app.include_router(warning.router, prefix="/api/warning", tags=["智能预警"])
app.include_router(evacuation.router, prefix="/api/evacuation", tags=["紧急撤离"])
app.include_router(report.router, prefix="/api/report", tags=["安全报表"])
app.include_router(planning.router, prefix="/api/planning", tags=["开采规划"])
app.include_router(digital_twin.router, prefix="/api/digital-twin", tags=["数字孪生"])
app.include_router(flink.router, prefix="/api/flink", tags=["Flink任务"])


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    db = SessionLocal()
    try:
        from database import Personnel, GasSensor, VentilationEquipment, RoofSensor, Warning, MineZone
        total_personnel = db.query(Personnel).count()
        underground = db.query(Personnel).filter(Personnel.zone != "surface").count()
        gas_sensors = db.query(GasSensor).count()
        gas_warnings = db.query(GasSensor).filter(GasSensor.status != "normal").count()
        vent_running = db.query(VentilationEquipment).filter(VentilationEquipment.running == True).count()
        vent_total = db.query(VentilationEquipment).count()
        roof_warnings = db.query(RoofSensor).filter(RoofSensor.status != "normal").count()
        active_warnings = db.query(Warning).filter(Warning.handled == False).count()
        zones_normal = db.query(MineZone).filter(MineZone.status == "normal").count()
        zones_total = db.query(MineZone).count()
        return {
            "total_personnel": total_personnel,
            "underground_personnel": underground,
            "gas_sensors": gas_sensors,
            "gas_warnings": gas_warnings,
            "ventilation_running": vent_running,
            "ventilation_total": vent_total,
            "roof_warnings": roof_warnings,
            "active_warnings": active_warnings,
            "zones_normal": zones_normal,
            "zones_total": zones_total
        }
    finally:
        db.close()


@app.get("/api/system/status")
async def system_status():
    return {
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "fastapi": "running",
            "flink": simulator.flink_status if hasattr(simulator, 'flink_status') else "checking",
            "database": "connected",
            "data_simulation": "active" if simulator.running else "stopped"
        }
    }


@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_connections.remove(websocket)


async def broadcast_realtime_data():
    while True:
        await asyncio.sleep(2)
        if not ws_connections:
            continue
        data = simulator.get_realtime_snapshot()
        disconnected = []
        for ws in ws_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            if ws in ws_connections:
                ws_connections.remove(ws)


frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/")
async def serve_index():
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "矿山数字孪生安全管控系统 API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
