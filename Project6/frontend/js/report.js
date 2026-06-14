var Report = (function () {
    var refreshInterval;

    var TYPE_MAP = {
        daily: "日报",
        weekly: "周报",
        monthly: "月报"
    };

    function init() {
        loadReportList();
        refreshInterval = setInterval(function () {
            loadReportList();
        }, 30000);
    }

    function generateDaily() {
        fetch("/api/report/generate/daily", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function () {
                App.notify("日报生成成功", "success");
                loadReportList();
            })
            .catch(function () {
                App.notify("日报生成失败", "error");
            });
    }

    function generateWeekly() {
        fetch("/api/report/generate/weekly", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function () {
                App.notify("周报生成成功", "success");
                loadReportList();
            })
            .catch(function () {
                App.notify("周报生成失败", "error");
            });
    }

    function generateMonthly() {
        fetch("/api/report/generate/monthly", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function () {
                App.notify("月报生成成功", "success");
                loadReportList();
            })
            .catch(function () {
                App.notify("月报生成失败", "error");
            });
    }

    function filterType(type) {
        loadReportList(type);
    }

    function loadReportList(type) {
        var url = "/api/report/list";
        if (type) url += "?report_type=" + encodeURIComponent(type);
        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) data = data.reports || [];
                renderReportList(data);
            })
            .catch(function () {});
    }

    function renderReportList(reports) {
        var container = document.getElementById("report-list");
        if (!container) return;
        if (!reports || reports.length === 0) {
            container.innerHTML = '<div class="report-empty">暂无报告</div>';
            return;
        }
        var html = "";
        reports.forEach(function (r) {
            var typeName = TYPE_MAP[r.report_type] || r.report_type || "未知";
            var dateStr = "";
            if (r.generated_at) {
                dateStr = r.generated_at.substring(0, 10);
            }
            html += '<div class="report-item" data-id="' + r.id + '">' +
                '<div class="ri-title">' + (r.title || typeName) + '</div>' +
                '<div class="ri-meta">' + typeName + ' · ' + dateStr + '</div>' +
                '</div>';
        });
        container.innerHTML = html;
        var items = container.querySelectorAll(".report-item");
        items.forEach(function (item) {
            item.addEventListener("click", function () {
                var id = item.getAttribute("data-id");
                loadReportContent(id);
            });
        });
    }

    function loadReportContent(reportId) {
        fetch("/api/report/" + reportId)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                renderReportContent(data);
            })
            .catch(function () {
                var container = document.getElementById("report-content");
                if (container) container.innerHTML = '<div class="report-error">加载报告内容失败</div>';
            });
    }

    function renderReportContent(data) {
        var container = document.getElementById("report-content");
        if (!container) return;

        var typeName = TYPE_MAP[data.report_type] || "";
        var dateStr = "";
        if (data.generated_at) {
            dateStr = data.generated_at.substring(0, 10);
        }

        var html = '<div class="rc-header">' +
            '<h2 class="rc-title">' + (data.title || "安全报告") + '</h2>' +
            '<div class="rc-meta">' + typeName + ' · ' + dateStr + '</div>' +
            '</div>';

        var c = data.content || {};

        html += '<div class="rc-section"><h3>人员统计</h3><div class="rc-stats-grid">';
        var p = c.personnel || {};
        html += '<div class="rc-stat-item"><span class="rc-stat-label">总人数</span><span class="rc-stat-value">' + (p.total || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">井下人数</span><span class="rc-stat-value">' + (p.underground || 0) + '</span></div>';
        html += '</div></div>';

        html += '<div class="rc-section"><h3>传感器统计</h3><div class="rc-stats-grid">';
        var gs = c.gas_sensors || {};
        var rs = c.roof_sensors || {};
        html += '<div class="rc-stat-item"><span class="rc-stat-label">瓦斯传感器</span><span class="rc-stat-value">' + (gs.count || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">瓦斯预警</span><span class="rc-stat-value">' + (gs.warnings || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">顶板传感器</span><span class="rc-stat-value">' + (rs.count || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">顶板预警</span><span class="rc-stat-value">' + (rs.warnings || 0) + '</span></div>';
        if (rs.max_stress != null) {
            html += '<div class="rc-stat-item"><span class="rc-stat-label">最大应力</span><span class="rc-stat-value">' + rs.max_stress + ' MPa</span></div>';
        }
        if (rs.max_displacement != null) {
            html += '<div class="rc-stat-item"><span class="rc-stat-label">最大位移</span><span class="rc-stat-value">' + rs.max_displacement + ' mm</span></div>';
        }
        html += '</div></div>';

        html += '<div class="rc-section"><h3>通风设备</h3><div class="rc-stats-grid">';
        var v = c.ventilation || {};
        html += '<div class="rc-stat-item"><span class="rc-stat-label">设备总数</span><span class="rc-stat-value">' + (v.total_equipment || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">运行中</span><span class="rc-stat-value">' + (v.running || 0) + '</span></div>';
        if (v.avg_airflow != null) {
            html += '<div class="rc-stat-item"><span class="rc-stat-label">平均风量</span><span class="rc-stat-value">' + v.avg_airflow + ' m³/s</span></div>';
        }
        html += '</div></div>';

        var w = c.warnings || {};
        html += '<div class="rc-section"><h3>预警统计</h3><div class="rc-stats-grid">';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">预警总数</span><span class="rc-stat-value">' + (w.total || 0) + '</span></div>';
        var byLevel = w.by_level || {};
        html += '<div class="rc-stat-item"><span class="rc-stat-label">预警级</span><span class="rc-stat-value">' + (byLevel.warning || 0) + '</span></div>';
        html += '<div class="rc-stat-item"><span class="rc-stat-label">危险级</span><span class="rc-stat-value">' + (byLevel.critical || 0) + '</span></div>';
        html += '</div></div>';

        if (c.compliance) {
            html += '<div class="rc-section"><h3>合规率</h3><div class="rc-stats-grid">';
            var comp = c.compliance || {};
            html += '<div class="rc-stat-item"><span class="rc-stat-label">瓦斯合规率</span><span class="rc-stat-value">' + (comp.gas_compliance_rate != null ? comp.gas_compliance_rate + "%" : "-") + '</span></div>';
            html += '<div class="rc-stat-item"><span class="rc-stat-label">顶板合规率</span><span class="rc-stat-value">' + (comp.roof_compliance_rate != null ? comp.roof_compliance_rate + "%" : "-") + '</span></div>';
            html += '<div class="rc-stat-item"><span class="rc-stat-label">通风合规率</span><span class="rc-stat-value">' + (comp.ventilation_compliance_rate != null ? comp.ventilation_compliance_rate + "%" : "-") + '</span></div>';
            html += '</div></div>';
        }

        if (c.trend_analysis && c.trend_analysis.daily_warning_counts) {
            var trend = c.trend_analysis.daily_warning_counts;
            var dates = Object.keys(trend).sort();
            if (dates.length > 0) {
                html += '<div class="rc-section"><h3>每日预警趋势</h3><table class="rc-table"><thead><tr>';
                html += '<th>日期</th><th>预警数量</th>';
                html += '</tr></thead><tbody>';
                dates.forEach(function (d) {
                    html += '<tr><td>' + d + '</td><td>' + trend[d] + '</td></tr>';
                });
                html += '</tbody></table></div>';
            }
        }

        if (c.production) {
            html += '<div class="rc-section"><h3>生产数据</h3><div class="rc-stats-grid">';
            var prod = c.production || {};
            html += '<div class="rc-stat-item"><span class="rc-stat-label">监测记录</span><span class="rc-stat-value">' + (prod.monitoring_records || 0) + '</span></div>';
            html += '<div class="rc-stat-item"><span class="rc-stat-label">活跃区域</span><span class="rc-stat-value">' + (prod.active_zones || 0) + '</span></div>';
            html += '</div></div>';
        }

        if (c.incident_summary) {
            html += '<div class="rc-section"><h3>事故汇总</h3><div class="rc-stats-grid">';
            var inc = c.incident_summary || {};
            html += '<div class="rc-stat-item"><span class="rc-stat-label">严重事故</span><span class="rc-stat-value">' + (inc.critical_count || 0) + '</span></div>';
            html += '<div class="rc-stat-item"><span class="rc-stat-label">处理率</span><span class="rc-stat-value">' + (inc.handled_rate != null ? inc.handled_rate + "%" : "-") + '</span></div>';
            html += '</div></div>';
        }

        if (c.safety_metrics && c.safety_metrics.zone_warnings) {
            var zw = c.safety_metrics.zone_warnings;
            var zones = Object.keys(zw);
            if (zones.length > 0) {
                html += '<div class="rc-section"><h3>区域预警统计</h3><table class="rc-table"><thead><tr>';
                html += '<th>区域</th><th>预警次数</th>';
                html += '</tr></thead><tbody>';
                zones.forEach(function (z) {
                    html += '<tr><td>' + z + '</td><td>' + zw[z] + '</td></tr>';
                });
                html += '</tbody></table></div>';
            }
        }

        html += '<div class="rc-actions">' +
            '<button class="btn-export" onclick="Report.exportReport(\'' + data.id + '\')">导出报表</button>' +
            '</div>';

        container.innerHTML = html;
    }

    function exportReport(reportId) {
        fetch("/api/report/" + reportId + "/export")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var rows = [];
                if (data.title) {
                    rows.push(data.title);
                    rows.push("");
                }
                if (data.headers && data.headers.length > 0) {
                    rows.push(data.headers.map(function (h) { return csvEscape(String(h)); }).join(","));
                }
                if (data.rows && data.rows.length > 0) {
                    data.rows.forEach(function (row) {
                        rows.push(row.map(function (cell) { return csvEscape(String(cell != null ? cell : "")); }).join(","));
                    });
                }

                var bom = "\uFEFF";
                var csvContent = bom + rows.join("\n");
                var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                var link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                var filename = "安全报表_" + reportId + ".csv";
                if (data.title) {
                    filename = data.title + ".csv";
                }
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);
                App.notify("导出成功", "success");
            })
            .catch(function () {
                App.notify("导出失败", "error");
            });
    }

    function csvEscape(str) {
        if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    return {
        init: init,
        generateDaily: generateDaily,
        generateWeekly: generateWeekly,
        generateMonthly: generateMonthly,
        filterType: filterType,
        loadReportList: loadReportList,
        loadReportContent: loadReportContent,
        exportReport: exportReport
    };
})();
