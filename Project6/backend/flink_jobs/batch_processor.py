"""
Flink Batch Job - Safety Report Batch Processor
Processes historical data from Hudi tables, generates analytics and reports.
"""
import json
import os
import sys
from datetime import datetime, timedelta
from collections import defaultdict

HUDI_BASE_PATH = "/data/hudi/sensor_data"
REPORT_OUTPUT_PATH = "/data/reports"


class SafetyReportBatchProcessor:
    def __init__(self, hudi_path, report_path):
        self.hudi_path = hudi_path
        self.report_path = report_path

    def read_hudi_data(self, hours=24):
        records = []
        if not os.path.exists(self.hudi_path):
            print(f"[Batch] Hudi path not found: {self.hudi_path}")
            return records

        cutoff = datetime.now() - timedelta(hours=hours)
        for filename in os.listdir(self.hudi_path):
            if filename.endswith(".jsonl"):
                filepath = os.path.join(self.hudi_path, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        for line in f:
                            try:
                                record = json.loads(line.strip())
                                ts_str = record.get("timestamp", "")
                                if ts_str:
                                    ts = datetime.fromisoformat(ts_str)
                                    if ts >= cutoff:
                                        records.append(record)
                            except (json.JSONDecodeError, ValueError):
                                continue
                except Exception as e:
                    print(f"[Batch] Error reading {filepath}: {e}")

        return records

    def generate_gas_statistics(self, records):
        stats = defaultdict(lambda: {"values": [], "warnings": 0, "critical": 0})
        for r in records:
            key = f"{r.get('zone_name', '')}_{r.get('gas_type', '')}"
            stats[key]["values"].append(r.get("value", 0))
            if r.get("status") == "warning":
                stats[key]["warnings"] += 1
            elif r.get("status") == "critical":
                stats[key]["critical"] += 1

        result = {}
        for key, data in stats.items():
            values = data["values"]
            result[key] = {
                "count": len(values),
                "min": min(values) if values else 0,
                "max": max(values) if values else 0,
                "avg": round(sum(values) / len(values), 3) if values else 0,
                "warnings": data["warnings"],
                "critical": data["critical"],
            }
        return result

    def generate_zone_risk_assessment(self, records):
        zone_risk = defaultdict(lambda: {"total": 0, "warnings": 0, "critical": 0})
        for r in records:
            zone = r.get("zone_name", "unknown")
            zone_risk[zone]["total"] += 1
            if r.get("status") == "warning":
                zone_risk[zone]["warnings"] += 1
            elif r.get("status") == "critical":
                zone_risk[zone]["critical"] += 1

        result = {}
        for zone, data in zone_risk.items():
            total = data["total"]
            if total == 0:
                risk_level = "safe"
            else:
                risk_ratio = (data["warnings"] + data["critical"] * 2) / total
                if risk_ratio > 0.3:
                    risk_level = "high"
                elif risk_ratio > 0.1:
                    risk_level = "medium"
                else:
                    risk_level = "low"

            result[zone] = {
                "total_readings": total,
                "warning_count": data["warnings"],
                "critical_count": data["critical"],
                "risk_level": risk_level,
            }
        return result

    def generate_compliance_report(self, records):
        gas_stats = self.generate_gas_statistics(records)
        zone_risk = self.generate_zone_risk_assessment(records)

        total_sensors = len(gas_stats)
        compliant_sensors = sum(
            1 for s in gas_stats.values()
            if s["warnings"] == 0 and s["critical"] == 0
        )

        high_risk_zones = sum(
            1 for z in zone_risk.values()
            if z["risk_level"] == "high"
        )

        report = {
            "report_type": "safety_compliance_batch",
            "generated_at": datetime.now().isoformat(),
            "period_hours": 24,
            "summary": {
                "total_records_processed": len(records),
                "total_sensor_groups": total_sensors,
                "compliant_sensors": compliant_sensors,
                "compliance_rate": round(compliant_sensors / total_sensors * 100, 1) if total_sensors > 0 else 100,
                "high_risk_zones": high_risk_zones,
            },
            "gas_statistics": gas_stats,
            "zone_risk_assessment": zone_risk,
            "recommendations": self._generate_recommendations(gas_stats, zone_risk),
        }

        return report

    def _generate_recommendations(self, gas_stats, zone_risk):
        recommendations = []
        for key, data in gas_stats.items():
            if data["critical"] > 0:
                recommendations.append(
                    f"{key}: 检测到{data['critical']}次严重超限，建议立即检查并加强通风"
                )
            elif data["warnings"] > 5:
                recommendations.append(
                    f"{key}: 检测到{data['warnings']}次预警，建议持续关注"
                )

        for zone, data in zone_risk.items():
            if data["risk_level"] == "high":
                recommendations.append(
                    f"{zone}: 风险等级为高，建议限制人员进入并加强监测"
                )

        return recommendations

    def save_report(self, report):
        os.makedirs(self.report_path, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(self.report_path, f"safety_report_{ts}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[Batch] Report saved to: {filepath}")
        return filepath

    def run(self, hours=24):
        print(f"[Batch] Starting batch processor for last {hours} hours...")
        records = self.read_hudi_data(hours)
        print(f"[Batch] Read {len(records)} records from Hudi")

        if not records:
            print("[Batch] No records found, generating sample report...")
            report = {
                "report_type": "safety_compliance_batch",
                "generated_at": datetime.now().isoformat(),
                "period_hours": hours,
                "summary": {
                    "total_records_processed": 0,
                    "total_sensor_groups": 0,
                    "compliant_sensors": 0,
                    "compliance_rate": 100,
                    "high_risk_zones": 0,
                    "note": "No historical data available yet"
                },
                "gas_statistics": {},
                "zone_risk_assessment": {},
                "recommendations": ["系统刚启动，暂无历史数据，请等待数据采集后重新生成报告"]
            }
        else:
            report = self.generate_compliance_report(records)

        filepath = self.save_report(report)
        print(f"[Batch] Report generation completed")
        return report


if __name__ == "__main__":
    hours = int(sys.argv[1]) if len(sys.argv) > 1 else 24
    processor = SafetyReportBatchProcessor(HUDI_BASE_PATH, REPORT_OUTPUT_PATH)
    processor.run(hours)
