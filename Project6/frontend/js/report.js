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
        if (type) url += "?type=" + encodeURIComponent(type);
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
            var typeName = TYPE_MAP[r.type] || r.type || "未知";
            html += '<div class="report-item" data-id="' + r.id + '">' +
                '<div class="ri-title">' + (r.title || typeName) + '</div>' +
                '<div class="ri-meta">' + typeName + ' · ' + (r.date || r.created_at || "") + '</div>' +
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

        var html = '<div class="rc-header">' +
            '<h2 class="rc-title">' + (data.title || "安全报告") + '</h2>' +
            '<div class="rc-meta">' + (TYPE_MAP[data.type] || "") + ' · ' + (data.date || data.created_at || "") + '</div>' +
            '</div>';

        if (data.summary) {
            html += '<div class="rc-section"><h3>统计概览</h3><div class="rc-stats-grid">';
            var keys = Object.keys(data.summary);
            keys.forEach(function (key) {
                html += '<div class="rc-stat-item">' +
                    '<span class="rc-stat-label">' + key + '</span>' +
                    '<span class="rc-stat-value">' + data.summary[key] + '</span>' +
                    '</div>';
            });
            html += '</div></div>';
        }

        if (data.gas_statistics && data.gas_statistics.length > 0) {
            html += '<div class="rc-section"><h3>瓦斯统计</h3><table class="rc-table"><thead><tr>' +
                '<th>区域</th><th>最大值</th><th>平均值</th><th>超标次数</th>' +
                '</tr></thead><tbody>';
            data.gas_statistics.forEach(function (g) {
                html += '<tr>' +
                    '<td>' + (g.zone || "-") + '</td>' +
                    '<td>' + (g.max != null ? g.max : "-") + '</td>' +
                    '<td>' + (g.avg != null ? g.avg : "-") + '</td>' +
                    '<td>' + (g.overlimit_count != null ? g.overlimit_count : "-") + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
        }

        if (data.zone_risk && data.zone_risk.length > 0) {
            html += '<div class="rc-section"><h3>区域风险评估</h3><table class="rc-table"><thead><tr>' +
                '<th>区域</th><th>风险等级</th><th>预警次数</th><th>评估说明</th>' +
                '</tr></thead><tbody>';
            data.zone_risk.forEach(function (z) {
                html += '<tr>' +
                    '<td>' + (z.zone || "-") + '</td>' +
                    '<td>' + (z.risk_level || "-") + '</td>' +
                    '<td>' + (z.warning_count != null ? z.warning_count : "-") + '</td>' +
                    '<td>' + (z.description || "-") + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
        }

        if (data.recommendations && data.recommendations.length > 0) {
            html += '<div class="rc-section"><h3>安全建议</h3><ul class="rc-list">';
            data.recommendations.forEach(function (rec) {
                html += '<li>' + rec + '</li>';
            });
            html += '</ul></div>';
        }

        html += '<div class="rc-actions">' +
            '<button class="btn-export" onclick="Report.exportReport(\'' + data.id + '\')">导出Excel</button>' +
            '</div>';

        container.innerHTML = html;
    }

    function exportReport(reportId) {
        fetch("/api/report/" + reportId + "/export")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var rows = [];
                if (data.summary) {
                    rows.push("统计概览");
                    rows.push("项目,数值");
                    Object.keys(data.summary).forEach(function (key) {
                        rows.push(csvEscape(key) + "," + csvEscape(String(data.summary[key])));
                    });
                    rows.push("");
                }
                if (data.gas_statistics && data.gas_statistics.length > 0) {
                    rows.push("瓦斯统计");
                    rows.push("区域,最大值,平均值,超标次数");
                    data.gas_statistics.forEach(function (g) {
                        rows.push(csvEscape(g.zone || "") + "," + csvEscape(String(g.max != null ? g.max : "")) + "," + csvEscape(String(g.avg != null ? g.avg : "")) + "," + csvEscape(String(g.overlimit_count != null ? g.overlimit_count : "")));
                    });
                    rows.push("");
                }
                if (data.zone_risk && data.zone_risk.length > 0) {
                    rows.push("区域风险评估");
                    rows.push("区域,风险等级,预警次数,评估说明");
                    data.zone_risk.forEach(function (z) {
                        rows.push(csvEscape(z.zone || "") + "," + csvEscape(z.risk_level || "") + "," + csvEscape(String(z.warning_count != null ? z.warning_count : "")) + "," + csvEscape(z.description || ""));
                    });
                    rows.push("");
                }
                if (data.recommendations && data.recommendations.length > 0) {
                    rows.push("安全建议");
                    data.recommendations.forEach(function (rec, i) {
                        rows.push((i + 1) + "," + csvEscape(rec));
                    });
                }

                var bom = "\uFEFF";
                var csvContent = bom + rows.join("\n");
                var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                var link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "安全报告_" + reportId + ".csv";
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
