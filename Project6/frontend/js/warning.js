var Warning = (function () {
    var refreshInterval;

    var TYPE_MAP = {
        gas_overlimit: "瓦斯超限",
        roof_stress: "冒顶风险"
    };

    var LEVEL_MAP = {
        warning: "预警",
        critical: "危险"
    };

    function init() {
        refresh();
        refreshInterval = setInterval(refresh, 5000);
    }

    function refresh() {
        fetchStats();
        fetchActiveList();
    }

    function fetchStats() {
        fetch("/api/warning/stats")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var el;
                el = document.getElementById("w-total");
                if (el) el.textContent = data.total != null ? data.total : 0;
                el = document.getElementById("w-active");
                if (el) el.textContent = data.active != null ? data.active : 0;
                el = document.getElementById("w-warning");
                if (el) el.textContent = data.warning != null ? data.warning : 0;
                el = document.getElementById("w-critical");
                if (el) el.textContent = data.critical != null ? data.critical : 0;
            })
            .catch(function () {});
    }

    function fetchActiveList() {
        fetch("/api/warning/active")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) data = data.warnings || [];
                renderWarningList(data);
            })
            .catch(function () {});
    }

    function renderWarningList(warnings) {
        var container = document.getElementById("warning-list");
        if (!container) return;
        if (!warnings || warnings.length === 0) {
            container.innerHTML = '<div class="warning-empty">暂无预警信息</div>';
            return;
        }
        var html = "";
        warnings.forEach(function (w) {
            var cls = "warning-item level-" + (w.level || "warning");
            if (w.handled) cls += " handled";
            html += '<div class="' + cls + '" data-id="' + w.id + '">' +
                '<div class="wi-header">' +
                '<span class="wi-type">' + (TYPE_MAP[w.warning_type] || w.warning_type || "未知") + '</span>' +
                '<span class="wi-time">' + (w.time || "") + '</span>' +
                '</div>' +
                '<div class="wi-message">' + (w.message || "") + '</div>' +
                '</div>';
        });
        container.innerHTML = html;
        var items = container.querySelectorAll(".warning-item");
        items.forEach(function (item) {
            item.addEventListener("click", function () {
                var id = item.getAttribute("data-id");
                var found = warnings.find(function (w) { return String(w.id) === String(id); });
                if (found) showDetail(found);
            });
        });
    }

    function showDetail(w) {
        var container = document.getElementById("warning-detail");
        if (!container) return;
        var html = '<div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">' + (TYPE_MAP[w.warning_type] || w.warning_type || "未知") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">级别</span><span class="detail-value">' + (LEVEL_MAP[w.level] || w.level || "未知") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">区域</span><span class="detail-value">' + (w.zone || "-") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">传感器</span><span class="detail-value">' + (w.sensor_id || "-") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">当前值</span><span class="detail-value">' + (w.value != null ? w.value : "-") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">阈值</span><span class="detail-value">' + (w.threshold != null ? w.threshold : "-") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">信息</span><span class="detail-value">' + (w.message || "-") + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">时间</span><span class="detail-value">' + (w.time || "-") + '</span></div>';
        if (!w.handled) {
            html += '<button class="btn-handle" onclick="Warning.handleWarning(' + w.id + ')">处理预警</button>';
        }
        container.innerHTML = html;
    }

    function handleWarning(warningId) {
        fetch("/api/warning/" + warningId + "/handle", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handler_name: "管理员" })
        })
            .then(function (r) { return r.json(); })
            .then(function () {
                if (typeof App !== "undefined" && App.notify) {
                    App.notify("预警已处理", "success");
                }
                refresh();
            })
            .catch(function () {
                if (typeof App !== "undefined" && App.notify) {
                    App.notify("处理失败", "error");
                }
            });
    }

    function checkNow() {
        fetch("/api/warning/check", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var msg = "检查完成";
                if (data && data.new_warnings != null) {
                    msg = "检查完成，新增预警：" + data.new_warnings + " 条";
                }
                if (typeof App !== "undefined" && App.notify) {
                    App.notify(msg, "success");
                }
                refresh();
            })
            .catch(function () {
                if (typeof App !== "undefined" && App.notify) {
                    App.notify("检查失败", "error");
                }
            });
    }

    function checkEvacuation() {
        fetch("/api/warning/evacuation-check")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var container = document.getElementById("evacuation-check-result");
                if (!container) return;
                var html = "";
                if (data.safe) {
                    html = '<div class="evacuation-safe">撤离检查通过，当前安全</div>';
                } else {
                    html = '<div class="evacuation-danger">存在危险，请立即撤离！</div>';
                    if (data.reasons && data.reasons.length > 0) {
                        html += '<ul class="evacuation-reasons">';
                        data.reasons.forEach(function (r) {
                            html += "<li>" + r + "</li>";
                        });
                        html += "</ul>";
                    }
                }
                container.innerHTML = html;
            })
            .catch(function () {
                var container = document.getElementById("evacuation-check-result");
                if (container) container.innerHTML = '<div class="evacuation-danger">撤离检查失败</div>';
            });
    }

    function filterType(type) {
        fetch("/api/warning/list?type=" + encodeURIComponent(type) + "&limit=50")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) data = data.warnings || [];
                renderWarningList(data);
            })
            .catch(function () {});
    }

    function filterLevel(level) {
        fetch("/api/warning/list?level=" + encodeURIComponent(level) + "&limit=50")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) data = data.warnings || [];
                renderWarningList(data);
            })
            .catch(function () {});
    }

    return {
        init: init,
        refresh: refresh,
        handleWarning: handleWarning,
        checkNow: checkNow,
        checkEvacuation: checkEvacuation,
        filterType: filterType,
        filterLevel: filterLevel
    };
})();
