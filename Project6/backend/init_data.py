import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_db
from datetime import datetime, timedelta
import random
import json


ZONES = [
    {"zone_id": "Z001", "name": "主井通道", "level": 0, "zone_type": "shaft", "x_start": 0, "y_start": 0, "z_start": 0, "x_end": 50, "y_end": 5, "z_end": 5},
    {"zone_id": "Z002", "name": "1号运输巷", "level": 1, "zone_type": "tunnel", "x_start": 50, "y_start": 0, "z_start": -50, "x_end": 200, "y_end": 5, "z_end": -45},
    {"zone_id": "Z003", "name": "2号运输巷", "level": 1, "zone_type": "tunnel", "x_start": 50, "y_start": 0, "z_start": -55, "x_end": 200, "y_end": 5, "z_end": -60},
    {"zone_id": "Z004", "name": "采煤工作面A", "level": 2, "zone_type": "workface", "x_start": 200, "y_start": 0, "z_start": -60, "x_end": 250, "y_end": 5, "z_end": -40},
    {"zone_id": "Z005", "name": "采煤工作面B", "level": 2, "zone_type": "workface", "x_start": 200, "y_start": 0, "z_start": -40, "x_end": 250, "y_end": 5, "z_end": -20},
    {"zone_id": "Z006", "name": "通风巷道", "level": 1, "zone_type": "ventilation", "x_start": 0, "y_start": 5, "z_start": -50, "x_end": 250, "y_end": 8, "z_end": -45},
    {"zone_id": "Z007", "name": "中央变电所", "level": 1, "zone_type": "power_station", "x_start": 100, "y_start": 0, "z_start": -70, "x_end": 120, "y_end": 5, "z_end": -60},
    {"zone_id": "Z008", "name": "水泵房", "level": 1, "zone_type": "pump_room", "x_start": 80, "y_start": 0, "z_start": -75, "x_end": 100, "y_end": 5, "z_end": -65},
    {"zone_id": "Z009", "name": "3号运输巷", "level": 2, "zone_type": "tunnel", "x_start": 50, "y_start": -5, "z_start": -55, "x_end": 200, "y_end": 0, "z_end": -50},
    {"zone_id": "Z010", "name": "避难硐室", "level": 1, "zone_type": "refuge", "x_start": 150, "y_start": 0, "z_start": -70, "x_end": 170, "y_end": 5, "z_end": -60},
]

NAMES = ["张伟", "王强", "李明", "赵刚", "刘洋", "陈军", "杨勇", "黄磊", "周鹏", "吴涛",
         "徐斌", "孙杰", "马超", "朱亮", "胡波", "林峰", "何龙", "郭威", "罗飞", "梁浩",
         "宋凯", "唐磊", "韩冰", "冯雷", "董鑫", "程亮", "曹宇", "袁博", "邓飞", "许刚"]

ROLES = ["矿工", "安检员", "通风工", "机电工", "班组长", "技术员"]
TEAMS = ["掘进一队", "掘进二队", "采煤一队", "采煤二队", "机电队", "通防队"]

GAS_TYPES = ["CH4", "CO", "H2S", "CO2"]

ROUTE_TEMPLATES = [
    {"name": "工作面A撤离路线", "zone": "Z004", "waypoints": "[[250,-55,0],[200,-55,0],[150,-52,0],[100,-48,0],[50,-2,0],[0,2,0]]", "distance": 350, "estimated_time": 8.5},
    {"name": "工作面B撤离路线", "zone": "Z005", "waypoints": "[[250,-30,0],[200,-30,0],[150,-35,0],[100,-42,0],[50,-2,0],[0,2,0]]", "distance": 320, "estimated_time": 7.8},
    {"name": "运输巷撤离路线", "zone": "Z002", "waypoints": "[[200,-47,0],[150,-47,0],[100,-47,0],[50,-2,0],[0,2,0]]", "distance": 250, "estimated_time": 6.2},
    {"name": "变电所撤离路线", "zone": "Z007", "waypoints": "[[110,-65,0],[100,-48,0],[50,-2,0],[0,2,0]]", "distance": 180, "estimated_time": 4.5},
    {"name": "避难硐室路线", "zone": "Z010", "waypoints": "[[160,-65,0],[150,-52,0],[155,-62,0]]", "distance": 30, "estimated_time": 1.0},
]


def init_data():
    init_db()
    db = SessionLocal()

    try:
        from database import Personnel, GasSensor, VentilationEquipment, RoofSensor
        from database import Warning, EvacuationRoute, MineZone, SafetyReport, MiningPlan, FlinkJob

        if db.query(MineZone).count() > 0:
            print("Database already initialized, skipping...")
            return

        print("Initializing mine zones...")
        for z in ZONES:
            zone = MineZone(
                zone_id=z["zone_id"], name=z["name"], level=z["level"],
                zone_type=z["zone_type"],
                x_start=z["x_start"], y_start=z["y_start"], z_start=z["z_start"],
                x_end=z["x_end"], y_end=z["y_end"], z_end=z["z_end"],
                status="normal"
            )
            db.add(zone)

        print("Initializing personnel...")
        for i in range(30):
            zone_info = random.choice(ZONES[1:])
            x = random.uniform(zone_info["x_start"], zone_info["x_end"])
            z = random.uniform(zone_info["z_start"], zone_info["z_end"])
            y = random.uniform(zone_info["y_start"], zone_info["y_end"])
            p = Personnel(
                name=NAMES[i], employee_id=f"EMP{i+1:04d}",
                role=random.choice(ROLES), team=random.choice(TEAMS),
                x=round(x, 1), y=round(y, 1), z=round(z, 1),
                zone=zone_info["zone_id"], status="normal",
                enter_time=datetime.now() - timedelta(hours=random.randint(1, 8)),
                last_update=datetime.now()
            )
            db.add(p)

        print("Initializing gas sensors...")
        gas_idx = 0
        for zone_info in ZONES[1:]:
            for gas_type in ["CH4", "CO"]:
                gas_idx += 1
                x = (zone_info["x_start"] + zone_info["x_end"]) / 2
                z = (zone_info["z_start"] + zone_info["z_end"]) / 2
                y = (zone_info["y_start"] + zone_info["y_end"]) / 2
                value = random.uniform(0.1, 0.8) if gas_type == "CH4" else random.uniform(1, 15)
                sensor = GasSensor(
                    sensor_id=f"GAS{gas_idx:03d}",
                    name=f"{zone_info['name']}{gas_type}传感器",
                    zone=zone_info["zone_id"],
                    x=round(x, 1), y=round(y, 1), z=round(z, 1),
                    gas_type=gas_type,
                    value=round(value, 2),
                    unit="%" if gas_type == "CH4" else "ppm",
                    threshold_warning=1.0 if gas_type == "CH4" else 24,
                    threshold_critical=1.5 if gas_type == "CH4" else 40,
                    status="normal",
                    last_update=datetime.now()
                )
                db.add(sensor)

        print("Initializing ventilation equipment...")
        vent_zones = [ZONES[1], ZONES[2], ZONES[5], ZONES[8]]
        for i, zone_info in enumerate(vent_zones):
            for j in range(2):
                x = zone_info["x_start"] + (zone_info["x_end"] - zone_info["x_start"]) * (j + 1) / 3
                z = (zone_info["z_start"] + zone_info["z_end"]) / 2
                y = zone_info["y_end"] - 0.5
                vent = VentilationEquipment(
                    equip_id=f"VENT{(i*2+j+1):03d}",
                    name=f"{zone_info['name']}通风机{ j+1}号",
                    zone=zone_info["zone_id"],
                    x=round(x, 1), y=round(y, 1), z=round(z, 1),
                    equip_type="main_fan" if i == 0 else "auxiliary_fan",
                    airflow_rate=round(random.uniform(800, 2000), 1),
                    power=round(random.uniform(50, 200), 1),
                    running=True,
                    status="normal",
                    last_update=datetime.now()
                )
                db.add(vent)

        print("Initializing roof sensors...")
        roof_idx = 0
        for zone_info in ZONES[3:6]:
            for j in range(3):
                roof_idx += 1
                x = zone_info["x_start"] + (zone_info["x_end"] - zone_info["x_start"]) * (j + 1) / 4
                z = (zone_info["z_start"] + zone_info["z_end"]) / 2
                y = zone_info["y_end"]
                roof = RoofSensor(
                    sensor_id=f"ROOF{roof_idx:03d}",
                    name=f"{zone_info['name']}顶板传感器{j+1}号",
                    zone=zone_info["zone_id"],
                    x=round(x, 1), y=round(y, 1), z=round(z, 1),
                    stress_value=round(random.uniform(3, 12), 2),
                    displacement=round(random.uniform(0.5, 5), 2),
                    threshold_warning=15.0,
                    threshold_critical=25.0,
                    status="normal",
                    last_update=datetime.now()
                )
                db.add(roof)

        for j in range(3):
            roof_idx += 1
            zone_info = ZONES[3 + j // 2] if j < 2 else ZONES[4]
            x = zone_info["x_start"] + (zone_info["x_end"] - zone_info["x_start"]) * (j + 1) / 4
            z = (zone_info["z_start"] + zone_info["z_end"]) / 2
            y = zone_info["y_end"]
            roof = RoofSensor(
                sensor_id=f"ROOF{roof_idx:03d}",
                name=f"{zone_info['name']}顶板传感器{roof_idx}号",
                zone=zone_info["zone_id"],
                x=round(x, 1), y=round(y, 1), z=round(z, 1),
                stress_value=round(random.uniform(3, 12), 2),
                displacement=round(random.uniform(0.5, 5), 2),
                threshold_warning=15.0,
                threshold_critical=25.0,
                status="normal",
                last_update=datetime.now()
            )
            db.add(roof)

        print("Initializing evacuation routes...")
        for rt in ROUTE_TEMPLATES:
            route = EvacuationRoute(
                name=rt["name"], zone=rt["zone"],
                waypoints=rt["waypoints"],
                distance=rt["distance"],
                estimated_time=rt["estimated_time"],
                status="available"
            )
            db.add(route)

        print("Initializing sample warnings...")
        sample_warnings = [
            {"warning_type": "gas_overlimit", "level": "warning", "zone": "Z004", "sensor_id": "GAS007", "value": 1.2, "threshold": 1.0, "message": "采煤工作面A甲烷浓度超过预警阈值"},
            {"warning_type": "roof_stress", "level": "warning", "zone": "Z005", "sensor_id": "ROOF002", "value": 16.5, "threshold": 15.0, "message": "采煤工作面B顶板应力超过预警阈值"},
        ]
        for w in sample_warnings:
            warning = Warning(**w, handled=True, handled_at=datetime.now() - timedelta(hours=2), handled_by="系统自动")
            db.add(warning)

        print("Initializing mining plans...")
        plans = [
            {"plan_name": "2026年6月采煤计划-A面", "zone": "Z004", "plan_type": "excavation", "target_output": 5000, "actual_output": 3200, "status": "in_progress", "description": "采煤工作面A月度开采计划"},
            {"plan_name": "2026年6月采煤计划-B面", "zone": "Z005", "plan_type": "excavation", "target_output": 4500, "actual_output": 2800, "status": "in_progress", "description": "采煤工作面B月度开采计划"},
            {"plan_name": "运输巷维护计划", "zone": "Z002", "plan_type": "maintenance", "target_output": 0, "actual_output": 0, "status": "planned", "description": "1号运输巷道维护计划"},
        ]
        for p in plans:
            plan = MiningPlan(
                plan_name=p["plan_name"], zone=p["zone"], plan_type=p["plan_type"],
                start_date=datetime(2026, 6, 1), end_date=datetime(2026, 6, 30),
                target_output=p["target_output"], actual_output=p["actual_output"],
                status=p["status"], description=p["description"]
            )
            db.add(plan)

        print("Initializing Flink jobs...")
        flink_jobs = [
            {"job_name": "sensor_stream_processor", "job_type": "streaming", "status": "pending"},
            {"job_name": "safety_report_batch", "job_type": "batch", "status": "pending"},
        ]
        for fj in flink_jobs:
            job = FlinkJob(**fj)
            db.add(job)

        db.commit()
        print("Data initialization completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error initializing data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
