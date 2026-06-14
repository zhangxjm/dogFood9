import json
from datetime import datetime, timedelta
from sqlalchemy import func

from database import (
    SafetyReport,
    Warning,
    GasSensor,
    RoofSensor,
    VentilationEquipment,
    Personnel,
    MonitoringData,
    MineZone,
    SessionLocal,
)


def generate_daily_report(db):
    today = datetime.now().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    total_personnel = db.query(func.count(Personnel.id)).scalar() or 0
    underground_personnel = db.query(func.count(Personnel.id)).filter(
        Personnel.zone != "surface",
        Personnel.status == "normal",
    ).scalar() or 0

    gas_sensors = db.query(GasSensor).all()
    gas_count = len(gas_sensors)
    gas_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "gas",
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).scalar() or 0
    gas_max_values = {}
    for sensor in gas_sensors:
        gas_type = sensor.gas_type
        if gas_type not in gas_max_values:
            gas_max_values[gas_type] = sensor.value
        else:
            gas_max_values[gas_type] = max(gas_max_values[gas_type], sensor.value)

    roof_sensors = db.query(RoofSensor).all()
    roof_count = len(roof_sensors)
    roof_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "roof",
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).scalar() or 0
    roof_max_stress = max((s.stress_value for s in roof_sensors), default=0.0)
    roof_max_displacement = max((s.displacement for s in roof_sensors), default=0.0)

    vent_equipments = db.query(VentilationEquipment).all()
    vent_total = len(vent_equipments)
    vent_running = sum(1 for v in vent_equipments if v.running)
    vent_avg_airflow = (
        sum(v.airflow_rate for v in vent_equipments if v.running) / vent_running
        if vent_running > 0
        else 0.0
    )

    warnings = db.query(Warning).filter(
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).all()
    warning_count = len(warnings)
    warnings_by_type = {}
    warnings_by_level = {}
    for w in warnings:
        warnings_by_type[w.warning_type] = warnings_by_type.get(w.warning_type, 0) + 1
        warnings_by_level[w.level] = warnings_by_level.get(w.level, 0) + 1

    content = {
        "date": today.isoformat(),
        "personnel": {
            "total": total_personnel,
            "underground": underground_personnel,
        },
        "gas_sensors": {
            "count": gas_count,
            "warnings": gas_warnings,
            "max_values": gas_max_values,
        },
        "roof_sensors": {
            "count": roof_count,
            "warnings": roof_warnings,
            "max_stress": round(roof_max_stress, 2),
            "max_displacement": round(roof_max_displacement, 2),
        },
        "ventilation": {
            "total_equipment": vent_total,
            "running": vent_running,
            "avg_airflow": round(vent_avg_airflow, 2),
        },
        "warnings": {
            "total": warning_count,
            "by_type": warnings_by_type,
            "by_level": warnings_by_level,
        },
    }

    report = SafetyReport(
        report_type="daily",
        title=f"矿山安全日报-{today.isoformat()}",
        period_start=start,
        period_end=end,
        content=json.dumps(content, ensure_ascii=False),
        generated_at=datetime.now(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def generate_weekly_report(db):
    today = datetime.now().date()
    week_start = today - timedelta(days=6)
    start = datetime.combine(week_start, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    total_personnel = db.query(func.count(Personnel.id)).scalar() or 0
    underground_personnel = db.query(func.count(Personnel.id)).filter(
        Personnel.zone != "surface",
        Personnel.status == "normal",
    ).scalar() or 0

    gas_sensors = db.query(GasSensor).all()
    gas_count = len(gas_sensors)
    gas_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "gas",
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).scalar() or 0
    gas_max_values = {}
    for sensor in gas_sensors:
        gas_type = sensor.gas_type
        if gas_type not in gas_max_values:
            gas_max_values[gas_type] = sensor.value
        else:
            gas_max_values[gas_type] = max(gas_max_values[gas_type], sensor.value)

    roof_sensors = db.query(RoofSensor).all()
    roof_count = len(roof_sensors)
    roof_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "roof",
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).scalar() or 0
    roof_max_stress = max((s.stress_value for s in roof_sensors), default=0.0)
    roof_max_displacement = max((s.displacement for s in roof_sensors), default=0.0)

    vent_equipments = db.query(VentilationEquipment).all()
    vent_total = len(vent_equipments)
    vent_running = sum(1 for v in vent_equipments if v.running)
    vent_avg_airflow = (
        sum(v.airflow_rate for v in vent_equipments if v.running) / vent_running
        if vent_running > 0
        else 0.0
    )

    warnings = db.query(Warning).filter(
        Warning.created_at >= start,
        Warning.created_at <= end,
    ).all()
    warning_count = len(warnings)
    warnings_by_type = {}
    warnings_by_level = {}
    for w in warnings:
        warnings_by_type[w.warning_type] = warnings_by_type.get(w.warning_type, 0) + 1
        warnings_by_level[w.level] = warnings_by_level.get(w.level, 0) + 1

    daily_warning_counts = {}
    for i in range(7):
        day = week_start + timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(func.count(Warning.id)).filter(
            Warning.created_at >= day_start,
            Warning.created_at <= day_end,
        ).scalar() or 0
        daily_warning_counts[day.isoformat()] = count

    gas_threshold_compliant = sum(
        1 for s in gas_sensors if s.value < s.threshold_warning
    )
    gas_compliance_rate = round(gas_threshold_compliant / gas_count * 100, 1) if gas_count > 0 else 100.0
    roof_threshold_compliant = sum(
        1 for s in roof_sensors if s.stress_value < s.threshold_warning
    )
    roof_compliance_rate = round(roof_threshold_compliant / roof_count * 100, 1) if roof_count > 0 else 100.0
    vent_compliance_rate = round(vent_running / vent_total * 100, 1) if vent_total > 0 else 100.0

    content = {
        "period": {
            "start": week_start.isoformat(),
            "end": today.isoformat(),
        },
        "personnel": {
            "total": total_personnel,
            "underground": underground_personnel,
        },
        "gas_sensors": {
            "count": gas_count,
            "warnings": gas_warnings,
            "max_values": gas_max_values,
        },
        "roof_sensors": {
            "count": roof_count,
            "warnings": roof_warnings,
            "max_stress": round(roof_max_stress, 2),
            "max_displacement": round(roof_max_displacement, 2),
        },
        "ventilation": {
            "total_equipment": vent_total,
            "running": vent_running,
            "avg_airflow": round(vent_avg_airflow, 2),
        },
        "warnings": {
            "total": warning_count,
            "by_type": warnings_by_type,
            "by_level": warnings_by_level,
        },
        "trend_analysis": {
            "daily_warning_counts": daily_warning_counts,
        },
        "compliance": {
            "gas_compliance_rate": gas_compliance_rate,
            "roof_compliance_rate": roof_compliance_rate,
            "ventilation_compliance_rate": vent_compliance_rate,
        },
    }

    date_range = f"{week_start.isoformat()}~{today.isoformat()}"
    report = SafetyReport(
        report_type="weekly",
        title=f"安全合规周报-{date_range}",
        period_start=start,
        period_end=end,
        content=json.dumps(content, ensure_ascii=False),
        generated_at=datetime.now(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def generate_monthly_report(db):
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    if now.month == 12:
        month_end = datetime(now.year + 1, 1, 1) - timedelta(seconds=1)
    else:
        month_end = datetime(now.year, now.month + 1, 1) - timedelta(seconds=1)

    total_personnel = db.query(func.count(Personnel.id)).scalar() or 0
    underground_personnel = db.query(func.count(Personnel.id)).filter(
        Personnel.zone != "surface",
        Personnel.status == "normal",
    ).scalar() or 0

    gas_sensors = db.query(GasSensor).all()
    gas_count = len(gas_sensors)
    gas_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "gas",
        Warning.created_at >= month_start,
        Warning.created_at <= month_end,
    ).scalar() or 0
    gas_max_values = {}
    for sensor in gas_sensors:
        gas_type = sensor.gas_type
        if gas_type not in gas_max_values:
            gas_max_values[gas_type] = sensor.value
        else:
            gas_max_values[gas_type] = max(gas_max_values[gas_type], sensor.value)

    roof_sensors = db.query(RoofSensor).all()
    roof_count = len(roof_sensors)
    roof_warnings = db.query(func.count(Warning.id)).filter(
        Warning.warning_type == "roof",
        Warning.created_at >= month_start,
        Warning.created_at <= month_end,
    ).scalar() or 0
    roof_max_stress = max((s.stress_value for s in roof_sensors), default=0.0)
    roof_max_displacement = max((s.displacement for s in roof_sensors), default=0.0)

    vent_equipments = db.query(VentilationEquipment).all()
    vent_total = len(vent_equipments)
    vent_running = sum(1 for v in vent_equipments if v.running)
    vent_avg_airflow = (
        sum(v.airflow_rate for v in vent_equipments if v.running) / vent_running
        if vent_running > 0
        else 0.0
    )

    warnings = db.query(Warning).filter(
        Warning.created_at >= month_start,
        Warning.created_at <= month_end,
    ).all()
    warning_count = len(warnings)
    warnings_by_type = {}
    warnings_by_level = {}
    for w in warnings:
        warnings_by_type[w.warning_type] = warnings_by_type.get(w.warning_type, 0) + 1
        warnings_by_level[w.level] = warnings_by_level.get(w.level, 0) + 1

    handled_warnings = sum(1 for w in warnings if w.handled)
    unhandled_warnings = warning_count - handled_warnings

    zones = db.query(MineZone).all()
    zone_warnings = {}
    for zone in zones:
        count = sum(1 for w in warnings if w.zone == zone.zone_id)
        zone_warnings[zone.zone_id] = count

    monitoring_records = db.query(func.count(MonitoringData.id)).filter(
        MonitoringData.recorded_at >= month_start,
        MonitoringData.recorded_at <= month_end,
    ).scalar() or 0

    content = {
        "month": f"{now.year}-{now.month:02d}",
        "personnel": {
            "total": total_personnel,
            "underground": underground_personnel,
        },
        "gas_sensors": {
            "count": gas_count,
            "warnings": gas_warnings,
            "max_values": gas_max_values,
        },
        "roof_sensors": {
            "count": roof_count,
            "warnings": roof_warnings,
            "max_stress": round(roof_max_stress, 2),
            "max_displacement": round(roof_max_displacement, 2),
        },
        "ventilation": {
            "total_equipment": vent_total,
            "running": vent_running,
            "avg_airflow": round(vent_avg_airflow, 2),
        },
        "warnings": {
            "total": warning_count,
            "by_type": warnings_by_type,
            "by_level": warnings_by_level,
            "handled": handled_warnings,
            "unhandled": unhandled_warnings,
        },
        "production": {
            "monitoring_records": monitoring_records,
            "active_zones": len(zones),
        },
        "safety_metrics": {
            "zone_warnings": zone_warnings,
        },
        "incident_summary": {
            "total_warnings": warning_count,
            "critical_count": warnings_by_level.get("critical", 0),
            "warning_level_count": warnings_by_level.get("warning", 0),
            "info_count": warnings_by_level.get("info", 0),
            "handled_rate": round(handled_warnings / warning_count * 100, 1) if warning_count > 0 else 100.0,
        },
    }

    month_label = f"{now.year}-{now.month:02d}"
    report = SafetyReport(
        report_type="monthly",
        title=f"安全生产月报-{month_label}",
        period_start=month_start,
        period_end=month_end,
        content=json.dumps(content, ensure_ascii=False),
        generated_at=datetime.now(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_reports(db, report_type=None, limit=20):
    query = db.query(SafetyReport)
    if report_type:
        query = query.filter(SafetyReport.report_type == report_type)
    return query.order_by(SafetyReport.generated_at.desc()).limit(limit).all()


def get_report_content(db, report_id):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        return None
    content = json.loads(report.content) if report.content else {}
    return {
        "id": report.id,
        "report_type": report.report_type,
        "title": report.title,
        "period_start": report.period_start.isoformat() if report.period_start else None,
        "period_end": report.period_end.isoformat() if report.period_end else None,
        "content": content,
        "file_path": report.file_path or "",
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
    }


def export_report_excel(db, report_id):
    data = get_report_content(db, report_id)
    if not data:
        return None
    content = data["content"]
    report_type = data["report_type"]

    if report_type == "daily":
        headers = ["类别", "指标", "数值"]
        rows = [
            ["人员", "总人数", content.get("personnel", {}).get("total", 0)],
            ["人员", "井下人数", content.get("personnel", {}).get("underground", 0)],
            ["瓦斯传感器", "总数", content.get("gas_sensors", {}).get("count", 0)],
            ["瓦斯传感器", "预警次数", content.get("gas_sensors", {}).get("warnings", 0)],
            ["顶板传感器", "总数", content.get("roof_sensors", {}).get("count", 0)],
            ["顶板传感器", "预警次数", content.get("roof_sensors", {}).get("warnings", 0)],
            ["顶板传感器", "最大应力", content.get("roof_sensors", {}).get("max_stress", 0)],
            ["顶板传感器", "最大位移", content.get("roof_sensors", {}).get("max_displacement", 0)],
            ["通风设备", "总数", content.get("ventilation", {}).get("total_equipment", 0)],
            ["通风设备", "运行中", content.get("ventilation", {}).get("running", 0)],
            ["通风设备", "平均风量", content.get("ventilation", {}).get("avg_airflow", 0)],
            ["预警", "总数", content.get("warnings", {}).get("total", 0)],
        ]
        for wtype, count in content.get("warnings", {}).get("by_type", {}).items():
            wtype_cn = {"gas": "瓦斯", "roof": "顶板", "gas_overlimit": "瓦斯超限", "roof_stress": "冒顶风险"}.get(wtype, wtype)
            rows.append(["预警分类", wtype_cn, count])
        for wlevel, count in content.get("warnings", {}).get("by_level", {}).items():
            wlevel_cn = {"warning": "预警级", "critical": "危险级"}.get(wlevel, wlevel)
            rows.append(["预警级别", wlevel_cn, count])
    elif report_type == "weekly":
        headers = ["类别", "指标", "数值"]
        rows = [
            ["人员", "总人数", content.get("personnel", {}).get("total", 0)],
            ["人员", "井下人数", content.get("personnel", {}).get("underground", 0)],
            ["瓦斯传感器", "总数", content.get("gas_sensors", {}).get("count", 0)],
            ["瓦斯传感器", "预警次数", content.get("gas_sensors", {}).get("warnings", 0)],
            ["顶板传感器", "总数", content.get("roof_sensors", {}).get("count", 0)],
            ["顶板传感器", "预警次数", content.get("roof_sensors", {}).get("warnings", 0)],
            ["通风设备", "运行中", content.get("ventilation", {}).get("running", 0)],
            ["预警", "总数", content.get("warnings", {}).get("total", 0)],
            ["合规率", "瓦斯合规率(%)", content.get("compliance", {}).get("gas_compliance_rate", 0)],
            ["合规率", "顶板合规率(%)", content.get("compliance", {}).get("roof_compliance_rate", 0)],
            ["合规率", "通风合规率(%)", content.get("compliance", {}).get("ventilation_compliance_rate", 0)],
        ]
        for date_str, count in content.get("trend_analysis", {}).get("daily_warning_counts", {}).items():
            rows.append(["每日预警趋势", date_str, count])
    elif report_type == "monthly":
        headers = ["类别", "指标", "数值"]
        rows = [
            ["人员", "总人数", content.get("personnel", {}).get("total", 0)],
            ["人员", "井下人数", content.get("personnel", {}).get("underground", 0)],
            ["瓦斯传感器", "总数", content.get("gas_sensors", {}).get("count", 0)],
            ["瓦斯传感器", "预警次数", content.get("gas_sensors", {}).get("warnings", 0)],
            ["顶板传感器", "总数", content.get("roof_sensors", {}).get("count", 0)],
            ["顶板传感器", "预警次数", content.get("roof_sensors", {}).get("warnings", 0)],
            ["通风设备", "运行中", content.get("ventilation", {}).get("running", 0)],
            ["预警", "总数", content.get("warnings", {}).get("total", 0)],
            ["预警", "已处理", content.get("warnings", {}).get("handled", 0)],
            ["预警", "未处理", content.get("warnings", {}).get("unhandled", 0)],
            ["生产", "监测记录", content.get("production", {}).get("monitoring_records", 0)],
            ["生产", "活跃区域", content.get("production", {}).get("active_zones", 0)],
            ["事故", "严重事故数", content.get("incident_summary", {}).get("critical_count", 0)],
            ["事故", "处理率(%)", content.get("incident_summary", {}).get("handled_rate", 0)],
        ]
        for zone_id, count in content.get("safety_metrics", {}).get("zone_warnings", {}).items():
            rows.append(["区域预警", zone_id, count])
    else:
        headers = ["Key", "Value"]
        rows = [[k, v] for k, v in content.items()]

    return {
        "title": data["title"],
        "report_type": data["report_type"],
        "period_start": data["period_start"],
        "period_end": data["period_end"],
        "headers": headers,
        "rows": rows,
    }
