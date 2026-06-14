import threading
import time
import random
from datetime import datetime
from database import (
    Personnel, GasSensor, VentilationEquipment, RoofSensor,
    Warning, MonitoringData, MineZone, SessionLocal
)

GAS_NORMAL_RANGES = {
    "CH4": (0.1, 0.8),
    "CO": (5.0, 20.0),
}
GAS_SPIKE_RANGES = {
    "CH4": (1.5, 2.5),
    "CO": (40.0, 80.0),
}
GAS_SPIKE_PROBABILITY = 0.05
ROOF_NORMAL_RANGE = (3.0, 12.0)
ROOF_SPIKE_RANGE = (15.0, 28.0)
ROOF_SPIKE_PROBABILITY = 0.03
VENTILATION_STATUS_CHANGE_PROB = 0.02
PERSONNEL_STEP_SIZE = 2.0
HAZARD_PROXIMITY_THRESHOLD = 5.0


class DataSimulator:
    def __init__(self):
        self.running = False
        self._thread = None
        self._zones = {}
        self._personnel_cache = {}
        self._gas_cache = {}
        self._vent_cache = {}
        self._roof_cache = {}
        self._last_warnings = []

    def start(self):
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join(timeout=5)
            self._thread = None

    def _run_loop(self):
        self._load_initial_state()
        while self.running:
            try:
                self._tick()
            except Exception:
                pass
            time.sleep(random.uniform(2.0, 3.0))

    def _load_initial_state(self):
        db = SessionLocal()
        try:
            zones = db.query(MineZone).all()
            self._zones = {z.zone_id: z for z in zones}
            for p in db.query(Personnel).all():
                self._personnel_cache[p.id] = {
                    "id": p.id, "name": p.name, "x": p.x, "y": p.y, "z": p.z,
                    "zone": p.zone, "status": p.status, "employee_id": p.employee_id
                }
            for g in db.query(GasSensor).all():
                self._gas_cache[g.id] = {
                    "id": g.id, "sensor_id": g.sensor_id, "gas_type": g.gas_type,
                    "value": g.value, "zone": g.zone, "status": g.status,
                    "unit": g.unit,
                    "threshold_warning": g.threshold_warning, "threshold_critical": g.threshold_critical
                }
            for v in db.query(VentilationEquipment).all():
                self._vent_cache[v.id] = {
                    "id": v.id, "equip_id": v.equip_id, "airflow_rate": v.airflow_rate,
                    "running": v.running, "zone": v.zone, "status": v.status
                }
            for r in db.query(RoofSensor).all():
                self._roof_cache[r.id] = {
                    "id": r.id, "sensor_id": r.sensor_id, "stress_value": r.stress_value,
                    "displacement": r.displacement, "zone": r.zone, "status": r.status,
                    "threshold_warning": r.threshold_warning, "threshold_critical": r.threshold_critical,
                    "x": r.x, "y": r.y, "z": r.z
                }
        finally:
            db.close()

    def _tick(self):
        self._simulate_personnel()
        self._simulate_gas_sensors()
        self._simulate_ventilation()
        self._simulate_roof_sensors()
        self._detect_warnings()
        self._persist_state()

    def _simulate_personnel(self):
        for pid, p in self._personnel_cache.items():
            zone = self._zones.get(p["zone"])
            if zone:
                p["x"] += random.uniform(-PERSONNEL_STEP_SIZE, PERSONNEL_STEP_SIZE)
                p["y"] += random.uniform(-PERSONNEL_STEP_SIZE, PERSONNEL_STEP_SIZE)
                p["z"] += random.uniform(-PERSONNEL_STEP_SIZE * 0.3, PERSONNEL_STEP_SIZE * 0.3)
                p["x"] = max(zone.x_start, min(zone.x_end, p["x"]))
                p["y"] = max(zone.y_start, min(zone.y_end, p["y"]))
                p["z"] = max(zone.z_start, min(zone.z_end, p["z"]))
            else:
                p["x"] += random.uniform(-PERSONNEL_STEP_SIZE, PERSONNEL_STEP_SIZE)
                p["y"] += random.uniform(-PERSONNEL_STEP_SIZE, PERSONNEL_STEP_SIZE)
                p["z"] += random.uniform(-PERSONNEL_STEP_SIZE * 0.3, PERSONNEL_STEP_SIZE * 0.3)
            p["status"] = self._compute_personnel_status(p)

    def _compute_personnel_status(self, person):
        for gas in self._gas_cache.values():
            if gas["zone"] != person["zone"]:
                continue
            if gas["status"] in ("warning", "critical"):
                return "danger"
        for roof in self._roof_cache.values():
            if roof["zone"] != person["zone"]:
                continue
            if roof["status"] in ("warning", "critical"):
                return "danger"
        return "normal"

    def _simulate_gas_sensors(self):
        for sid, sensor in self._gas_cache.items():
            gas_type = sensor["gas_type"]
            normal_range = GAS_NORMAL_RANGES.get(gas_type, (0.1, 0.8))
            spike_range = GAS_SPIKE_RANGES.get(gas_type, (1.5, 2.5))
            if random.random() < GAS_SPIKE_PROBABILITY:
                new_val = random.uniform(*spike_range)
            else:
                delta = random.uniform(-0.1, 0.1)
                new_val = sensor["value"] + delta
                new_val = max(normal_range[0], min(normal_range[1], new_val))
            sensor["value"] = round(new_val, 3)
            sensor["status"] = self._compute_gas_status(sensor)

    def _compute_gas_status(self, sensor):
        v = sensor["value"]
        if v >= sensor["threshold_critical"]:
            return "critical"
        if v >= sensor["threshold_warning"]:
            return "warning"
        return "normal"

    def _simulate_ventilation(self):
        for vid, vent in self._vent_cache.items():
            if random.random() < VENTILATION_STATUS_CHANGE_PROB:
                vent["running"] = not vent["running"]
            if vent["running"]:
                vent["airflow_rate"] = round(random.uniform(15.0, 35.0), 1)
                vent["status"] = "normal"
            else:
                vent["airflow_rate"] = 0.0
                vent["status"] = "stopped"

    def _simulate_roof_sensors(self):
        for rid, roof in self._roof_cache.items():
            if random.random() < ROOF_SPIKE_PROBABILITY:
                new_stress = random.uniform(*ROOF_SPIKE_RANGE)
            else:
                delta = random.uniform(-0.3, 0.5)
                new_stress = roof["stress_value"] + delta
                new_stress = max(ROOF_NORMAL_RANGE[0], min(ROOF_NORMAL_RANGE[1], new_stress))
            roof["stress_value"] = round(new_stress, 2)
            roof["displacement"] = round(roof["stress_value"] * random.uniform(0.01, 0.05), 4)
            roof["status"] = self._compute_roof_status(roof)

    def _compute_roof_status(self, roof):
        v = roof["stress_value"]
        if v >= roof["threshold_critical"]:
            return "critical"
        if v >= roof["threshold_warning"]:
            return "warning"
        return "normal"

    def _get_zone_name(self, zone_id):
        zone = self._zones.get(zone_id)
        return zone.name if zone else zone_id

    def _detect_warnings(self):
        db = SessionLocal()
        try:
            for gas in self._gas_cache.values():
                zone_name = self._get_zone_name(gas["zone"])
                if gas["status"] == "warning":
                    self._create_warning_if_needed(
                        db, gas["sensor_id"], gas["zone"], "gas",
                        "warning", gas["value"], gas["threshold_warning"],
                        f"{zone_name}{gas['gas_type']}浓度超过预警阈值，当前值: {gas['value']}{gas['unit']}"
                    )
                elif gas["status"] == "critical":
                    self._create_warning_if_needed(
                        db, gas["sensor_id"], gas["zone"], "gas",
                        "critical", gas["value"], gas["threshold_critical"],
                        f"{zone_name}{gas['gas_type']}浓度超过危险阈值，当前值: {gas['value']}{gas['unit']}"
                    )
            for roof in self._roof_cache.values():
                zone_name = self._get_zone_name(roof["zone"])
                if roof["status"] == "warning":
                    self._create_warning_if_needed(
                        db, roof["sensor_id"], roof["zone"], "roof",
                        "warning", roof["stress_value"], roof["threshold_warning"],
                        f"{zone_name}顶板应力超过预警阈值，当前值: {roof['stress_value']}"
                    )
                elif roof["status"] == "critical":
                    self._create_warning_if_needed(
                        db, roof["sensor_id"], roof["zone"], "roof",
                        "critical", roof["stress_value"], roof["threshold_critical"],
                        f"{zone_name}顶板应力超过危险阈值，当前值: {roof['stress_value']}"
                    )
            db.commit()
        finally:
            db.close()

    def _create_warning_if_needed(self, db, sensor_id, zone, warning_type, level, value, threshold, message):
        recent = db.query(Warning).filter(
            Warning.sensor_id == sensor_id,
            Warning.warning_type == warning_type,
            Warning.level == level,
            Warning.handled == False,
        ).first()
        if recent:
            return
        w = Warning(
            warning_type=warning_type,
            level=level,
            zone=zone,
            sensor_id=sensor_id,
            value=value,
            threshold=threshold,
            message=message,
            handled=False,
            created_at=datetime.now(),
        )
        db.add(w)

    def _persist_state(self):
        db = SessionLocal()
        try:
            now = datetime.now()
            for p_data in self._personnel_cache.values():
                p = db.query(Personnel).filter(Personnel.id == p_data["id"]).first()
                if p:
                    p.x = p_data["x"]
                    p.y = p_data["y"]
                    p.z = p_data["z"]
                    p.zone = p_data["zone"]
                    p.status = p_data["status"]
                    p.last_update = now
            for g_data in self._gas_cache.values():
                g = db.query(GasSensor).filter(GasSensor.id == g_data["id"]).first()
                if g:
                    g.value = g_data["value"]
                    g.status = g_data["status"]
                    g.last_update = now
                    md = MonitoringData(
                        data_type="gas",
                        source_id=g_data["sensor_id"],
                        value=g_data["value"],
                        unit="%",
                        zone=g_data["zone"],
                        recorded_at=now,
                    )
                    db.add(md)
            for v_data in self._vent_cache.values():
                v = db.query(VentilationEquipment).filter(VentilationEquipment.id == v_data["id"]).first()
                if v:
                    v.airflow_rate = v_data["airflow_rate"]
                    v.running = v_data["running"]
                    v.status = v_data["status"]
                    v.last_update = now
            for r_data in self._roof_cache.values():
                r = db.query(RoofSensor).filter(RoofSensor.id == r_data["id"]).first()
                if r:
                    r.stress_value = r_data["stress_value"]
                    r.displacement = r_data["displacement"]
                    r.status = r_data["status"]
                    r.last_update = now
                    md = MonitoringData(
                        data_type="roof",
                        source_id=r_data["sensor_id"],
                        value=r_data["stress_value"],
                        unit="MPa",
                        zone=r_data["zone"],
                        recorded_at=now,
                    )
                    db.add(md)
            db.commit()
        finally:
            db.close()

    def get_realtime_snapshot(self):
        now = datetime.now().isoformat()
        personnel = [
            {"id": p["id"], "name": p["name"], "x": p["x"], "y": p["y"], "z": p["z"],
             "zone": p["zone"], "status": p["status"]}
            for p in self._personnel_cache.values()
        ]
        gas_sensors = [
            {"sensor_id": g["sensor_id"], "value": g["value"], "status": g["status"], "zone": g["zone"]}
            for g in self._gas_cache.values()
        ]
        ventilation = [
            {"equip_id": v["equip_id"], "airflow_rate": v["airflow_rate"],
             "running": v["running"], "status": v["status"]}
            for v in self._vent_cache.values()
        ]
        roof_sensors = [
            {"sensor_id": r["sensor_id"], "stress_value": r["stress_value"],
             "displacement": r["displacement"], "status": r["status"], "zone": r["zone"]}
            for r in self._roof_cache.values()
        ]
        db = SessionLocal()
        try:
            warnings = db.query(Warning).filter(Warning.handled == False).order_by(
                Warning.created_at.desc()
            ).limit(20).all()
            warning_list = [
                {"id": w.id, "type": w.warning_type, "level": w.level, "zone": w.zone,
                 "sensor_id": w.sensor_id, "value": w.value, "threshold": w.threshold,
                 "message": w.message, "created_at": w.created_at.isoformat() if w.created_at else None}
                for w in warnings
            ]
            recent_data = db.query(MonitoringData).order_by(
                MonitoringData.recorded_at.desc()
            ).limit(50).all()
            monitoring_data = [
                {"id": m.id, "data_type": m.data_type, "source_id": m.source_id,
                 "value": m.value, "unit": m.unit, "zone": m.zone,
                 "recorded_at": m.recorded_at.isoformat() if m.recorded_at else None}
                for m in recent_data
            ]
        finally:
            db.close()
        return {
            "timestamp": now,
            "personnel": personnel,
            "gas_sensors": gas_sensors,
            "ventilation": ventilation,
            "roof_sensors": roof_sensors,
            "warnings": warning_list,
            "monitoring_data": monitoring_data,
        }
