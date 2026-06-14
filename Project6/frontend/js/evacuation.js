var Evacuation = (function () {
    var refreshInterval;

    var ZONE_COLORS = {
        normal: "#66bb6a",
        warning: "#ff9800",
        critical: "#ef5350",
        evacuating: "#ab47bc"
    };

    var ZONE_LABELS = {
        normal: "正常",
        warning: "预警",
        critical: "危险",
        evacuating: "撤离中"
    };

    function init() {
        loadZones();
        loadRoutes();
        loadStatus();
        drawEvacMap();
        refreshInterval = setInterval(function () {
            loadStatus();
            drawEvacMap();
        }, 5000);
    }

    function loadZones() {
        fetch("/api/planning/zones")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) data = data.zones || [];
                var select = document.getElementById("evac-zone-select");
                if (!select) return;
                select.innerHTML = '<option value="">-- 请选择区域 --</option>';
                data.forEach(function (z) {
                    var opt = document.createElement("option");
                    opt.value = z.id || z.zone_id;
                    opt.textContent = z.name || z.zone_name;
                    select.appendChild(opt);
                });
                select.addEventListener("change", function () {
                    var zoneId = select.value;
                    if (zoneId) {
                        loadGuidance(zoneId);
                        loadRefuge(zoneId);
                    } else {
                        var guidanceEl = document.getElementById("evac-guidance-info");
                        if (guidanceEl) guidanceEl.innerHTML = "";
                        var refugeEl = document.getElementById("evac-refuge-info");
                        if (refugeEl) refugeEl.innerHTML = "";
                    }
                    drawEvacMap();
                });
            })
            .catch(function () {});
    }

    function loadGuidance(zoneId) {
        fetch("/api/evacuation/guidance/" + encodeURIComponent(zoneId))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var container = document.getElementById("evac-guidance-info");
                if (!container) return;
                var html = '<div class="guidance-section">';
                html += '<div class="guidance-row"><span class="guidance-label">区域名称</span><span class="guidance-value">' + (data.zone_name || data.zone || "-") + '</span></div>';
                html += '<div class="guidance-row"><span class="guidance-label">人员数量</span><span class="guidance-value">' + (data.personnel_count != null ? data.personnel_count : "-") + ' 人</span></div>';
                html += '<div class="guidance-row"><span class="guidance-label">预计撤离时间</span><span class="guidance-value">' + (data.estimated_time != null ? data.estimated_time + " 分钟" : "-") + '</span></div>';
                if (data.personnel && data.personnel.length > 0) {
                    html += '<div class="guidance-row"><span class="guidance-label">人员名单</span><span class="guidance-value">' + data.personnel.join("、") + '</span></div>';
                }
                if (data.blocked_paths && data.blocked_paths.length > 0) {
                    html += '<div class="guidance-blocked"><span class="guidance-label">⚠ 阻断通道</span><span class="guidance-value">' + data.blocked_paths.join("、") + '</span></div>';
                }
                if (data.waypoints && data.waypoints.length > 0) {
                    html += '<div class="guidance-waypoints"><span class="guidance-label">撤离路线</span><ol>';
                    data.waypoints.forEach(function (wp) {
                        var name = wp.name || wp;
                        html += '<li>' + name + '</li>';
                    });
                    html += '</ol></div>';
                }
                html += '</div>';
                container.innerHTML = html;
            })
            .catch(function () {
                var container = document.getElementById("evac-guidance-info");
                if (container) container.innerHTML = '<div class="guidance-error">加载指引信息失败</div>';
            });
    }

    function triggerEvacuation() {
        var select = document.getElementById("evac-zone-select");
        if (!select || !select.value) {
            App.notify("请先选择撤离区域", "error");
            return;
        }
        var zoneId = select.value;
        fetch("/api/evacuation/trigger/" + encodeURIComponent(zoneId), {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success || data.status === "ok") {
                    App.notify("撤离指令已发送", "success");
                } else {
                    App.notify(data.message || "撤离触发失败", "error");
                }
                loadStatus();
                drawEvacMap();
            })
            .catch(function () {
                App.notify("撤离触发请求失败", "error");
            });
    }

    function drawEvacMap() {
        var canvas = document.getElementById("evac-canvas");
        if (!canvas) return;
        canvas.width = 800;
        canvas.height = 500;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, 800, 500);

        var tunnels = [
            { x: 40, y: 60, w: 180, h: 50, label: "主巷道A" },
            { x: 40, y: 170, w: 180, h: 50, label: "主巷道B" },
            { x: 40, y: 280, w: 180, h: 50, label: "运输巷道" },
            { x: 40, y: 390, w: 180, h: 50, label: "通风巷道" },
            { x: 280, y: 60, w: 180, h: 50, label: "采区巷道1" },
            { x: 280, y: 170, w: 180, h: 50, label: "采区巷道2" },
            { x: 280, y: 280, w: 180, h: 50, label: "采区巷道3" },
            { x: 280, y: 390, w: 180, h: 50, label: "回风巷道" },
            { x: 520, y: 60, w: 180, h: 50, label: "掘进巷道" },
            { x: 520, y: 170, w: 180, h: 50, label: "工作面1" },
            { x: 520, y: 280, w: 180, h: 50, label: "工作面2" },
            { x: 520, y: 390, w: 180, h: 50, label: "安全出口" }
        ];

        var connections = [
            [0, 1], [1, 2], [2, 3],
            [4, 5], [5, 6], [6, 7],
            [8, 9], [9, 10], [10, 11],
            [0, 4], [4, 8],
            [1, 5], [5, 9],
            [2, 6], [6, 10],
            [3, 7], [7, 11]
        ];

        ctx.strokeStyle = "#4a4a6a";
        ctx.lineWidth = 3;
        connections.forEach(function (pair) {
            var a = tunnels[pair[0]];
            var b = tunnels[pair[1]];
            var ax = a.x + a.w / 2;
            var ay = a.y + a.h / 2;
            var bx = b.x + b.w / 2;
            var by = b.y + b.h / 2;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
        });

        var zoneStatusMap = {};
        fetch("/api/evacuation/status")
            .then(function (r) { return r.json(); })
            .then(function (statusData) {
                var zones = statusData.zones || statusData || [];
                if (Array.isArray(zones)) {
                    zones.forEach(function (z) {
                        zoneStatusMap[z.zone_id || z.id] = z.status || "normal";
                    });
                }
                renderTunnels(ctx, tunnels, zoneStatusMap);
            })
            .catch(function () {
                renderTunnels(ctx, tunnels, zoneStatusMap);
            });
    }

    function renderTunnels(ctx, tunnels, zoneStatusMap) {
        tunnels.forEach(function (t, i) {
            var status = zoneStatusMap[i + 1] || "normal";
            var color = ZONE_COLORS[status] || ZONE_COLORS.normal;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(t.x, t.y, t.w, t.h);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x, t.y, t.w, t.h);
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(t.label, t.x + t.w / 2, t.y + t.h / 2 - 8);
            ctx.fillStyle = color;
            ctx.font = "10px sans-serif";
            ctx.fillText(ZONE_LABELS[status] || "", t.x + t.w / 2, t.y + t.h / 2 + 8);
        });

        drawPersonnel(ctx, tunnels);
        drawEvacRoutes(ctx, tunnels);
        drawRefugeChamber(ctx);
    }

    function drawPersonnel(ctx, tunnels) {
        var personnelPositions = [
            { x: 80, y: 85, count: 3 },
            { x: 150, y: 85, count: 2 },
            { x: 320, y: 195, count: 4 },
            { x: 400, y: 195, count: 1 },
            { x: 560, y: 305, count: 5 },
            { x: 650, y: 305, count: 2 },
            { x: 100, y: 415, count: 3 },
            { x: 350, y: 415, count: 2 }
        ];
        personnelPositions.forEach(function (p) {
            ctx.fillStyle = "#64b5f6";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            if (p.count > 1) {
                ctx.fillStyle = "#e3f2fd";
                ctx.font = "9px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("×" + p.count, p.x, p.y - 9);
            }
        });
    }

    function drawEvacRoutes(ctx, tunnels) {
        var routes = [
            { points: [[tunnels[8].x + tunnels[8].w / 2, tunnels[8].y + tunnels[8].h / 2], [tunnels[4].x + tunnels[4].w / 2, tunnels[4].y + tunnels[4].h / 2], [tunnels[0].x + tunnels[0].w / 2, tunnels[0].y + tunnels[0].h / 2]] },
            { points: [[tunnels[9].x + tunnels[9].w / 2, tunnels[9].y + tunnels[9].h / 2], [tunnels[5].x + tunnels[5].w / 2, tunnels[5].y + tunnels[5].h / 2], [tunnels[1].x + tunnels[1].w / 2, tunnels[1].y + tunnels[1].h / 2]] },
            { points: [[tunnels[10].x + tunnels[10].w / 2, tunnels[10].y + tunnels[10].h / 2], [tunnels[6].x + tunnels[6].w / 2, tunnels[6].y + tunnels[6].h / 2], [tunnels[2].x + tunnels[2].w / 2, tunnels[2].y + tunnels[2].h / 2]] },
            { points: [[tunnels[11].x + tunnels[11].w / 2, tunnels[11].y + tunnels[11].h / 2], [tunnels[7].x + tunnels[7].w / 2, tunnels[7].y + tunnels[7].h / 2], [tunnels[3].x + tunnels[3].w / 2, tunnels[3].y + tunnels[3].h / 2]] }
        ];

        ctx.strokeStyle = "#ffeb3b";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        routes.forEach(function (route) {
            ctx.beginPath();
            route.points.forEach(function (pt, idx) {
                if (idx === 0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            });
            ctx.stroke();
            var last = route.points[route.points.length - 1];
            var prev = route.points[route.points.length - 2];
            var angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
            ctx.fillStyle = "#ffeb3b";
            ctx.beginPath();
            ctx.moveTo(last[0] + 8 * Math.cos(angle), last[1] + 8 * Math.sin(angle));
            ctx.lineTo(last[0] + 8 * Math.cos(angle + 2.5), last[1] + 8 * Math.sin(angle + 2.5));
            ctx.lineTo(last[0] + 8 * Math.cos(angle - 2.5), last[1] + 8 * Math.sin(angle - 2.5));
            ctx.closePath();
            ctx.fill();
        });
        ctx.setLineDash([]);
    }

    function drawRefugeChamber(ctx) {
        var chambers = [
            { x: 230, y: 115, label: "避难硐室1" },
            { x: 470, y: 340, label: "避难硐室2" }
        ];
        chambers.forEach(function (ch) {
            ctx.fillStyle = "#ffd54f";
            ctx.beginPath();
            for (var i = 0; i < 5; i++) {
                var outerAngle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
                var innerAngle = outerAngle + Math.PI / 5;
                var ox = ch.x + 14 * Math.cos(-outerAngle);
                var oy = ch.y - 14 * Math.sin(outerAngle);
                var ix = ch.x + 6 * Math.cos(-innerAngle);
                var iy = ch.y - 6 * Math.sin(innerAngle);
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#f9a825";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "#fff9c4";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(ch.label, ch.x, ch.y + 22);
        });
    }

    function loadRefuge(zoneId) {
        fetch("/api/evacuation/refuge/" + encodeURIComponent(zoneId))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var container = document.getElementById("evac-refuge-info");
                if (!container) return;
                var refuges = data.refuges || data || [];
                if (!Array.isArray(refuges)) refuges = [refuges];
                if (refuges.length === 0) {
                    container.innerHTML = '<div class="refuge-empty">该区域暂无避难硐室信息</div>';
                    return;
                }
                var html = "";
                refuges.forEach(function (ref) {
                    html += '<div class="refuge-item">';
                    html += '<div class="refuge-row"><span class="refuge-label">名称</span><span class="refuge-value">' + (ref.name || "-") + '</span></div>';
                    html += '<div class="refuge-row"><span class="refuge-label">容量</span><span class="refuge-value">' + (ref.capacity != null ? ref.capacity + " 人" : "-") + '</span></div>';
                    html += '<div class="refuge-row"><span class="refuge-label">当前人数</span><span class="refuge-value">' + (ref.current_count != null ? ref.current_count + " 人" : "-") + '</span></div>';
                    html += '<div class="refuge-row"><span class="refuge-label">状态</span><span class="refuge-value">' + (ref.status === "available" ? "可用" : ref.status === "full" ? "已满" : ref.status || "-") + '</span></div>';
                    html += '<div class="refuge-row"><span class="refuge-label">物资储备</span><span class="refuge-value">' + (ref.supplies || "-") + '</span></div>';
                    html += '</div>';
                });
                container.innerHTML = html;
            })
            .catch(function () {
                var container = document.getElementById("evac-refuge-info");
                if (container) container.innerHTML = '<div class="refuge-error">加载避难硐室信息失败</div>';
            });
    }

    function loadRoutes() {
        fetch("/api/evacuation/routes")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var container = document.getElementById("evac-routes-list");
                if (!container) return;
                var routes = data.routes || data || [];
                if (!Array.isArray(routes)) routes = [routes];
                if (routes.length === 0) {
                    container.innerHTML = '<div class="routes-empty">暂无撤离路线</div>';
                    return;
                }
                var html = "";
                routes.forEach(function (rt) {
                    html += '<div class="route-item">';
                    html += '<div class="route-name">' + (rt.name || rt.route_name || "-") + '</div>';
                    html += '<div class="route-detail"><span>区域：' + (rt.zone || rt.zone_name || "-") + '</span></div>';
                    html += '<div class="route-detail"><span>距离：' + (rt.distance != null ? rt.distance + " 米" : "-") + '</span></div>';
                    html += '<div class="route-detail"><span>预计时间：' + (rt.estimated_time != null ? rt.estimated_time + " 分钟" : "-") + '</span></div>';
                    html += '</div>';
                });
                container.innerHTML = html;
            })
            .catch(function () {
                var container = document.getElementById("evac-routes-list");
                if (container) container.innerHTML = '<div class="routes-error">加载撤离路线失败</div>';
            });
    }

    function loadStatus() {
        fetch("/api/evacuation/status")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var container = document.getElementById("evac-status-info");
                if (!container) return;
                var zones = data.zones || data || [];
                if (!Array.isArray(zones)) zones = [zones];
                if (zones.length === 0) {
                    container.innerHTML = '<div class="status-empty">暂无撤离状态信息</div>';
                    return;
                }
                var html = '<div class="status-summary">';
                html += '<div class="status-row"><span class="status-label">撤离中区域</span><span class="status-value">' + (data.evacuating_count != null ? data.evacuating_count : zones.filter(function (z) { return z.status === "evacuating"; }).length) + '</span></div>';
                html += '<div class="status-row"><span class="status-label">危险区域</span><span class="status-value">' + (data.critical_count != null ? data.critical_count : zones.filter(function (z) { return z.status === "critical"; }).length) + '</span></div>';
                html += '<div class="status-row"><span class="status-label">预警区域</span><span class="status-value">' + (data.warning_count != null ? data.warning_count : zones.filter(function (z) { return z.status === "warning"; }).length) + '</span></div>';
                html += '</div>';
                html += '<div class="status-zones">';
                zones.forEach(function (z) {
                    var status = z.status || "normal";
                    var statusText = ZONE_LABELS[status] || status;
                    var color = ZONE_COLORS[status] || ZONE_COLORS.normal;
                    html += '<div class="status-zone-item">';
                    html += '<span class="status-zone-name">' + (z.zone_name || z.name || z.zone_id || "-") + '</span>';
                    html += '<span class="status-zone-badge" style="background:' + color + '">' + statusText + '</span>';
                    if (z.personnel_count != null) {
                        html += '<span class="status-zone-personnel">' + z.personnel_count + ' 人</span>';
                    }
                    html += '</div>';
                });
                html += '</div>';
                container.innerHTML = html;
            })
            .catch(function () {
                var container = document.getElementById("evac-status-info");
                if (container) container.innerHTML = '<div class="status-error">加载撤离状态失败</div>';
            });
    }

    return {
        init: init,
        loadGuidance: loadGuidance,
        triggerEvacuation: triggerEvacuation,
        drawEvacMap: drawEvacMap,
        loadRefuge: loadRefuge,
        loadRoutes: loadRoutes,
        loadStatus: loadStatus
    };
})();
