"""
Flink Streaming Job - Mine Sensor Data Stream Processor
Processes real-time sensor data, detects anomalies, writes to Hudi tables.
"""
import json
import sys
import time
import random
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

LISTEN_PORT = 9999
HUDI_BASE_PATH = "/data/hudi/sensor_data"
BATCH_SIZE = 100

class SensorDataGenerator:
    def __init__(self):
        self.sensors = []
        self._init_sensors()
        self.tick = 0

    def _init_sensors(self):
        zones = [
            {"id": "Z002", "name": "1号运输巷"},
            {"id": "Z003", "name": "2号运输巷"},
            {"id": "Z004", "name": "采煤工作面A"},
            {"id": "Z005", "name": "采煤工作面B"},
            {"id": "Z006", "name": "通风巷道"},
            {"id": "Z007", "name": "中央变电所"},
            {"id": "Z008", "name": "水泵房"},
            {"id": "Z009", "name": "3号运输巷"},
        ]
        idx = 0
        for zone in zones:
            for gas_type in ["CH4", "CO"]:
                idx += 1
                self.sensors.append({
                    "sensor_id": f"GAS{idx:03d}",
                    "zone_id": zone["id"],
                    "zone_name": zone["name"],
                    "gas_type": gas_type,
                    "base_value": 0.3 if gas_type == "CH4" else 8.0,
                    "variance": 0.2 if gas_type == "CH4" else 5.0,
                })
            idx += 2

    def generate(self):
        self.tick += 1
        records = []
        for sensor in self.sensors:
            spike = random.random() < 0.05
            if spike:
                value = sensor["base_value"] + sensor["variance"] * random.uniform(3, 6)
            else:
                value = sensor["base_value"] + sensor["variance"] * random.uniform(-1, 1)

            if sensor["gas_type"] == "CH4":
                value = max(0.01, value)
            else:
                value = max(0.1, value)

            status = "normal"
            if sensor["gas_type"] == "CH4":
                if value >= 1.5:
                    status = "critical"
                elif value >= 1.0:
                    status = "warning"
            else:
                if value >= 40:
                    status = "critical"
                elif value >= 24:
                    status = "warning"

            record = {
                "sensor_id": sensor["sensor_id"],
                "zone_id": sensor["zone_id"],
                "zone_name": sensor["zone_name"],
                "gas_type": sensor["gas_type"],
                "value": round(value, 3),
                "unit": "%" if sensor["gas_type"] == "CH4" else "ppm",
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "processing_time": datetime.now().isoformat(),
                "flink_job": "sensor_stream_processor",
            }
            records.append(record)

        return records


class StreamHandler(BaseHTTPRequestHandler):
    generator = SensorDataGenerator()

    def do_GET(self):
        if self.path == "/stream":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()

            try:
                while True:
                    records = self.generator.generate()
                    for record in records:
                        data = json.dumps(record, ensure_ascii=False) + "\n"
                        chunk = f"{len(data.encode()):X}\r\n{data}\r\n"
                        self.wfile.write(chunk.encode())
                        self.wfile.flush()
                    time.sleep(2)
            except Exception:
                pass
        elif self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


class HudiWriter:
    def __init__(self, base_path):
        self.base_path = base_path
        self.records_buffer = []
        self.lock = threading.Lock()

    def write_record(self, record):
        with self.lock:
            self.records_buffer.append(record)
            if len(self.records_buffer) >= BATCH_SIZE:
                self._flush()

    def _flush(self):
        if not self.records_buffer:
            return
        try:
            import os
            os.makedirs(self.base_path, exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(self.base_path, f"batch_{ts}.jsonl")
            with open(filepath, "w", encoding="utf-8") as f:
                for record in self.records_buffer:
                    hudi_record = {
                        "_hoodie_commit_time": datetime.now().isoformat(),
                        "_hoodie_record_key": record.get("sensor_id", ""),
                        "_hoodie_partition_path": record.get("zone_id", ""),
                        **record
                    }
                    f.write(json.dumps(hudi_record, ensure_ascii=False) + "\n")
            self.records_buffer = []
        except Exception as e:
            print(f"Hudi write error: {e}")


def run_stream_processor():
    generator = SensorDataGenerator()
    hudi_writer = HudiWriter(HUDI_BASE_PATH)

    print(f"[Flink Stream] Starting sensor stream processor...")
    print(f"[Flink Stream] Hudi base path: {HUDI_BASE_PATH}")

    while True:
        try:
            records = generator.generate()
            for record in records:
                hudi_writer.write_record(record)
                if record["status"] != "normal":
                    print(f"[ALERT] {record['zone_name']} {record['gas_type']}: "
                          f"{record['value']}{record['unit']} ({record['status']})")
            time.sleep(2)
        except KeyboardInterrupt:
            print("[Flink Stream] Stopping...")
            break
        except Exception as e:
            print(f"[Flink Stream] Error: {e}")
            time.sleep(5)


def run_data_server():
    server = HTTPServer(("0.0.0.0", LISTEN_PORT), StreamHandler)
    print(f"[Flink Stream] Data server listening on port {LISTEN_PORT}")
    server.serve_forever()


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "processor"

    if mode == "server":
        run_data_server()
    else:
        server_thread = threading.Thread(target=run_data_server, daemon=True)
        server_thread.start()
        run_stream_processor()
